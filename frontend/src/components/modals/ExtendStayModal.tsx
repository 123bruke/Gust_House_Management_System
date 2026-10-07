import { useState, useEffect } from 'react'
import { CalendarPlus, Clock, AlertCircle, CircleDollarSign, CreditCard, Banknote, Check } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { extendStay, getStayPayments } from '../../api/stays'
import { recordManualPayment } from '../../api/payments'
import { toLocalDatetimeInput, toLocalDateStr } from '../../utils/dateUtils'
import type { Stay } from '../../types/api'
import { useI18n } from '../../i18n'

interface ExtendStayModalProps {
  isOpen: boolean
  onClose: () => void
  stay: Stay | null
  roomNumber?: string
  roomPrice?: number
  guestName?: string
  onSuccess: () => void
}

export function ExtendStayModal({
  isOpen,
  onClose,
  stay,
  roomNumber,
  roomPrice,
  guestName,
  onSuccess,
}: ExtendStayModalProps) {
  const { t, formatDate, formatMoney } = useI18n()
  const [newCheckout, setNewCheckout] = useState<string>('')
  const [selectedQuickDays, setSelectedQuickDays] = useState<number | null>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Payment Settlement Choice
  const [paymentOption, setPaymentOption] = useState<'PAY_NOW' | 'CREDIT'>('PAY_NOW')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'OTHER'>('CASH')
  const [bankName, setBankName] = useState('')

  useEffect(() => {
    if (stay) {
      const current = new Date(stay.expected_checkout)
      current.setDate(current.getDate() + 1)
      // Use local-timezone formatting so the datetime-local input shows the
      // correct local time (not UTC shifted). See utils/dateUtils.ts.
      setNewCheckout(toLocalDatetimeInput(current))
      setSelectedQuickDays(1)
      setError('')
      setPaymentOption('PAY_NOW')
      setBankName('')
    }
  }, [stay])

  if (!stay) return null

  const currentCheckoutDate = new Date(stay.expected_checkout)
  const formattedCurrent = formatDate(currentCheckoutDate, 'datetime')

  const selectedCheckoutDate = newCheckout ? new Date(newCheckout) : currentCheckoutDate
  const diffDays = Math.round((selectedCheckoutDate.getTime() - currentCheckoutDate.getTime()) / (1000 * 60 * 60 * 24))
  const extensionNights = Math.max(1, isNaN(diffDays) ? 1 : diffDays)
  const unitPrice = Number(roomPrice || 0)
  const totalExtensionFee = extensionNights * unitPrice

  function handleQuickAddDays(days: number) {
    setSelectedQuickDays(days)
    const d = new Date(stay!.expected_checkout)
    d.setDate(d.getDate() + days)
    // toLocalDatetimeInput() preserves the local timezone offset so the
    // value sent to the backend is always LATER than the existing checkout.
    setNewCheckout(toLocalDatetimeInput(d))
  }

  async function handleExtend(e: React.FormEvent) {
    e.preventDefault()
    if (!stay) return

    const selected = new Date(newCheckout)
    if (selected <= currentCheckoutDate) {
      setError(t('extend.errDate'))
      return
    }

    if (paymentOption === 'PAY_NOW' && paymentMethod === 'OTHER' && !bankName.trim()) {
      setError(t('common.errBankName'))
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Extend the stay (sends payment option to backend)
      await extendStay(
        stay.id,
        selected.toISOString(),
        paymentOption,
        paymentOption === 'PAY_NOW' ? paymentMethod : undefined
      )

      // 2. If guest pays right away, ensure a payment with the exact date range is recorded
      if (paymentOption === 'PAY_NOW' && totalExtensionFee > 0) {
        const fromStr = toLocalDateStr(currentCheckoutDate)
        const toStr = toLocalDateStr(selected)
        const methodLabel = paymentMethod === 'OTHER' ? (bankName.trim() || 'Other Bank') : paymentMethod
        const paymentRef = `Stay extension (${extensionNights} night${extensionNights > 1 ? 's' : ''}: ${fromStr} to ${toStr}) - ${methodLabel}`

        try {
          const existingPayments = await getStayPayments(stay.id)
          const alreadyRecorded = existingPayments.some(
            (p) =>
              p.status === 'SUCCESS' &&
              (p.reference || '').toLowerCase().includes(fromStr.toLowerCase())
          )
          if (!alreadyRecorded) {
            await recordManualPayment({
              stay_id: stay.id,
              amount: totalExtensionFee,
              payment_method: paymentMethod,
              reference: paymentRef,
            })
          }
        } catch (payErr) {
          console.error('Payment verification/recording fallback:', payErr)
        }
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('extend.errSubmit')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const displayRoom = (roomNumber || '').trim().toLowerCase().startsWith('room')
    ? roomNumber
    : t('common.roomWithNumber', { number: roomNumber || stay.room_id })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('extend.title')} size="md">
      <form onSubmit={handleExtend} className="space-y-5">
        {/* Info card */}
        <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t('common.guest')}</p>
              <p className="text-sm font-semibold text-neutral-900">{guestName || t('logbook.guestNo', { id: stay.guest_id })}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t('common.room')}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF385C]/10 text-[#FF385C]">
                {displayRoom}
              </span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={16} className="text-neutral-400" /> {t('extend.currentCheckout')}
            </span>
            <span className="font-semibold text-neutral-800">{formattedCurrent}</span>
          </div>
        </div>

        {/* Quick extension shortcuts: 1, 2, 3 Days */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
            {t('extend.quickExtension')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAddDays(1)}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedQuickDays === 1
                  ? 'border-[#FF385C] bg-[#FF385C] text-white shadow-sm ring-2 ring-[#FF385C]/25'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-medium'
              }`}
            >
              {selectedQuickDays === 1 && <Check size={14} className="shrink-0 stroke-[2.5]" />}
              <span>{t('extend.plus1Day')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(2)}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedQuickDays === 2
                  ? 'border-[#FF385C] bg-[#FF385C] text-white shadow-sm ring-2 ring-[#FF385C]/25'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-medium'
              }`}
            >
              {selectedQuickDays === 2 && <Check size={14} className="shrink-0 stroke-[2.5]" />}
              <span>{t('extend.plus2Days')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(3)}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedQuickDays === 3
                  ? 'border-[#FF385C] bg-[#FF385C] text-white shadow-sm ring-2 ring-[#FF385C]/25'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-medium'
              }`}
            >
              {selectedQuickDays === 3 && <Check size={14} className="shrink-0 stroke-[2.5]" />}
              <span>{t('extend.plus3Days')}</span>
            </button>
          </div>
        </div>

        {/* Custom new checkout date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('extend.newCheckoutLabel')}
          </label>
          <input
            type="datetime-local"
            required
            value={newCheckout}
            onChange={(e) => {
              const val = e.target.value
              setNewCheckout(val)
              if (val) {
                const manualDate = new Date(val)
                const diff = Math.round((manualDate.getTime() - currentCheckoutDate.getTime()) / (1000 * 60 * 60 * 24))
                setSelectedQuickDays(diff === 1 || diff === 2 || diff === 3 ? diff : null)
              } else {
                setSelectedQuickDays(null)
              }
            }}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent transition"
          />
        </div>

        {/* Payment / Credit Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
            {t('extend.paymentMethodLabel')}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentOption('PAY_NOW')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                paymentOption === 'PAY_NOW'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Banknote className={`w-4 h-4 ${paymentOption === 'PAY_NOW' ? 'text-emerald-600' : 'text-neutral-400'}`} />
                <span className="text-xs font-bold">{t('extend.paidRightAway')}</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-tight">
                {t('extend.paysNow', { amount: formatMoney(totalExtensionFee) })}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentOption('CREDIT')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                paymentOption === 'CREDIT'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-2 ring-amber-500/20'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <CreditCard className={`w-4 h-4 ${paymentOption === 'CREDIT' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span className="text-xs font-bold">{t('pm.creditPayLater')}</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-tight">
                {t('extend.addCredit', { amount: formatMoney(totalExtensionFee) })}
              </p>
            </button>
          </div>

          {/* If Pay Right Away, choose method */}
          {paymentOption === 'PAY_NOW' && (
            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  {t('common.receivedVia')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full h-9 px-3 rounded-lg border border-emerald-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CASH">{t('pm.cash')}</option>
                  <option value="TELEBIRR">{t('pm.telebirr')}</option>
                  <option value="CBE_BIRR">{t('pm.cbeBirr')}</option>
                  <option value="BANK_TRANSFER">{t('pm.bankTransfer')}</option>
                  <option value="OTHER">{t('pm.other')}</option>
                </select>
              </div>

              {paymentMethod === 'OTHER' && (
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    {t('common.bankName')} *
                  </label>
                  <input
                    type="text"
                    placeholder={t('common.placeholderBankName')}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-emerald-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* If Credit, display notice (single-line) */}
          {paymentOption === 'CREDIT' && (
            <div className="px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
              <CircleDollarSign size={16} className="text-amber-600 shrink-0" />
              <span className="truncate">
                {t('extend.creditLinePrefix')} <strong>{formatMoney(totalExtensionFee)}</strong> {t('extend.creditLineSuffix')}
              </span>
            </div>
          )}
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
            <CalendarPlus size={16} />
            {loading
              ? t('extend.extending')
              : paymentOption === 'PAY_NOW'
              ? t('extend.confirmPay')
              : t('extend.confirmCredit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
