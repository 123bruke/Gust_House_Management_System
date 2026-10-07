import { useState } from 'react'
import { Trash2, AlertTriangle, AlertCircle } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { deleteRoom } from '../../api/rooms'
import { useI18n } from '../../i18n'
import type { Room } from '../../types/api'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  room: Room | null
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  room,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!room) return null

  const isOccupied = room.status === 'OCCUPIED'

  async function handleDelete() {
    if (!room) return
    if (isOccupied) {
      setError(t('confirm.occupiedRoomError'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await deleteRoom(room.id)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('confirm.deleteRoomFailed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('common.deleteRoom')} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-950">
              {t('confirm.deleteRoomHeading', { number: room.room_number })}
            </h4>
            <p className="text-xs text-rose-700 mt-1">
              {isOccupied
                ? t('confirm.occupiedRoomNotice')
                : t('confirm.roomDeleteBody', { number: room.room_number, type: room.room_type })}
            </p>
          </div>
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
            loading={loading}
            disabled={isOccupied}
            leftIcon={<Trash2 size={13} />}
            onClick={handleDelete}
          >
            {t('common.confirmDelete')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
