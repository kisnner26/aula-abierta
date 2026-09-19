import { useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, CheckCircle2, Gamepad2, Loader2, PartyPopper, Trophy, XCircle } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, Skeleton, WorkspaceHero } from '@core/ui'
import { studentApi } from '../api'
import type { StudentQuizQuestion } from '../api'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'

const OPTION_COLORS = [
  { base: 'bg-brand-red', hover: 'hover:bg-red-700', text: 'text-white' },
  { base: 'bg-brand-blue', hover: 'hover:bg-blue-700', text: 'text-white' },
  { base: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-white' },
  { base: 'bg-brand-yellow', hover: 'hover:bg-yellow-400', text: 'text-neutral-900' },
]

const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface AnswerResult {
  isCorrect: boolean
  correctIndex: number
  myIndex: number
}

export default function ArenaPage() {
  const { play } = useSound()

  const [currentQuestion, setCurrentQuestion] = useState<StudentQuizQuestion | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [score, setScore] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [arenaEnded, setArenaEnded] = useState(false)
  const [quizId, setQuizId] = useState<number | null>(null)

  // Track last question id seen so we can play sound on new question
  const lastQuestionIdRef = useRef<number | null>(null)

  const { data: activeQuiz, isLoading } = useQuery({
    queryKey: ['student', 'quiz', 'active'],
    queryFn: studentApi.quizGetActive,
    // SSE events already trigger invalidation; 5s is just a safety net
    refetchInterval: 5000,
  })

  // Sync state from server whenever the query refreshes
  useEffect(() => {
    if (!activeQuiz) return
    setQuizId(activeQuiz.quiz_id)
    setScore(activeQuiz.my_score)

    if (activeQuiz.status === 'ended') {
      setArenaEnded(true)
      return
    }

    if (activeQuiz.current_question) {
      const q = activeQuiz.current_question
      if (q.id !== lastQuestionIdRef.current) {
        lastQuestionIdRef.current = q.id
        setCurrentQuestion(q)
        setResult(null)
        setQuestionCount((n) => Math.max(n, q.position))
        play('focus')
      } else if (activeQuiz.already_answered && activeQuiz.my_answer_index !== null && activeQuiz.correct_index !== null) {
        setResult({
          isCorrect: activeQuiz.my_answer_index === activeQuiz.correct_index,
          correctIndex: activeQuiz.correct_index,
          myIndex: activeQuiz.my_answer_index,
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuiz])

  const answerMutation = useMutation({
    mutationFn: (answerIndex: number) =>
      studentApi.quizAnswer(quizId!, currentQuestion!.id, answerIndex),
    onSuccess: (data, answerIndex) => {
      setResult({
        isCorrect: data.is_correct,
        correctIndex: data.correct_index,
        myIndex: answerIndex,
      })
      if (data.is_correct) {
        setScore((s) => s + 1)
        play('success')
      } else {
        play('error')
      }
    },
  })

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container flex flex-col gap-6 py-8">
          <Skeleton.Line width={300} height={40} />
          <Skeleton.Card />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="ARENA"
          title="Quiz battle!"
          description="Answer as fast as you can. Every correct answer earns a point on the leaderboard."
          image="placeholder"
          imageAlt="Aula Abierta illustration in arena battle mode"
          tone="red"
          metric={quizId ? (
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-white/15 px-4 text-white">
              <Trophy size={19} aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold tabular-nums">{score}</span>
              <span className="text-xs font-semibold text-white/75">correct</span>
            </div>
          ) : undefined}
        />

        {/* ─── No active quiz ─────────────────────────────────────────── */}
        {!activeQuiz && !arenaEnded && (
          <div className="flex flex-col items-center gap-6 rounded-[26px] border border-neutral-200 bg-white p-12 shadow-soft text-center">
            <div className="flex size-20 items-center justify-center rounded-[24px] bg-brand-red/10">
              <Gamepad2 size={36} className="text-brand-red" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-neutral-900">No arena running yet</h2>
              <p className="mt-2 text-sm font-semibold text-neutral-500">
                Your trainer will start a quiz during the live class. This page updates automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Checking every few seconds…
            </div>
          </div>
        )}

        {/* ─── Quiz ended — podium ────────────────────────────────────── */}
        {arenaEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-8 rounded-[26px] bg-brand-blue p-10 text-white shadow-lg text-center"
          >
            <div className="flex size-20 items-center justify-center rounded-[24px] bg-white/15">
              <Award size={36} className="text-brand-yellow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-brand-yellow">ARENA COMPLETE</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold text-white">
                You scored {score} point{score !== 1 ? 's' : ''}!
              </h2>
              <p className="mt-3 text-sm font-semibold text-white/80">
                {score === 0 && 'Keep practising — you\'ll nail it next time!'}
                {score > 0 && score < questionCount && 'Great effort! Every round makes you stronger.'}
                {score === questionCount && questionCount > 0 && 'Perfect score! You\'re a Aula Learning!'}
              </p>
            </div>
            <div className="flex size-24 flex-col items-center justify-center rounded-full bg-brand-yellow">
              <span className="font-display text-4xl font-extrabold tabular-nums text-neutral-900">{score}</span>
              <span className="text-xs font-bold text-neutral-700">correct</span>
            </div>
          </motion.div>
        )}

        {/* ─── Active question ────────────────────────────────────────── */}
        {activeQuiz && !arenaEnded && currentQuestion && (
          <div className="mx-auto w-full max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {/* Question card */}
                <div className="overflow-hidden rounded-[26px] bg-brand-red text-white shadow-lg">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-extrabold text-brand-yellow">
                      QUESTION {currentQuestion.position}
                    </p>
                    <h2 className="mt-4 font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl text-balance">
                      {currentQuestion.question_text}
                    </h2>
                  </div>
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, i) => {
                    const color = OPTION_COLORS[i % OPTION_COLORS.length]!
                    const answered = result !== null
                    const isMyAnswer = answered && result.myIndex === i
                    const isCorrect = answered && result.correctIndex === i
                    const wrong = answered && isMyAnswer && !result.isCorrect

                    return (
                      <motion.button
                        key={i}
                        type="button"
                        whileTap={answered ? {} : { scale: 0.96 }}
                        onClick={() => !answered && !answerMutation.isPending && answerMutation.mutate(i)}
                        disabled={answered || answerMutation.isPending}
                        className={cn(
                          'relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-[22px] p-4 text-center font-bold shadow-soft transition-all duration-200',
                          answered
                            ? isCorrect
                              ? 'bg-emerald-500 text-white scale-[1.02]'
                              : wrong
                              ? 'bg-neutral-200 text-neutral-500 line-through'
                              : 'bg-neutral-100 text-neutral-300'
                            : `${color.base} ${color.hover} ${color.text} cursor-pointer hover:-translate-y-1`,
                        )}
                        aria-label={`Option ${OPTION_LABELS[i]}: ${option}`}
                      >
                        <span className={cn(
                          'flex size-9 items-center justify-center rounded-xl text-sm font-extrabold',
                          answered && isCorrect
                            ? 'bg-white/30 text-white'
                            : answered
                            ? 'bg-neutral-300 text-neutral-500'
                            : 'bg-white/20',
                        )}>
                          {OPTION_LABELS[i]}
                        </span>
                        <span className="text-sm font-bold leading-5">{option}</span>

                        {/* Feedback icon */}
                        {answered && isCorrect && (
                          <CheckCircle2 size={20} className="absolute right-3 top-3 text-white" aria-hidden="true" />
                        )}
                        {answered && wrong && (
                          <XCircle size={20} className="absolute right-3 top-3 text-brand-red" aria-hidden="true" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Result message */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-[20px] p-5 text-center',
                      result.isCorrect ? 'bg-emerald-50' : 'bg-red-50',
                    )}
                  >
                    <p className={cn(
                      'flex items-center justify-center gap-2 font-display text-xl font-extrabold',
                      result.isCorrect ? 'text-emerald-700' : 'text-brand-red',
                    )}>
                      {result.isCorrect && <PartyPopper size={22} aria-hidden="true" />}
                      {result.isCorrect
                        ? 'Correct! Keep it up!'
                        : `Not quite — the answer was ${OPTION_LABELS[result.correctIndex]}`}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">
                      Waiting for your trainer to reveal the next question…
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ─── Active quiz but no question yet ───────────────────────── */}
        {activeQuiz && !arenaEnded && !currentQuestion && (
          <EmptyState
            icon={<Loader2 size={22} className="animate-spin" />}
            title="Arena is starting…"
            description="Your trainer is revealing the first question. Get ready!"
          />
        )}
      </div>
    </AppShell>
  )
}
