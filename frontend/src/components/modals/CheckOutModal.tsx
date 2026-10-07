import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  ShieldAlert,
  CreditCard,
  Clock,
  Check,
} from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import type { Stay } from '../../types/api'
import { checkOutStay, getStayCharges, getStayPayments } from '../../api/stays'
import { recordManualPayment } from '../../api/payments'
import { getSettings } from '../../api/settings'
import { getApiError } from '../../api/client'
import { setRoomCleaning } from '../../utils/roomCleaning'
import { useI18n } from '../../i18n'

interface CheckOutModalProps {
  isOpen: boolean
  onClose: () => void
  stay: Stay | null
  guestName?: string
  roomNumber?: string
  onSuccess: (checkedOutStay?: Stay | null) => void
  onOpenVoidModal?: (stay: Stay) => void
}

type ReceivedViaMethod = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'OTHER'

export function CheckOutModal({
  isOpen,
  onClose,
  stay,
  guestName,
  roomNumber,
  onSuccess,
  onOpenVoidModal,
}: CheckOutModalProps) {
  const { t, formatMoney } = useI18n()
  const [extensionCredit, setExtensionCredit] = useState<number>(0)
  const [extensionDays, setExtensionDays] = useState<number>(0)
  const [deadlineHour, setDeadlineHour] = useState<number>(4)
  const [deadlineMinute, setDeadlineMinute] = useState<number>(0)
  const [penaltyRate, setPenaltyRate] = useState<number>(600)
  const [applyPenalty, setApplyPenalty] = useState<boolean>(false)
  const [receivedVia, setReceivedVia] = useState<ReceivedViaMethod>('CASH')
  const [bankName, setBankName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Clean room number to prevent duplicate "Room Room 101"
  const cleanRoom = (roomNumber || '').replace(/^Room\s+/i, '').trim()

  // Determine current time vs checkout deadline
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const isLate = currentHour > deadlineHour || (currentHour === deadlineHour && currentMinute > deadlineMinute)

  useEffect(() => {
    if (!stay || !isOpen) return
    setLoading(true)
    setError('')
    setApplyPenalty(false)
    setReceivedVia('CASH')
    setBankName('')

    Promise.all([
      getStayCharges(stay.id),
      getStayPayments(stay.id),
      getSettings().catch(() => null),
    ])
      .then(([charges, payments, settings]) => {
        if (settings) {
          setDeadlineHour(settings.checkout_deadline_hour)
          setDeadlineMinute(settings.checkout_deadline_minute)
          setPenaltyRate(Number(settings.late_checkout_penalty))
        } else {
          setDeadlineHour(4)
          setDeadlineMinute(0)
          setPenaltyRate(600)
        }

        // Extension credit calculation
        const extCharges = charges.filter((c) =>
          (c.description || '').toLowerCase().includes('extension')
        )
        const totalExtDue = extCharges.reduce(
          (sum, c) => sum + Number(c.amount || 0) * (c.quantity || 1),
          0
        )

        let totalNights = 0
        extCharges.forEach((c) => {
          const match = (c.description || '').match(/(\d+)\s*night/)
          if (match) {
            totalNights += parseInt(match[1], 10)
          } else {
            totalNights += c.quantity || 1
          }
        })
        setExtensionDays(totalNights)

        // Payments recorded for extension
        const extPayments = payments.filter(
          (p) => p.status === 'SUCCESS' && (p.reference || '').toLowerCase().includes('extension')
        )
        const directExtPaid = extPayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        )

        const initialRoomCharges = charges
          .filter(
            (c) =>
              !(c.description || '').toLowerCase().includes('extension') &&
              c.charge_type !== 'LATE_CHECKOUT_PENALTY'
          )
          .reduce((sum, c) => sum + Number(c.amount || 0) * (c.quantity || 1), 0)

        const totalSuccessfulPayments = payments
          .filter((p) => p.status === 'SUCCESS')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)

        const excessPaid = Math.max(0, totalSuccessfulPayments - initialRoomCharges)
        const totalCreditedExtension = Math.max(
          0,
          totalExtDue - Math.max(directExtPaid, excessPaid)
        )

        setExtensionCredit(totalCreditedExtension)
      })
      .catch((err) => {
        setError(getApiError(err, t('checkout.errLoad')))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [stay, isOpen, currentHour, currentMinute])

  const activePenalty = (isLate && applyPenalty) ? penaltyRate : 0
  const totalToCollect = extensionCredit + activePenalty

  async function handleConfirmCheckout() {
    if (!stay) return
    if (totalToCollect > 0 && receivedVia === 'OTHER' && !bankName.trim()) {
      setError(t('common.errBankName'))
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const customPenalty = isLate ? (applyPenalty ? Number(penaltyRate) : 0) : 0
      await checkOutStay(stay.id, customPenalty)

      if (totalToCollect > 0) {
        const paymentRef =
          receivedVia === 'OTHER'
            ? `Checkout settlement (Other: ${bankName.trim()})`
            : `Checkout settlement (${receivedVia})`
        await recordManualPayment({
          stay_id: stay.id,
          amount: totalToCollect,
          payment_method: receivedVia,
          reference: paymentRef,
        })
      }

      setRoomCleaning(stay.room_id)
      onSuccess(stay)
      onClose()
    } catch (err) {
      setError(getApiError(err, t('checkout.errSubmit')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cleanRoom ? t('checkout.titleRoom', { room: cleanRoom }) : t('checkout.titleGuest')}
      description={guestName ? t('rooms.guest', { name: guestName }) : t('checkout.description')}
      maxWidth="md"
    >
      <div className="space-y-4 text-sm text-[#222222]">
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FFF7F5] border border-[#F2D1CA] text-xs text-[#C13515] flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-4 text-sm text-[#717171] gap-2">
            <Loader2 size={18} className="animate-spin text-[#FF385C]" />
            <span>{t('checkout.loading')}</span>
          </div>
        )}

        {/* 1. Unpaid Stay Extension (if any) */}
        {!loading && extensionCredit > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <CreditCard size={15} className="text-amber-700" />
                {t('checkout.unpaidExtension')}
              </span>
              <span className="font-extrabold text-sm text-amber-950">
                {formatMoney(extensionCredit)}
              </span>
            </div>
            <p className="text-amber-800">
              {t('checkout.extensionNote', {
                duration:
                  extensionDays > 0
                    ? t(extensionDays > 1 ? 'checkout.extraNights' : 'checkout.extraNight', {
                        count: extensionDays,
                      })
                    : t('checkout.extendedStay'),
              })}
            </p>
          </div>
        )}

        {/* 2. Optional Late Checkout Penalty Question (Receptionist decides) */}
        {!loading && isLate && (
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                <Clock size={15} className="text-neutral-500" />
                {t('checkout.applyPenalty')}
              </span>
              <span className="text-[11px] font-semibold text-neutral-500">
                {t('checkout.rate')} {formatMoney(penaltyRate)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setApplyPenalty(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  !applyPenalty
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs dark:bg-white dark:text-neutral-900 dark:border-white'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                {!applyPenalty && <Check size={14} className="stroke-[3]" />}
                <span>{t('checkout.noPenalty', { amount: formatMoney(0) })}</span>
              </button>

              <button
                type="button"
                onClick={() => setApplyPenalty(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  applyPenalty
                    ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                {applyPenalty && <Check size={14} className="stroke-[3]" />}
                <span>{t('checkout.yesPenalty', { amount: formatMoney(penaltyRate) })}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Total to Collect Box (Eliminates mental math) */}
        {!loading && totalToCollect > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-300 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              {t('checkout.totalToCollect')}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600">
                {formatMoney(totalToCollect)}
              </span>
              <span className="text-xs text-rose-700 font-medium">
                {extensionCredit > 0 && activePenalty > 0
                  ? t('checkout.breakdownBoth', {
                      ext: formatMoney(extensionCredit),
                      penalty: formatMoney(activePenalty),
                    })
                  : extensionCredit > 0
                  ? t('checkout.unpaidExtensionShort')
                  : t('checkout.latePenaltyShort')}
              </span>
            </div>
          </div>
        )}

        {!loading && totalToCollect > 0 && (
          <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 space-y-2">
            <label htmlFor="checkout-received-via" className="block text-xs font-bold text-neutral-800">
              {t('common.receivedVia')}
            </label>
            <select
              id="checkout-received-via"
              value={receivedVia}
              onChange={(e) => setReceivedVia(e.target.value as ReceivedViaMethod)}
              disabled={submitting}
              className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
            >
              <option value="CASH">{t('pm.cash')}</option>
              <option value="TELEBIRR">{t('pm.telebirr')}</option>
              <option value="CBE_BIRR">{t('pm.cbeBirr')}</option>
              <option value="BANK_TRANSFER">{t('pm.bankTransfer')}</option>
              <option value="OTHER">{t('pm.other')}</option>
            </select>
            {receivedVia === 'OTHER' && (
              <div>
                <label htmlFor="checkout-bank-name" className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('common.bankName')} *
                </label>
                <Input
                  id="checkout-bank-name"
                  placeholder={t('common.placeholderBankName')}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={submitting}
                  required
                  autoFocus
                />
              </div>
            )}
            <p className="text-[11px] text-neutral-500">
              {t('checkout.paymentRecordedVia', {
                method:
                  receivedVia === 'CBE_BIRR'
                    ? t('pm.cbeBirr')
                    : receivedVia === 'BANK_TRANSFER'
                    ? t('pm.bankTransfer')
                    : receivedVia === 'TELEBIRR'
                    ? t('pm.telebirr')
                    : receivedVia === 'OTHER'
                    ? bankName.trim() || t('pm.otherBank')
                    : t('pm.cash'),
              })}
            </p>
          </div>
        )}

        {/* 4. All Clear Status Banner (when 0 to collect) */}
        {!loading && totalToCollect === 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-950">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-emerald-900">{t('checkout.ready')}</p>
              <p className="text-emerald-700 text-xs">
                {t('checkout.allSettled', { amount: formatMoney(0) })}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F0F0F0]">
          {onOpenVoidModal && stay ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenVoidModal(stay)
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
            >
              {t('checkout.voidInstead')}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={totalToCollect > 0 ? 'danger' : 'primary'}
              size="md"
              onClick={handleConfirmCheckout}
              loading={submitting}
            >
              {totalToCollect > 0
                ? t('checkout.collect', { amount: formatMoney(totalToCollect) })
                : t('checkout.checkOutFree')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
