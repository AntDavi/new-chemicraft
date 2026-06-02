// Rota POST /api/analyze
// Recebe { challengeId, currentGraph }, compara a molécula desenhada pelo aluno
// contra o alvo do desafio e chama a OpenAI para gerar feedback tutorial em 3 frases.
// Retorna { feedback: string, isCorrect: boolean }.

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { getChallengeById } from '@/app/lib/challengeDatabase';
import { compareMolecules } from '@/app/lib/moleculeComparator';
import { buildAnalysisPrompt } from '@/app/lib/aiPromptBuilder';
import type { MoleculeGraph } from '@/app/lib/moleculeGraph';

export async function POST(request: NextRequest) {
  // Verifica presença da chave antes de qualquer coisa
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY não configurada no servidor.' },
      { status: 500 },
    );
  }

  // Parse e validação básica do body
  let challengeId: string;
  let currentGraph: MoleculeGraph;
  try {
    const body = await request.json();
    challengeId = body.challengeId;
    currentGraph = body.currentGraph;
    if (!challengeId || !currentGraph) throw new Error('campos obrigatórios ausentes');
  } catch {
    return NextResponse.json(
      { error: 'Body inválido. Esperado: { challengeId, currentGraph }.' },
      { status: 400 },
    );
  }

  // Busca o desafio pelo id
  const challenge = getChallengeById(challengeId);
  if (!challenge) {
    return NextResponse.json(
      { error: `Desafio "${challengeId}" não encontrado.` },
      { status: 404 },
    );
  }

  // Compara o grafo atual com o alvo e constrói o prompt
  const diff = compareMolecules(currentGraph, challenge.targetGraph);
  const prompt = buildAnalysisPrompt(challenge, currentGraph, diff);

  // Chama a OpenAI
  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const feedback = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ feedback, isCorrect: diff.isCorrect });
  } catch (err) {
    console.error('[api/analyze] Erro na OpenAI:', err);
    return NextResponse.json(
      { error: 'Falha ao obter feedback da IA. Tente novamente.' },
      { status: 502 },
    );
  }
}
