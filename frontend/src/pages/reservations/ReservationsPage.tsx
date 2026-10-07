import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  UserCheck,
  X,
  Ban,
} from '../../components/common/MaterialIcon'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Badge, type BadgeTone } from '../../components/common/Badge'
import { Table, type TableColumn } from '../../components/common/Table'
import { ReservationModal } from '../../components/modals/ReservationModal'
import { CheckInModal } from '../../components/modals/CheckInModal'
import {
  getReservations,
  cancelReservation,
  markReservationNoShow,
} from '../../api/reservations'
import { getRooms } from '../../api/rooms'
import { getGuests } from '../../api/guests'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import type { Reservation, Room, Guest } from '../../types/api'

export function ReservationsPage() {
  const { user } = useAuth()
  const { t, formatDate } = useI18n()
  const canCheckInOut = user?.role === 'RECEPTION'
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<{
    id: number
    type: 'cancel' | 'no-show'
  } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resData, roomsData, guestsData] = await Promise.all([
        getReservations(),
        getRooms(),
        getGuests().catch(() => []),
      ])
      setReservations(resData)
      setRooms(roomsData)
      setGuests(guestsData)
    } catch (err) {
      console.error('Failed to fetch reservations data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const roomMap = new Map(rooms.map((r) => [r.id, r]))
  const guestMap = new Map(guests.map((g) => [g.id, g]))
  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE')

  function handleCheckIn(res: Reservation) {
    setSelectedReservation(res)
    setCheckInModalOpen(true)
  }

  async function handleCancel(resId: number) {
    if (!confirm(t('res.confirmCancel'))) return
    setActionLoading({ id: resId, type: 'cancel' })
    try {
      await cancelReservation(resId)
      fetchData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('res.cancelFailed')
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleNoShow(resId: number) {
    if (!confirm(t('res.confirmNoShow'))) return
    setActionLoading({ id: resId, type: 'no-show' })
    try {
      await markReservationNoShow(resId)
      fetchData()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('res.noShowFailed')
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredReservations = reservations.filter((r) => {
    const guest = guestMap.get(r.guest_id)
    const room = roomMap.get(r.room_id)
    return (
      (guest?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (guest?.phone || '').includes(search) ||
      (room?.room_number || '').includes(search) ||
      String(r.id).includes(search)
    )
  })

  const statusTone: Record<string, BadgeTone> = {
    RESERVED: 'expected',
    CHECKED_IN: 'occupied',
    CANCELLED: 'inactive',
    NO_SHOW: 'inactive',
  }

  const statusLabel = (status: string): string =>
    status === 'RESERVED'
      ? t('res.status.reserved')
      : status === 'CHECKED_IN'
      ? t('res.status.checkedIn')
      : status === 'CANCELLED'
      ? t('res.status.cancelled')
      : status === 'NO_SHOW'
      ? t('res.status.noShow')
      : status.replace('_', ' ')

  const columns: TableColumn<Reservation>[] = [
    {
      key: 'id',
      header: t('res.bookingNo'),
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-neutral-900">#{r.id}</span>
      ),
    },
    {
      key: 'guest',
      header: t('res.guestDetails'),
      render: (r) => {
        const guest = guestMap.get(r.guest_id)
        return (
          <div>
            <p className="font-bold text-neutral-900 text-sm">
              {guest?.full_name || t('logbook.guestNo', { id: r.guest_id })}
            </p>
            <p className="text-xs text-neutral-500">{guest?.phone || t('common.noPhone')}</p>
          </div>
        )
      },
    },
    {
      key: 'room',
      header: t('res.assignedRoom'),
      render: (r) => {
        const room = roomMap.get(r.room_id)
        return room ? (
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#FF385C]/10 text-[#FF385C]">
              {t('common.room')} {room.room_number}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">{room.room_type}</p>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">{t('res.roomNo', { id: r.room_id })}</span>
        )
      },
    },
    {
      key: 'dates',
      header: t('res.arrivalDeparture'),
      render: (r) => {
        const arr = formatDate(r.expected_arrival, 'datetime')
        const dep = formatDate(r.expected_checkout, 'datetime')
        return (
          <div className="text-xs text-neutral-700">
            <p className="font-medium text-neutral-900">{t('res.arrLabel', { date: arr })}</p>
            <p className="text-neutral-500">{t('res.depLabel', { date: dep })}</p>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => (
        <Badge tone={statusTone[r.status] || 'neutral'} size="sm">
          {statusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: t('common.notes'),
      render: (r) => (
        <span className="text-xs text-neutral-500 italic max-w-xs truncate block">
          {r.notes || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      render: (r) => {
        const isActionLoading = actionLoading?.id === r.id
        if (r.status === 'RESERVED') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              {canCheckInOut && (
                <Button
                  variant="primary"
                  size="xs"
                  isLoading={isActionLoading}
                  onClick={() => handleCheckIn(r)}
                  className="gap-1"
                >
                  <UserCheck size={14} />
                  {t('logbook.checkIn')}
                </Button>
              )}
              <Button
                variant="outline"
                size="xs"
                leftIcon={<X size={14} />}
                isLoading={actionLoading?.id === r.id && actionLoading.type === 'cancel'}
                disabled={isActionLoading}
                onClick={() => handleCancel(r.id)}
                className="text-neutral-600 hover:text-rose-600"
              >
                {actionLoading?.id === r.id && actionLoading.type === 'cancel' ? t('res.cancelling') : t('common.cancel')}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={<Ban size={14} />}
                isLoading={actionLoading?.id === r.id && actionLoading.type === 'no-show'}
                disabled={isActionLoading}
                onClick={() => handleNoShow(r.id)}
                className="text-neutral-400 hover:text-amber-600"
              >
                {actionLoading?.id === r.id && actionLoading.type === 'no-show' ? t('res.marking') : t('res.noShow')}
              </Button>
            </div>
          )
        }
        return <span className="text-xs text-neutral-400">—</span>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('res.pageTitle')}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-1.5"
          >
            <Plus size={14} />
            {t('res.new')}
          </Button>
        }
      />

      {/* Search */}
      <div className="w-full sm:w-80">
        <Input
          placeholder={t('res.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <Table
          columns={columns}
          data={filteredReservations}
          keyExtractor={(r) => r.id}
          isLoading={loading}
          loadingLabel={t('res.loading')}
          emptyMessage={t('res.emptySearch')}
        />
      </div>

      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        availableRooms={availableRooms}
        onSuccess={() => fetchData()}
      />

      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => {
          setCheckInModalOpen(false)
          setSelectedReservation(null)
        }}
        availableRooms={availableRooms}
        allRooms={rooms}
        selectedRoomId={selectedReservation?.room_id}
        existingReservation={selectedReservation}
        onSuccess={() => fetchData()}
      />
    </div>
  )
}
