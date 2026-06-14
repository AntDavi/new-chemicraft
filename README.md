<h1 align="center">ChemiCraft</h1>

<br>

## 💻 Projeto

ChemiCraft é um editor visual 2D de moléculas químicas para uso educacional. O usuário posiciona átomos numa tela SVG interativa, cria ligações entre eles (simples, duplas ou triplas) e recebe em tempo real a fórmula molecular correta (ex.: HNO₃) como um balão flutuante. A plataforma conta com uma IA tutora que propõe desafios e fornece feedback personalizado, além de um sistema de turmas que permite professores acompanharem o progresso dos alunos.

**Público-alvo:** Estudantes e professores de química que precisam de uma ferramenta leve e intuitiva, sem instalação.

## 🧪 Tecnologias

- [Next.js 16](https://nextjs.org/): Framework React com App Router para desenvolvimento full-stack e deploy simplificado na Vercel.
- [TypeScript](https://www.typescriptlang.org/): Superset do JavaScript que adiciona tipagem estática ao código.
- [Supabase](https://supabase.com/): BaaS com autenticação (email/senha), banco de dados Postgres e RLS para o sistema de turmas e relatórios.
- SVG customizado (sem biblioteca externa): Renderização do canvas de moléculas com controle total e sem overhead.

## 🖌️ Bibliotecas UI

- [Tailwind CSS](https://tailwindcss.com/): Framework de CSS utilitário para design rápido e customizável.
- [ShadCn](https://ui.shadcn.com/): Biblioteca de componentes UI para um desenvolvimento rápido.
- [Lucide React](https://lucide.dev/icons/): Biblioteca de ícones de código aberto para aplicações modernas.

## 🛠️ Funcionalidades

- Posicionar átomos (C, H, O, N, S, P, F, Cl) livremente no canvas SVG.
- Criar e promover ligações entre átomos: simples → dupla → tripla.
- Exibir a fórmula molecular em tempo real (notação Hill) num balão flutuante.
- Identificar moléculas conhecidas (H₂O, CO₂, CH₄, NH₃, etc.) e exibir seus nomes.
- Inspecionar valência total e disponível de cada átomo ao clicar nele.
- Desfazer / refazer alterações no grafo (Ctrl+Z / Ctrl+Shift+Z).
- Deletar átomos e ligações com a tecla Delete ou Backspace.
- Zoom in/out no canvas.
- IA tutora com desafios por nível de dificuldade e feedback gerado via API Claude.
- Sistema de turmas: professor cria turmas com código de acesso, alunos entram pelo código.
- Relatórios individuais e agregados de progresso por turma.

## 📑 Como Inicializar a Aplicação Localmente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm (gerenciador de pacotes do Node.js)
- Conta no [Supabase](https://supabase.com/) com as tabelas configuradas
- Chave de API da [Anthropic](https://www.anthropic.com/)

### Passo a Passo

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/AntDavi/new-chemicraft
   ```

2. **Entre no diretório e instale as dependências:**

   ```bash
   cd new-chemicraft
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ANTHROPIC_API_KEY=sk-...
   ```

4. **Execute o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 🗂️ Estrutura de Rotas

| Rota | Papel | Descrição |
|------|-------|-----------|
| `/` | público | Landing page |
| `/login` | público | Formulário de login |
| `/register` | público | Cadastro de professor ou aluno |
| `/app` | autenticado | Editor de moléculas com desafios e IA |
| `/teacher/dashboard` | professor | Lista de turmas criadas |
| `/teacher/classroom/[id]` | professor | Visão geral da turma |
| `/teacher/classroom/[id]/report` | professor | Relatório agregado da turma |
| `/teacher/classroom/[id]/student/[studentId]` | professor | Relatório individual do aluno |
| `/student/dashboard` | aluno | Progresso e turmas do aluno |
| `/student/join` | aluno | Entrar em uma turma pelo código de 6 caracteres |

## 📝 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para obter mais detalhes.

---

<p align='center'>Criado por Anthony Davi 🙃</p>
