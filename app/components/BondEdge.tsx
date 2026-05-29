// Sub-componente do Canvas. Renderiza uma ligação química entre dois átomos
// como 1, 2 ou 3 linhas <line> paralelas conforme o tipo (single/double/triple).
// Linhas duplas e triplas são deslocadas perpendicularmente à direção da ligação.

import { Atom, Bond } from '../lib/moleculeGraph';
import { ATOM_RADIUS } from './AtomNode';

// Deslocamento lateral (px) entre linhas paralelas em ligações duplas/triplas
const BOND_OFFSET = 4;

// Vetor unitário perpendicular à direção from→to
function perp(x1: number, y1: number, x2: number, y2: number): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / len, dx / len];
}

export interface BondEdgeProps {
  bond: Bond;
  fromAtom: Atom;
  toAtom: Atom;
}

export default function BondEdge({ bond, fromAtom, toAtom }: BondEdgeProps) {
  const { x: x1, y: y1 } = fromAtom;
  const { x: x2, y: y2 } = toAtom;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Vetor unitário na direção da ligação (para recuar dos círculos dos átomos)
  const ux = dx / len;
  const uy = dy / len;
  // Vetor perpendicular (para deslocar linhas paralelas)
  const [px, py] = perp(x1, y1, x2, y2);

  // Extremidades recuadas para não sobrepor os círculos dos átomos
  const ax1 = x1 + ux * ATOM_RADIUS;
  const ay1 = y1 + uy * ATOM_RADIUS;
  const ax2 = x2 - ux * ATOM_RADIUS;
  const ay2 = y2 - uy * ATOM_RADIUS;

  const base = {
    stroke: '#4b5563',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
  };

  if (bond.type === 'single') {
    return <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} {...base} />;
  }

  if (bond.type === 'double') {
    const o = BOND_OFFSET;
    return (
      <g>
        <line x1={ax1 + px * o} y1={ay1 + py * o} x2={ax2 + px * o} y2={ay2 + py * o} {...base} />
        <line x1={ax1 - px * o} y1={ay1 - py * o} x2={ax2 - px * o} y2={ay2 - py * o} {...base} />
      </g>
    );
  }

  // triple — linha central + duas laterais
  const o = BOND_OFFSET * 1.6;
  return (
    <g>
      <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} {...base} />
      <line x1={ax1 + px * o} y1={ay1 + py * o} x2={ax2 + px * o} y2={ay2 + py * o} {...base} />
      <line x1={ax1 - px * o} y1={ay1 - py * o} x2={ax2 - px * o} y2={ay2 - py * o} {...base} />
    </g>
  );
}
