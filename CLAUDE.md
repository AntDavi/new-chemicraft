# CLAUDE.md — Construtor de Moléculas 2D

> Arquivo de contexto para o Claude Code. Leia antes de qualquer implementação.

---

## O que é?

Editor visual 2D de moléculas químicas para uso educacional. O usuário posiciona átomos numa tela SVG interativa, cria ligações entre eles (simples, duplas ou triplas), e recebe em tempo real a fórmula molecular correta (ex.: HNO₃) como um balão flutuante próximo à molécula. Ao clicar em um átomo já posicionado no canvas, uma barra inferior exibe informações sobre aquele átomo (id, valência total, valência disponível).

**Público-alvo:** Estudantes e professores de química que precisam de uma ferramenta leve e intuitiva, sem instalação.  
**Fase atual:** MVP — fluxo completo de construção → fórmula → identificação.

---

## Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | Next.js 16 (App Router) + TypeScript | Velocidade de desenvolvimento, deploy fácil na Vercel |
| Estilização | Tailwind CSS | Utilitário | ShadCn | 
| Renderização | SVG customizado (sem lib externa) | Controle total, sem overhead, sem dependência pesada |
| Estado | React hooks (`useState`, `useReducer`) | Suficiente para o MVP |
| Lógica química | Client-side puro | Sem backend no MVP |
| Deploy | Vercel | Zero config com Next.js |

---

## Layout — baseado no wireframe

```
┌──────┬─────────────────────────────────────────────────┐
│  C   │                                                 │
│  H   │                                                 │
│  O   │            CANVAS SVG                          │
│  N   │          (área de desenho livre)               │
│  S   │                                                 │
│  ──  │       ╭────────╮                               │
│  I   │       │ HNO₃   │  ← balão flutuante            │
│  II  │       ╰────────╯                               │
│  III │         ⬤O                                     │
│      │        ╱ ║                                     │
│      │      ⬤O  ⬤N ── ⬤O ── ⬤H                      │
│      │                                                 │
├──────┴──────────────────────────────────────────┬──────┤
│  AtomInfoCard (oculto por padrão)               │ −  + │
│  O · oxigênio   valência total: 2               │      │
│  id: a3f2...    valência disponível: 1          │LIMPAR│
└─────────────────────────────────────────────────┴──────┘
```

### Zonas de layout

| Zona | Componente | Comportamento |
|------|-----------|---------------|
| Sidebar esquerda | `Sidebar.tsx` | Sempre visível; paleta de átomos (topo) + seletor de ligação (base) |
| Canvas central | `Canvas.tsx` | Ocupa todo o espaço restante |
| Barra inferior esquerda | `AtomInfoCard.tsx` | **Oculta por padrão**; aparece ao clicar um átomo no canvas |
| Barra inferior direita | `BottomBar.tsx` | Sempre visível; botões −, + e LIMPAR |
| Balão de fórmula | `FormulaLabel.tsx` | Flutuante no canvas, próximo ao centróide da molécula |

---

## Arquitetura

```
/app
  /page.tsx                  → página principal (layout, instância do editor)
/components
  /MoleculeEditor.tsx         → componente-raiz; orquestra estado global e layout
  /Sidebar.tsx                → coluna esquerda: AtomPalette (topo) + BondToolbar (base)
  /AtomPalette.tsx            → círculos clicáveis com símbolo de cada átomo (empilhados verticalmente)
  /BondToolbar.tsx            → seletor de tipo de ligação: I / II / III (vertical, abaixo da paleta)
  /Canvas.tsx                 → SVG interativo (átomos + ligações + FormulaLabel)
  /FormulaLabel.tsx           → balão flutuante SVG com a fórmula molecular calculada
  /AtomInfoCard.tsx           → barra inferior com info do átomo selecionado no canvas
  /BottomBar.tsx              → controles de zoom (−/+) e botão LIMPAR (canto inferior direito)
/lib
  /moleculeGraph.ts           → estrutura de dados do grafo (nós=átomos, arestas=ligações)
  /formulaCalculator.ts       → conta átomos → gera fórmula Hill notation
  /valenceCalculator.ts       → calcula valência total e disponível por átomo no grafo
  /moleculeDatabase.ts        → dicionário de moléculas conhecidas (fórmula → nome + curiosidade)
  /atomData.ts                → valências, cores e raios de cada átomo suportado
```

### Fluxo de interação (happy path)

1. Usuário clica em um átomo na `AtomPalette` (sidebar) → define átomo ativo
2. Clica em área vazia do `Canvas` → cria nó no grafo com posição (x, y)
3. Seleciona tipo de ligação no `BondToolbar` (I / II / III)
4. Clica num nó existente (origem) → clica em outro nó (destino) → cria aresta tipada
5. Clica num átomo já posicionado → `AtomInfoCard` desliza na barra inferior
6. `formulaCalculator` recalcula a fórmula a cada mudança no grafo
7. `FormulaLabel` exibe o balão flutuante atualizado no canvas
8. `moleculeDatabase` tenta identificar a molécula → exibe nome no balão (se reconhecida)

