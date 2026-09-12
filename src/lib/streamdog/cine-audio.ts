/**
 * STREAMDOG · cine-audio.ts (v1.38.0) — la banda sonora de la casa.
 *
 * Música y efectos 100 % sintetizados con WebAudio: sin ficheros de
 * audio que descargar, sin licencias, sin latencia — la intro suena
 * al instante y no añade ni un byte al bundle. Tres piezas:
 *
 *   · acordeStreamDog()  → el jingle de la intro (arpegio mayúsculo
 *                          con pad y brillo, ~4 s, estilo keynote).
 *   · blip()             → el clic amable del tour y de los pasos.
 *   · despegue()         → el whoosh suave de apertura.
 *
 * Todo respeta `silencio` (interruptor persistido) y falla en silencio
 * si el navegador no tiene AudioContext.
 */

/** Nota → Hz (temperamento igual, la4 = 440). */
const HZ: Record<string, number> = {
  E3: 164.81, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
  G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26,
};

type CtxAudio = AudioContext;

/** Contexto compartido (lazy: se crea al primer sonido real). */
let ctx: CtxAudio | null = null;

function contexto(): CtxAudio | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Una nota con envolvente suave (ataque, sustain, cola) y forma de onda elegida. */
function nota(
  ac: CtxAudio,
  destino: AudioNode,
  frecuenciaHz: number,
  cuando: number,
  duracionS: number,
  volumen: number,
  forma: OscillatorType = "sine"
): void {
  const osc = ac.createOscillator();
  const envolvente = ac.createGain();
  osc.type = forma;
  osc.frequency.value = frecuenciaHz;
  envolvente.gain.setValueAtTime(0.0001, cuando);
  envolvente.gain.exponentialRampToValueAtTime(volumen, cuando + 0.04);
  envolvente.gain.exponentialRampToValueAtTime(0.0001, cuando + duracionS);
  osc.connect(envolvente).connect(destino);
  osc.start(cuando);
  osc.stop(cuando + duracionS + 0.05);
}

/**
 * El JINGLE de la intro: arpegio en Mi mayor (E3-B3-E4-G4-B4-E5) con un
 * pad grave de sostén y un brillo agudo al final. Volumen discreto:
 * acompaña, no asalta. Devuelve la duración aproximada en ms.
 */
export function acordeStreamDog(silencio: boolean): number {
  if (silencio) return 0;
  const ac = contexto();
  if (!ac) return 0;
  const ahora = ac.currentTime + 0.05;
  const maestro = ac.createGain();
  maestro.gain.value = 0.16;
  maestro.connect(ac.destination);

  // Pad grave (dos ondas desafinadas para que respire)
  nota(ac, maestro, HZ.E3, ahora, 3.6, 0.5, "triangle");
  nota(ac, maestro, HZ.E3 * 1.005, ahora, 3.6, 0.4, "sine");
  // Arpegio ascendente, la melodía de la casa
  const arpegio: [string, number][] = [
    ["E3", 0], ["B3", 0.18], ["E4", 0.36], ["G4", 0.54], ["B4", 0.72], ["E5", 0.9],
  ];
  for (const [n, t] of arpegio) nota(ac, maestro, HZ[n], ahora + t, 1.2, 0.55, "sine");
  // Brillo final (campanilla suave)
  nota(ac, maestro, HZ.B4 * 2, ahora + 1.15, 1.6, 0.22, "sine");
  nota(ac, maestro, HZ.E5 * 2, ahora + 1.3, 1.8, 0.16, "sine");
  return 4200;
}

/** BLIP del tour: dos notas cortas y arriba — amable, sin sobresaltar. */
export function blip(silencio: boolean): void {
  if (silencio) return;
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime + 0.01;
  const maestro = ac.createGain();
  maestro.gain.value = 0.12;
  maestro.connect(ac.destination);
  nota(ac, maestro, HZ.A4, ahora, 0.12, 0.6, "sine");
  nota(ac, maestro, HZ.E5, ahora + 0.08, 0.16, 0.5, "sine");
}

/** DESPEGUE de la intro: un whoosh suave (ruido filtrado que se abre). */
export function despegue(silencio: boolean): void {
  if (silencio) return;
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime + 0.02;
  const maestro = ac.createGain();
  maestro.gain.value = 0.1;
  maestro.connect(ac.destination);

  const trozos = 2 * ac.sampleRate;
  const buffer = ac.createBuffer(1, trozos, ac.sampleRate);
  const canal = buffer.getChannelData(0);
  for (let i = 0; i < trozos; i++) canal[i] = Math.random() * 2 - 1;
  const ruido = ac.createBufferSource();
  ruido.buffer = buffer;

  const filtro = ac.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.setValueAtTime(300, ahora);
  filtro.frequency.exponentialRampToValueAtTime(4200, ahora + 0.9);

  const envolvente = ac.createGain();
  envolvente.gain.setValueAtTime(0.0001, ahora);
  envolvente.gain.exponentialRampToValueAtTime(0.5, ahora + 0.25);
  envolvente.gain.exponentialRampToValueAtTime(0.0001, ahora + 1.1);

  ruido.connect(filtro).connect(envolvente).connect(maestro);
  ruido.start(ahora);
  ruido.stop(ahora + 1.2);
}
