# TODO.md — Construtor de Moléculas 2D

> Passo a passo de implementação do MVP. Siga a ordem — cada fase depende da anterior.  
> Marque com [x] ao concluir cada item.

---

## FASE 0 — Setup do projeto

- [x] `npx create-next-app@latest molecule-builder --typescript --tailwind --app --eslint`
- [x] Remover arquivos de exemplo: `app/page.tsx` (limpar conteúdo), `app/globals.css` (manter só reset)
- [x] Criar estrutura de pastas:
  ```
  /components
  /lib
  ```
- [x] Instalar `uuid` para geração de ids: `npm install uuid` + `npm install -D @types/uuid`
- [x] Commitar: `chore: project setup`

---

## FASE 1 — Dados estáticos (`/lib`)

> Sem React ainda. Lógica pura, testável isoladamente.

- [x] **`lib/atomData.ts`**  
  Exporta objeto com dados de cada átomo: símbolo, nome, valência total, cor hex.  
  Átomos: C, H, O, N, S, P, F, Cl.

- [x] **`lib/moleculeGraph.ts`**  
  Define e exporta as interfaces `Atom`, `Bond`, `MoleculeGraph`.  
  Exporta funções puras: `addAtom`, `addBond`, `removeAtom`, `removeBond`.  
  `removeAtom` deve remover também todas as ligações daquele átomo.

- [x] **`lib/valenceCalculator.ts`**  
  Exporta `getUsedValence(atomId, graph)` e `getAvailableValence(atomId, graph)`.  
  Ordem das ligações: single=1, double=2, triple=3.

- [x] **`lib/formulaCalculator.ts`**  
  Exporta `calculateFormula(graph): string`.  
  Implementa Hill notation: C → H → demais em ordem alfabética.  
  Usa subscript unicode (₀₁₂₃...) para os números.

- [x] **`lib/moleculeDatabase.ts`**  
  Exporta `identifyMolecule(formula: string): { name: string, fact: string } | null`.  
  Dicionário mínimo: H₂O, CO₂, CH₄, NH₃, H₂O₂, C₂H₆O, HCl, O₂, N₂, H₂, HNO₃, CH₂O, C₆H₁₂O₆.

- [x] Commitar: `feat: lib — atom data, graph, valence, formula, database`

---

## FASE 2 — Estado global (`MoleculeEditor`)

- [x] **`components/MoleculeEditor.tsx`**  
  Componente raiz que detém todo o estado da aplicação via `useReducer`.

  Estado a gerenciar:
  ```typescript
  {
    graph: MoleculeGraph          // átomos e ligações
    activeAtomSymbol: string | null  // átomo selecionado na palette
    activeBondType: 'single' | 'double' | 'triple'
    bondingFrom: string | null    // id do átomo origem da ligação
    selectedAtomId: string | null // átomo clicado no canvas (AtomInfoCard)
    zoom: number                  // fator de escala (default: 1)
  }
  ```

  Actions do reducer:
  - `SET_ACTIVE_ATOM`
  - `SET_BOND_TYPE`
  - `PLACE_ATOM` — adiciona átomo no grafo com posição (x, y)
  - `START_BOND` — define `bondingFrom`
  - `COMPLETE_BOND` — cria ligação e limpa `bondingFrom`
  - `CANCEL_BOND`
  - `SELECT_ATOM` — abre AtomInfoCard
  - `DESELECT_ATOM` — fecha AtomInfoCard
  - `MOVE_ATOM` — atualiza x, y do átomo (drag)
  - `DELETE_ATOM`
  - `ZOOM_IN` / `ZOOM_OUT`
  - `CLEAR`

- [x] Commitar: `feat: MoleculeEditor reducer and state shape`

---

## FASE 3 — Sidebar esquerda

- [x] **`components/AtomPalette.tsx`**  
  Recebe: `activeSymbol`, `onSelect(symbol)`.  
  Renderiza um círculo por átomo com cor do `atomData`.  
  Estado visual: ativo (borda destacada), hover, inativo.

- [x] **`components/BondToolbar.tsx`**  
  Recebe: `activeBondType`, `onChange(type)`.  
  Três botões: I (single), II (double), III (triple).  
  Cada botão mostra linha(s) SVG desenhadas representando o tipo de ligação.

