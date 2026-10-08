import { useEffect, useState } from 'react'
import type { IconComponent } from '../components/common/MaterialIcon'
import {
  BedDouble,
  CalendarDays,
  CircleDollarSign,
  Download,
  Plus,
  ShieldCheck,
  UserPlus,
} from '../components/common/MaterialIcon'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/common/Button'
import { RoomCard, type RoomCardData } from '../components/common/RoomCard'
import { Table, type Column } from '../components/common/Table'
import { EmptyState } from '../components/common/StatePanel'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { getAuditLogs } from '../api/audit'
import type { AuditLog } from '../types/api'

const roomFilterKeys: Record<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'CLEANING', string> = {
  ALL: 'ph.allRooms',
  AVAILABLE: 'ph.filterAvailable',
  OCCUPIED: 'ph.filterOccupied',
  CLEANING: 'ph.filterCleaning',
}

export interface PlaceholderPageProps {
  id?: string
  title: string
  description: string
  icon: IconComponent
}

export function PlaceholderPage({ id, title, description, icon: Icon }: PlaceholderPageProps) {
  const { user } = useAuth()
  const { t, formatDate } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'CLEANING'>('ALL')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  // Derive module key from id or title
  const moduleKey = id || title.toLowerCase()

  useEffect(() => {
    if (!moduleKey.includes('audit')) return
    setAuditLoading(true)
    getAuditLogs()
      .then(setAuditLogs)
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false))
  }, [moduleKey])

  // Sample architectural room models for the Rooms view
  const sampleRooms: RoomCardData[] = [
    {
      id: '101',
      roomNumber: `${t('common.room')} 101`,
      roomType: t('ph.roomDeluxeKing'),
      pricePerNight: 1800,
      status: 'AVAILABLE',
      capacity: 2,
      bedType: t('ph.bedKing'),
    },
    {
      id: '102',
      roomNumber: `${t('common.room')} 102`,
      roomType: t('ph.roomClassicQueen'),
      pricePerNight: 1400,
      status: 'OCCUPIED',
      capacity: 2,
      bedType: t('ph.bedQueen'),
    },
    {
      id: '103',
      roomNumber: `${t('common.room')} 103`,
      roomType: t('ph.roomGardenTwin'),
      pricePerNight: 1600,
      status: 'CLEANING',
      capacity: 2,
      bedType: t('ph.bedTwin'),
    },
    {
      id: '201',
      roomNumber: `${t('common.room')} 201`,
      roomType: t('ph.roomExecutiveBalcony'),
      pricePerNight: 2400,
      status: 'AVAILABLE',
      capacity: 3,
      bedType: t('ph.bedKingSofa'),
    },
    {
      id: '202',
      roomNumber: `${t('common.room')} 202`,
      roomType: t('ph.roomStandardDouble'),
      pricePerNight: 1200,
      status: 'AVAILABLE',
      capacity: 2,
      bedType: t('ph.bedDouble'),
    },
    {
      id: '203',
      roomNumber: `${t('common.room')} 203`,
      roomType: t('ph.roomPenthouse'),
      pricePerNight: 3200,
      status: 'RESERVED',
      capacity: 4,
      bedType: t('ph.bedKing2'),
    },
  ]

  const filteredRooms = sampleRooms.filter((r) => {
    if (roomFilter === 'ALL') return true
    return r.status === roomFilter
  })

  // Module-specific renders
  const renderModuleContent = () => {
    if (moduleKey.includes('room')) {
      return (
        <div className="space-y-6">
          {/* Room Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD]">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoomFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    roomFilter === filter
                      ? 'bg-white text-[#222222] shadow-xs'
                      : 'text-[#717171] hover:text-[#222222]'
                  }`}
                >
                  {t(roomFilterKeys[filter])}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#717171] px-3">
              {t('ph.showingLayouts', { count: filteredRooms.length })}
            </div>
          </div>

          {/* Grid of Room Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                actionSlot={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                  >
                    {t('sa.manage')}
                  </Button>
                }
              />
            ))}
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DDDDDD] text-center text-xs text-[#717171]">
            <span className="font-semibold text-[#222222]">{t('ph.phaseArchitecture')}</span>{' '}
            {t('ph.roomsNote')}
          </div>
        </div>
      )
    }

    if (moduleKey.includes('reservation')) {
      const reservationColumns: Column<Record<string, unknown>>[] = [
        { header: t('ph.colReservationId'), accessorKey: 'code' },
        { header: t('ph.colGuestName'), accessorKey: 'guest' },
        { header: t('ph.colRoomType'), accessorKey: 'room' },
        { header: t('ph.colDates'), accessorKey: 'dates' },
        { header: t('ph.colNights'), accessorKey: 'nights' },
        {
          header: t('common.status'),
          cell: () => <Badge tone="expected">{t('ph.expected')}</Badge>,
        },
        { header: t('ph.colTotalEtb'), accessorKey: 'total', align: 'right' },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={reservationColumns}
            data={[]}
            emptyMessage={t('ph.noReservationsFound')}
          />
          <EmptyState
            title={t('ph.noReservationsTitle')}
            description={t('ph.noReservationsDesc')}
            actionLabel={t('ph.createReservation')}
            onAction={() => setModalOpen(true)}
          />
        </div>
      )
    }

    if (moduleKey.includes('guest')) {
      const guestColumns: Column<Record<string, unknown>>[] = [
        { header: t('ph.colFullName'), accessorKey: 'name' },
        { header: t('common.phoneNumber'), accessorKey: 'phone' },
        { header: t('ph.colIdPassport'), accessorKey: 'idDoc' },
        { header: t('ph.colTotalStays'), accessorKey: 'stays' },
        { header: t('common.status'), cell: () => <Badge tone="available">{t('ph.registered')}</Badge> },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={guestColumns}
            data={[]}
            emptyMessage={t('ph.noGuestsFound')}
          />
          <EmptyState
            title={t('ph.noGuestsTitle')}
            description={t('ph.noGuestsDesc')}
            actionLabel={t('ph.registerGuest')}
            onAction={() => setModalOpen(true)}
          />
        </div>
      )
    }

    if (moduleKey.includes('stay')) {
      const stayColumns: Column<Record<string, unknown>>[] = [
        { header: t('ph.colStayRef'), accessorKey: 'stayRef' },
        { header: t('ph.colGuest'), accessorKey: 'guest' },
        { header: t('ph.colRoomAssigned'), accessorKey: 'room' },
        { header: t('ph.colCheckinTime'), accessorKey: 'checkin' },
        { header: t('ph.colBalanceEtb'), accessorKey: 'balance', align: 'right' },
        { header: t('common.status'), cell: () => <Badge tone="occupied">{t('ph.inHouse')}</Badge> },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={stayColumns}
            data={[]}
            emptyMessage={t('ph.noStaysFound')}
          />
          <EmptyState
            title={t('ph.noStaysTitle')}
            description={t('ph.noStaysDesc')}
            actionLabel={t('ph.checkInGuest')}
            onAction={() => setModalOpen(true)}
          />
        </div>
      )
    }

    if (moduleKey.includes('payment')) {
      const paymentColumns: Column<Record<string, unknown>>[] = [
        { header: t('ph.colReceiptNo'), accessorKey: 'receipt' },
        { header: t('ph.colDateTime'), accessorKey: 'date' },
        { header: t('ph.colStayGuest'), accessorKey: 'guest' },
        { header: t('common.method'), accessorKey: 'method' },
        { header: t('ph.colAmountEtb'), accessorKey: 'amount', align: 'right' },
        { header: t('common.status'), cell: () => <Badge tone="available">{t('ph.verified')}</Badge> },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={paymentColumns}
            data={[]}
            emptyMessage={t('ph.noPaymentsFound')}
          />
          <EmptyState
            title={t('ph.noPaymentsTitle')}
            description={t('ph.noPaymentsDesc')}
            actionLabel={t('ph.recordPayment')}
            onAction={() => setModalOpen(true)}
          />
        </div>
      )
    }

    if (moduleKey.includes('expense')) {
      const expenseColumns: Column<Record<string, unknown>>[] = [
        { header: t('ph.colVoucherNo'), accessorKey: 'voucher' },
        { header: t('common.date'), accessorKey: 'date' },
        { header: t('common.category'), accessorKey: 'category' },
        { header: t('common.description'), accessorKey: 'desc' },
        { header: t('ph.colAmountEtb'), accessorKey: 'amount', align: 'right' },
        { header: t('ph.colRecordedBy'), accessorKey: 'staff' },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={expenseColumns}
            data={[]}
            emptyMessage={t('ph.noExpensesFound')}
          />
          <EmptyState
            title={t('ph.noExpensesTitle')}
            description={t('ph.noExpensesDesc')}
            actionLabel={t('ph.recordExpense')}
            onAction={() => setModalOpen(true)}
          />
        </div>
      )
    }

    if (moduleKey.includes('report')) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hover padding="md" onClick={() => setModalOpen(true)}>
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#FF385C] flex items-center justify-center mb-3">
                <CircleDollarSign size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[#222222]">{t('ph.revenueSummary')}</h3>
              <p className="text-xs text-[#717171] mt-1">{t('ph.revenueSummaryDesc')}</p>
              <div className="mt-4 pt-3 border-t border-[#F0F0F0] text-xs font-semibold text-[#FF385C] flex items-center gap-1">
                <Download size={13} /> {t('ph.export')}
              </div>
            </Card>

            <Card hover padding="md" onClick={() => setModalOpen(true)}>
              <div className="w-10 h-10 rounded-xl bg-[#EBF9EB] text-[#008A05] flex items-center justify-center mb-3">
                <BedDouble size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[#222222]">{t('ph.occupancyRevpar')}</h3>
              <p className="text-xs text-[#717171] mt-1">{t('ph.occupancyRevparDesc')}</p>
              <div className="mt-4 pt-3 border-t border-[#F0F0F0] text-xs font-semibold text-[#008A05] flex items-center gap-1">
                <Download size={13} /> {t('ph.export')}
              </div>
            </Card>

            <Card hover padding="md" onClick={() => setModalOpen(true)}>
              <div className="w-10 h-10 rounded-xl bg-[#FFF6EB] text-[#C76A00] flex items-center justify-center mb-3">
                <CalendarDays size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[#222222]">{t('ph.stayDuration')}</h3>
              <p className="text-xs text-[#717171] mt-1">{t('ph.stayDurationDesc')}</p>
              <div className="mt-4 pt-3 border-t border-[#F0F0F0] text-xs font-semibold text-[#C76A00] flex items-center gap-1">
                <Download size={13} /> {t('ph.export')}
              </div>
            </Card>

            <Card hover padding="md" onClick={() => setModalOpen(true)}>
              <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#0073E6] flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[#222222]">{t('ph.taxCompliance')}</h3>
              <p className="text-xs text-[#717171] mt-1">{t('ph.etbDesc')}</p>
              <div className="mt-4 pt-3 border-t border-[#F0F0F0] text-xs font-semibold text-[#0073E6] flex items-center gap-1">
                <Download size={13} /> {t('ph.export')}
              </div>
            </Card>
          </div>

          <EmptyState
            title={t('ph.reportingReady')}
            description={t('ph.reportingReadyDesc')}
          />
        </div>
      )
    }

    if (moduleKey.includes('user')) {
      interface StaffUser {
        name: string
        username: string
        role: string
        status: string
      }
      const userColumns: Column<StaffUser>[] = [
        { header: t('ph.colFullName'), accessorKey: 'name' },
        { header: t('ph.colUsername'), accessorKey: 'username' },
        {
          header: t('common.role'),
          cell: (item: StaffUser) => (
            <Badge tone={item.role === 'ADMIN' ? 'occupied' : 'info'}>
              {item.role === 'ADMIN' ? t('settings.administrator') : t('ph.receptionist')}
            </Badge>
          ),
        },
        {
          header: t('common.status'),
          cell: () => <Badge tone="available">{t('ph.activeStaff')}</Badge>,
        },
      ]

      const staffData = [
        {
          name: user?.full_name || t('ph.systemAdmin'),
          username: user?.username || 'admin',
          role: user?.role || 'ADMIN',
          status: t('common.active'),
        },
        {
          name: t('ph.receptionStaff'),
          username: 'reception',
          role: 'RECEPTION',
          status: t('common.active'),
        },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={userColumns}
            data={staffData}
          />
          <div className="p-4 bg-white rounded-2xl border border-[#DDDDDD] text-center text-xs text-[#717171]">
            {t('ph.rbacNote')}
          </div>
        </div>
      )
    }

    if (moduleKey.includes('audit')) {
      const auditColumns: Column<AuditLog>[] = [
        {
          header: t('ph.colTimestamp'),
          render: (item) => formatDate(item.timestamp, 'datetime'),
        },
        { header: t('ph.colStaffActor'), render: (item) => item.actor_name || t('ph.system') },
        {
          header: t('ph.colAction'),
          render: (item) => item.action === 'STAFF_PASSWORD_CHANGED'
            ? t('audit.passwordChanged')
            : item.action === 'STAFF_PASSWORD_RESET_BY_ADMIN'
              ? t('audit.passwordReset')
              : item.action === 'STAFF_USERNAME_CHANGED'
                ? t('audit.usernameChanged')
              : item.action,
        },
        {
          header: t('ph.colEntity'),
          render: (item) => `${item.entity_type} #${item.entity_id}`,
        },
        { header: t('ph.colResult'), cell: () => <Badge tone="available">{t('ph.success')}</Badge> },
      ]

      return (
        <div className="space-y-6">
          <Table
            columns={auditColumns}
            data={auditLogs}
            isLoading={auditLoading}
            emptyMessage={t('ph.noAuditFound')}
          />
          <EmptyState
            title={t('ph.auditActive')}
            description={t('ph.auditActiveDesc')}
          />
        </div>
      )
    }

    if (moduleKey.includes('setting')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="md">
            <h3 className="text-base font-semibold text-[#222222] mb-1">Guest House Profile</h3>
            <p className="text-xs text-[#717171] mb-4">Core guest house attributes and local business identity.</p>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Guest House Name</span>
                <span className="font-semibold text-[#222222]">Family Guest House</span>
              </div>
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Base Currency</span>
                <span className="font-semibold text-[#222222]">ETB (Ethiopian Birr)</span>
              </div>
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Timezone</span>
                <span className="font-semibold text-[#222222]">Africa/Addis_Ababa (UTC+3)</span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-base font-semibold text-[#222222] mb-1">Operational Policies</h3>
            <p className="text-xs text-[#717171] mb-4">Standard front-desk deadlines and grace periods.</p>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Check-in Standard</span>
                <span className="font-semibold text-[#222222]">02:00 PM</span>
              </div>
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Checkout Standard</span>
                <span className="font-semibold text-[#222222]">11:00 AM</span>
              </div>
              <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EEEEEE] flex justify-between">
                <span className="text-[#717171]">Late Checkout Penalty</span>
                <span className="font-semibold text-[#222222]">ETB 600.00 / hour</span>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    // Default fallback
    return (
      <Card padding="lg">
        <EmptyState
          icon={<Icon size={24} className="text-[#FF385C]" />}
          title={`${title} Module Ready`}
          description={description}
          actionLabel="Open options"
          onAction={() => setModalOpen(true)}
        />
      </Card>
    )
  }

  // Derive contextual action button
  const getHeaderActions = () => {
    if (moduleKey.includes('room')) {
      return (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setModalOpen(true)}
        >
          + Add Room
        </Button>
      )
    }
    if (moduleKey.includes('reservation')) {
      return (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CalendarDays size={15} />}
          onClick={() => setModalOpen(true)}
        >
          + New Reservation
        </Button>
      )
    }
    if (moduleKey.includes('guest')) {
      return (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus size={15} />}
          onClick={() => setModalOpen(true)}
        >
          + Add Guest
        </Button>
      )
    }
    if (moduleKey.includes('payment')) {
      return (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CircleDollarSign size={15} />}
          onClick={() => setModalOpen(true)}
        >
          + Record Payment
        </Button>
      )
    }
    if (moduleKey.includes('expense')) {
      return (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setModalOpen(true)}
        >
          + Record Expense
        </Button>
      )
    }
    return undefined
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        kicker="Hospitality Operations"
        title={title}
        description={description}
        actions={getHeaderActions()}
      />

      {renderModuleContent()}

      {/* Action preview modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${title} Action`}
        description="Phase 5.1 Hospitality UI Redesign"
      >
        <div className="space-y-3 text-xs text-[#717171]">
          <p className="leading-relaxed">
            This module has been upgraded to the modern Airbnb-inspired hospitality design system. The form modals and interactive mutations will connect to backend endpoints in Phase 5.2.
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}