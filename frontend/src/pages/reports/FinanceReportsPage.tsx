import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from '../../components/common/MaterialIcon'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { getProperties } from '../../api/superAdmin'
import { getApiError } from '../../api/client'
import { getFinanceReport } from '../../api/reports'
import type { FinanceBucket, FinancePeriod, FinanceReport, Property } from '../../types/api'
import { useI18n } from '../../i18n'

const EXCHANGE_RATE_KEY = 'guest_house_etb_per_usd'
const TIME_ZONE = 'Africa/Addis_Ababa'

function localToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function bucketKeyForTimestamp(occurredAt: string, period: FinancePeriod): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(occurredAt))
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ''
  const year = part('year')
  const month = part('month')
  const day = part('day')
  if (period === 'daily') return String(Number(part('hour')))
  if (period === 'weekly') return `${year}-${month}-${day}`
  if (period === 'monthly') return String(Math.ceil(Number(day) / 7))
  return String(Number(month))
}

function money(value: number, currency: 'ETB' | 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function paymentMethodName(method: string, t: (key: string) => string): string {
  const keys: Record<string, string> = {
    CASH: 'pm.cash',
    TELEBIRR: 'pm.telebirr',
    CBE_BIRR: 'pm.cbeBirr',
    BANK_TRANSFER: 'pm.bankTransfer',
    CREDIT: 'pm.credit',
    OTHER: 'pm.other',
  }
  return keys[method] ? t(keys[method]) : method
}

export function FinanceReportsPage() {
  const { user } = useAuth()
  const { t, formatDate, formatMoney } = useI18n()
  const userRole = user?.role
  const periodLabels: Record<FinancePeriod, string> = {
    daily: 'reports.tab.daily',
    weekly: 'reports.tab.weekly',
    monthly: 'reports.tab.monthly',
    yearly: 'fin.yearly',
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriod] = useState<FinancePeriod>('daily')
  const [selectedDate, setSelectedDate] = useState(localToday)
  const [selectedMonth, setSelectedMonth] = useState(() => localToday().slice(0, 7))
  const [selectedYear, setSelectedYear] = useState(() => Number(localToday().slice(0, 4)))
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(() => {
    const value = searchParams.get('property_id')
    return value ? Number(value) : null
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [report, setReport] = useState<FinanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB')
  const [exchangeRate, setExchangeRate] = useState(() => localStorage.getItem(EXCHANGE_RATE_KEY) ?? '')
  const [displayMode, setDisplayMode] = useState<'table' | 'chart'>('table')
  const [chartStyle, setChartStyle] = useState<'bars' | 'line'>('bars')
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const propertyId = userRole === 'SUPER_ADMIN' ? selectedPropertyId : undefined
      const params = {
        period,
        ...(period === 'daily' || period === 'weekly' ? { target_date: selectedDate } : {}),
        ...(period === 'monthly'
          ? {
              year: Number(selectedMonth.slice(0, 4)),
              month: Number(selectedMonth.slice(5, 7)),
            }
          : {}),
        ...(period === 'yearly' ? { year: selectedYear } : {}),
        property_id: propertyId,
      }
      setReport(await getFinanceReport(params))
    } catch (requestError) {
      setError(getApiError(requestError, t('fin.errorLoad')))
    } finally {
      setLoading(false)
    }
  }, [period, selectedDate, selectedMonth, selectedYear, selectedPropertyId, userRole, t])

  useEffect(() => {
    void fetchReport()
  }, [fetchReport])

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') return
    getProperties()
      .then(setProperties)
      .catch((requestError: unknown) => {
        setError(getApiError(requestError, t('fin.errorProperties')))
      })
  }, [userRole, t])

  useEffect(() => {
    const intervalId = window.setInterval(() => void fetchReport(), 30_000)
    return () => window.clearInterval(intervalId)
  }, [fetchReport])

  const rate = Number(exchangeRate)
  const convert = useCallback(
    (amount: string | number) => {
      const value = Number(amount)
      return currency === 'ETB' ? formatMoney(value) : rate > 0 ? money(value / rate, 'USD') : t('fin.setRate')
    },
    [currency, rate, formatMoney, t]
  )

  const visibleTransactions = useMemo(() => {
    if (!report) return []
    return report.transactions.filter((transaction) => {
      const matchesBucket =
        selectedBucket === null || bucketKeyForTimestamp(transaction.occurred_at, report.period) === selectedBucket
      const matchesSource = selectedSource === null || transaction.source === selectedSource
      return matchesBucket && matchesSource
    })
  }, [report, selectedBucket, selectedSource])

  const analysis = useMemo(() => {
    const buckets = report?.buckets ?? []
    if (buckets.length === 0 || Number(report?.total_income ?? 0) === 0) return null
    const sorted = [...buckets].sort((left, right) => Number(left.income) - Number(right.income))
    return {
      high: sorted[sorted.length - 1],
      low: sorted[0],
      average: Number(report?.total_income ?? 0) / buckets.length,
    }
  }, [report])

  function choosePeriod(nextPeriod: FinancePeriod) {
    setPeriod(nextPeriod)
    setSelectedBucket(null)
    setSelectedSource(null)
  }

  function chooseProperty(value: string) {
    const propertyId = value ? Number(value) : null
    setSelectedPropertyId(propertyId)
    setSearchParams(propertyId ? { property_id: String(propertyId) } : {})
  }

  function updateExchangeRate(value: string) {
    setExchangeRate(value)
    const nextRate = Number(value)
    if (nextRate > 0 && Number.isFinite(nextRate)) {
      localStorage.setItem(EXCHANGE_RATE_KEY, value)
    } else {
      localStorage.removeItem(EXCHANGE_RATE_KEY)
    }
  }

  const maximumBucketAmount = Math.max(
    1,
    ...(report?.buckets.flatMap((bucket) => [Number(bucket.income), Number(bucket.expenses)]) ?? [])
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('fin.pageTitle')}
        subtitle={t('fin.pageSubtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {userRole === 'SUPER_ADMIN' && (
              <select
                aria-label={t('common.property')}
                value={selectedPropertyId ?? ''}
                onChange={(event) => chooseProperty(event.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">{t('fin.allProperties')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => void fetchReport()}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
              {t('common.refresh')}
            </button>
          </div>
        }
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
        <div className="flex flex-wrap gap-1.5" aria-label={t('fin.reportPeriod')}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={period === item}
              onClick={() => choosePeriod(item)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
                period === item
                  ? 'border-emerald-700 bg-emerald-700/10 text-emerald-800'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t(periodLabels[item])}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(period === 'daily' || period === 'weekly') && (
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              <Calendar size={16} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label={t('fin.selectDate')}
                className="bg-transparent outline-none"
              />
            </label>
          )}
          {period === 'monthly' && (
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              <Calendar size={16} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                aria-label={t('fin.selectMonth')}
                className="bg-transparent outline-none"
              />
            </label>
          )}
          {period === 'yearly' && (
            <label className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              <span className="sr-only">{t('fin.selectYear')}</span>
              <input
                type="number"
                min={2000}
                max={2200}
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="w-20 bg-transparent outline-none"
              />
            </label>
          )}
          <select
            aria-label={t('fin.displayCurrency')}
            value={currency}
            onChange={(event) => setCurrency(event.target.value as 'ETB' | 'USD')}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold"
          >
            <option value="ETB">ETB</option>
            <option value="USD">USD</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <span className="whitespace-nowrap">ETB / USD</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={exchangeRate}
              onChange={(event) => updateExchangeRate(event.target.value)}
              placeholder={t('fin.setRate')}
              aria-label={t('fin.exchangeRate')}
              className="w-24 bg-transparent outline-none"
            />
          </label>
        </div>
      </section>

      {currency === 'USD' && !(rate > 0) && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('fin.exchangeRateHelper')}
        </p>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {loading && !report && <p className="py-12 text-center text-sm text-neutral-500">{t('fin.loadingReport')}</p>}

      {report && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t('reports.tab.income'), value: report.total_income, icon: TrendingUp, tone: 'text-emerald-700' },
              { label: t('reports.tab.expenses'), value: report.total_expenses, icon: TrendingDown, tone: 'text-rose-700' },
              { label: t('fin.net'), value: report.net_income, icon: Wallet, tone: 'text-neutral-900' },
              {
                label: t('fin.transactions'),
                value: report.transaction_count.toString(),
                icon: Clock,
                tone: 'text-neutral-900',
                count: true,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <article key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>{item.label}</span>
                    <Icon size={18} className={item.tone} />
                  </div>
                  <p className={`mt-2 text-2xl font-bold ${item.tone}`}>
                    {item.count ? item.value : convert(item.value)}
                  </p>
                  {item.label === t('fin.transactions') && report.transactions_truncated && (
                    <p className="mt-1 text-xs text-neutral-500">{t('fin.latest500')}</p>
                  )}
                </article>
              )
            })}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">{t('fin.incomeProgress')}</h2>
                <p className="text-xs text-neutral-500">{t('fin.incomeProgressSub')}</p>
              </div>
              <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
                {(['table', 'chart'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={displayMode === mode}
                    onClick={() => setDisplayMode(mode)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${
                      displayMode === mode ? 'bg-emerald-700 text-white' : 'text-neutral-600'
                    }`}
                  >
                    {mode === 'chart' ? <BarChart3 size={15} className="mr-1 inline" /> : null}
                    {mode === 'chart' ? t('fin.chart') : t('fin.table')}
                  </button>
                ))}
                {displayMode === 'chart' && (
                  <button
                    type="button"
                    onClick={() => setChartStyle(chartStyle === 'bars' ? 'line' : 'bars')}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-600 hover:bg-white"
                  >
                    {chartStyle === 'bars' ? t('fin.line') : t('fin.bars')}
                  </button>
                )}
              </div>
            </div>

            {displayMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">{t('fin.period')}</th>
                      <th className="px-3 py-2 text-right">{t('reports.tab.income')}</th>
                      <th className="px-3 py-2 text-right">{t('reports.tab.expenses')}</th>
                      <th className="px-3 py-2 text-right">{t('fin.net')}</th>
                      <th className="px-3 py-2 text-right">{t('fin.payments')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {report.buckets.map((bucket) => (
                      <BucketTableRow
                        key={bucket.key}
                        bucket={bucket}
                        selected={selectedBucket === bucket.key}
                        onSelect={() => setSelectedBucket(selectedBucket === bucket.key ? null : bucket.key)}
                        formatMoney={convert}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-neutral-600">
                  <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />{t('reports.tab.income')}</span>
                  <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />{t('reports.tab.expenses')}</span>
                </div>
                {chartStyle === 'bars' ? (
                  <div className="flex h-64 items-end gap-1 overflow-x-auto border-b border-l border-neutral-200 px-2 pt-3">
                    {report.buckets.map((bucket) => (
                      <button
                        key={bucket.key}
                        type="button"
                        title={t('fin.bucketTooltip', { label: bucket.label, income: convert(bucket.income), expenses: convert(bucket.expenses) })}
                        aria-label={t('fin.showTransactions', { label: bucket.label })}
                        onClick={() => setSelectedBucket(selectedBucket === bucket.key ? null : bucket.key)}
                        className={`group flex h-full min-w-7 flex-1 flex-col justify-end rounded-t-md px-0.5 hover:bg-emerald-50 ${
                          selectedBucket === bucket.key ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <span className="flex h-[86%] items-end justify-center gap-0.5">
                          <i
                            className="w-2/5 rounded-t-sm bg-emerald-600 group-hover:bg-emerald-700"
                            style={{ height: `${Math.max(1, (Number(bucket.income) / maximumBucketAmount) * 100)}%` }}
                          />
                          <i
                            className="w-2/5 rounded-t-sm bg-rose-400"
                            style={{ height: `${Math.max(1, (Number(bucket.expenses) / maximumBucketAmount) * 100)}%` }}
                          />
                        </span>
                        <span className="mt-2 w-full truncate text-center text-[10px] text-neutral-500">{bucket.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 1000 260" role="img" aria-label={t('fin.trendLine')} className="h-64 min-w-[700px] w-full border-b border-l border-neutral-200">
                      {[0, 1, 2, 3, 4].map((line) => (
                        <line key={line} x1="0" x2="1000" y1={20 + line * 55} y2={20 + line * 55} stroke="#e5e7eb" strokeDasharray="4 5" />
                      ))}
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="4"
                        points={trendPoints(report.buckets, 'income', maximumBucketAmount)}
                      />
                      <polyline
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth="3"
                        points={trendPoints(report.buckets, 'expenses', maximumBucketAmount)}
                      />
                      {report.buckets.map((bucket, index) => (
                        <circle
                          key={bucket.key}
                          cx={pointX(index, report.buckets.length)}
                          cy={pointY(Number(bucket.income), maximumBucketAmount)}
                          r="5"
                          fill="#059669"
                        >
                          <title>{t('fin.bucketValue', { label: bucket.label, value: convert(bucket.income) })}</title>
                        </circle>
                      ))}
                    </svg>
                    <div className="mt-2 flex overflow-x-auto">
                      {report.buckets.map((bucket) => (
                        <button
                          key={bucket.key}
                          type="button"
                          onClick={() => setSelectedBucket(selectedBucket === bucket.key ? null : bucket.key)}
                          className="min-w-10 flex-1 truncate text-center text-[10px] text-neutral-500 hover:text-emerald-800"
                        >
                          {bucket.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{t('fin.paymentSources')}</h2>
                  <p className="text-xs text-neutral-500">{t('fin.paymentSourcesSub')}</p>
                </div>
                {(selectedBucket || selectedSource) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBucket(null)
                      setSelectedSource(null)
                    }}
                    className="text-xs font-semibold text-emerald-800 underline"
                  >
                    {t('fin.clearFilters')}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {report.by_source.filter((source) => Number(source.amount) > 0).map((source) => {
                  const share = Number(report.total_income) > 0 ? (Number(source.amount) / Number(report.total_income)) * 100 : 0
                  return (
                    <button
                      key={source.name}
                      type="button"
                      onClick={() => setSelectedSource(selectedSource === source.name ? null : source.name)}
                      className={`w-full rounded-xl p-2 text-left ${selectedSource === source.name ? 'bg-emerald-50' : 'hover:bg-neutral-50'}`}
                    >
                      <span className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-neutral-800">{paymentMethodName(source.name, t)}</span>
                        <span className="font-bold text-neutral-900">{convert(source.amount)}</span>
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-neutral-100">
                        <i className="block h-full rounded-full bg-emerald-600" style={{ width: `${share}%` }} />
                      </span>
                      <span className="mt-1 block text-xs text-neutral-500">{t('fin.paymentsShare', { count: source.count, share: share.toFixed(1) })}</span>
                    </button>
                  )
                })}
                {report.by_source.every((source) => Number(source.amount) === 0) && (
                  <p className="py-4 text-sm text-neutral-500">{t('fin.noSuccessfulPayments')}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <h2 className="text-base font-bold text-neutral-900">{t('fin.periodAnalysis')}</h2>
              {analysis ? (
                <dl className="mt-4 space-y-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t('fin.highestIncome')}</dt>
                    <dd className="text-right font-semibold text-emerald-800">{analysis.high.label} · {convert(analysis.high.income)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t('fin.lowestIncome')}</dt>
                    <dd className="text-right font-semibold">{analysis.low.label} · {convert(analysis.low.income)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t('fin.averagePerInterval')}</dt>
                    <dd className="text-right font-semibold">{convert(analysis.average)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-neutral-100 pt-3">
                    <dt className="text-neutral-500">{t('fin.netForPeriod')}</dt>
                    <dd className="text-right font-bold">{convert(report.net_income)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">{t('fin.noIncomeRecorded')}</p>
              )}
              <p className="mt-5 text-xs text-neutral-500">
                {t('fin.refreshed', { time: formatDate(report.updated_at, 'datetime') })}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 p-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">{t('fin.paymentTimeline')}</h2>
                <p className="text-xs text-neutral-500">{t('fin.paymentTimelineSub')}</p>
              </div>
              <span className="text-xs text-neutral-500">{t('fin.shownOf', { shown: visibleTransactions.length, total: report.transaction_count })}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">{t('fin.timeEthiopia')}</th>
                    <th className="px-4 py-3">{t('fin.guestRoom')}</th>
                    <th className="px-4 py-3">{t('fin.incomeSource')}</th>
                    <th className="px-4 py-3">{t('common.reference')}</th>
                    <th className="px-4 py-3 text-right">{t('common.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {visibleTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatDate(transaction.occurred_at, 'datetime')}</td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-neutral-900">{transaction.guest_name}</span>
                        <span className="text-xs text-neutral-500">{t('common.room')} {transaction.room_number}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{paymentMethodName(transaction.source, t)} · {t('fin.stayPayment')}</td>
                      <td className="px-4 py-3 text-neutral-500">{transaction.reference || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-800">{convert(transaction.amount)}</td>
                    </tr>
                  ))}
                  {visibleTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                        {t('fin.noPaymentsMatch')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {report.transactions_truncated && (
              <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
                {t('fin.latest500Full')}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function BucketTableRow({
  bucket,
  selected,
  onSelect,
  formatMoney,
}: {
  bucket: FinanceBucket
  selected: boolean
  onSelect: () => void
  formatMoney: (amount: string | number) => string
}) {
  return (
    <tr className={selected ? 'bg-emerald-50' : 'hover:bg-neutral-50'}>
      <td className="px-3 py-2.5">
        <button type="button" onClick={onSelect} className="font-semibold text-neutral-800 hover:text-emerald-800">
          {bucket.label}
        </button>
      </td>
      <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">{formatMoney(bucket.income)}</td>
      <td className="px-3 py-2.5 text-right text-rose-700">{formatMoney(bucket.expenses)}</td>
      <td className="px-3 py-2.5 text-right font-bold text-neutral-900">{formatMoney(bucket.net)}</td>
      <td className="px-3 py-2.5 text-right text-neutral-600">{bucket.transaction_count}</td>
    </tr>
  )
}

function pointX(index: number, length: number): number {
  return length <= 1 ? 500 : 20 + (index / (length - 1)) * 960
}

function pointY(value: number, maximum: number): number {
  return 240 - (value / maximum) * 220
}

function trendPoints(buckets: FinanceBucket[], metric: 'income' | 'expenses', maximum: number): string {
  return buckets
    .map((bucket, index) => `${pointX(index, buckets.length)},${pointY(Number(bucket[metric]), maximum)}`)
    .join(' ')
}
