import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, ChevronRight, Gamepad2, Loader2, Medal, Plus, SkipForward, Square, Trash2, Trophy,
} from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, EmptyState, Skeleton, SectionHeader, toast, WorkspaceHero } from '@core/ui'
import { teacherApi } from '../api'
import type { QuizQuestion, QuizLeaderboardEntry } from '../api'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'

const OPTION_COLORS = [
  'bg-brand-red text-white',
  'bg-brand-blue text-white',
  'bg-emerald-500 text-white',
  'bg-brand-yellow text-neutral-900',
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export default function ArenaPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const { play } = useSound()

  const [quizId, setQuizId] = useState<number | null>(null)
  const [phase, setPhase] = useState<'setup' | 'live' | 'podium'>('setup')

  // Form state for adding a question
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)

  const stateQuery = useQuery({
    queryKey: ['trainer', 'quiz', quizId, 'state'],
    queryFn: () => teacherApi.quizTrainerState(quizId!),
    enabled: Boolean(quizId),
    refetchInterval: phase === 'live' ? 3000 : false,
  })

  const quiz = stateQuery.data?.quiz
  const questions: QuizQuestion[] = stateQuery.data?.questions ?? []
  const leaderboard: QuizLeaderboardEntry[] = stateQuery.data?.leaderboard ?? []

  const startMutation = useMutation({
    mutationFn: () => teacherApi.quizStart(id),
    onSuccess: (data) => {
      setQuizId(data.id)
      play('success')
      toast.success('Arena created! Add your questions.')
    },
    onError: () => toast.error('Failed to create arena.'),
  })

  const addQuestionMutation = useMutation({
    mutationFn: () => teacherApi.quizAddQuestion(quizId!, {
      question_text: questionText,
      options,
      correct_index: correctIndex,
    }),
    onSuccess: () => {
      play('tap')
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectIndex(0)
      queryClient.invalidateQueries({ queryKey: ['trainer', 'quiz', quizId, 'state'] })
    },
    onError: () => toast.error('Failed to add question.'),
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => teacherApi.quizDeleteQuestion(quizId!, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'quiz', quizId, 'state'] })
    },
  })

  const revealMutation = useMutation({
    mutationFn: () => teacherApi.quizRevealNext(quizId!),
    onSuccess: () => {
      play('focus')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'quiz', quizId, 'state'] })
      setPhase('live')
    },
    onError: () => toast.error('No more questions to reveal.'),
  })

  const endMutation = useMutation({
    mutationFn: () => teacherApi.quizEnd(quizId!),
    onSuccess: () => {
      play('success')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'quiz', quizId, 'state'] })
      setPhase('podium')
    },
    onError: () => toast.error('Failed to end arena.'),
  })

  const canAddQuestion = questionText.trim() && options.every((o) => o.trim())
  const revealedCount = questions.filter((q) => q.revealed).length
  const currentQuestion = quiz?.current_question_id
    ? questions.find((q) => q.id === quiz.current_question_id)
    : null

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="ARENA"
          title="Live quiz battle"
          description="Launch a real-time quiz, reveal questions one by one, and watch the leaderboard race live."
          image="placeholder"
          imageAlt="Aula Abierta illustration running a live quiz arena"
          tone="red"
          metric={quizId ? (
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-white/15 px-4 text-white">
              <Gamepad2 size={19} aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold tabular-nums">{questions.length}</span>
              <span className="text-xs font-semibold text-white/75">questions · {revealedCount} revealed</span>
            </div>
          ) : undefined}
        />

        {/* ─── Phase: setup ──────────────────────────────────────────── */}
        {phase === 'setup' && (
          <>
            {!quizId ? (
              <div className="flex flex-col items-center gap-6 rounded-[26px] border border-neutral-200 bg-white p-10 shadow-soft text-center">
                <div className="flex size-20 items-center justify-center rounded-[24px] bg-brand-red/10 text-brand-red">
                  <Gamepad2 size={36} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-neutral-900">Create a new arena</h2>
                  <p className="mt-2 text-sm font-semibold text-neutral-500">
                    Add up to 10 questions, then start the battle with your students.
                  </p>
                </div>
                <Button
                  onClick={() => startMutation.mutate()}
                  loading={startMutation.isPending}
                  variant="danger"
                  size="lg"
                  leftIcon={<Plus size={18} aria-hidden="true" />}
                >
                  Create arena
                </Button>
              </div>
            ) : (
              <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
                {/* Question builder */}
                <section className="flex flex-col gap-6" aria-labelledby="question-builder-title">
                  <SectionHeader
                    eyebrow="BUILD YOUR QUIZ"
                    title="Add questions"
                    titleId="question-builder-title"
                    description="Type the question, fill in 4 options, and mark the correct one."
                  />

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
                    <div className="flex flex-col gap-5">
                      <div>
                        <label htmlFor="q-text" className="block text-sm font-bold text-neutral-700">Question</label>
                        <textarea
                          id="q-text"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="What is the plural of 'child'?"
                          rows={2}
                          className="mt-2 w-full resize-none rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-bold text-neutral-700">
                          Answers <span className="ml-1 text-xs font-semibold text-neutral-400">(click to mark correct)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setCorrectIndex(i)}
                                className={cn(
                                  'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-colors duration-150',
                                  correctIndex === i
                                    ? OPTION_COLORS[i]
                                    : 'border border-neutral-200 bg-neutral-50 text-neutral-400',
                                )}
                                aria-label={`Mark option ${i + 1} as correct`}
                              >
                                {String.fromCharCode(65 + i)}
                              </button>
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const next = [...options]
                                  next[i] = e.target.value
                                  setOptions(next)
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 text-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => addQuestionMutation.mutate()}
                        loading={addQuestionMutation.isPending}
                        disabled={!canAddQuestion || questions.length >= 10}
                        variant="danger"
                        leftIcon={<Plus size={16} aria-hidden="true" />}
                        fullWidth
                      >
                        Add question ({questions.length}/10)
                      </Button>
                    </div>
                  </div>

                  {/* Added questions list */}
                  {questions.length > 0 && (
                    <motion.ul initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
                      {questions.map((q) => (
                        <motion.li
                          key={q.id}
                          variants={fadeUp}
                          className="flex items-start gap-4 rounded-[20px] border border-neutral-200 bg-white p-4 shadow-soft"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-sm font-extrabold text-brand-red">
                            {q.position}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-base font-extrabold text-neutral-900">{q.question_text}</p>
                            <div className="mt-2 grid grid-cols-2 gap-1">
                              {q.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    'truncate rounded-lg px-2 py-1 text-xs font-bold',
                                    i === q.correct_index
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-neutral-50 text-neutral-500',
                                  )}
                                >
                                  {String.fromCharCode(65 + i)}: {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteQuestionMutation.mutate(q.id)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-red-50 hover:text-brand-red"
                            aria-label={`Delete question ${q.position}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </section>

                {/* Launch panel */}
                <aside className="sticky top-6 flex flex-col gap-5">
                  <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-bold text-brand-red">ARENA LAUNCH</p>
                    <h2 className="mt-2 font-display text-xl font-extrabold text-neutral-900">Ready to battle?</h2>
                    <p className="mt-2 text-sm font-semibold text-neutral-500">
                      {questions.length === 0
                        ? 'Add at least one question to start the battle.'
                        : `${questions.length} question${questions.length !== 1 ? 's' : ''} ready. Hit reveal to launch the first one.`}
                    </p>
                    <div className="mt-5 flex flex-col gap-3">
                      <Button
                        onClick={() => revealMutation.mutate()}
                        loading={revealMutation.isPending}
                        disabled={questions.length === 0}
                        variant="danger"
                        fullWidth
                        rightIcon={<ChevronRight size={17} aria-hidden="true" />}
                      >
                        Reveal first question
                      </Button>
                      <p className="text-center text-xs font-semibold text-neutral-400">
                        Students will see the question on their devices instantly.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {/* ─── Phase: live ───────────────────────────────────────────── */}
        {phase === 'live' && quizId && (
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex flex-col gap-5" aria-labelledby="live-question-title">
              <SectionHeader eyebrow="NOW LIVE" title="Current question" titleId="live-question-title" />

              {currentQuestion ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden rounded-[26px] bg-brand-blue text-white shadow-lg"
                  >
                    <div className="p-6 sm:p-8">
                      <p className="text-xs font-extrabold text-brand-yellow">
                        QUESTION {currentQuestion.position} OF {questions.length}
                      </p>
                      <h2 className="mt-4 font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl">
                        {currentQuestion.question_text}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-6 sm:p-8 sm:pt-0">
                      {currentQuestion.options.map((opt, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-3 rounded-[18px] p-4',
                            i === currentQuestion.correct_index ? 'bg-emerald-500' : 'bg-white/10',
                          )}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-extrabold">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm font-bold text-white">{opt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/10 px-6 pb-6 sm:px-8">
                      <p className="text-xs font-semibold text-white/60">
                        {currentQuestion.answer_count ?? 0} student{(currentQuestion.answer_count ?? 0) !== 1 ? 's' : ''} answered
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex items-center justify-center gap-3 rounded-[22px] border border-neutral-200 bg-white p-8 shadow-soft">
                  <Loader2 size={20} className="animate-spin text-brand-blue" aria-hidden="true" />
                  <p className="text-sm font-semibold text-neutral-500">Waiting for first question…</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => revealMutation.mutate()}
                  loading={revealMutation.isPending}
                  disabled={revealedCount >= questions.length}
                  variant="danger"
                  leftIcon={<SkipForward size={17} aria-hidden="true" />}
                >
                  Next question
                </Button>
                <Button
                  onClick={() => endMutation.mutate()}
                  loading={endMutation.isPending}
                  variant="ghost"
                  leftIcon={<Square size={16} fill="currentColor" aria-hidden="true" />}
                >
                  End arena
                </Button>
              </div>
            </section>

            {/* Live leaderboard */}
            <aside className="sticky top-6 rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <Trophy size={19} className="text-brand-yellow" aria-hidden="true" />
                <p className="text-xs font-bold text-brand-blue">LIVE LEADERBOARD</p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {leaderboard.length === 0 ? (
                  <p className="py-4 text-center text-sm font-semibold text-neutral-400">Waiting for answers…</p>
                ) : (
                  leaderboard.slice(0, 10).map((entry) => (
                    <motion.div
                      key={entry.student_id}
                      layout
                      className={cn(
                        'flex items-center gap-3 rounded-[16px] p-3',
                        entry.rank === 1 ? 'bg-brand-yellow/20' : entry.rank === 2 ? 'bg-neutral-100' : 'bg-neutral-50',
                      )}
                    >
                      <span className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums',
                        entry.rank === 1 ? 'bg-brand-yellow text-neutral-900' :
                        entry.rank === 2 ? 'bg-neutral-300 text-neutral-700' :
                        entry.rank === 3 ? 'bg-orange-300 text-white' :
                        'bg-neutral-100 text-neutral-500',
                      )}>
                        {entry.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-800">{entry.name}</span>
                      <span className="font-display text-lg font-extrabold tabular-nums text-brand-blue">{entry.score}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        {/* ─── Phase: podium ─────────────────────────────────────────── */}
        {phase === 'podium' && (
          <section className="flex flex-col items-center gap-8" aria-labelledby="podium-title">
            <div className="text-center">
              <p className="text-xs font-extrabold text-brand-red">ARENA COMPLETE</p>
              <h2 id="podium-title" className="mt-2 font-display text-4xl font-extrabold text-neutral-900">Final podium</h2>
            </div>

            {leaderboard.length === 0 ? (
              <EmptyState icon={<Award size={22} />} title="No answers recorded" description="No one answered any questions." />
            ) : (
              <div className="flex w-full max-w-lg flex-col gap-4">
                {leaderboard.slice(0, 3).map((entry, i) => (
                  <motion.div
                    key={entry.student_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.3 }}
                    className={cn(
                      'flex items-center gap-5 rounded-[24px] p-5 shadow-soft',
                      i === 0 ? 'bg-brand-yellow' : i === 1 ? 'bg-neutral-200' : 'bg-orange-100',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-14 shrink-0 items-center justify-center rounded-full border-2',
                        i === 0 && 'border-yellow-500/40 bg-white/60 text-yellow-600',
                        i === 1 && 'border-neutral-400/40 bg-white/60 text-neutral-500',
                        i === 2 && 'border-orange-400/40 bg-white/60 text-orange-500',
                      )}
                      aria-label={`${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} place`}
                    >
                      <Medal size={30} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl font-extrabold text-neutral-900">{entry.name}</p>
                      <p className="text-sm font-semibold text-neutral-700">{entry.score} correct answers</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <Button
              onClick={() => {
                setQuizId(null)
                setPhase('setup')
                setQuestionText('')
                setOptions(['', '', '', ''])
                setCorrectIndex(0)
              }}
              variant="danger"
              leftIcon={<Plus size={17} aria-hidden="true" />}
            >
              New arena
            </Button>
          </section>
        )}
      </div>
    </AppShell>
  )
}
