// Sub-componente do Canvas. Exibe um balão flutuante com a fórmula molecular
// calculada (Hill notation) e, quando reconhecida, o nome da molécula abaixo.
// Posicionado acima do centróide de todos os átomos do grafo.

import { MoleculeGraph } from '../lib/moleculeGraph';
import { calculateFormula } from '../lib/formulaCalculator';
import { identifyMolecule } from '../lib/moleculeDatabase';

// Distância vertical entre o centróide e a base do balão (px, em espaço SVG)
const OFFSET_Y = 52;
// Padding interno do balão
const PAD_X = 14;
const PAD_Y = 8;
// Altura de cada linha de texto
const LINE_HEIGHT = 18;
// Altura da pontinha triangular
const TAIL_H = 9;

interface FormulaLabelProps {
  graph: MoleculeGraph;
}

export default function FormulaLabel({ graph }: FormulaLabelProps) {
  if (graph.atoms.length === 0) return null;

  // Centróide dos átomos
  const cx = graph.atoms.reduce((sum, a) => sum + a.x, 0) / graph.atoms.length;
  const cy = graph.atoms.reduce((sum, a) => sum + a.y, 0) / graph.atoms.length;

  const formula = calculateFormula(graph);
  if (!formula) return null;

  const info = identifyMolecule(formula);
  const hasName = info !== null;

  // Dimensões do balão
  const textLines = hasName ? 2 : 1;
  const boxH = PAD_Y * 2 + textLines * LINE_HEIGHT;
  const longestText = hasName && info.name.length > formula.length ? info.name : formula;
  const boxW = PAD_X * 2 + longestText.length * 8;

  // Posição do canto superior esquerdo do balão
  const bx = cx - boxW / 2;
  const by = cy - OFFSET_Y - boxH;

  // Pontos da pontinha triangular (aponta para baixo, no centro do balão)
  const tailPoints = `${cx - 7},${by + boxH} ${cx},${by + boxH + TAIL_H} ${cx + 7},${by + boxH}`;

  return (
    <g pointerEvents="none">
      <defs>
        <filter id="formula-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00000018" />
        </filter>
      </defs>

      {/* Fundo branco + pontinha */}
      <g filter="url(#formula-shadow)">
        <rect
          x={bx}
          y={by}
          width={boxW}
          height={boxH}
          rx={8}
          ry={8}
          fill="white"
        />
        <polygon points={tailPoints} fill="white" />
      </g>

      {/* Fórmula molecular */}
      <text
        x={cx}
        y={by + PAD_Y + LINE_HEIGHT * 0.78}
        textAnchor="middle"
        fontSize={14}
        fontWeight="700"
        fill="#1f2937"
        style={{ userSelect: 'none' }}
      >
        {formula}
      </text>

      {/* Nome da molécula em small caps */}
      {hasName && (
        <text
          x={cx}
          y={by + PAD_Y + LINE_HEIGHT * 1.78}
          textAnchor="middle"
          fontSize={9}
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="1.2"
          style={{ userSelect: 'none', textTransform: 'uppercase' }}
        >
          {info.name.toUpperCase()}
        </text>
      )}
    </g>
  );
}
