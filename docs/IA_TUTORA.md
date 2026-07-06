# IA Tutora — Arquitetura, Classificação e Funcionamento

> Documento técnico sobre o módulo de inteligência artificial do ChemiCraft.
> Descreve como a IA está integrada, que tipo de IA ela é e por que as decisões de design foram tomadas dessa forma.

---

## 1. Que tipo de IA é essa?

A IA do ChemiCraft pode ser classificada em múltiplas dimensões simultaneamente. Nenhuma classificação sozinha a descreve completamente.

### 1.1 Por arquitetura: Large Language Model (LLM)

O núcleo da IA é um **Modelo de Linguagem de Grande Escala** — especificamente o `gpt-4o-mini` da OpenAI. LLMs são redes neurais do tipo Transformer treinadas em enormes corpora de texto para prever tokens sequencialmente. Eles não "conhecem química" de forma simbólica; aprenderam padrões linguísticos sobre química a partir de textos existentes.

Isso tem implicações diretas no design: **um LLM não é confiável para julgar se uma molécula está correta**. Ele pode alucinar fórmulas, confundir valências ou simplesmente errar. Por isso, no ChemiCraft, o LLM nunca toma decisões químicas.

### 1.2 Por paradigma de aprendizado: Aprendizado por Transferência com In-Context Learning

O modelo não foi treinado especificamente para este projeto. O que acontece é **in-context learning** (aprendizado em contexto): a cada chamada de API, o prompt inclui todas as informações necessárias para a tarefa — contexto do desafio, estado atual do aluno, análise da tentativa. O modelo aplica o conhecimento que adquiriu no pré-treino para responder ao contexto imediato.

Não há fine-tuning, não há embeddings customizados, não há memória entre sessões. Cada análise é uma conversa nova e autossuficiente.

### 1.3 Por função no sistema: IA Auxiliar / Ferramenta Especializada

A IA **não é o sistema** — ela é uma peça dentro de um sistema maior predominantemente determinístico. Sua única responsabilidade é transformar dados estruturados em linguagem pedagógica. Toda a inteligência química (comparação de grafos, detecção de erros, verificação de valência) é código convencional.

Essa classificação é importante: o sistema não depende da IA para funcionar corretamente do ponto de vista químico.

### 1.4 Por papel pedagógico: Agente Tutor Socrático

O comportamento prescrito ao modelo é o do **método socrático**: guiar o aluno por perguntas e pistas em vez de entregar respostas. O prompt proíbe explicitamente revelar a fórmula, contar quantos átomos faltam ou dar instruções passo a passo. O modelo deve fazer o aluno pensar, não pensar por ele.

Esse papel tem nome na literatura de tecnologia educacional: **Intelligent Tutoring System (ITS)** com estratégia de scaffolding mínimo — oferecer o menor suporte necessário para que o aluno avance por conta própria.

### 1.5 Por autonomia: IA Reativa de Baixa Autonomia

A IA só age quando explicitamente solicitada (botão "Analisar") ou quando o sistema dispara um evento predefinido (início de desafio, violação de valência). Ela não observa o aluno continuamente, não toma iniciativas próprias e não persiste contexto entre chamadas. É **reativa**, não proativa.

---

## 2. A Separação Fundamental: Código Determinístico vs. IA

A decisão de design mais importante do módulo é onde traçar a linha entre o que o código faz e o que a IA faz.

```
┌─────────────────────────────────────────────────────────────┐
│                     CÓDIGO DETERMINÍSTICO                   │
│                                                             │
│  compareMolecules()     →  MoleculeDiff                     │
│  - Contagem de átomos   →  missingAtoms / extraAtoms        │
│  - Contagem de ligações →  wrongBondTypes / missingBonds    │
│  - Histograma de vizinhança → structurallyCorrect           │
│  - isCorrect            →  booleano definitivo              │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │ MoleculeDiff (dado estruturado)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     buildAnalysisPrompt()                   │
│                                                             │
│  Traduz o diff para linguagem natural                       │
│  Injeta contexto do desafio e estado atual                  │
│  Define regras invioláveis de comportamento                 │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │ prompt (string)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     LLM (gpt-4o-mini)                       │
│                                                             │
│  Recebe: contexto + diff traduzido + regras                 │
│  Produz: 3 frases em português (feedback pedagógico)        │
│  NÃO decide: se a molécula está certa (isso é o isCorrect   │
│              que vem do código, nunca do modelo)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Por que essa separação existe?**

LLMs são não-determinísticos e falíveis. Se o modelo decidisse se a resposta está correta, um aluno poderia receber "parabéns, molécula correta!" para uma estrutura errada — ou ser bloqueado numa resposta certa por uma alucinação do modelo. O `isCorrect` é calculado por código puro, sem margem para erro, e o modelo só recebe esse resultado como fato consumado.

---

## 3. O Comparador de Moléculas: A Inteligência Real do Sistema

O `moleculeComparator.ts` é onde a maior parte da "inteligência química" reside — e é código convencional, sem IA.

### 3.1 Comparação por contagem (nível 1)

Primeira verificação: histogramas de símbolos e tipos de ligação.

```
currentCounts:  { H: 1, O: 1 }
targetCounts:   { H: 2, O: 1 }

