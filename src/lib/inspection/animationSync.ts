/** Sincronia entre a narração de um item e o clipe de animação do seu GLB (sem dependências). */

/**
 * Instante do clipe para um instante da narração: interpolação linear entre os pares
 * [narração, clipe] de `sync`; antes do primeiro par, o primeiro valor; depois do último (ou com a
 * narração já ouvida), o último quadro alcançado.
 */
export function animationTimeAt(narration: number, sync: readonly (readonly [number, number])[], duration: number) {
  if (!sync.length) return 0;
  const last = sync[sync.length - 1];
  let t: number;
  if (!Number.isFinite(narration) || narration >= last[0]) t = last[1];
  else if (narration <= sync[0][0]) t = sync[0][1];
  else {
    let i = 0;
    while (narration > sync[i + 1][0]) i++;
    const [n0, a0] = sync[i];
    const [n1, a1] = sync[i + 1];
    t = a0 + ((narration - n0) / (n1 - n0)) * (a1 - a0);
  }
  return Math.min(duration, Math.max(0, t));
}
