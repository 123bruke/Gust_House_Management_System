import { useState, useEffect } from 'react'
import {
  AlertCircle,
  Receipt,
  Sparkles,
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
} from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { recordManualPayment } from '../../api/payments'
import { getStayFinancialSummary } from '../../api/stays'
import type { FinancialSummary } from '../../types/api'
import { useI18n } from '../../i18n'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  stayId: number | null
  guestName?: string
  roomNumber?: string
  onSuccess: () => void
}

type PaymentMethodType = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CREDIT' | 'OTHER'

export function RecordPaymentModal({
  isOpen,
  onClose,
  stayId,
  guestName,
  roomNumber,
  onSuccess,
}: RecordPaymentModalProps) {
  const { t, formatMoney, currency } = useI18n()
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [method, setMethod] = useState<PaymentMethodType>('CASH')
  const [bankName, setBankName] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && stayId) {
      setLoading(true)
      setError('')
      setBankName('')
      getStayFinancialSummary(stayId)
        .then((res) => {
          setSummary(res)
          const bal = Number(res.balance || 0)
          if (bal > 0) {
            setAmount(bal.toFixed(2))
          } else {
            setAmount('0.00')
          }
        })
        .catch((err) => {
          console.error(err)
          setError(t('payment.errLoad'))
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, stayId])

  const balance = Number(summary?.balance || 0)
  const totalCharges = Number(summary?.total_due || 0)
  const totalPayments = Number(summary?.total_paid || 0)

  const handleSelectMethod = (selectedMethod: PaymentMethodType) => {
    setMethod(selectedMethod)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stayId) return

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('payment.errAmount'))
      return
    }

    if (numAmount > balance) {
      setError(
        t('payment.errExceeds', {
          amount: formatMoney(numAmount),
          balance: formatMoney(balance),
        })
      )
      return
    }

    if (method === 'OTHER' && !bankName.trim()) {
      setError(t('common.errBankName'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const finalReference =
        method === 'OTHER'
          ? reference.trim()
            ? `${bankName.trim()} - ${reference.trim()}`
            : `Other Bank: ${bankName.trim()}`
          : reference.trim() || undefined

      await recordManualPayment({
        stay_id: stayId,
        amount: numAmount.toFixed(2),
        payment_method: method,
        reference: finalReference,
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('payment.errSubmit')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!stayId) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payment.title')} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Prominent Amount Due Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-5 shadow-sm border border-neutral-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {t('payment.remaining')}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black tracking-tight text-white">
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-[#FF385C]">{currency}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-neutral-300 block">
                {guestName || t('payment.stayNo', { id: stayId })}
              </span>
              {roomNumber && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-neutral-200 mt-1">
                  {t('common.roomWithNumber', { number: roomNumber })}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">{t('payment.totalRoomBill')}</span>
              <span className="font-bold text-neutral-200">{formatMoney(totalCharges)}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">{t('payment.alreadyPaid')}</span>
              <span className="font-bold text-emerald-400">{formatMoney(totalPayments)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
            {t('common.paymentMethod')} *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                id: 'CASH',
                label: t('pm.cash'),
                desc: t('payment.descCash'),
                icon: Banknote,
              },
              {
                id: 'TELEBIRR',
                label: t('pm.telebirr'),
                desc: t('payment.descTelebirr'),
                icon: Smartphone,
              },
              {
                id: 'CBE_BIRR',
                label: t('pm.cbeBirr'),
                desc: t('payment.descCbe'),
                icon: Building2,
              },
              {
                id: 'BANK_TRANSFER',
                label: t('pm.bankTransfer'),
                desc: t('payment.descBank'),
                icon: Building2,
              },
              {
                id: 'OTHER',
                label: t('pm.other'),
                desc: t('payment.descOther'),
                icon: Building2,
              },
              {
                id: 'CREDIT',
                label: t('payment.creditLedger'),
                desc: t('payment.descCredit'),
                icon: CreditCard,
              },
            ].map((m) => {
              const active = method === m.id
              const IconComp = m.icon
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectMethod(m.id as PaymentMethodType)}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    active
                      ? 'border-[#FF385C] bg-[#FF385C]/5 ring-2 ring-[#FF385C]/30'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      active ? 'bg-[#FF385C] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold block ${active ? 'text-[#FF385C]' : 'text-neutral-900'}`}>
                      {m.label}
                    </span>
                    <span className="text-[11px] text-neutral-500 block truncate mt-0.5">{m.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bank Name Input if OTHER */}
        {method === 'OTHER' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t('common.bankName')} *
            </label>
            <Input
              placeholder={t('common.placeholderBankName')}
              disabled={loading}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              {t('payment.amountLabel', { currency })}
            </label>
            {balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="text-[11px] font-semibold text-[#FF385C] hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} /> {t('payment.fillBalance', { amount: formatMoney(balance) })}
              </button>
            )}
          </div>

          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 1500.00"
            required
            disabled={loading}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Reference Input */}
        <div>
          <Input
            label={t('payment.referenceLabel')}
            placeholder={t('payment.referencePlaceholder')}
            disabled={loading}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            {t('payment.referenceHelper')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" isLoading={loading} disabled={loading} className="gap-2">
            <Receipt size={16} />
            <span>{loading ? t('payment.recording') : t('stays.recordPayment')}</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
