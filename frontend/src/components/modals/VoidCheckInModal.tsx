import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  DoorOpen,
  Info,
  Loader2,
  Undo2,
  XCircle,
} from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import type { Payment, PaymentMethod, Stay } from '../../types/api'
import { getStayPayments, voidCheckIn } from '../../api/stays'
import { getApiError } from '../../api/client'
import { useI18n } from '../../i18n'

interface VoidCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  stay: Stay | null
  guestName?: string
  roomNumber?: string
  onSuccess: (voidedStay?: Stay | null) => void
}

const REASON_OPTIONS = [
  { value: 'GUEST_REJECTED_ROOM', label: 'Guest room rejection (dissatisfied with room/bed/AC)', labelKey: 'void.reasonRejected' },
  { value: 'PLAN_CHANGE_EMERGENCY', label: 'Immediate change of plans / guest emergency', labelKey: 'void.reasonPlanChange' },
  { value: 'ACCIDENTAL_CHECKIN', label: 'Accidental check-in by receptionist (wrong room/guest)', labelKey: 'void.reasonAccidental' },
  { value: 'PAYMENT_ISSUE', label: 'Payment dispute / failed electronic transfer', labelKey: 'void.reasonPayment' },
  { value: 'OTHER', label: 'Other reason (specify in notes)', labelKey: 'void.reasonOther' },
]