- [x] **`components/Sidebar.tsx`**  
  Compõe `AtomPalette` (topo) + separador + `BondToolbar` (base).  
  Coluna fixa à esquerda, altura 100%.

- [x] Commitar: `feat: Sidebar — AtomPalette + BondToolbar`

---

## FASE 4 — Canvas SVG

- [x] **`components/Canvas.tsx`**  
  Recebe o grafo, estado ativo e callbacks do `MoleculeEditor`.

  Responsabilidades:
  - Renderizar todas as ligações (`<Bond />`) antes dos átomos (z-order)
  - Renderizar todos os átomos (`<AtomNode />`)
  - Renderizar `FormulaLabel` se houver pelo menos 1 átomo
  - Capturar clique em área vazia → `PLACE_ATOM`
  - Aplicar `zoom` via `transform="scale(zoom)"`

- [x] **`components/AtomNode.tsx`** (sub-componente do Canvas)  
  Renderiza um `<circle>` + `<text>` com símbolo.  
  Props: atom, isSelected, isBondingFrom, onClick, onDragEnd.  
  Estados visuais: normal, selecionado (AtomInfoCard aberto), origem de ligação (destaque diferente).  
  Implementar drag com `onMouseDown` / `onMouseMove` / `onMouseUp` no SVG pai.

- [x] **`components/BondEdge.tsx`** (sub-componente do Canvas)  
  Renderiza 1, 2 ou 3 linhas `<line>` paralelas conforme o tipo.  
  Linhas duplas/triplas são deslocadas perpendicularmente à direção da ligação.

- [x] **`components/FormulaLabel.tsx`** (sub-componente do Canvas)  
  Calcula centróide dos átomos + offset vertical (acima da molécula).  
  Renderiza `<rect>` de fundo + `<text>` com fórmula.  
  Segunda linha com nome da molécula se `identifyMolecule` retornar resultado.

- [x] Commitar: `feat: Canvas — AtomNode, BondEdge, FormulaLabel`

---

## FASE 5 — Barra inferior

- [x] **`components/AtomInfoCard.tsx`**  
  Recebe: `atomId | null`, `graph`.  
  Quando `atomId` é `null`: oculto (altura 0 ou `hidden`).  
  Quando preenchido: mostra círculo colorido + nome + id + valência total + valência disponível.  
  Valência disponível: cor diferente se = 0 (saturado).  
  Animação: slide up ao aparecer.

- [x] **`components/BottomBar.tsx`**  
  Recebe callbacks: `onZoomIn`, `onZoomOut`, `onClear`.  
  Botões −, +, LIMPAR.  
  LIMPAR com estilo de ação destrutiva (cor de alerta).  
  Confirmar antes de limpar se houver átomos no grafo (`window.confirm` no MVP).

- [x] Commitar: `feat: AtomInfoCard + BottomBar`

---

## FASE 6 — Composição final

- [x] **`app/page.tsx`**  
  Importa e renderiza `MoleculeEditor` ocupando 100vw × 100vh.

- [x] **`components/MoleculeEditor.tsx`** — montar layout completo:
  ```
  <div class="flex flex-col h-screen">
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <Canvas />
    </div>
    <div class="flex">
      <AtomInfoCard />
      <BottomBar />
    </div>
  </div>
  ```

- [x] Ligar todos os callbacks do reducer aos componentes filhos
- [x] Commitar: `feat: full layout composition`

---

## FASE 7 — Interações pendentes

- [x] **Drag de átomos no canvas**  
  Ao segurar e mover um átomo → despacha `MOVE_ATOM` com nova posição.  
  Garantir que drag não dispara `SELECT_ATOM` ao soltar.

- [x] **Prevenção de ligação inválida**  
  Não permitir ligação se `getAvailableValence` de qualquer um dos dois átomos < ordem da ligação escolhida.  
  Feedback visual: átomo destino fica vermelho ao passar por cima quando inválido.

- [x] **Prevenção de ligação duplicada**
  Não permitir segunda ligação entre o mesmo par de átomos no MVP.

