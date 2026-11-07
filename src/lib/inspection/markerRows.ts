/** Altura (px) de uma linha de rótulos sobre o modelo. */
export const MARKER_ROW = 22;

type Marker = { label: string; x: number; y: number; visible: boolean };

/**
 * Linha de cada rótulo sobre o modelo: o que se encostaria num já posto (da esquerda para a direita)
 * sobe uma linha. Ex.: os três galões do Módulo 16 lado a lado no celular. Sem colisão, todos ficam
 * na linha 0. A largura é estimada pelo número de letras (texto de 11–12 px, com o respiro lateral).
 */
export function markerRows(markers: Marker[]): Map<string, number> {
  const rows = new Map<string, number>();
  const placed: { x0: number; x1: number; y: number }[] = [];
  for (const m of markers.filter((m) => m.visible).sort((a, b) => a.x - b.x)) {
    const half = (m.label.length * 6.5 + 22) / 2;
    const hits = (y: number) =>
      placed.some((p) => p.x1 > m.x - half && p.x0 < m.x + half && Math.abs(p.y - y) < MARKER_ROW - 4);
    let row = 0;
    while (row < markers.length && hits(m.y - row * MARKER_ROW)) row++;
    placed.push({ x0: m.x - half, x1: m.x + half, y: m.y - row * MARKER_ROW });
    rows.set(m.label, row);
  }
  return rows;
}
