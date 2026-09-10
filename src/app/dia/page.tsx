import DueloDelDia from "@/components/arena/DueloDelDia";

export const metadata = {
  title: "Duelo del día — todólogo.ai",
  description:
    "Un duelo anónimo al día para toda la comunidad: los mismos dos modelos, la misma consigna y el consenso de todos los que votan. Tu veredicto mueve tu ELO de jurado.",
};

export default function PaginaDia() {
  return <DueloDelDia />;
}
