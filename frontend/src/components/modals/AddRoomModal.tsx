import { useState } from 'react'
import { Building, AlertCircle } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { createRoom } from '../../api/rooms'
import { useI18n } from '../../i18n'

interface AddRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ROOM_TYPES = [
  'Standard Double',
  'Deluxe Suite',
  'Single Room',
  'Executive Suite',
  'Twin Bed Room',
  'Master Penthouse',
]

const ROOM_TYPE_KEYS: Record<string, string> = {
  'Standard Double': 'roomForm.type.standardDouble',
  'Deluxe Suite': 'roomForm.type.deluxeSuite',
  'Single Room': 'roomForm.type.singleRoom',
  'Executive Suite': 'roomForm.type.executiveSuite',
  'Twin Bed Room': 'roomForm.type.twinBed',
  'Master Penthouse': 'roomForm.type.masterPenthouse',
  Other: 'roomForm.type.other',
}

export function AddRoomModal({ isOpen, onClose, onSuccess }: AddRoomModalProps) {
  const { t } = useI18n()
  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState(ROOM_TYPES[0])
  const [customType, setCustomType] = useState('')
  const [price, setPrice] = useState('')
  const [hourlyPrice, setHourlyPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomNumber.trim()) {
      setError(t('roomForm.roomNumberRequired'))
      return
    }
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setError(t('roomForm.nightlyPriceInvalid'))
      return
    }

    const finalType = roomType === 'Other' && customType.trim() ? customType.trim() : roomType

    setLoading(true)
    setError('')

    try {
      await createRoom({
        room_number: roomNumber.trim(),
        room_type: finalType,
        price: numPrice,
        hourly_price: hourlyPrice ? Number(hourlyPrice) : undefined,
      })

      onSuccess()
      onClose()
      setRoomNumber('')
      setPrice('')
      setHourlyPrice('')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('roomForm.addFailed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('roomForm.addTitle')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('roomForm.roomNumberLabel')}
          placeholder={t('roomForm.roomNumberPlaceholder')}
          required
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t('rooms.roomType')} *
          </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          >
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(ROOM_TYPE_KEYS[type])}
              </option>
            ))}
            <option value="Other">{t('roomForm.type.other')}</option>
          </select>
        </div>

        {roomType === 'Other' && (
          <Input
            label={t('roomForm.customRoomType')}
            placeholder={t('roomForm.customRoomTypePlaceholder')}
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={t('roomForm.nightlyPrice')}
            type="number"
            min="50"
            step="1"
            placeholder="e.g. 1000"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label={t('roomForm.hourlyRate')}
            type="number"
            min="10"
            step="1"
            placeholder="e.g. 150"
            helperText={t('roomForm.hourlyRateHelper')}
            value={hourlyPrice}
            onChange={(e) => setHourlyPrice(e.target.value)}
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
            <Building size={16} />
            {loading ? t('roomForm.creating') : t('roomForm.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
