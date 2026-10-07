import { useState, useEffect } from 'react'
import { ReceiptText, AlertCircle } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { createExpense, updateExpense } from '../../api/expenses'
import type { Expense } from '../../types/api'
import { useI18n } from '../../i18n'

interface RecordExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  expense?: Expense | null
}

const EXPENSE_CATEGORIES = [
  { id: 'CLEANING', labelKey: 'expense.catCleaning' },
  { id: 'ELECTRICITY', labelKey: 'expense.catElectricity' },
  { id: 'WATER', labelKey: 'expense.catWater' },
  { id: 'MAINTENANCE', labelKey: 'expense.catMaintenance' },
  { id: 'FOOD', labelKey: 'expense.catFood' },
  { id: 'SALARY', labelKey: 'expense.catSalary' },
  { id: 'TRANSPORTATION', labelKey: 'expense.catTransportation' },
  { id: 'SUPPLIES', labelKey: 'expense.catSupplies' },
  { id: 'OTHER', labelKey: 'expense.catOther' },
]

const EXPENSE_REASONS: Record<string, { id: string; labelKey: string }[]> = {
  CLEANING: [
    { id: 'ROOM_CLEANING', labelKey: 'expense.reasonRoomCleaning' },
    { id: 'LAUNDRY', labelKey: 'expense.reasonLaundry' },
    { id: 'CLEANING_SUPPLIES', labelKey: 'expense.reasonCleaningSupplies' },
  ],
  ELECTRICITY: [{ id: 'ELECTRICITY_BILL', labelKey: 'expense.reasonElectricityBill' }],
  WATER: [
    { id: 'WATER_BILL', labelKey: 'expense.reasonWaterBill' },
    { id: 'WATER_DELIVERY', labelKey: 'expense.reasonWaterDelivery' },
  ],
  MAINTENANCE: [
    { id: 'PLUMBING_REPAIR', labelKey: 'expense.reasonPlumbingRepair' },
    { id: 'ELECTRICAL_REPAIR', labelKey: 'expense.reasonElectricalRepair' },
    { id: 'FURNITURE_REPAIR', labelKey: 'expense.reasonFurnitureRepair' },
    { id: 'APPLIANCE_REPAIR', labelKey: 'expense.reasonApplianceRepair' },
  ],
  FOOD: [
    { id: 'GUEST_BREAKFAST', labelKey: 'expense.reasonGuestBreakfast' },
    { id: 'STAFF_MEAL', labelKey: 'expense.reasonStaffMeal' },
  ],
  SALARY: [{ id: 'STAFF_PAYROLL', labelKey: 'expense.reasonStaffPayroll' }],
  TRANSPORTATION: [
    { id: 'SUPPLY_DELIVERY', labelKey: 'expense.reasonSupplyDelivery' },
    { id: 'GUEST_TRANSPORT', labelKey: 'expense.reasonGuestTransport' },
  ],
  SUPPLIES: [
    { id: 'ROOM_AMENITIES', labelKey: 'expense.reasonRoomAmenities' },
    { id: 'OFFICE_SUPPLIES', labelKey: 'expense.reasonOfficeSupplies' },
  ],
  OTHER: [{ id: 'OTHER', labelKey: 'expense.reasonOther' }],
}

export function RecordExpenseModal({ isOpen, onClose, onSuccess, expense }: RecordExpenseModalProps) {
  const { t, currency } = useI18n()
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id)
  const [reason, setReason] = useState(EXPENSE_REASONS[EXPENSE_CATEGORIES[0].id][0].id)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('CASH')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setCategory(expense.category)
        setReason(expense.reason || EXPENSE_REASONS[expense.category]?.[0]?.id || 'OTHER')
        setDescription(expense.description)
        setAmount(String(expense.amount))
        setPaymentMethod(
          (['CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER'].includes(expense.payment_method)
            ? expense.payment_method
            : 'CASH') as 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'
        )
        setExpenseDate(
          expense.expense_date
            ? new Date(expense.expense_date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        )
      } else {
        setCategory(EXPENSE_CATEGORIES[0].id)
        setReason(EXPENSE_REASONS[EXPENSE_CATEGORIES[0].id][0].id)
        setDescription('')
        setAmount('')
        setPaymentMethod('CASH')
        setExpenseDate(new Date().toISOString().slice(0, 10))
      }
      setError('')
    }
  }, [isOpen, expense])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('expense.errAmount'))
      return
    }

    if (!description.trim()) {
      setError(t('expense.errDescription'))
      return
    }

    setLoading(true)
    setError('')

    try {
      if (expense) {
        await updateExpense(expense.id, {
          category,
          reason,
          description: description.trim(),
          amount: numAmount,
          payment_method: paymentMethod,
          expense_date: new Date(expenseDate).toISOString(),
        })
      } else {
        await createExpense({
          category,
          reason,
          description: description.trim(),
          amount: numAmount,
          payment_method: paymentMethod,
          expense_date: new Date(expenseDate).toISOString(),
        })
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('expense.errSubmit')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? t('expense.editTitle', { id: expense.id }) : t('expense.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense type and reason */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('expense.typeLabel')} *
          </label>
          <select
            value={category}
            onChange={(e) => {
              const nextCategory = e.target.value
              setCategory(nextCategory)
              setReason(EXPENSE_REASONS[nextCategory][0].id)
            }}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {t(cat.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('expense.reasonLabel')} *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          >
            {EXPENSE_REASONS[category].map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('expense.amountLabel', { currency })}
            type="number"
            min="0.5"
            step="0.01"
            placeholder="1200.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t('expense.dateLabel')} *
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
            />
          </div>
        </div>

        {/* Payment Method Used */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('expense.paymentMethodLabel')} *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: t('pm.cash') },
              { id: 'TELEBIRR', label: t('pm.telebirr') },
              { id: 'CBE_BIRR', label: t('pm.cbeBirr') },
              { id: 'BANK_TRANSFER', label: t('expense.bank') },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id as typeof paymentMethod)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  paymentMethod === m.id
                    ? 'border-[#FF385C] bg-[#FF385C]/10 text-[#FF385C]'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('expense.detailsLabel')} *
          </label>
          <textarea
            rows={2}
            required
            placeholder={t('expense.detailsPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" isLoading={loading} className="gap-2">
            <ReceiptText size={16} />
            {loading ? (expense ? t('expense.updating') : t('expense.saving')) : (expense ? t('expense.update') : t('exp.record'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
