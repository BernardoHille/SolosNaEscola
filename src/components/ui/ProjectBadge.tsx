/** Identificação discreta do projeto, sobreposta ao visualizador. */
export default function ProjectBadge() {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 select-none sm:left-4 sm:top-4">
      <div className="rounded-lg bg-black/45 px-3 py-2 backdrop-blur-sm">
        <p className="text-sm font-semibold leading-tight text-stone-50">Solos na Escola</p>
        <p className="text-[10px] uppercase leading-tight tracking-[0.18em] text-stone-300/80">
          Exposição em 3D · UFPR
        </p>
      </div>
    </div>
  );
}
