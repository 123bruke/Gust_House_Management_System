import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, CalendarPlus, LogIn, LogOut, UserCheck, Undo2, SprayCan } from '../../components/common/MaterialIcon'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { RoomCard } from '../../components/common/RoomCard'
import { StatePanel } from '../../components/common/StatePanel'
import { CheckInModal } from '../../components/modals/CheckInModal'
import { ReservationModal } from '../../components/modals/ReservationModal'
import { CheckOutModal } from '../../components/modals/CheckOutModal'
import { VoidCheckInModal } from '../../components/modals/VoidCheckInModal'
import { AddRoomModal } from '../../components/modals/AddRoomModal'
import { EditRoomModal } from '../../components/modals/EditRoomModal'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import { getRooms } from '../../api/rooms'
import { getStays } from '../../api/stays'
import { getReservations } from '../../api/reservations'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { sortRoomsAscending } from '../../utils/roomUtils'
import { getCleaningRooms, setRoomCleaning } from '../../utils/roomCleaning'
import type { Room, Stay, Reservation } from '../../types/api'

export function RoomsPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const isAdmin = user?.role === 'ADMIN'
  const canCheckInOut = user?.role === 'RECEPTION'

  const [rooms, setRooms] = useState<Room[]>([])
  const [activeStays, setActiveStays] = useState<Stay[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'EXPECTED' | 'CLEANING'>('ALL')

  // Modals state
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [checkOutOpen, setCheckOutOpen] = useState(false)
  const [voidCheckInOpen, setVoidCheckInOpen] = useState(false)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [editRoomOpen, setEditRoomOpen] = useState(false)
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null)
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState<Room | null>(null)
  const [selectedRoomToDelete, setSelectedRoomToDelete] = useState<Room | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [roomsData, staysData, reservationsData] = await Promise.all([
        getRooms(),
        getStays('CHECKED_IN').catch(() => []),
        getReservations('RESERVED').catch(() => []),
      ])
      const activeCleaning = getCleaningRooms()
      const mergedRooms = roomsData.map((r) => {
        const cleanExpiry = activeCleaning[r.id]
        if (cleanExpiry && cleanExpiry > Date.now()) {
          return {
            ...r,
            status: 'CLEANING' as const,
            available_after: new Date(cleanExpiry).toISOString(),
          }
        }
        if (r.status === 'CLEANING' && r.available_after) {
          setRoomCleaning(r.id, Math.max(0, new Date(r.available_after).getTime() - Date.now()))
        }
        return r
      })
      setRooms(mergedRooms)
      setActiveStays(staysData)
      setReservations(reservationsData)
    } catch (err) {
      console.error('Failed to load rooms:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const availableRooms = useMemo(() => sortRoomsAscending(rooms.filter((r) => r.status === 'AVAILABLE')), [rooms])
  const cleaningRooms = useMemo(() => sortRoomsAscending(rooms.filter((r) => r.status === 'CLEANING')), [rooms])
  const occupiedRooms = useMemo(() => sortRoomsAscending(rooms.filter((r) => r.status === 'OCCUPIED')), [rooms])
  const expectedRooms = useMemo(() => sortRoomsAscending(rooms.filter((r) => r.status === 'EXPECTED')), [rooms])

  const totalUnoccupied = availableRooms.length + cleaningRooms.length
  const readyPct = totalUnoccupied > 0 ? Math.round((availableRooms.length / totalUnoccupied) * 100) : 100

  const filteredRooms = useMemo(() => {
    const list = rooms.filter((r) => {
      const matchesSearch =
        r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.room_type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === 'ALL' ||
        r.status === statusFilter
      return matchesSearch && matchesStatus
    })
    return sortRoomsAscending(list)
  }, [rooms, searchTerm, statusFilter])

  function handleRoomCheckIn(roomId: number) {
    const matchedRes =
      reservations.find(
        (r) => r.room_id === roomId && (r.status === 'RESERVED' || r.status === 'PENDING')
      ) || null
    setSelectedRoomId(roomId)
    setSelectedReservation(matchedRes)
    setCheckInOpen(true)
  }

  function handleRoomReserve(roomId: number) {
    setSelectedRoomId(roomId)
    setReservationOpen(true)
  }

  function handleRoomManageStay(room: Room) {
    const stay = activeStays.find((s) => s.room_id === room.id)
    if (stay) {
      setSelectedStay(stay)
      setSelectedRoomId(room.id)
      setCheckOutOpen(true)
    }
  }

  function handleVoidCheckIn(room: Room) {
    const stay = activeStays.find((s) => s.room_id === room.id)
    if (stay) {
      setSelectedStay(stay)
      setSelectedRoomId(room.id)
      setVoidCheckInOpen(true)
    }
  }

  function handleEditRoom(room: Room) {
    setSelectedRoomToEdit(room)
    setEditRoomOpen(true)
  }

  function handleDeleteRoom(room: Room) {
    setSelectedRoomToDelete(room)
    setDeleteRoomOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('rooms.title')}
        subtitle={t('rooms.subtitle')}
        action={
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddRoomOpen(true)}
                className="gap-1.5"
              >
                <Plus size={14} />
                {t('rooms.add')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Rooms Card */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium text-neutral-500">{t('rooms.totalRooms')}</span>
            <strong className="block text-2xl font-bold text-neutral-900 mt-0.5">{rooms.length}</strong>
          </div>
          <span className="text-[10px] text-neutral-400 mt-2">{t('rooms.acrossProperty')}</span>
        </div>

        {/* Available Card (Option 3 with Progress & Cleaning Breakdown) */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex flex-col justify-between space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-neutral-500">{t('room.status.available')}</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <strong className="text-2xl font-bold text-neutral-900">{availableRooms.length}</strong>
                <span className="text-[11px] font-semibold text-emerald-700">{t('rooms.readyNow')}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              {t('rooms.readyPct', { percent: readyPct })}
            </span>
          </div>

          {/* Interactive Badges */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium transition border ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={t('rooms.filterReadyHint')}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'AVAILABLE' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>{t('rooms.nReady', { count: availableRooms.length })}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'CLEANING' ? 'ALL' : 'CLEANING')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium transition border ${
                statusFilter === 'CLEANING'
                  ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                  : cleaningRooms.length > 0
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
                  : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60 cursor-default'
              }`}
              title={cleaningRooms.length > 0 ? t('rooms.filterCleaningHint') : t('rooms.noRoomsInCleaning')}
              disabled={cleaningRooms.length === 0}
            >
              <SprayCan size={14} />
              <span>{t('rooms.nInCleaning', { count: cleaningRooms.length })}</span>
            </button>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${readyPct}%` }}
                title={t('rooms.readyTooltip', { count: availableRooms.length, percent: readyPct })}
              />
              <div
                className="bg-slate-300 h-full transition-all duration-300 dark:bg-slate-600"
                style={{ width: `${100 - readyPct}%` }}
                title={t('rooms.cleaningTooltip', { count: cleaningRooms.length, percent: 100 - readyPct })}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>{t('rooms.unrented', { count: totalUnoccupied })}</span>
              <span>{t('rooms.inCleaning', { count: cleaningRooms.length })}</span>
            </div>
          </div>
        </div>

        {/* Occupied Card */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium text-neutral-500">{t('room.status.occupied')}</span>
            <strong className="block text-2xl font-bold text-neutral-900 mt-0.5">{occupiedRooms.length}</strong>
          </div>
          <span className="text-[10px] text-neutral-400 mt-2">{t('rooms.activeStays')}</span>
        </div>

        {/* Arriving Today Card */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium text-neutral-500">{t('room.status.expected')}</span>
            <strong className="block text-2xl font-bold text-neutral-900 mt-0.5">{expectedRooms.length}</strong>
          </div>
          <span className="text-[10px] text-neutral-400 mt-2">{t('rooms.expectedGuests')}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('rooms.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL' as const, label: t('rooms.allRooms'), count: rooms.length },
            { id: 'AVAILABLE' as const, label: t('room.status.available'), count: availableRooms.length },
            { id: 'CLEANING' as const, label: t('room.status.cleaning'), count: cleaningRooms.length },
            { id: 'OCCUPIED' as const, label: t('room.status.occupied'), count: occupiedRooms.length },
            { id: 'EXPECTED' as const, label: t('rooms.arriving'), count: expectedRooms.length },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === filter.id
                  ? 'border border-neutral-200 bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {filter.label} {filter.count}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200"
            />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <StatePanel
          type="empty"
          title={t('rooms.noMatch')}
          message={t('rooms.noMatchHint')}
          actionSlot={
            <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
              {t('rooms.clearSearch')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRooms.map((room) => {
            const isAvailable = room.status === 'AVAILABLE'
            const isOccupied = room.status === 'OCCUPIED'
            const isExpected = room.status === 'EXPECTED'

            const stay = activeStays.find((s) => s.room_id === room.id && s.status === 'CHECKED_IN')
            const res = reservations.find(
              (r) => r.room_id === room.id && (r.status === 'RESERVED' || r.status === 'PENDING')
            )

            const stayRecord = stay as (Stay & { guest?: { full_name?: string }; guest_name?: string; has_credit?: boolean; balance?: number }) | undefined
            const resRecord = res as (Reservation & { guest?: { full_name?: string }; guest_name?: string }) | undefined

            const guestName =
              stayRecord?.guest?.full_name ||
              stayRecord?.guest_name ||
              resRecord?.guest?.full_name ||
              resRecord?.guest_name
            const hasCredit = Boolean(stayRecord?.has_credit || (stayRecord?.balance ?? 0) > 0)

            return (
              <RoomCard
                key={room.id}
                room={{
                  id: String(room.id),
                  roomNumber: room.room_number,
                  roomType: room.room_type,
                  pricePerNight: Number(room.price),
                  hourlyPrice: room.hourly_price ? Number(room.hourly_price) : undefined,
                  status: room.status,
                  availableAfter: room.available_after,
                  bedType: t('rooms.comfortBed'),
                  guestName,
                  hasCredit,
                  expectedCheckout: stay?.expected_checkout,
                  expectedArrival: res?.expected_arrival,
                }}
                isAdmin={isAdmin}
                onEdit={() => handleEditRoom(room)}
                onDelete={() => handleDeleteRoom(room)}
                actionSlot={
                  <div className="flex items-center gap-1.5 w-full">
                    {isAvailable && (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<CalendarPlus size={13} />}
                          className="flex-1 whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRoomReserve(room.id)
                          }}
                        >
                          {t('rooms.reserve')}
                        </Button>
                        {canCheckInOut && (
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={<LogIn size={13} />}
                            className="flex-1 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoomCheckIn(room.id)
                            }}
                          >
                            {t('logbook.checkIn')}
                          </Button>
                        )}
                      </>
                    )}

                    {isOccupied && canCheckInOut && (
                      <div className="flex items-center gap-1.5 w-full">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<LogOut size={13} />}
                          className="flex-1 whitespace-nowrap text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRoomManageStay(room)
                          }}
                        >
                          {t('logbook.checkOut')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Undo2 size={13} />}
                          className="text-neutral-500 hover:text-rose-600 hover:bg-rose-50 px-2"
                          title={t('common.voidHint')}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVoidCheckIn(room)
                          }}
                        >
                          {t('common.void')}
                        </Button>
                      </div>
                    )}

                    {isExpected && canCheckInOut && (
                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<UserCheck size={13} />}
                        className="flex-1 whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRoomCheckIn(room.id)
                        }}
                      >
                        {t('rooms.checkInReserved')}
                      </Button>
                    )}

                  </div>
                }
              />
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CheckInModal
        isOpen={checkInOpen}
        onClose={() => {
          setCheckInOpen(false)
          setSelectedReservation(null)
        }}
        availableRooms={availableRooms}
        allRooms={rooms}
        selectedRoomId={selectedRoomId}
        existingReservation={selectedReservation}
        onSuccess={() => {
          fetchData()
        }}
      />

      <ReservationModal
        isOpen={reservationOpen}
        onClose={() => setReservationOpen(false)}
        availableRooms={availableRooms}
        selectedRoomId={selectedRoomId}
        onSuccess={() => {
          fetchData()
        }}
      />

      <CheckOutModal
        isOpen={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        stay={selectedStay}
        onOpenVoidModal={(stay) => {
          setSelectedStay(stay)
          setVoidCheckInOpen(true)
        }}
        onSuccess={(checkedOutStay) => {
          const s = checkedOutStay || selectedStay
          if (s) {
            setActiveStays((prev) => prev.filter((item) => item.id !== s.id))
            setRooms((prev) =>
              prev.map((r) =>
                r.id === s.room_id
                  ? { ...r, status: 'AVAILABLE', available_after: null }
                  : r
              )
            )
          }
          fetchData()
        }}
      />

      <VoidCheckInModal
        isOpen={voidCheckInOpen}
        onClose={() => setVoidCheckInOpen(false)}
        stay={selectedStay}
        roomNumber={rooms.find((r) => r.id === selectedStay?.room_id)?.room_number}
        onSuccess={() => {
          fetchData()
        }}
      />

      <AddRoomModal
        isOpen={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        onSuccess={() => {
          fetchData()
        }}
      />

      <EditRoomModal
        isOpen={editRoomOpen}
        onClose={() => {
          setEditRoomOpen(false)
          setSelectedRoomToEdit(null)
        }}
        room={selectedRoomToEdit}
        onSuccess={() => {
          fetchData()
        }}
        onDeleteRequest={(r) => {
          setSelectedRoomToDelete(r)
          setDeleteRoomOpen(true)
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteRoomOpen}
        onClose={() => {
          setDeleteRoomOpen(false)
          setSelectedRoomToDelete(null)
        }}
        room={selectedRoomToDelete}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
