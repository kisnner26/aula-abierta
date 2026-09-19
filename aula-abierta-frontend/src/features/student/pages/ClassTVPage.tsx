import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Tv } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, Skeleton, WorkspaceHero } from '@core/ui'
import { cn } from '@core/utils'
import { studentApi } from '../api'

export default function ClassTVPage() {
  const [classroomId, setClassroomId] = useState<number | null>(null)
  const [videoId, setVideoId] = useState<number | null>(null)

  const classroomsQuery = useQuery({
    queryKey: ['student', 'classrooms'],
    queryFn: studentApi.getClassrooms,
  })

  const selectedClassroomId = classroomId ?? classroomsQuery.data?.[0]?.id ?? 0

  const videosQuery = useQuery({
    queryKey: ['student', 'tv', selectedClassroomId],
    queryFn: () => studentApi.getLearningVideos(selectedClassroomId),
    enabled: selectedClassroomId > 0,
  })

  const videos = videosQuery.data ?? []
  const activeVideo = videos.find((video) => video.id === videoId) ?? videos[0]

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="CURATED BY AULA ABIERTA"
          title="Video Library"
          description="English videos selected for your exact program and level, without leaving your learning space."
          image="placeholder"
          imageAlt="Aula Abierta illustration presenting educational videos"
          tone="blue"
          imagePosition="object-[55%_center]"
        />

        {classroomsQuery.isLoading ? (
          <Skeleton.Line height={44} />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose classroom">
            {classroomsQuery.data?.map((classroom) => (
              <button
                key={classroom.id}
                type="button"
                onClick={() => { setClassroomId(classroom.id); setVideoId(null) }}
                className={cn(
                  'min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition-colors duration-150',
                  selectedClassroomId === classroom.id
                    ? 'bg-brand-red text-white'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-300',
                )}
              >
                {classroom.name}
              </button>
            ))}
          </div>
        )}

        {videosQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        ) : !activeVideo ? (
          <EmptyState
            icon={<Tv size={22} />}
            title="The channel is being prepared"
            description="Coordination will add videos curated for this level."
          />
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section aria-labelledby="now-playing-title">
              <div className="aspect-video overflow-hidden rounded-[22px] bg-neutral-900 shadow-lg">
                <iframe
                  key={activeVideo.id}
                  src={activeVideo.embed_url}
                  title={activeVideo.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="mt-5 text-xs font-extrabold text-brand-red">NOW PLAYING</p>
              <h2 id="now-playing-title" className="mt-1 text-balance font-display text-2xl font-extrabold text-neutral-900 dark:text-white">
                {activeVideo.title}
              </h2>
              <p className="mt-2 text-pretty text-sm font-semibold leading-6 text-neutral-500 dark:text-neutral-400">
                {activeVideo.description}
              </p>
            </section>

            <aside>
              <p className="text-xs font-extrabold text-brand-blue">LEVEL PLAYLIST</p>
              <div className="mt-3 flex flex-col gap-2">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setVideoId(video.id)}
                    className={cn(
                      'flex min-h-20 items-center gap-4 rounded-xl border p-3 text-left transition-colors duration-150',
                      activeVideo.id === video.id
                        ? 'border-brand-blue bg-brand-sky/20'
                        : 'border-neutral-200 bg-white hover:border-brand-blue dark:border-white/10 dark:bg-surface-card',
                    )}
                  >
                    <span className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums',
                      activeVideo.id === video.id
                        ? 'bg-brand-blue text-white'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-white/10',
                    )}>
                      {activeVideo.id === video.id
                        ? <Play size={16} fill="currentColor" aria-hidden="true" />
                        : index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-bold text-neutral-800 dark:text-white">{video.title}</span>
                      <span className="mt-1 block text-xs font-semibold text-neutral-400">Aula Abierta selection</span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
