import { useI18n } from '../../i18n'

export interface AvatarProps {
  name: string
  role?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({
  name,
  role,
  size = 'md',
  className = '',
}: AvatarProps) {
  const { t } = useI18n()
  const getInitials = (str: string) => {
    if (!str) return 'H'
    const parts = str.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return str.slice(0, 2).toUpperCase()
  }

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
  }[size]
  const roleStyles =
    role === 'ADMIN'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
      : role === 'SUPER_ADMIN'
        ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
        : role === 'RECEPTION'
          ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
          : 'bg-[var(--primary-tint)] text-[var(--danger)] border-[var(--line)]'
  const roleIndicator =
    role === 'ADMIN'
      ? 'bg-emerald-600'
      : role === 'SUPER_ADMIN'
        ? 'bg-slate-600'
        : role === 'RECEPTION'
          ? 'bg-blue-600'
          : 'bg-[var(--success-soft)]'

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`rounded-full flex items-center justify-center border select-none ${roleStyles} ${sizeStyles} ${className}`}
        title={`${name}${role ? ` (${role})` : ''}`}
      >
        {getInitials(name)}
      </div>
      {role && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)] ${roleIndicator}`}
          title={t('common.activeStaff')}
        />
      )}
    </div>
  )
}