export function VoidCheckInModal({
  isOpen,
  onClose,
  stay,
  guestName,
  roomNumber,
  onSuccess,
}: VoidCheckInModalProps) {
  const { t, formatMoney, currency } = useI18n()
  const [reason, setReason] = useState('GUEST_REJECTED_ROOM')
  const [notes, setNotes] = useState('')
  const [roomCondition, setRoomCondition] = useState<'AVAILABLE' | 'CLEANING'>('AVAILABLE')
  const [refundMode, setRefundMode] = useState<'FULL' | 'PARTIAL' | 'NONE'>('FULL')
  const [retentionFee, setRetentionFee] = useState<number>(0)
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH')
  const [refundBankName, setRefundBankName] = useState('')

  const [loadingPayments, setLoadingPayments] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const cleanRoom = (roomNumber || '').replace(/^Room\s+/i, '').trim()

  // Load payments collected for this stay
  useEffect(() => {
    if (!isOpen || !stay) return
    let cancelled = false
    setLoadingPayments(true)
    setError('')

    getStayPayments(stay.id)
      .then((data) => {
        if (cancelled) return
        const successful = data.filter((p) => p.status === 'SUCCESS')
        setPayments(successful)
        // If payments were collected, default refund method to the first payment method used
        if (successful.length > 0) {
          const firstMethod = successful[0].payment_method as PaymentMethod
          if (['CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER', 'OTHER'].includes(firstMethod)) {
            setRefundMethod(firstMethod)
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, stay])

  if (!stay) return null

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0)

  // Calculate refund amount based on mode
  let refundAmount = 0
  if (refundMode === 'FULL') {
    refundAmount = totalPaid
  } else if (refundMode === 'PARTIAL') {
    refundAmount = Math.max(0, totalPaid - (retentionFee || 0))
  } else {
    refundAmount = 0
  }

  // Elapsed time since check-in
  const checkInDate = new Date(stay.check_in_at)
  const minutesSinceCheckIn = Math.max(
    1,
    Math.round((Date.now() - checkInDate.getTime()) / (1000 * 60))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stay) return
    if (!reason) {
      setError(t('void.errReason'))
      return
    }
    if (refundMethod === 'OTHER' && refundAmount > 0 && !refundBankName.trim()) {
      setError(t('void.errBankName'))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const updated = await voidCheckIn(stay.id, {
        reason: REASON_OPTIONS.find((r) => r.value === reason)?.label || reason,
        notes: notes.trim() || null,
        room_condition: roomCondition,
        refund_amount: refundAmount > 0 ? refundAmount : null,
        refund_method: refundAmount > 0 ? refundMethod : null,
        refund_bank_name: refundAmount > 0 && refundMethod === 'OTHER' ? refundBankName.trim() : null,
      })
      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('void.title')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Stay Summary Card */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold shrink-0">
                <Undo2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  {t('common.roomWithNumber', { number: cleanRoom })} &bull; {guestName || t('common.guest')}
                </h4>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                  <Clock size={14} />
                  <span>
                    {t('void.checkedInAgo', { count: minutesSinceCheckIn })}
                  </span>
                  <span>&bull;</span>
                  <span>{t('payment.stayNo', { id: stay.id })}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                {t('void.totalPaid')}
              </span>
              <span className="text-base font-black text-neutral-900">
                {loadingPayments ? (
                  <Loader2 size={16} className="animate-spin inline text-neutral-400" />
                ) : (
                  formatMoney(totalPaid)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Cancellation Reason */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            {t('void.cancellationReason')} <span className="text-rose-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t('void.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          />
        </div>

        {/* 2. Room Housekeeping Condition */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            {t('void.roomUsedQuestion')} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRoomCondition('AVAILABLE')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                roomCondition === 'AVAILABLE'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  roomCondition === 'AVAILABLE'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <Info size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-900">{t('void.neverEntered')}</p>
                  {roomCondition === 'AVAILABLE' && (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {t('void.neverEnteredDescPrefix')}{' '}
                  <span className="font-semibold text-emerald-700">{t('room.status.available')}</span>.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRoomCondition('CLEANING')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                roomCondition === 'CLEANING'
                  ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  roomCondition === 'CLEANING'
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <DoorOpen size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-900">{t('void.enteredInspected')}</p>
                  {roomCondition === 'CLEANING' && (
                    <CheckCircle2 size={14} className="text-amber-600" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {t('void.enteredDescPrefix')}{' '}
                  <span className="font-semibold text-amber-700">{t('room.status.cleaning')}</span> {t('void.enteredDescSuffix')}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Refund & Financial Settlement */}
        <div className="bg-neutral-50/70 rounded-2xl border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Coins size={14} className="text-neutral-500" />
              {t('void.paymentRefundSettlement')}
            </label>
            <span className="text-xs font-semibold text-neutral-600">
              {t('void.paidLabel', { amount: formatMoney(totalPaid) })}
            </span>
          </div>

          {totalPaid > 0 ? (
            <div className="space-y-3">
              {/* Refund Options */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FULL', label: t('void.refundFull'), sub: formatMoney(totalPaid) },
                  { id: 'PARTIAL', label: t('void.refundRetain'), sub: t('void.refundRetainSub') },
                  { id: 'NONE', label: t('void.refundNone'), sub: formatMoney(0) },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRefundMode(mode.id as typeof refundMode)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      refundMode === mode.id
                        ? 'border-[#FF385C] bg-rose-50/60 text-[#FF385C] ring-1 ring-[#FF385C]'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{mode.label}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{mode.sub}</p>
                  </button>
                ))}
              </div>

              {/* Partial fee retention input */}
              {refundMode === 'PARTIAL' && (
                <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-700 font-medium">{t('void.retainedFee')}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={totalPaid}
                        value={retentionFee || ''}
                        onChange={(e) => setRetentionFee(Math.min(totalPaid, Math.max(0, Number(e.target.value))))}
                        className="w-24 px-2 py-1 text-xs font-bold text-neutral-900 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#FF385C]"
                      />
                      <span className="text-xs text-neutral-500 font-bold">{currency}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex justify-between border-t border-neutral-100 pt-1.5">
                    <span>{t('void.remainingRefund')}</span>
                    <span className="font-bold text-emerald-600">{formatMoney(refundAmount)}</span>
                  </div>
                </div>
              )}

              {/* Refund Method selection */}
              {refundAmount > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-semibold text-neutral-600">
                    {t('void.refundVia')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'CASH', label: t('void.methodCashDrawer') },
                      { id: 'TELEBIRR', label: t('pm.telebirr') },
                      { id: 'CBE_BIRR', label: t('pm.cbeBirr') },
                      { id: 'BANK_TRANSFER', label: t('pm.bankTransfer') },
                      { id: 'OTHER', label: t('pm.otherBank') },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setRefundMethod(m.id as PaymentMethod)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                          refundMethod === m.id
                            ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {refundMethod === 'OTHER' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        list="void-refund-banks"
                        placeholder={t('void.bankPlaceholder')}
                        value={refundBankName}
                        onChange={(e) => setRefundBankName(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                      />
                      <datalist id="void-refund-banks">
                        <option value="Commercial Bank of Ethiopia (CBE)" />
                        <option value="Awash Bank" />
                        <option value="Dashen Bank" />
                        <option value="Bank of Abyssinia" />
                        <option value="Wegagen Bank" />
                        <option value="Hibret Bank" />
                        <option value="Nib International Bank" />
                        <option value="Cooperative Bank of Oromia" />
                        <option value="Zemen Bank" />
                        <option value="Oromia Bank" />
                      </datalist>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-600">
              <Info size={16} className="text-neutral-400 shrink-0" />
              <span>
                {t('void.noPayments')}
              </span>
            </div>
          )}
        </div>

        {/* Caution Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800">
          <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            {t('void.caution')}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-xs"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('void.voiding')}</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>{t('void.confirm')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
