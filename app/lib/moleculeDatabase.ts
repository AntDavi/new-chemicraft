// Dicionário de moléculas conhecidas. Exporta identifyMolecule para buscar nome
// e curiosidade a partir de uma fórmula em Hill notation com subscripts unicode.

type MoleculeInfo = { name: string; fact: string };

const DATABASE: Record<string, MoleculeInfo> = {
  'H₂O':      { name: 'Água',                 fact: 'Solvente universal' },
  'CO₂':      { name: 'Dióxido de Carbono',   fact: 'Principal gás do efeito estufa' },
  'CH₄':      { name: 'Metano',               fact: 'Combustível fóssil mais simples' },
  'NH₃':      { name: 'Amônia',               fact: 'Base de fertilizantes' },
  'H₂O₂':    { name: 'Água Oxigenada',        fact: 'Antisséptico comum' },
  'C₂H₆O':   { name: 'Etanol',               fact: 'Álcool de bebidas' },
  'HCl':      { name: 'Ácido Clorídrico',     fact: 'Ácido forte' },
  'O₂':       { name: 'Oxigênio',             fact: 'Essencial para respiração' },
  'N₂':       { name: 'Nitrogênio',           fact: '78% da atmosfera terrestre' },
  'H₂':       { name: 'Hidrogênio',           fact: 'Combustível limpo' },
  'HNO₃':    { name: 'Ácido Nítrico',         fact: 'Usado em fertilizantes e explosivos' },
  'CH₂O':    { name: 'Formaldeído',           fact: 'Conservante' },
  'C₆H₁₂O₆': { name: 'Glicose',              fact: 'Principal fonte de energia celular' },
};

export function identifyMolecule(formula: string): MoleculeInfo | null {
  return DATABASE[formula] ?? null;
}
