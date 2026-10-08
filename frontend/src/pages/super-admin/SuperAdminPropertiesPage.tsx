import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BedDouble,
  CalendarDays,
  Users,
  Phone,
  MapPin,
  Power,
  ShieldCheck,
  AlertCircle,
  Clock,
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowUpRight,
  Wifi,
  WifiOff,
} from '../../components/common/MaterialIcon'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { AddPropertyModal } from '../../components/modals/AddPropertyModal'
import { getProperties, getStaffActivity, getSuperAdminStats, togglePropertyStatus } from '../../api/superAdmin'
import { getApiError } from '../../api/client'
import { useI18n } from '../../i18n'
import type { Property, StaffActivity, SuperAdminStats } from '../../types/api'

export function SuperAdminPropertiesPage() {
  const { t, formatDate, formatNumber, formatMoney } = useI18n()
  const [properties, setProperties] = useState<Property[]>([])
  const [staffActivity, setStaffActivity] = useState<StaffActivity[]>([])
  const [staffActivityLoading, setStaffActivityLoading] = useState(true)
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Status toggle confirmation modal state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function loadData() {
    setLoading(true)
    setErrorMsg('')
    try {
      const [propsData, statsData] = await Promise.all([
        getProperties(),
        getSuperAdminStats(),
      ])
      setProperties(propsData)
      setStats(statsData)
    } catch (err) {
      setErrorMsg(getApiError(err, t('sa.errorLoad')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let mounted = true
    const loadActivity = () => {
      getStaffActivity()
        .then((activity) => {
          if (mounted) setStaffActivity(activity)
        })
        .catch((err: unknown) => {
          if (mounted) setErrorMsg(getApiError(err, t('sa.errorStaffActivity')))
        })
        .finally(() => {
          if (mounted) setStaffActivityLoading(false)
        })
    }
    loadActivity()
    const intervalId = window.setInterval(loadActivity, 30_000)
    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [t])

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const matchesSearch =
        prop.name.toLowerCase().includes(search.toLowerCase()) ||
        prop.code.toLowerCase().includes(search.toLowerCase()) ||
        (prop.contact_phone && prop.contact_phone.includes(search))

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && prop.is_active) ||
        (statusFilter === 'SUSPENDED' && !prop.is_active)

      return matchesSearch && matchesStatus
    })
  }, [properties, search, statusFilter])

  function handlePromptToggle(property: Property) {
    setSelectedProperty(property)
    setIsToggleModalOpen(true)
  }

  async function handleConfirmToggle() {
    if (!selectedProperty) return
    setIsToggling(true)
    try {
      const updated = await togglePropertyStatus(selectedProperty.id, !selectedProperty.is_active)
      setProperties((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, is_active: updated.is_active } : p))
      )
      setSuccessMsg(
        t('sa.statusChanged', { name: updated.name, status: updated.is_active ? t('sa.statusActive') : t('sa.statusSuspended') })
      )
      setTimeout(() => setSuccessMsg(''), 4000)
      setIsToggleModalOpen(false)
      setSelectedProperty(null)
      // refresh stats
      getSuperAdminStats().then(setStats).catch(() => {})
    } catch (err) {
      setErrorMsg(getApiError(err, t('sa.errorToggle')))
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={t('sa.pageTitle')}
          subtitle={t('sa.pageSubtitle')}
        />
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>{t('sa.onboard')}</span>
        </Button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Platform Metric Overview Cards */}
      <div className="space-y-3">
        {/* Operational Scope Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <span className="block text-xl font-bold text-neutral-900 leading-tight">
                {stats?.total_properties ?? 0}
              </span>
              <span className="block text-[11px] font-medium text-neutral-500">{t('sa.totalProperties')}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="block text-xl font-bold text-emerald-700 leading-tight">
                {stats?.active_properties ?? 0}
              </span>
              <span className="block text-[11px] font-medium text-neutral-500">{t('sa.activeClients')}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <span className="block text-xl font-bold text-rose-700 leading-tight">
                {stats?.suspended_properties ?? 0}
              </span>
              <span className="block text-[11px] font-medium text-neutral-500">{t('sa.statusSuspended')}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BedDouble size={20} />
            </div>
            <div>
              <span className="block text-xl font-bold text-neutral-900 leading-tight">
                {stats?.total_rooms ?? 0}
              </span>
              <span className="block text-[11px] font-medium text-neutral-500">{t('sa.managedRooms')}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <span className="block text-xl font-bold text-neutral-900 leading-tight">
                {stats?.total_stays ?? 0}
              </span>
              <span className="block text-[11px] font-medium text-neutral-500">{t('sa.totalStays')}</span>
            </div>
          </div>
        </div>

        {/* Financial Rollup Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  {t('sa.grossVolume')}
                </span>
                <span className="block text-xl font-extrabold text-emerald-950 leading-tight">
                  {formatMoney(Number(stats?.total_revenue || 0))}
                </span>
              </div>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
            >
              <span>{t('sa.reports')}</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  {t('sa.operatingExpenses')}
                </span>
                <span className="block text-xl font-extrabold text-rose-950 leading-tight">
                  {formatMoney(Number(stats?.total_expenses || 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
                  {t('sa.netCashflow')}
                </span>
                <span className="block text-xl font-extrabold text-indigo-950 leading-tight">
                  {formatMoney(Number(stats?.total_net_income || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="border-b border-neutral-200 p-4">
          <h2 className="text-base font-bold text-neutral-900">{t('sa.staffActivity')}</h2>
          <p className="mt-1 text-xs text-neutral-500">{t('sa.staffActivitySub')}</p>
        </div>
        {staffActivityLoading ? (
          <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p>
        ) : staffActivity.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">{t('sa.noStaffActivity')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{t('common.name')}</th>
                  <th className="px-4 py-3">{t('common.property')}</th>
                  <th className="px-4 py-3">{t('common.role')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('sa.activeDays')}</th>
                  <th className="px-4 py-3">{t('sa.lastActive')}</th>
                  <th className="px-4 py-3">{t('sa.passwordChangedAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staffActivity.map((staff) => (
                  <tr key={staff.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-neutral-900">{staff.full_name}</span>
                      <span className="text-xs text-neutral-500">{staff.username}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{staff.property_name || '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {staff.role === 'ADMIN' ? t('settings.administrator') : t('settings.receptionDesk')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          staff.is_online
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {staff.is_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {staff.is_online ? t('sa.online') : t('sa.offline')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {formatNumber(staff.active_days)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {staff.last_seen_at ? formatDate(staff.last_seen_at, 'datetime') : t('sa.neverSeen')}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(staff.password_changed_at, 'datetime')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
          {t('sa.passwordVisibilityNote')}
        </p>
      </section>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('sa.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === filter
                  ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {filter === 'ALL' ? t('sa.allClients') : filter === 'ACTIVE' ? t('sa.statusActive') : t('sa.statusSuspended')}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            {t('sa.loading')}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Building2 size={32} className="text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold text-neutral-700">{t('sa.noPropertiesFound')}</p>
            <p className="text-xs text-neutral-400">
              {search || statusFilter !== 'ALL'
                ? t('sa.adjustSearch')
                : t('sa.addFirstClient')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('sa.colProperty')}</th>
                  <th className="py-3 px-4">{t('sa.colContact')}</th>
                  <th className="py-3 px-4">{t('sa.colConfiguration')}</th>
                  <th className="py-3 px-4 text-center">{t('sa.colScope')}</th>
                  <th className="py-3 px-4">{t('sa.colFinancials')}</th>
                  <th className="py-3 px-4 text-center">{t('common.status')}</th>
                  <th className="py-3 px-4 text-right">{t('sa.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-neutral-50/50 transition-colors">
                    {/* Property Identification */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 font-bold shrink-0">
                          {prop.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 text-sm">{prop.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-mono font-bold text-neutral-600">
                              {prop.code}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400">
                            {t('sa.onboarded', { date: formatDate(prop.created_at, 'short') })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Location */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {prop.contact_phone ? (
                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Phone size={14} className="text-neutral-400" />
                            <span>{prop.contact_phone}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">{t('sa.noPhone')}</span>
                        )}
                        {prop.address && (
                          <div className="flex items-center gap-1.5 text-neutral-500 truncate max-w-xs">
                            <MapPin size={14} className="text-neutral-400 shrink-0" />
                            <span className="truncate">{prop.address}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Configuration */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-neutral-600">
                          <span className="font-semibold text-neutral-900">{prop.currency}</span>
                          <span>{t('sa.currencyWord')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
                          <Clock size={12} className="text-neutral-400" />
                          <span>
                            {t('sa.cutoff', { time: `${String(prop.checkout_deadline_hour).padStart(2, '0')}:${String(prop.checkout_deadline_minute).padStart(2, '0')}` })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Scope Counters */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center" title={t('sa.rooms')}>
                          <span className="block font-bold text-neutral-900">
                            {prop.total_rooms ?? 0}
                          </span>
                          <span className="block text-[10px] text-neutral-400">{t('sa.rooms')}</span>
                        </div>
                        <div className="w-px h-5 bg-neutral-200" />
                        <div className="text-center" title={t('sa.reservations')}>
                          <span className="block font-bold text-neutral-900">
                            {prop.total_reservations ?? 0}
                          </span>
                          <span className="block text-[10px] text-neutral-400">{t('sa.bookings')}</span>
                        </div>
                        <div className="w-px h-5 bg-neutral-200" />
                        <div className="text-center" title={t('sa.staffUsers')}>
                          <span className="block font-bold text-neutral-900">
                            {prop.total_users ?? 0}
                          </span>
                          <span className="block text-[10px] text-neutral-400">{t('sa.staff')}</span>
                        </div>
                      </div>
                    </td>

                    {/* Financial Summary */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 min-w-[130px]">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-neutral-400">{t('sa.revShort')}</span>
                          <span className="font-semibold text-emerald-700">
                            {prop.currency} {formatNumber(Number(prop.total_revenue || 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-neutral-400">{t('sa.expShort')}</span>
                          <span className="font-medium text-rose-600">
                            {prop.currency} {formatNumber(Number(prop.total_expenses || 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-neutral-100">
                          <span className="text-neutral-400">{t('sa.netShort')}</span>
                          <span
                            className={`font-bold ${
                              Number(prop.net_income || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {prop.currency} {formatNumber(Number(prop.net_income || 0))}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {prop.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t('sa.statusActive')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {t('sa.statusSuspended')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reports?property_id=${prop.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition border border-neutral-200"
                          title={t('sa.viewReports')}
                        >
                          <BarChart3 size={14} className="text-neutral-500" />
                          <span>{t('sa.reports')}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handlePromptToggle(prop)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            prop.is_active
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          <Power size={14} />
                          <span>{prop.is_active ? t('sa.suspend') : t('sa.activate')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Property Modal */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadData()
          setSuccessMsg(t('sa.onboardedSuccess'))
          setTimeout(() => setSuccessMsg(''), 4000)
        }}
      />

      {/* Confirmation Modal for Suspending / Activating */}
      {selectedProperty && (
        <Modal
          isOpen={isToggleModalOpen}
          onClose={() => {
            if (!isToggling) {
              setIsToggleModalOpen(false)
              setSelectedProperty(null)
            }
          }}
          title={
            selectedProperty.is_active
              ? t('sa.confirmSuspendTitle', { name: selectedProperty.name })
              : t('sa.confirmReactivateTitle', { name: selectedProperty.name })
          }
          description={
            selectedProperty.is_active
              ? t('sa.suspendDesc')
              : t('sa.reactivateDesc')
          }
          size="md"
        >
          <div className="space-y-4 pt-2">
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                selectedProperty.is_active
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {selectedProperty.is_active ? (
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              )}
              <span>
                {selectedProperty.is_active
                  ? t('sa.suspendWarning')
                  : t('sa.reactivateWarning')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsToggleModalOpen(false)
                  setSelectedProperty(null)
                }}
                disabled={isToggling}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant={selectedProperty.is_active ? 'danger' : 'primary'}
                onClick={handleConfirmToggle}
                isLoading={isToggling}
                className="gap-2"
              >
                <Power size={16} />
                <span>
                  {selectedProperty.is_active ? t('sa.confirmSuspension') : t('sa.confirmActivation')}
                </span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