---

## Estrutura de dados do grafo

```typescript
// lib/moleculeGraph.ts
interface Atom {
  id: string;        // uuid gerado na criação
  symbol: string;    // 'C', 'H', 'O', etc.
  x: number;         // posição SVG
  y: number;
}

interface Bond {
  id: string;
  fromId: string;
  toId: string;
  type: 'single' | 'double' | 'triple';
}

interface MoleculeGraph {
  atoms: Atom[];
  bonds: Bond[];
}
```

---

## AtomInfoCard — dados exibidos

Aparece como barra horizontal na base do canvas ao clicar um átomo. Fecha ao clicar fora ou no mesmo átomo novamente. **Nunca aparece durante o modo de criação de ligações.**

```
┌─────────────────────────────────────────────────────────┐
│  ⬤O  oxigênio       valência total: 2                  │
│       id: a3f2...   valência disponível: 1              │
└─────────────────────────────────────────────────────────┘
```

| Campo | Origem | Descrição |
|-------|--------|-----------|
| Símbolo + nome | `atomData.ts` | Fixo por tipo de átomo |
| id | `Atom.id` | UUID do nó no grafo |
| valência total | `atomData.ts` | Valência máxima do elemento |
| valência disponível | `valenceCalculator.ts` | `total − Σ(ordem das ligações existentes)` |

### Cálculo de valência disponível

```typescript
// lib/valenceCalculator.ts
// ligação simples = 1 | dupla = 2 | tripla = 3
function getAvailableValence(atomId: string, graph: MoleculeGraph): number {
  const totalValence = atomData[atom.symbol].valence;
  const usedValence = graph.bonds
    .filter(b => b.fromId === atomId || b.toId === atomId)
    .reduce((sum, b) => sum + bondOrder[b.type], 0);
  return totalValence - usedValence;
}
```

---

## Átomos suportados no MVP

| Símbolo | Nome | Valência total | Cor |
|---------|------|---------------|-----|
| C | Carbono | 4 | #404040 |
| H | Hidrogênio | 1 | #888888 |
| O | Oxigênio | 2 | #FF4444 |
| N | Nitrogênio | 3 | #4444FF |
| S | Enxofre | 2 | #DDCC00 |
| P | Fósforo | 3 | #FF8800 |
| F | Flúor | 1 | #44DDAA |
| Cl | Cloro | 1 | #22BB44 |

---

## FormulaLabel — balão flutuante no canvas

- Posição: calculada como centróide de todos os átomos do grafo + offset vertical para ficar acima da molécula
- Conteúdo: fórmula Hill (ex.: `HNO₃`) + nome da molécula abaixo se reconhecida (ex.: `Ácido Nítrico`)
- Renderizado como elemento SVG `<foreignObject>` ou `<text>` com `<rect>` de fundo
- Atualiza a cada mudança no grafo

---

## Fórmula molecular — Hill Notation

1. C primeiro (se presente)
2. H segundo (se presente)
3. Demais elementos em ordem alfabética

Lógica em `lib/formulaCalculator.ts`, chamada a cada mudança no grafo.

---

## Banco de moléculas conhecidas (MVP)

| Fórmula | Nome | Curiosidade |
|---------|------|-------------|
| H₂O | Água | Solvente universal |
| CO₂ | Dióxido de Carbono | Principal gás do efeito estufa |
| CH₄ | Metano | Combustível fóssil mais simples |
| NH₃ | Amônia | Base de fertilizantes |
| H₂O₂ | Água Oxigenada | Antisséptico comum |
| C₂H₆O | Etanol | Álcool de bebidas |
| HCl | Ácido Clorídrico | Ácido forte |
| O₂ | Oxigênio | Essencial para respiração |
| N₂ | Nitrogênio | 78% da atmosfera terrestre |
| H₂ | Hidrogênio | Combustível limpo |
| HNO₃ | Ácido Nítrico | Usado em fertilizantes e explosivos |
| CH₂O | Formaldeído | Conservante |
| C₆H₁₂O₆ | Glicose | Principal fonte de energia celular |

---

## Interação com o Canvas SVG

| Ação do usuário | Resultado |
|----------------|-----------|
| Clique em área vazia (átomo ativo) | Cria nó na posição clicada |
| Clique em nó (modo ligação, 1º clique) | Marca como origem |
| Clique em nó (modo ligação, 2º clique) | Cria ligação tipada |
| Clique em nó (modo seleção) | Abre `AtomInfoCard` na barra inferior |
| Clique fora de qualquer nó | Fecha `AtomInfoCard` / cancela seleção |
| Arrastar nó | Move o átomo pela tela |
| Delete / Backspace com nó selecionado | Remove nó e suas ligações |
| Botão − / + | Zoom out / zoom in no canvas |
| Botão LIMPAR | Remove todos os átomos e ligações |

---

## Regras de Implementação

