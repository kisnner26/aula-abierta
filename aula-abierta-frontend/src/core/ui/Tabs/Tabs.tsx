import { useState, type ReactNode, useId } from 'react'
import { motion } from 'framer-motion'

type TabsVariant = 'underline' | 'pill'

interface Tab {
  key: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  variant?: TabsVariant
  defaultTab?: string
  onChange?: (key: string) => void
}

export function Tabs({ tabs, variant = 'underline', defaultTab, onChange }: TabsProps) {
  const layoutId = useId()
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '')

  const select = (key: string) => {
    setActive(key)
    onChange?.(key)
  }

  const activeContent = tabs.find((t) => t.key === active)?.content

  if (variant === 'pill') {
    return (
      <div>
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-white/10 dark:bg-white/[.03]" role="tablist">
          {tabs.map((tab) => {
            const isActive = tab.key === active
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => select(tab.key)}
                role="tab"
                aria-selected={isActive}
                className={[
                  'relative min-h-10 shrink-0 px-4 py-1.5 text-sm font-bold rounded-[10px] transition-colors duration-150',
                  'flex items-center gap-1.5',
                  isActive ? 'text-brand-red dark:text-red-300' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                ].join(' ')}
              >
                {isActive && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-[10px] bg-white shadow-sm dark:bg-surface-overlay"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-5" role="tabpanel">{activeContent}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-white/10" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => select(tab.key)}
              role="tab"
              aria-selected={isActive}
              className={[
                'relative min-h-12 shrink-0 px-4 pb-3 pt-1 text-sm font-bold transition-colors duration-150',
                'flex items-center gap-1.5',
                isActive ? 'text-brand-red' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-red"
                />
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-5" role="tabpanel">{activeContent}</div>
    </div>
  )
}
