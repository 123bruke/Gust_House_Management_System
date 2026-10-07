import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ETHIOPIAN_MONTHS_AM,
  ETHIOPIAN_MONTHS_SHORT_AM,
  ETHIOPIAN_WEEKDAYS_AM,
  WEEKDAYS_EN,
  WEEKDAYS_SHORT_EN,
  ethiopianFromDate,
} from '../utils/ethiopianCalendar'
import { translations, type Lang, type Params } from './translations'

/**
 * Global Amharic / English localization + Ethiopian calendar formatting.
 *
 *  - Default language is Amharic ('am'); users can switch to English ('en').
 *  - When Amharic is active the whole UI renders in Amharic and every date is
 *    shown on the Ethiopian calendar (Amharic month/weekday names, Ethiopian
 *    year). When English is active the UI renders in English and dates use the
 *    Gregorian calendar.
 *  - The choice is persisted in localStorage under `gh-language` (mirrors the
 *    `gh-theme` pre-paint pattern in index.html so `document.documentElement.lang`
 *    is correct before first paint).
 */

const STORAGE_KEY = 'gh-language'

export type DateFormat =
  | 'short'
  | 'medium'
  | 'long'
  | 'monthYear'
  | 'monthDay'
  | 'weekdayShort'
  | 'weekdayLong'
  | 'datetime'
  | 'header'

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  /** Translate a key from the Amharic / English dictionary. */
  t: (key: string, params?: Params) => string
  /** Calendar-aware, localized date formatting. */
  formatDate: (input: Date | string | number | null | undefined, format?: DateFormat) => string
  /** Number formatting with thousands separators (Western digits always). */
  formatNumber: (value: number | string | null | undefined) => string
  /** Currency label for the active language: ብር (Amharic) / ETB (English). */
  currency: string
  /** Currency amount: "1,250 ብር" / "ETB 1,250". */
  formatMoney: (value: number | string | null | undefined) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'am'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'am' ? stored : 'am'
  } catch {
    return 'am'
  }
}

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null
  const d = input instanceof Date ? input : new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function prettyTime(date: Date): string {
  const h24 = date.getHours()
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${period}`
}

function amharicDate(date: Date, format: DateFormat): string {
  const { year, month, day } = ethiopianFromDate(date)
  const longMonth = ETHIOPIAN_MONTHS_AM[month - 1]
  const shortMonth = ETHIOPIAN_MONTHS_SHORT_AM[month - 1]
  const weekday = ETHIOPIAN_WEEKDAYS_AM[date.getDay()]

  switch (format) {
    case 'monthYear':
      return `${longMonth} ${year}`
    case 'monthDay':
      return `${shortMonth} ${day}`
    case 'weekdayShort':
    case 'weekdayLong':
      return weekday
    case 'header':
      return `${weekday}, ${shortMonth} ${day}, ${year}`
    case 'long':
      return `${weekday}, ${day} ${longMonth} ${year}`
    case 'datetime':
      return `${day} ${longMonth} ${year} — ${prettyTime(date)}`
    case 'medium':
    case 'short':
    default:
      return `${day} ${longMonth} ${year}`
  }
}

function englishDate(locale: string, date: Date, format: DateFormat): string {
  const intl = (
    opts: Intl.DateTimeFormatOptions,
    otherLocale = 'en-US'
  ) => new Intl.DateTimeFormat(locale === 'en' ? otherLocale : 'en-US', opts).format(date)

  switch (format) {
    case 'monthYear':
      return intl({ month: 'long', year: 'numeric' })
    case 'monthDay':
      return intl({ month: 'short', day: 'numeric' })
    case 'weekdayShort':
      return intl({ weekday: 'short' })
    case 'weekdayLong':
      return intl({ weekday: 'long' })
    case 'header':
      return intl({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    case 'long':
      return intl({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    case 'datetime':
      return `${intl({ year: 'numeric', month: 'short', day: 'numeric' })}, ${prettyTime(date)}`
    case 'medium':
      return intl({ year: 'numeric', month: 'short', day: 'numeric' })
    case 'short':
    default:
      return intl({ month: 'short', day: 'numeric', year: 'numeric' })
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore storage errors
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'en' ? 'am' : 'en')), [])

  const t = useCallback(
    (key: string, params?: Params): string => {
      const entry = translations[key]
      let text: string
      if (!entry) {
        text = key
      } else if (lang === 'am') {
        text = entry.am || entry.en || key
      } else {
        text = entry.en || entry.am || key
      }
      if (!params) return text
      return text.replace(/\{(\w+)\}/g, (match, name: string) =>
        params[name] !== undefined ? String(params[name]) : match
      )
    },
    [lang]
  )

  const formatDate = useCallback(
    (input: Date | string | number | null | undefined, format: DateFormat = 'short'): string => {
      const date = toDate(input)
      if (!date) return ''
      if (lang === 'am') return amharicDate(date, format)
      return englishDate('en', date, format)
    },
    [lang]
  )

  const formatNumber = useCallback((value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return ''
    const num = typeof value === 'number' ? value : Number(value)
    if (isNaN(num)) return ''
    return num.toLocaleString('en-US')
  }, [])

  const currency = lang === 'am' ? 'ብር' : 'ETB'

  const formatMoney = useCallback(
    (value: number | string | null | undefined): string => {
      const formatted = formatNumber(value)
      return formatedMoney(lang, formatted)
    },
    [lang, formatNumber]
  )

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      formatDate,
      formatNumber,
      currency,
      formatMoney,
    }),
    [lang, setLang, toggleLang, t, formatDate, formatNumber, currency, formatMoney]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function formatedMoney(lang: Lang, formatted: string): string {
  return lang === 'am' ? `${formatted} ብር` : `ETB ${formatted}`
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within a LanguageProvider')
  }
  return ctx
}

export function useWeekdayLabels(lang: Lang, kind: 'short' | 'long'): string[] {
  return lang === 'am'
    ? [...ETHIOPIAN_WEEKDAYS_AM]
    : kind === 'short'
      ? [...WEEKDAYS_SHORT_EN]
      : [...WEEKDAYS_EN]
}