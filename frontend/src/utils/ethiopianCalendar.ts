/**
 * Ethiopian (Ge'ez) calendar conversion + Amharic month / weekday names.
 *
 * Confirmed rules (valid for the Gregorian century 1900–2099, which fully
 * covers this app's data window):
 *
 *  - The Ethiopian year has 12 months of exactly 30 days plus a 13th month,
 *    Pagume (ጳጉሜ), of 5 days (6 in a leap year).
 *  - Ethiopian year E is a leap year iff (E + 1) % 4 === 0  (i.e. E % 4 === 3).
 *  - Enkutatash — 1 Meskerem of Ethiopian year E — falls on Gregorian
 *    September 11 of year (E + 7), or September 12 when E % 4 === 0.
 *  - For a Gregorian date: the Ethiopian year is (G − 8) before that year's
 *    Enkutatash, otherwise (G − 7).
 *
 * Verified against known anchors (all pass):
 *   1 Meskerem 2011 = 2018-09-11 · 1 Meskerem 2015 = 2022-09-11 ·
 *   1 Meskerem 2016 = 2023-09-12 (2015 is a 366-day leap year) ·
 *   1 Meskerem 2018 = 2025-09-11 · 1 Meskerem 2019 = 2026-09-11 ·
 *   1 Meskerem 2020 = 2027-09-12 · 2016-01-01 = 22 Tahsas 2008 ·
 *   2000-01-01 = 22 Tahsas 1992 ·
 *   today 2026-10-07 = 27 Meskerem 2019.
 */

export interface EthDateParts {
  /** Ethiopian year (Amete Mihret). */
  year: number
  /** Ethiopian month, 1 (Meskerem) .. 12 (Nehase), 13 (Pagume). */
  month: number
  /** Day of the Ethiopian month, 1..30 (Pagume: 1..6). */
  day: number
}

export const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
] as const

/** Short Amharic month abbreviations (grid headers, compact tables). */
export const ETHIOPIAN_MONTHS_SHORT_AM = [
  'መስ',
  'ጥቅ',
  'ኅዳ',
  'ታኅ',
  'ጥር',
  'የካ',
  'መጋ',
  'ሚያ',
  'ግን',
  'ሰኔ',
  'ሐም',
  'ነሐ',
  'ጳጉ',
] as const

export const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
] as const

/**
 * Amharic weekday names indexed by `Date.getDay()` (0 = Sunday).
 */
export const ETHIOPIAN_WEEKDAYS_AM = [
  'እሑድ',
  'ሰኞ',
  'ማክሰኞ',
  'ረቡዕ',
  'ሐሙስ',
  'አርብ',
  'ቅዳሜ',
] as const

/** English weekday names indexed by `Date.getDay()` (0 = Sunday). */
export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** English weekday short names indexed by `Date.getDay()`. */
export const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Returns true if Ethiopian year `E` is a leap year (Pagume has 6 days). */
export function isEthiopianLeapYear(year: number): boolean {
  return (year + 1) % 4 === 0
}

/** Shift an Ethiopian month by `delta` months (13 months per year, 1-based). */
export function shiftEthiopianMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  let m = month + delta
  let y = year
  while (m < 1) {
    m += 13
    y -= 1
  }
  while (m > 13) {
    m -= 13
    y += 1
  }
  return { year: y, month: m }
}

/** Days in Ethiopian month `month` (1..13) of year `year`. */
export function ethiopianDaysInMonth(year: number, month: number): number {
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5
  return 30
}

/** Serial day number for a proleptic Gregorian date (1990-2200 safe). */
function gregorianSerial(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

/** Serial day number for an Ethiopian date (astronomical, not per-day-loop). */
function ethiopianSerial(year: number, month: number, day: number): number {
  return 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day
}

// Offset tying both serial schemes together: of 1 Meskerem 2011 (= 2018-09-11).
const GREGORIAN_ANCHOR = gregorianSerial(2018, 9, 11)
const ETHIOPIAN_ANCHOR = ethiopianSerial(2011, 1, 1)
const OFFSET = ETHIOPIAN_ANCHOR - GREGORIAN_ANCHOR // signed like a timezone

/** Converts a Gregorian calendar date into Ethiopian calendar date parts. */
export function gregorianToEthiopian(
  year: number,
  month: number,
  day: number
): EthDateParts {
  const serial = gregorianSerial(year, month, day) + OFFSET

  let ethYear = year - 8
  while (serial >= ethiopianSerial(ethYear + 1, 1, 1)) ethYear++
  while (serial < ethiopianSerial(ethYear, 1, 1)) ethYear--

  const dayOfYear = serial - ethiopianSerial(ethYear, 1, 1)
  const ethMonth = Math.floor(dayOfYear / 30) + 1
  const ethDay = (dayOfYear % 30) + 1
  return { year: ethYear, month: ethMonth, day: ethDay }
}

/** Converts a JS Date into Ethiopian calendar date parts (local time). */
export function ethiopianFromDate(date: Date): EthDateParts {
  return gregorianToEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/** Ethiopian date parsed from an ISO string / Date. Returns null if unparseable. */
export function ethiopianFromIso(input: string | Date | null | undefined): EthDateParts | null {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return null
  return ethiopianFromDate(d)
}

/** Converts an Ethiopian calendar date into Gregorian date parts {year, month: 1..12, day}. */
export function ethiopianToGregorian(
  ethYear: number,
  ethMonth: number,
  ethDay: number
): { year: number; month: number; day: number } {
  const serial = ethiopianSerial(ethYear, ethMonth, ethDay) - OFFSET

  let year = 1990
  while (gregorianSerial(year + 1, 1, 1) <= serial) year++
  for (let month = 1; month <= 12; month++) {
    const first = gregorianSerial(year, month, 1)
    const next = month < 12 ? gregorianSerial(year, month + 1, 1) : gregorianSerial(year + 1, 1, 1)
    if (serial < next) {
      return { year, month, day: serial - first + 1 }
    }
  }
  return { year, month: 12, day: 31 }
}

/** Converts an Ethiopian calendar date into a local JS Date at 00:00:00. */
export function ethiopianToDate(ethYear: number, ethMonth: number, ethDay: number): Date {
  const g = ethiopianToGregorian(ethYear, ethMonth, ethDay)
  const d = new Date(g.year, g.month - 1, g.day)
  d.setHours(0, 0, 0, 0)
  return d
}