- [x] **Tecla Delete / Backspace**
  Se `selectedAtomId` preenchido → despacha `DELETE_ATOM`.

- [x] **Movimentar Canvas**
  Se `selectedAtomId` vazio → movimentar `Canva` para reposicionar x e y.

- [x] **Clique fora de átomo**
  Canvas recebe `onClick` → se alvo for o próprio SVG (não um átomo) → `DESELECT_ATOM`.

- [x] Commitar: `feat: interaction guards and keyboard shortcuts`

---

## FASE 8 — Estilo final

- [x] Aplicar design definido no Claude para refinamento visual (ver prompt de design)
- [x] Garantir que cores dos átomos no canvas batem com `atomData.ts`
- [x] Responsividade básica: sidebar colapsa em tela menor que 640px (mobile fora do escopo do MVP, mas não quebrar)
- [x] Favicon e `<title>` da página
- [x] Commitar: `style: apply final design tokens`

---

## FASE 9 — Testes manuais

- [x] Construir H₂O → fórmula correta → nome "Água" exibido
- [x] Construir CH₄ → fórmula correta → nome "Metano" exibido
- [x] Construir HNO₃ → fórmula correta → nome "Ácido Nítrico" exibido
- [x] Tentar criar ligação extra em H (valência 1) → bloqueado
- [x] Clicar átomo → AtomInfoCard abre com dados corretos
- [x] Mover átomo → ligações acompanham
- [x] Deletar átomo → ligações removidas junto
- [x] LIMPAR → canvas vazio
- [x] Zoom in/out → molécula escala corretamente

---

## FASE 10 — Deploy

- [ ] `vercel` (ou push para `main` com Vercel conectado ao repo)
- [ ] Testar URL de produção com os mesmos casos da Fase 9
- [ ] Registrar URL no histórico do `CLAUDE.md`
- [ ] Commitar: `chore: production deploy`

---

---

## FASE 11 — lib/challengeDatabase.ts

- [x] Definir interface `Challenge`: `id`, `name`, `formula`, `targetGraph` (só conectividade, sem posições x/y), `initialHint`, `difficulty`
- [x] Implementar array de desafios: H₂O (iniciante), CH₄ (iniciante), NH₃ (iniciante), CO₂ (intermediário), C₂H₆O (intermediário), C₆H₁₂O₆ (avançado), C₁₀H₂₀O Mentol (avançado)
- [x] Exportar `getChallengeById(id): Challenge | null` e `getAllChallenges(): Challenge[]`
- [x] Commitar: `feat: lib/challengeDatabase — desafios do MVP`

---

## FASE 12 — lib/moleculeComparator.ts

- [x] Definir interface `MoleculeDiff`: `missingAtoms`, `extraAtoms`, `wrongAtoms`, `missingBonds`, `wrongBondTypes`, `isCorrect`
- [x] Implementar `compareMolecules(current: MoleculeGraph, target: MoleculeGraph): MoleculeDiff`
- [x] Comparar por **tipo e quantidade** de átomos e tipo de ligações — **nunca por posição no canvas**
- [x] `isCorrect = true` somente quando todas as diferenças forem zero
- [x] Commitar: `feat: lib/moleculeComparator — comparação por conectividade`

---

## FASE 13 — lib/aiPromptBuilder.ts

- [x] Implementar `buildAnalysisPrompt(challenge: Challenge, currentGraph: MoleculeGraph, diff: MoleculeDiff): string`
- [x] Prompt deve instruir o modelo a responder em exatamente 3 frases: (1) reforçar o que está certo, (2) apontar o erro principal, (3) dar uma dica sem entregar a resposta
- [x] Prompt deve ser em português e incluir contexto do desafio e da diferença atual
- [x] Commitar: `feat: lib/aiPromptBuilder — construção de prompt para a IA`

---

## FASE 14 — app/api/analyze/route.ts

