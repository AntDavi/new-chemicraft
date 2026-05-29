// Sub-componente do Canvas. Exibe um balão flutuante com a fórmula molecular
// calculada (Hill notation) e, quando reconhecida, o nome da molécula abaixo.
// Posicionado acima do centróide de todos os átomos do grafo.

import { MoleculeGraph } from '../lib/moleculeGraph';
import { calculateFormula } from '../lib/formulaCalculator';
import { identifyMolecule } from '../lib/moleculeDatabase';

// Distância vertical entre o centróide e a base do balão (px, em espaço SVG)
const OFFSET_Y = 48;
// Padding interno do balão
const PAD_X = 12;
const PAD_Y = 6;
// Altura de cada linha de texto
const LINE_HEIGHT = 18;

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

  // Altura total do balão: 1 linha (fórmula) ou 2 linhas (fórmula + nome)
  const textLines = hasName ? 2 : 1;
  const boxH = PAD_Y * 2 + textLines * LINE_HEIGHT;
  // Estimativa de largura baseada no comprimento do texto mais longo
  const longestText = hasName && info.name.length > formula.length ? info.name : formula;
  const boxW = PAD_X * 2 + longestText.length * 8;

  // Posição do canto superior esquerdo do balão
  const bx = cx - boxW / 2;
  const by = cy - OFFSET_Y - boxH;

  return (
    <g pointerEvents="none">
      {/* Fundo do balão */}
      <rect
        x={bx}
        y={by}
        width={boxW}
        height={boxH}
        rx={6}
        ry={6}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={1}
        opacity={0.92}
      />

      {/* Fórmula molecular */}
      <text
        x={cx}
        y={by + PAD_Y + LINE_HEIGHT * 0.75}
        textAnchor="middle"
        fontSize={13}
        fontWeight="700"
        fill="#f1f5f9"
        style={{ userSelect: 'none' }}
      >
        {formula}
      </text>

      {/* Nome da molécula (segunda linha, se reconhecida) */}
      {hasName && (
        <text
          x={cx}
          y={by + PAD_Y + LINE_HEIGHT * 1.75}
          textAnchor="middle"
          fontSize={11}
          fontWeight="400"
          fill="#94a3b8"
          style={{ userSelect: 'none' }}
        >
          {info.name}
        </text>
      )}
    </g>
  );
}
