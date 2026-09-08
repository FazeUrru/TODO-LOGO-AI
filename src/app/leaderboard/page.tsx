import LeaderboardView from "@/components/arena/LeaderboardView";

export const metadata = {
  title: "Leaderboard — todólogo.ai",
  description:
    "Ranking dinámico de los 56 mejores modelos de IA por votos reales de la comunidad, con ELO por categoría, intervalos de confianza y filtros por licencia.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