- [ ] Criar rota POST em `app/api/analyze/route.ts`
- [ ] Recebe body `{ challengeId: string, currentGraph: MoleculeGraph }`
- [ ] Busca challenge via `getChallengeById`, compara via `compareMolecules`, constrói prompt via `buildAnalysisPrompt`
- [ ] Chama Anthropic API com modelo `claude-sonnet-4-20250514`, `max_tokens: 300`
- [ ] Retorna `{ feedback: string, isCorrect: boolean }`
- [ ] Criar `.env.local` com `ANTHROPIC_API_KEY=` se não existir (não commitar)
- [ ] Tratamento de erro: se `ANTHROPIC_API_KEY` ausente → retorna 500 sem quebrar o frontend
- [ ] Commitar: `feat: api/analyze — rota POST com Anthropic`

---

## FASE 15 — Novas actions no reducer do MoleculeEditor

- [ ] Adicionar novos campos ao `EditorState`: `activeChallenge`, `challengeStatus`, `aiFeedback`, `isAnalyzing`
- [ ] Implementar action `START_CHALLENGE`: define `activeChallenge`, limpa grafo, `challengeStatus → active`
- [ ] Implementar action `REQUEST_ANALYSIS`: `isAnalyzing → true`
- [ ] Implementar action `SET_AI_FEEDBACK`: adiciona feedback ao array, `isAnalyzing → false`
- [ ] Implementar action `COMPLETE_CHALLENGE`: `challengeStatus → completed`
- [ ] Disparar `COMPLETE_CHALLENGE` automaticamente quando `isCorrect === true` na resposta da API
- [ ] Commitar: `feat: MoleculeEditor — actions de desafio e IA`

---

## FASE 16 — components/ChallengePanel.tsx

- [ ] Props: `challenge`, `challengeStatus`, `isAnalyzing`, `onAnalyze`, `onNewChallenge`
- [ ] Exibe nome do desafio, fórmula alvo e dificuldade
- [ ] Botão "Analisar" desabilitado enquanto `isAnalyzing === true`
- [ ] Estado `completed`: celebração visual (ex.: confete ou banner) + botão "Próximo desafio"
- [ ] Commitar: `feat: ChallengePanel — painel de desafio`

---

## FASE 17 — components/AIFeedbackPanel.tsx

- [ ] Props: `feedback: string[]`, `isAnalyzing: boolean`
- [ ] Lista feedbacks com o mais recente no topo
- [ ] Estado de loading durante `isAnalyzing` (spinner ou skeleton)
- [ ] Painel vazio exibe mensagem neutra "Construa a molécula e clique em Analisar"
- [ ] Commitar: `feat: AIFeedbackPanel — painel de feedback da IA`

---

## FASE 18 — Tela de seleção de desafios

- [ ] Criar `app/challenges/page.tsx` ou modal na página principal
- [ ] Listar todos os desafios com nome, fórmula e badge de dificuldade
- [ ] Botão "Iniciar" por desafio: despacha `START_CHALLENGE` e redireciona ao canvas
- [ ] Commitar: `feat: challenges page — seleção de desafios`

---

## FASE 19 — Integração final do painel direito

- [ ] Adicionar `ChallengePanel` + `AIFeedbackPanel` ao layout do `MoleculeEditor`
- [ ] Painel direito visível **somente quando `activeChallenge !== null`**
- [ ] Layout: painel direito ao lado do canvas (ou sobreposto em telas menores)
- [ ] Commitar: `feat: integração painel direito — ChallengePanel + AIFeedbackPanel`

---

## FASE 20 — Testes manuais da IA

- [ ] H₂O errado (H–H) → IA aponta o erro → corrigir → IA confirma
- [ ] CH₄ com N em vez de C → IA identifica átomo errado
- [ ] CO₂ com ligação simples → IA aponta tipo de ligação errado
- [ ] Completar desafio → `challengeStatus === completed` → celebração aparece
- [ ] `ANTHROPIC_API_KEY` ausente → erro 500 no servidor, frontend exibe mensagem amigável sem quebrar
- [ ] Commitar: `test: testes manuais da IA tutora`

---

## Backlog pós-MVP (não implementar agora)

- Múltiplas moléculas independentes no mesmo canvas
- Validação automática de estrutura química (regra do octeto)
- Exportar molécula como PNG / SVG
- Preços dinâmicos de valência (S, P com múltiplas valências)
- Banco de moléculas expandido
- Desfazer / refazer (undo/redo)
- Mobile touch events