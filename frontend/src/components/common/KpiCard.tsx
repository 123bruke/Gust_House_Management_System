import { isValidElement, type ReactNode, type ComponentType } from 'react'
import type { IconComponent } from './MaterialIcon'
import { Skeleton } from './StatePanel'

export interface KpiCardProps {
  label?: string
  title?: string
  value: string | number
  detail?: string
  subtitle?: string
  icon: IconComponent | ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
  badge?: ReactNode
  loading?: boolean
  className?: string
}

export function KpiCard({
  label,
  title,
  value,
  detail,
  subtitle,
  icon,
  tone = 'neutral',
  badge,
  loading = false,
  className = '',
}: KpiCardProps) {
  const displayLabel = label || title || ''
  const displayDetail = detail || subtitle || ''

  const toneIconStyles = {
    neutral: 'bg-[var(--primary-tint)] text-[#FF385C]',
    accent: 'bg-neutral-100 text-neutral-800',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  }[tone]

  const renderIcon = () => {
    if (isValidElement(icon)) {
      return icon
    }
    if (icon) {
      const IconComp = icon as ComponentType<{ size?: number; className?: string }>
      return <IconComp size={16} />
    }
    return null
  }

  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[var(--line-strong)] transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          {displayLabel}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toneIconStyles}`}>
          {renderIcon()}
        </div>
      </div>
      <div className="mt-4 mb-1 flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-8 w-28 rounded-lg" />
        ) : (
          <>
            <strong className="text-2xl font-semibold text-[var(--ink)] tracking-tight">
              {value}
            </strong>
            {badge}
          </>
        )}
      </div>
      {displayDetail && (
        loading ? <Skeleton className="h-3 w-36 rounded" /> : (
          <p className="text-xs text-[var(--ink-muted)] leading-normal font-normal">
            {displayDetail}
          </p>
        )
      )}
    </div>
  )
}
