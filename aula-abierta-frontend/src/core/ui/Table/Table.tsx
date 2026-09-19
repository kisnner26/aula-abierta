import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  render: (row: T, index: number) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  stickyHeader?: boolean
  className?: string
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyTitle = 'No results',
  emptyDescription,
  emptyIcon,
  sortKey,
  sortDir,
  onSort,
  stickyHeader,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton.Line key={i} height={44} />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={['w-full overflow-x-auto', className].join(' ')}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.03]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="px-5 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400"
              >
                {col.sortable && onSort ? <button type="button" onClick={() => onSort(col.key)} className="flex min-h-8 items-center gap-1 rounded-lg text-left hover:text-neutral-900 dark:hover:text-white" aria-label={`Sort by ${col.header}`}>
                  {col.header}
                    <span className="text-neutral-400" aria-hidden="true">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ChevronsUpDown size={13} />
                      )}
                    </span>
                </button> : <span>{col.header}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey(row)}
              className="border-b border-neutral-100 transition-colors duration-150 last:border-0 hover:bg-brand-sky/10 dark:border-white/10 dark:hover:bg-white/[.03]"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 font-medium text-neutral-800 dark:text-neutral-200">
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
