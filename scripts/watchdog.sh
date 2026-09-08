#!/usr/bin/env bash
#
# watchdog.sh — Vigilante de nivel empresarial para todólogo.ai (v1.10.0)
#
# Mantén el servidor vivo: comprueba /api/health cada INTERVAL segundos y,
# si no responde o devuelve 503, reinicia el proceso con espera exponencial.
#
#   ./scripts/watchdog.sh                          # desarrollo (bun run dev)
#   START_CMD="bun run start" ./scripts/watchdog.sh  # producción (standalone)
#   CRON_DISABLED=1 PORT=3000 MAX_CONSEC=8 ./scripts/watchdog.sh
#
# Empresa:
#   - Logs JSON estructurados en logs/watchdog.log (una línea por evento).
#   - Backoff exponencial 5→10→20→40…s con techo de 120 s entre reinicios.
#   - MAX_CONSEC reinicios consecutivos → se retira y avisa (evita bucles locos).
#   - Lockfile (evita dos vigilantes para el mismo puerto) y trampa de señales.
#   - `--once` ejecuta una sola comprobación (ideal para cron del sistema).
#
set -u

PORT="${PORT:-3000}"
INTERVAL="${INTERVAL:-30}"
TIMEOUT="${TIMEOUT:-8}"
MAX_CONSEC="${MAX_CONSEC:-6}"
HEALTH_URL="http://localhost:${PORT}/api/health"
START_CMD="${START_CMD:-bun run dev}"
PIDFILE="${PIDFILE:-/tmp/todologo-watchdog.pid}"
LOG_DIR="${LOG_DIR:-logs}"
LOG_FILE="${LOG_DIR}/watchdog.log"

mkdir -p "$LOG_DIR"

# ── Lockfile: un solo vigilante por puerto ──
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "{\"evt\":\"already_running\",\"pid\":$(cat "$PIDFILE")}"
  exit 0
fi
echo $$ > "$PIDFILE"
trap 'rm -f "$PIDFILE"; echo "{\"evt\":\"watchdog_stop\",\"signal\":\"TERM\"}" | tee -a "$LOG_FILE"; exit 0' TERM INT

log() { # log <nivel> <evento> <detalle>
  printf '{"ts":"%s","level":"%s","evt":"%s","port":%s,"detail":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "$PORT" "$3" | tee -a "$LOG_FILE"
}

check_health() {
  curl -s -o /dev/null -m "$TIMEOUT" -w "%{http_code}" "$HEALTH_URL" 2>/dev/null
}

restart_server() {
  log warn "restart_begin" "matando procesos del puerto ${PORT}"
  # Termina cualquier proceso previo del puerto (next dev/start anterior)
  local pids
  pids=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs -r kill 2>/dev/null
    sleep 2
    echo "$pids" | xargs -r kill -9 2>/dev/null
  fi
  log warn "server_start" "comando: ${START_CMD}"
  setsid nohup $START_CMD < /dev/null >> "${LOG_DIR}/server.log" 2>&1 &
}

consec=0
backoff=5
log info "watchdog_start" "cada ${INTERVAL}s · máx ${MAX_CONSEC} reinicios seguidos · ${HEALTH_URL}"

while true; do
  code="$(check_health)"
  case "$code" in
    200)
      if [ "$consec" -gt 0 ]; then log info "recovered" "saludable tras ${consec} fallo(s)"; fi
      consec=0; backoff=5
      ;;
    000)
      consec=$((consec + 1))
      log error "unreachable" "sin respuesta (intento ${consec}/${MAX_CONSEC})"
      ;;
    *)
      consec=$((consec + 1))
      log error "unhealthy" "HTTP ${code} (intento ${consec}/${MAX_CONSEC})"
      ;;
  esac

  if [ "$consec" -ge 1 ] && [ "$code" != "200" ]; then
    if [ "$consec" -gt "$MAX_CONSEC" ]; then
      log error "give_up" "superados ${MAX_CONSEC} reinicios consecutivos; el vigilante se retira"
      rm -f "$PIDFILE"
      exit 1
    fi
    restart_server
    log warn "backoff" "esperando ${backoff}s antes de volver a comprobar"
    sleep "$backoff"
    backoff=$(( backoff * 2 )); [ "$backoff" -gt 120 ] && backoff=120
  fi

  [ "${1:-}" = "--once" ] && { log info "once_done" "comprobación única terminada"; exit 0; }
  sleep "$INTERVAL"
done
