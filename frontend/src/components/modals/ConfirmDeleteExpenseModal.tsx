import { useState } from 'react'
import { Trash2, AlertTriangle, AlertCircle } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { deleteExpense } from '../../api/expenses'
import { useI18n } from '../../i18n'
import type { Expense } from '../../types/api'

interface ConfirmDeleteExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  expense: Expense | null
}

export function ConfirmDeleteExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: ConfirmDeleteExpenseModalProps) {
  const { t, formatDate, formatMoney } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!expense) return null

  async function handleDelete() {
    if (!expense) return
    setLoading(true)
    setError('')

    try {
      await deleteExpense(expense.id)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('confirm.deleteExpenseFailed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = formatDate(expense.expense_date, 'medium')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('confirm.deleteExpense')} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-rose-950">
              {t('confirm.deleteExpenseHeading', { id: expense.id })}
            </h4>
            <p className="text-xs text-rose-700 mt-1">
              {t('confirm.deleteExpenseBodyPrefix')}{' '}
              <strong className="font-semibold text-rose-900">
                {formatMoney(expense.amount)}
              </strong>
              {t('confirm.deleteExpenseBodySuffix')}
            </p>
          </div>
        </div>

        {/* Expense Quick Summary */}
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">{t('common.category')}</span>
            <span className="font-semibold text-neutral-800">{expense.category}</span>
          </div>
          {expense.reason && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">{t('common.reason')}</span>
              <span className="font-semibold text-neutral-800">
                {expense.reason
                  .toLowerCase()
                  .replaceAll('_', ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">{t('common.description')}</span>
            <span className="font-semibold text-neutral-800 truncate max-w-[180px]">
              {expense.description}
            </span>
          </div>
          {formattedDate && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">{t('common.date')}</span>
              <span className="font-semibold text-neutral-700">{formattedDate}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-medium">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="button"
            isLoading={loading}
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash2 size={13} />
            {t('common.confirmDelete')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
