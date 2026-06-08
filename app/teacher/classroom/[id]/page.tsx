// Visão da turma pelo professor: lista de alunos, última atividade,
// taxa de conclusão e destaque visual para alunos inativos há +7 dias.
// Server Component.

import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/SignOutButton";
import { CopyButton } from "@/components/CopyButton";
import { createServerClient } from "../../../../lib/supabase";

const INACTIVE_DAYS = 7;

type Enrollment = {
  id: string;
  joined_at: string;
  student_id: string;
  users: { name: string | null; email: string | null } | null;
};

type Session = {
  id: string;
  student_id: string;
  status: string;
  started_at: string;
};

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Garante que o professor é dono da turma
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, join_code, created_at")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (!classroom) notFound();

  // Alunos matriculados com dados do perfil
  const { data: enrollmentsRaw } = await supabase
    .from("enrollments")
    .select("id, joined_at, student_id, users(name, email)")
    .eq("classroom_id", id)
    .order("joined_at", { ascending: true });

  // E depois map para extrair o primeiro
  const enrollments = (enrollmentsRaw ?? []).map((e) => ({
    ...e,
    users: e.users?.[0] ?? null, // pega apenas o primeiro
  })) as Enrollment[];

  // Sessões de desafio desta turma
  const { data: sessionsRaw } = await supabase
    .from("challenge_sessions")
    .select("id, student_id, status, started_at")
    .eq("classroom_id", id);

  const sessions = (sessionsRaw ?? []) as Session[];

  // Métricas agregadas da turma
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (s) => s.status === "completed",
  ).length;
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - INACTIVE_DAYS);

  // Computa dados por aluno
  const studentStats = enrollments.map((enrollment) => {
    const studentSessions = sessions.filter(
      (s) => s.student_id === enrollment.student_id,
    );
    const completed = studentSessions.filter(
      (s) => s.status === "completed",
    ).length;

    const lastActivityDate =
      studentSessions.length > 0
        ? new Date(
            Math.max(
              ...studentSessions.map((s) => new Date(s.started_at).getTime()),
            ),
          )
        : null;

    const isInactive = !lastActivityDate || lastActivityDate < sevenDaysAgo;

    return {
      enrollment,
      total: studentSessions.length,
      completed,
      lastActivityDate,
      isInactive,
    };
  });

  const inactiveCount = studentStats.filter((s) => s.isInactive).length;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/dashboard">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <p className="font-semibold text-sm leading-none truncate max-w-[200px] sm:max-w-none">
              {classroom.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">Código:</span>
              <span className="font-mono text-xs font-semibold tracking-widest">
                {classroom.join_code}
              </span>
              <CopyButton text={classroom.join_code} />
            </div>
          </div>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">
                {enrollments.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">alunos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">
                {completionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">conclusão</p>
            </CardContent>
          </Card>
          <Card
            className={
              inactiveCount > 0
                ? "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/20"
                : ""
            }
          >
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                inativos +7d
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de alunos */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Alunos matriculados</h2>

          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="font-medium">Nenhum aluno ainda</p>
                <p className="text-sm text-muted-foreground">
                  Compartilhe o código{" "}
                  <span className="font-mono font-semibold">
                    {classroom.join_code}
                  </span>{" "}
                  com seus alunos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {studentStats.map(
                ({
                  enrollment,
                  total,
                  completed,
                  lastActivityDate,
                  isInactive,
                }) => {
                  const profile = enrollment.users;
                  const displayName =
                    profile?.name ?? profile?.email ?? "Aluno";

                  return (
                    <Link
                      key={enrollment.id}
                      href={`/teacher/classroom/${id}/student/${enrollment.student_id}`}
                      className="block group"
                    >
                      <Card
                        className={
                          isInactive
                            ? "border-amber-400/60 transition-colors group-hover:border-foreground/20"
                            : "transition-colors group-hover:border-foreground/20"
                        }
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-sm truncate">
                                  {displayName}
                                </CardTitle>
                                {isInactive && (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-sm shrink-0">
                                    <AlertCircle className="size-3" />
                                    inativo
                                  </span>
                                )}
                              </div>
                              <CardDescription className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {lastActivityDate ? (
                                  <>
                                    Última atividade:{" "}
                                    {lastActivityDate.toLocaleDateString(
                                      "pt-BR",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                      },
                                    )}
                                  </>
                                ) : (
                                  "Nenhuma atividade registrada"
                                )}
                              </CardDescription>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                              <FlaskConical className="size-4" />
                              <span className="tabular-nums">
                                {completed}/{total}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