→ missingAtoms: [{ symbol: 'H', count: 1 }]
```

Isso detecta erros óbvios: elemento errado, quantidade errada, tipo de ligação errada.

### 3.2 Inferência de tipo de ligação incorreto

Quando há excesso de ligações simples e falta de ligações duplas, o comparador infere que o aluno usou o tipo errado:

```
current: 2 single, 0 double
target:  1 single, 1 double

→ wrongBondTypes: [{ expected: 'double', got: 'single', count: 1 }]
```

### 3.3 Verificação estrutural por histograma de vizinhança (nível 2)

A contagem pode bater e a molécula ainda estar errada. Exemplo para H₂O₂ (água oxigenada):

```
Correto:   H–O–O–H
Errado:    H–O–H + O isolado (ou H–O–H e O–H)
```

Ambas as versões têm 2 H e 2 O, mas a conectividade é diferente. Para detectar isso, cada átomo recebe uma **assinatura de vizinhança**:

```
// Para o O central em H-O-O-H:
"O(H:single,O:single)"

// Para o H terminal:
"H(O:single)"
```

Os vizinhos são ordenados alfabeticamente — isso garante que `O(H:single,O:single)` seja idêntico independente da ordem em que o aluno criou as ligações. Um histograma dessas assinaturas é comparado entre grafo atual e alvo. Se diferirem, a estrutura está errada mesmo com contagens corretas.

Esta é a verificação mais sofisticada do sistema: é um isomorfismo de grafos simplificado, suficiente para as moléculas do MVP.

---

## 4. O Prompt: Engenharia de Contexto

O prompt enviado ao LLM é a interface entre o sistema determinístico e o modelo. Sua estrutura é deliberada:

### 4.1 Persona e missão

```
Você é um tutor de química para estudantes do ensino médio.
Sua missão é dar feedback encorajador que faça o aluno PENSAR —
você dá pistas, nunca respostas.
```

Estabelece o papel antes de qualquer dado. LLMs respondem melhor quando o contexto de persona é definido primeiro.

### 4.2 Dados visíveis ao aluno (estado atual)

```
ESTADO ATUAL DO ALUNO:
- Átomos desenhados: 1 H, 1 O
- Ligações desenhadas: 1 simples
```

O modelo sabe o que o aluno fez, mas em nível de contagem — não recebe o grafo bruto com coordenadas.

### 4.3 Análise interna marcada como secreta

```
ANÁLISE INTERNA (apenas para você — NUNCA revele estes dados ao aluno):
- O que está correto: átomos corretos: 1 O; ligações corretas: 1 simples
- Erros encontrados:
- Átomos faltando: 1 H
```

Esse bloco é fundamental. O modelo recebe os dados do diff em linguagem natural, mas com a instrução explícita de não citar esses números ao aluno. O objetivo é que o modelo use esses dados apenas para calibrar o tom e a direção da dica, não para simplesmente repassá-los.

### 4.4 Instrução de formato rígida

```
Responda em exatamente 3 frases em português, sem numeração, sem marcadores:

Frase 1 — Reforce o que o aluno acertou (sem citar quantidades exatas).
Frase 2 — Indique APENAS A REGIÃO do erro (ex: "revise as ligações do átomo central").
Frase 3 — Termine com uma pergunta ou pista conceitual.
```

Formato rígido reduz a variabilidade da saída e facilita a exibição no painel. `max_tokens: 300` garante que o modelo não extrapole.

### 4.5 Regras negativas explícitas

```
REGRAS INVIOLÁVEIS:
- NUNCA revele a fórmula molecular nem quantos átomos de cada elemento a molécula tem.
- NUNCA diga quantos átomos ou ligações faltam, sobram ou devem ser adicionados.
- NUNCA dê instruções passo a passo.
- NUNCA cite os dados da análise interna literalmente.
```

Regras negativas são necessárias porque LLMs tendem a ser "úteis demais" — sem restrições, o modelo simplesmente diria "falta 1 H ligado ao O", destruindo o objetivo pedagógico.

---

## 5. Gatilhos de Feedback

A IA pode ser acionada de três formas:

| Gatilho | Momento | Tipo de feedback |
|---------|---------|-----------------|
| `START_CHALLENGE` | Ao iniciar um desafio | `initialHint` pré-escrito (sem chamada de API) |
| Botão "Analisar" | Sob demanda do aluno | Chamada completa ao LLM |
| Violação de valência | Automático ao tentar criar ligação inválida | Chamada completa ao LLM |

O `initialHint` merece atenção: ele é texto humano escrito no `challengeDatabase.ts`, não gerado pela IA. Isso garante uma dica de qualidade garantida no momento mais crítico — quando o aluno ainda não sabe por onde começar — sem custo de API e sem latência.

---

## 6. Registro de Sessões: IA Informando Professores

Cada ação do aluno é registrada no banco de dados via `sessionLogger.ts`, sempre em modo `fire-and-forget` (`.then().catch()`, nunca `await` na UI):

```
place_atom     → qual símbolo, onde
add_bond       → entre quais átomos
delete_atom    → qual átomo removido
valence_blocked → tentativa bloqueada por valência
feedback recebido → texto + gatilho (manual / valence_error / challenge_start)
```

Esses dados alimentam os relatórios do professor: erros mais frequentes por molécula, padrão de tentativas, evolução entre primeira e última sessão. A IA tutora, nesse sentido, é também uma geradora de dados pedagógicos estruturados.

---

## 7. O que a IA Não Faz (e Por Que)

| Capacidade | Presente? | Justificativa |
|------------|-----------|---------------|
| Julgar correção da molécula | Não | Papel do comparador determinístico |
| Memória entre sessões | Não | In-context learning; sem estado persistente no modelo |
| Geração de novos desafios | Não | Desafios são código estático curado manualmente |
| Verificação de isomorfismo completo | Não | Histograma de vizinhança é suficiente para o MVP |
| Observação contínua do aluno | Não | Reativa; só age quando acionada |
| Fine-tuning em dados do sistema | Não | Custo e complexidade não justificados no MVP |

---

## 8. Diagrama do Fluxo Completo

```
Aluno posiciona átomos e ligações no Canvas SVG
                   │
                   ▼
         MoleculeGraph atualizado
         (React useReducer)
                   │
         Clica "Analisar"
                   │
                   ▼
         handleAnalyze() em MoleculeEditor
         dispatch(REQUEST_ANALYSIS) → spinner
                   │
                   ▼
         POST /api/analyze
         { challengeId, currentGraph }
                   │
         ┌─────────┴──────────┐
         │   Servidor Next.js  │
         │                    │
         │ getChallengeById()  │
         │ compareMolecules()  │ ← código puro, sem IA
         │ buildAnalysisPrompt()│ ← tradução para texto
         │        │            │
         │        ▼            │
         │  gpt-4o-mini API    │ ← único ponto de IA
         │  max_tokens: 300    │
         └─────────┬──────────┘
                   │
         { feedback: string, isCorrect: boolean }
                   │
                   ▼
         dispatch(SET_AI_FEEDBACK)
         isCorrect → challengeStatus: 'completed'
         feedback  → aiFeedback[] (mais recente no topo)
                   │
         ┌─────────┴──────────┐
         │  AIFeedbackPanel   │  ← exibe texto do modelo
         │  ChallengePanel    │  ← exibe celebração se correto
         └────────────────────┘
```

---

## 9. Síntese: Onde Esta IA se Encaixa no Ecossistema

O ChemiCraft usa um padrão que pode ser chamado de **IA como último milha**: o sistema faz 90% do trabalho de forma determinística — comparação, validação, detecção de erros — e usa o LLM exclusivamente para o que código convencional não faz bem: gerar linguagem natural empática, variada e pedagogicamente adequada.

Isso contrasta com dois extremos comuns:

- **IA como oráculo**: o modelo recebe o grafo cru e decide tudo — propenso a alucinações, custoso, não auditável
- **Código puro sem IA**: feedback sempre igual, sem variação de tom, sem capacidade de adaptar a linguagem ao contexto

A abordagem do ChemiCraft combina a confiabilidade do código com a expressividade do LLM, mantendo cada um na zona onde é mais competente.