- Toda implementação deve vir com uma explicação exata do que está sendo feito para aprovação do desenvolvedor.
- Não deve tomar decisões sozinho — sempre pedir aprovação antes de implementar.
- Todo arquivo deve conter um comentário no topo informando exatamente o que ele faz.
- Ao final de toda implementação deve haver um resumo: o que foi feito, como, por que e no que interfere, além dos arquivos que precisaram de modificação.
- Nenhuma biblioteca de química externa (ex.: RDKit, Kekule) deve ser adicionada sem aprovação explícita.
- Preferir SVG puro a Canvas API para facilitar debug e estilização.
- `AtomInfoCard` nunca deve aparecer durante o modo de criação de ligações.

---

## IA Tutora

> Módulo de desafios com feedback gerado por IA. Depende do MVP estar completo (Fases 0–9).

### Novos componentes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/components/ChallengePanel.tsx` | Exibe desafio ativo, status, botão Analisar e celebração ao completar |
| `app/components/AIFeedbackPanel.tsx` | Histórico de feedbacks da sessão (mais recente no topo), loading state |

### Novos arquivos lib

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/lib/challengeDatabase.ts` | Array de desafios com id, name, formula, targetGraph (conectividade), initialHint, difficulty |
| `app/lib/moleculeComparator.ts` | `compareMolecules(current, target): MoleculeDiff` — compara por tipo/qtd de átomos e tipo de ligações, **nunca por posição** |
| `app/lib/aiPromptBuilder.ts` | `buildAnalysisPrompt(challenge, currentGraph, diff): string` — 3 frases: reforçar acerto, apontar erro principal, dar dica sem entregar resposta |

### Nova rota de API

`app/api/analyze/route.ts`
- POST recebe `{ challengeId, currentGraph }`
- Chama `moleculeComparator` + `aiPromptBuilder`
- Chama Anthropic API com `claude-sonnet-4-20250514`, `max_tokens: 300`
- Retorna `{ feedback: string, isCorrect: boolean }`

### Variável de ambiente

```
ANTHROPIC_API_KEY=sk-...   # em .env.local (nunca commitar)
```

### Novos estados no reducer (MoleculeEditor)

```typescript
activeChallenge: Challenge | null   // desafio em andamento
challengeStatus: 'idle' | 'active' | 'completed'
aiFeedback: string[]                // histórico de feedbacks
isAnalyzing: boolean                // aguardando resposta da API
```

### Novas actions

| Action | Efeito |
|--------|--------|
| `START_CHALLENGE` | Define `activeChallenge`, limpa grafo, status → `active` |
| `REQUEST_ANALYSIS` | `isAnalyzing → true` |
| `SET_AI_FEEDBACK` | Adiciona feedback ao array, `isAnalyzing → false` |
| `COMPLETE_CHALLENGE` | `challengeStatus → completed` (disparado automaticamente quando `isCorrect === true`) |

### Layout atualizado

Painel direito com `ChallengePanel` + `AIFeedbackPanel` aparece sobreposto ou ao lado do canvas **somente quando `activeChallenge !== null`**.

### Gatilhos de feedback da IA

- **Sob demanda:** botão "Analisar" no `ChallengePanel`
- **Automático:** ao violar valência de um átomo
- **Automático:** ao iniciar um desafio (`initialHint` pré-carregado)

### Desafios do MVP

| id | Fórmula | Dificuldade |
|----|---------|-------------|
| `h2o` | H₂O | iniciante |
| `ch4` | CH₄ | iniciante |
| `nh3` | NH₃ | iniciante |
| `co2` | CO₂ | intermediário |
| `c2h6o` | C₂H₆O | intermediário |
| `c6h12o6` | C₆H₁₂O₆ | avançado |
| `c10h20o` | C₁₀H₂₀O (Mentol) | avançado |

### Tipo MoleculeDiff

```typescript
interface MoleculeDiff {
  missingAtoms: { symbol: string; count: number }[];
  extraAtoms: { symbol: string; count: number }[];
  wrongAtoms: { symbol: string; count: number }[];
  missingBonds: { type: BondType; count: number }[];
  wrongBondTypes: { expected: BondType; got: BondType; count: number }[];
  isCorrect: boolean;
}
```

---

## Tropeços

> Seção para registrar problemas reais encontrados durante a implementação. Começa vazia.

---

## Histórico

| Data | Descrição |
|------|-----------|
| 2025-05-28 | Stack definida: Next.js 16 + Tailwind + SVG customizado |
| 2025-05-28 | Arquitetura de componentes e estrutura de dados definidas |
| 2025-05-28 | Átomos suportados e banco de moléculas MVP listados |
| 2025-05-28 | CLAUDE.md criado |
| 2025-05-28 | Wireframe (v1) analisado — layout corrigido: sidebar esquerda vertical + AtomInfoCard na barra inferior |
| 2025-05-28 | valenceCalculator.ts adicionado à arquitetura |
| 2025-05-28 | FormulaLabel como balão flutuante SVG no canvas documentado |