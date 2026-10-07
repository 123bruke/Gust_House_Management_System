import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  CircleDollarSign,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  Wallet,
  Building,
  Building2,
  Layers,
} from '../../components/common/MaterialIcon'
import { PageHeader } from '../../components/common/PageHeader'
import { KpiCard } from '../../components/common/KpiCard'
import { useAuth } from '../../context/AuthContext'
import { getProperties } from '../../api/superAdmin'
import {
  getDailyReport,
  getIncomeAnalysis,
  getExpensesAnalysis,
  getWeeklyReport,
  getMonthlyReport,
} from '../../api/reports'
import type {
  DailyReport,
  IncomeAnalysisReport,
  ExpenseAnalysisReport,
  WeeklyReport,
  MonthlyReport,
  Property,
} from '../../types/api'
import { useI18n } from '../../i18n'

type StatementMetric =
  | 'GROSS_INCOME'
  | 'DAILY_REVENUE'
  | 'NET_INCOME'
  | 'EXPENSE'
  | 'NET_CASHFLOW'
  | 'ALL'

export function ReportsPage() {
  const { user } = useAuth()
  const { t, formatDate, formatMoney, currency } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPropId = searchParams.get('property_id') ? Number(searchParams.get('property_id')) : null

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(initialPropId)

  const [activeTab, setActiveTab] = useState<'daily' | 'income' | 'expenses' | 'weekly' | 'monthly'>('monthly')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [_loading, setLoading] = useState(true)

  // Total Statement states
  const [statementPeriod, setStatementPeriod] = useState<'month' | 'all'>('month')
  const [statementMonth, setStatementMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [statementMetric, setStatementMetric] = useState<StatementMetric>('GROSS_INCOME')

  // Report states
  const [dailyData, setDailyData] = useState<DailyReport | null>(null)
  const [incomeData, setIncomeData] = useState<IncomeAnalysisReport | null>(null)
  const [expenseData, setExpenseData] = useState<ExpenseAnalysisReport | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyReport | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null)

  // Load properties list if user is SUPER_ADMIN
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      getProperties().then(setProperties).catch(() => {})
    }
  }, [user?.role])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const propId = user?.role === 'SUPER_ADMIN' ? selectedPropertyId : undefined
    try {
      if (activeTab === 'daily') {
        const data = await getDailyReport(selectedDate, propId)
        setDailyData(data)
      } else if (activeTab === 'income') {
        const data = await getIncomeAnalysis({ period: 'all', property_id: propId })
        setIncomeData(data)
      } else if (activeTab === 'expenses') {
        const data = await getExpensesAnalysis({ period: 'all', property_id: propId })
        setExpenseData(data)
      } else if (activeTab === 'weekly') {
        const data = await getWeeklyReport(selectedDate, propId)
        setWeeklyData(data)
      } else if (activeTab === 'monthly') {
        if (statementPeriod === 'all') {
          const data = await getMonthlyReport(0, 0, propId)
          setMonthlyData(data)
        } else {
          const [y, m] = statementMonth.split('-').map(Number)
          const data = await getMonthlyReport(y, m, propId)
          setMonthlyData(data)
        }
      }
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedDate, statementPeriod, statementMonth, selectedPropertyId, user?.role])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const paymentMethodKeys: Record<string, string> = {
    CASH: 'pm.cash',
    TELEBIRR: 'pm.telebirr',
    CBE_BIRR: 'pm.cbeBirr',
    BANK_TRANSFER: 'pm.bankTransfer',
    OTHER: 'pm.otherBank',
    CREDIT: 'pm.credit',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.intelligence')}
        subtitle={t('reports.intelligenceSub')}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
                <Building2 size={16} className="text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-600">{t('reports.propertyLabel')}</span>
                <select
                  value={selectedPropertyId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    setSelectedPropertyId(val)
                    if (val) {
                      setSearchParams({ property_id: String(val) })
                    } else {
                      setSearchParams({})
                    }
                  }}
                  className="text-xs bg-transparent font-bold text-neutral-900 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('reports.allProperties')}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
              />
            ) : activeTab === 'monthly' ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-neutral-200 bg-neutral-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setStatementPeriod('month')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      statementPeriod === 'month'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {t('reports.byMonth')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatementPeriod('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      statementPeriod === 'all'
                        ? 'bg-white text-[#FF385C] shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {t('reports.allTimeTotal')}
                  </button>
                </div>

                {statementPeriod === 'month' && (
                  <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-3 py-1 text-xs">
                    <Calendar size={14} className="text-neutral-400" />
                    <input
                      type="month"
                      value={statementMonth}
                      onChange={(e) => setStatementMonth(e.target.value)}
                      className="text-xs text-neutral-800 bg-transparent focus:outline-none font-medium cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ) : undefined}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 space-x-1">
        {[
          { id: 'monthly', label: t('reports.tab.totalStatement'), icon: FileSpreadsheet },
          { id: 'daily', label: t('reports.tab.daily'), icon: Calendar },
          { id: 'weekly', label: t('reports.tab.weekly'), icon: BarChart3 },
          { id: 'income', label: t('reports.tab.income'), icon: CircleDollarSign },
          { id: 'expenses', label: t('reports.tab.expenses'), icon: TrendingDown },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
                active
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: DAILY FLASH REPORT */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {dailyData && (
            <>
              {/* Daily KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title={t('reports.netCashflow')}
                  value={formatMoney(Number(dailyData.net_income))}
                  subtitle={t('reports.netCashflowSub')}
                  icon={<Wallet size={20} />}
                  tone={Number(dailyData.net_income) >= 0 ? 'success' : 'danger'}
                />
                <KpiCard
                  title={t('reports.dailyRevenue')}
                  value={formatMoney(Number(dailyData.todays_income))}
                  subtitle={t('reports.guestSettlementsCollected')}
                  icon={<TrendingUp size={20} />}
                  tone="success"
                />
                <KpiCard
                  title={t('reports.dailyExpenses')}
                  value={formatMoney(Number(dailyData.todays_expenses))}
                  subtitle={t('reports.operationalCostsToday')}
                  icon={<TrendingDown size={20} />}
                  tone="neutral"
                />
                <KpiCard
                  title={t('dash.occupiedRooms')}
                  value={t('logbook.roomsCount', { count: dailyData.occupied_rooms })}
                  subtitle={t('reports.availableForCheckin', { count: dailyData.available_rooms })}
                  icon={<Building size={20} />}
                  tone="accent"
                />
              </div>

              {/* Operational Activity Glance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {t('reports.checkInsToday')}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      {dailyData.check_ins_count}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-neutral-900 mt-2">
                    {t('reports.guestsCount', { count: dailyData.check_ins_count })}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('reports.checkedInThisDate')}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {t('reports.checkOutsCompleted')}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs">
                      {dailyData.check_outs_count}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-neutral-900 mt-2">
                    {t('logbook.roomsCount', { count: dailyData.check_outs_count })}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('reports.vacatedReady')}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {t('reports.lateCheckoutPenalties')}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-rose-600 mt-2">
                    {formatMoney(Number(dailyData.penalties_total))}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('reports.automatedPenalty')}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: INCOME BY PAYMENT METHOD */}
      {activeTab === 'income' && incomeData && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-[#1A1D21] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t('reports.totalGrossCollections')}
              </p>
              <h2 className="text-3xl font-extrabold mt-1">
                {formatMoney(Number(incomeData.total_income))}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-400">{t('reports.paymentChannelsActive')}</span>
              <p className="text-lg font-bold">{t('reports.methodsCount', { count: incomeData.by_method.length })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeData.by_method.map((item) => {
              const numAmt = Number(item.amount)
              const total = Number(incomeData.total_income) || 1
              const pct = Math.round((numAmt / total) * 100)

              return (
                <div
                  key={item.method}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-neutral-900">
                        {paymentMethodKeys[item.method] ? t(paymentMethodKeys[item.method]) : item.method}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF385C]/10 text-[#FF385C]">
                        {pct}%
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {formatMoney(numAmt)}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t('reports.successfulTransactions', { count: item.count })}
                    </p>
                  </div>

                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-4">
                    <div
                      className="bg-[#FF385C] h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE DISTRIBUTION */}
      {activeTab === 'expenses' && expenseData && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('reports.totalOperationalExpenses')}
              </p>
              <h2 className="text-3xl font-extrabold text-neutral-900 mt-1">
                {formatMoney(Number(expenseData.total_expenses))}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-500">{t('reports.costCenters')}</span>
              <p className="text-lg font-bold text-neutral-900">{t('reports.categoriesCount', { count: expenseData.by_category.length })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseData.by_category.map((item) => (
              <div
                key={item.category}
                className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-neutral-900">{item.category}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {item.percentage}%
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {formatMoney(Number(item.amount))}
                  </h3>
                </div>

                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WEEKLY SUMMARY */}
      {activeTab === 'weekly' && weeklyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title={t('reports.sevenDayNetCashflow')}
              value={formatMoney(Number(weeklyData.net_income))}
              subtitle={t('reports.dateRange', { start: formatDate(weeklyData.start_date, 'short'), end: formatDate(weeklyData.end_date, 'short') })}
              icon={<Wallet size={20} />}
              tone={Number(weeklyData.net_income) >= 0 ? 'success' : 'danger'}
            />
            <KpiCard
              title={t('reports.sevenDayRevenue')}
              value={formatMoney(Number(weeklyData.total_income))}
              subtitle={t('reports.grossIncomeCollected')}
              icon={<TrendingUp size={20} />}
              tone="success"
            />
            <KpiCard
              title={t('reports.sevenDayExpenses')}
              value={formatMoney(Number(weeklyData.total_expense))}
              subtitle={t('reports.operationalDisbursements')}
              icon={<TrendingDown size={20} />}
              tone="neutral"
            />
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-4">{t('reports.dailyBreakdownWeek')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-neutral-200 text-neutral-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">{t('reports.dayDate')}</th>
                    <th className="py-2.5 px-3">{t('reports.revenueEtb')}</th>
                    <th className="py-2.5 px-3">{t('reports.expensesEtb')}</th>
                    <th className="py-2.5 px-3">{t('reports.netBalance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {weeklyData.days.map((d) => (
                    <tr key={d.date} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">
                        {d.day} ({d.date})
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600">
                        {formatMoney(Number(d.income))}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">
                        {formatMoney(Number(d.expense))}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">
                        {formatMoney(Number(d.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOTAL STATEMENT */}
      {activeTab === 'monthly' && monthlyData && (
        <div className="space-y-6">
          {/* Metric Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {t('reports.filterStatement')}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                    {t('reports.defaultGrossIncome')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {t('reports.isolatePrefix')}{' '}
                  <span className="font-semibold text-neutral-800">{monthlyData.month}</span>
                  {t('reports.isolateSuffix')}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'GROSS_INCOME', label: t('reports.grossIncome'), badge: t('reports.defaultBadge'), icon: TrendingUp },
                  { id: 'DAILY_REVENUE', label: t('reports.dailyRevenue'), icon: CircleDollarSign },
                  { id: 'NET_INCOME', label: t('dash.netIncome'), icon: Wallet },
                  { id: 'EXPENSE', label: t('reports.expenseLabel'), icon: TrendingDown },
                  { id: 'NET_CASHFLOW', label: t('reports.netCashflow'), icon: Building },
                  { id: 'ALL', label: t('reports.allMetrics'), icon: Layers },
                ].map((item) => {
                  const isSelected = statementMetric === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatementMetric(item.id as StatementMetric)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-[#FF385C] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge && !isSelected && (
                        <span className="text-[9px] font-bold bg-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Active Metric Spotlight Banner */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/30">
                    {statementMetric === 'GROSS_INCOME' && t('reports.metricDefaultGross')}
                    {statementMetric === 'DAILY_REVENUE' && t('reports.metricDailyRevenue')}
                    {statementMetric === 'NET_INCOME' && t('reports.metricNetIncome')}
                    {statementMetric === 'EXPENSE' && t('reports.metricOperationalExpenses')}
                    {statementMetric === 'NET_CASHFLOW' && t('reports.metricNetCashflow')}
                    {statementMetric === 'ALL' && t('reports.metricAllDimensions')}
                  </span>
                  <span className="text-xs text-neutral-400">{t('reports.statementMonth', { month: monthlyData.month })}</span>
                </div>

                <div className="mt-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {statementMetric === 'GROSS_INCOME' && formatMoney(Number(monthlyData.total_income))}
                    {statementMetric === 'DAILY_REVENUE' && t('reports.perDay', { amount: formatMoney(Number(monthlyData.average_daily_income)) })}
                    {statementMetric === 'NET_INCOME' && formatMoney(Number(monthlyData.net_income))}
                    {statementMetric === 'EXPENSE' && formatMoney(Number(monthlyData.total_expenses))}
                    {statementMetric === 'NET_CASHFLOW' && formatMoney(Number(monthlyData.net_income))}
                    {statementMetric === 'ALL' && t('reports.amountGross', { amount: formatMoney(Number(monthlyData.total_income)) })}
                  </h2>
                  <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
                    {statementMetric === 'GROSS_INCOME' &&
                      t('reports.descGrossIncome')}
                    {statementMetric === 'DAILY_REVENUE' &&
                      t('reports.descDailyRevenue')}
                    {statementMetric === 'NET_INCOME' &&
                      t('reports.descNetIncome')}
                    {statementMetric === 'EXPENSE' &&
                      t('reports.descExpense')}
                    {statementMetric === 'NET_CASHFLOW' &&
                      t('reports.descNetCashflow')}
                    {statementMetric === 'ALL' &&
                      t('reports.descAllMetrics')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs border-t md:border-t-0 md:border-l border-neutral-700 pt-3 md:pt-0 md:pl-5">
                <div className="text-neutral-300">
                  <span className="text-neutral-400">{t('reports.occupancyLabel')} </span>
                  <span className="font-bold text-white">{monthlyData.occupancy_rate}%</span>
                </div>
                <div className="text-neutral-300">
                  <span className="text-neutral-400">{t('reports.guestsHostedLabel')} </span>
                  <span className="font-bold text-white">{monthlyData.total_guests}</span>
                </div>
                <div className="text-neutral-300">
                  <span className="text-neutral-400">{t('reports.avgDaily')}: </span>
                  <span className="font-bold text-emerald-400">
                    {formatMoney(Number(monthlyData.average_daily_income))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statement KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`rounded-2xl transition ${
                statementMetric === 'GROSS_INCOME' ? 'ring-2 ring-[#FF385C] rounded-2xl' : ''
              }`}
            >
              <KpiCard
                title={t('reports.grossIncome')}
                value={formatMoney(Number(monthlyData.total_income))}
                subtitle={statementMetric === 'GROSS_INCOME' ? t('reports.activeFilterDefault') : t('reports.allRoomCharges')}
                icon={<TrendingUp size={20} />}
                tone="success"
              />
            </div>

            <div
              className={`rounded-2xl transition ${
                statementMetric === 'DAILY_REVENUE' ? 'ring-2 ring-[#FF385C] rounded-2xl' : ''
              }`}
            >
              <KpiCard
                title={t('reports.dailyRevenuePace')}
                value={formatMoney(Number(monthlyData.average_daily_income))}
                subtitle={statementMetric === 'DAILY_REVENUE' ? t('reports.activeFilter') : t('reports.averageDailyIncome')}
                icon={<CircleDollarSign size={20} />}
                tone="accent"
              />
            </div>

            <div
              className={`rounded-2xl transition ${
                statementMetric === 'EXPENSE' ? 'ring-2 ring-[#FF385C] rounded-2xl' : ''
              }`}
            >
              <KpiCard
                title={t('reports.totalExpenses')}
                value={formatMoney(Number(monthlyData.total_expenses))}
                subtitle={statementMetric === 'EXPENSE' ? t('reports.activeFilter') : t('reports.operationsSuppliesMaintenance')}
                icon={<TrendingDown size={20} />}
                tone="neutral"
              />
            </div>

            <div
              className={`rounded-2xl transition ${
                statementMetric === 'NET_INCOME' || statementMetric === 'NET_CASHFLOW'
                  ? 'ring-2 ring-[#FF385C] rounded-2xl'
                  : ''
              }`}
            >
              <KpiCard
                title={statementMetric === 'NET_CASHFLOW' ? t('reports.netCashflow') : t('dash.netIncome')}
                value={formatMoney(Number(monthlyData.net_income))}
                subtitle={
                  statementMetric === 'NET_INCOME' || statementMetric === 'NET_CASHFLOW'
                    ? t('reports.activeFilter')
                    : t('reports.grossMinusExpenses')
                }
                icon={<Wallet size={20} />}
                tone={Number(monthlyData.net_income) >= 0 ? 'success' : 'danger'}
              />
            </div>
          </div>

          {/* Secondary Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('reports.averageOccupancyRate')}
              </span>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {monthlyData.occupancy_rate}%
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('reports.roomCapacityUtilization')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('reports.outstandingBalances')}
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatMoney(Number(monthlyData.total_credit))}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('reports.unsettledFolioCredit')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('reports.penaltiesLevied')}
              </span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {formatMoney(Number(monthlyData.total_penalties))}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('reports.automatedPenaltyFees')}</p>
            </div>
          </div>

          {/* Statement Ledger Breakdown Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {t('reports.statementLedger')}
                </h3>
                <p className="text-xs text-neutral-500">
                  {t('reports.journalDesc', { month: monthlyData.month })}
                </p>
              </div>
              <div className="text-xs text-neutral-500">
                {t('reports.filteredColumn')}{' '}
                <span className="font-bold text-[#FF385C]">
                  {statementMetric === 'GROSS_INCOME' && t('reports.grossIncome')}
                  {statementMetric === 'DAILY_REVENUE' && t('reports.dailyRevenue')}
                  {statementMetric === 'NET_INCOME' && t('dash.netIncome')}
                  {statementMetric === 'EXPENSE' && t('reports.expenseLabel')}
                  {statementMetric === 'NET_CASHFLOW' && t('reports.netCashflow')}
                  {statementMetric === 'ALL' && t('reports.allMetrics')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-neutral-200 text-neutral-500 uppercase font-semibold bg-neutral-50/50">
                  <tr>
                    <th className="py-2.5 px-3">{t('reports.dateDay')}</th>
                    <th
                      className={`py-2.5 px-3 ${
                        statementMetric === 'GROSS_INCOME'
                          ? 'bg-rose-50 text-[#FF385C] font-black'
                          : ''
                      }`}
                    >
                      {t('reports.grossIncomeCurrency')}
                    </th>
                    <th
                      className={`py-2.5 px-3 ${
                        statementMetric === 'DAILY_REVENUE'
                          ? 'bg-rose-50 text-[#FF385C] font-black'
                          : ''
                      }`}
                    >
                      {t('reports.dailyRevenueCurrency')}
                    </th>
                    <th
                      className={`py-2.5 px-3 ${
                        statementMetric === 'EXPENSE'
                          ? 'bg-rose-50 text-[#FF385C] font-black'
                          : ''
                      }`}
                    >
                      {t('reports.expensesCurrency')}
                    </th>
                    <th
                      className={`py-2.5 px-3 ${
                        statementMetric === 'NET_INCOME'
                          ? 'bg-rose-50 text-[#FF385C] font-black'
                          : ''
                      }`}
                    >
                      {t('reports.netIncomeCurrency')}
                    </th>
                    <th
                      className={`py-2.5 px-3 ${
                        statementMetric === 'NET_CASHFLOW'
                          ? 'bg-rose-50 text-[#FF385C] font-black'
                          : ''
                      }`}
                    >
                      {t('reports.netCashflowCurrency')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {monthlyData.days && monthlyData.days.length > 0 ? (
                    monthlyData.days.map((d) => (
                      <tr key={d.date} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-neutral-800">
                          {d.day} ({d.date})
                        </td>
                        <td
                          className={`py-2.5 px-3 font-semibold ${
                            statementMetric === 'GROSS_INCOME'
                              ? 'bg-rose-50/50 text-[#FF385C] font-bold'
                              : 'text-emerald-600'
                          }`}
                        >
                          {formatMoney(Number(d.income))}
                        </td>
                        <td
                          className={`py-2.5 px-3 ${
                            statementMetric === 'DAILY_REVENUE'
                              ? 'bg-rose-50/50 text-[#FF385C] font-bold'
                              : 'text-neutral-700'
                          }`}
                        >
                          {formatMoney(Number(d.income))}
                        </td>
                        <td
                          className={`py-2.5 px-3 ${
                            statementMetric === 'EXPENSE'
                              ? 'bg-rose-50/50 text-[#FF385C] font-bold'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(Number(d.expense))}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            statementMetric === 'NET_INCOME'
                              ? 'bg-rose-50/50 text-[#FF385C]'
                              : Number(d.net) >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(Number(d.net))}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            statementMetric === 'NET_CASHFLOW'
                              ? 'bg-rose-50/50 text-[#FF385C]'
                              : Number(d.net) >= 0
                              ? 'text-neutral-900'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(Number(d.net))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                        {t('reports.noActivityPeriod')}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-neutral-200 font-bold text-neutral-900 bg-neutral-50/80">
                  <tr>
                    <td className="py-3 px-3 uppercase text-neutral-600">{t('reports.periodTotal')}</td>
                    <td
                      className={`py-3 px-3 ${
                        statementMetric === 'GROSS_INCOME' ? 'text-[#FF385C]' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(Number(monthlyData.total_income))}
                    </td>
                    <td
                      className={`py-3 px-3 ${
                        statementMetric === 'DAILY_REVENUE' ? 'text-[#FF385C]' : 'text-neutral-800'
                      }`}
                    >
                      {t('reports.avgAmountPerDay', { amount: formatMoney(Number(monthlyData.average_daily_income)) })}
                    </td>
                    <td
                      className={`py-3 px-3 ${
                        statementMetric === 'EXPENSE' ? 'text-[#FF385C]' : 'text-rose-600'
                      }`}
                    >
                      {formatMoney(Number(monthlyData.total_expenses))}
                    </td>
                    <td
                      className={`py-3 px-3 ${
                        statementMetric === 'NET_INCOME'
                          ? 'text-[#FF385C]'
                          : Number(monthlyData.net_income) >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {formatMoney(Number(monthlyData.net_income))}
                    </td>
                    <td
                      className={`py-3 px-3 ${
                        statementMetric === 'NET_CASHFLOW' ? 'text-[#FF385C]' : 'text-neutral-900'
                      }`}
                    >
                      {formatMoney(Number(monthlyData.net_income))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
