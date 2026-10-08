export type Role = 'ADMIN' | 'RECEPTION' | 'SUPER_ADMIN'

export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CREDIT' | 'OTHER'

export interface User {
  id: number
  full_name: string
  username: string
  email?: string | null
  role: Role
  is_active: boolean
  property_id?: number | null
  property_name?: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: number
  timestamp: string
  details: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface GoogleLoginPayload {
  credential: string
}

export type RoomStatusType = 'AVAILABLE' | 'OCCUPIED' | 'EXPECTED' | 'CLEANING'

export interface Room {
  id: number
  room_number: string
  room_type: string
  price: string
  hourly_price?: string | number | null
  status: RoomStatusType
  available_after?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: number
  full_name: string
  id_number: string
  phone: string
  address: string | null
  nationality: string | null
  id_photo_url?: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: number
  guest_id: number
  room_id: number
  status: string
  expected_arrival: string
  expected_checkout: string
  expected_amount: string
  reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Stay {
  id: number
  reservation_id: number
  guest_id: number
  room_id: number
  check_in_at: string
  expected_checkout: string
  actual_checkout_at: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VoidCheckInRequest {
  reason: string
  notes?: string | null
  room_condition: 'AVAILABLE' | 'CLEANING'
  refund_amount?: number | null
  refund_method?: PaymentMethod | null
  refund_bank_name?: string | null
}


export interface Charge {
  id: number
  stay_id: number
  charge_type: string
  description: string
  amount: string
  quantity: number
  charged_at: string
  created_by: number | null
  created_at: string
}

export interface Payment {
  id: number
  stay_id: number
  amount: string
  currency: string
  payment_method: string
  status: string
  reference: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface FinancialSummary {
  stay_id: number
  total_due: string
  total_paid: string
  balance: string
  currency: string
  payments_by_currency: Record<string, string>
}

export interface Expense {
  id: number
  category: string
  reason?: string | null
  description: string
  amount: string
  payment_method: string
  expense_date: string
  recorded_by: number | null
  created_at: string
}

export interface DailyReport {
  date: string
  todays_income: string
  todays_income_by_currency: Record<string, string>
  todays_expenses: string
  todays_expenses_by_currency: Record<string, string>
  net_income: string
  net_income_by_currency: Record<string, string>
  occupied_rooms: number
  available_rooms: number
  expected_rooms: number
  cleaning_rooms: number
  maintenance_rooms: number
  check_ins_count: number
  check_outs_count: number
  penalties_total: string
  penalties_by_currency: Record<string, string>
  outstanding_credit: string
  outstanding_credit_by_currency: Record<string, string>
}

export interface PaymentMethodIncome {
  method: string
  amount: string
  count: number
  amount_by_currency: Record<string, string>
  percentage_by_currency: Record<string, number>
}

export interface IncomeAnalysisReport {
  period: string
  start_date: string
  end_date: string
  by_method: PaymentMethodIncome[]
  total_income: string
  total_income_by_currency: Record<string, string>
}

export interface ExpenseCategoryItem {
  category: string
  amount: string
  percentage: number
  amount_by_currency: Record<string, string>
  percentage_by_currency: Record<string, number>
}

export interface ExpenseAnalysisReport {
  period: string
  start_date: string
  end_date: string
  by_category: ExpenseCategoryItem[]
  total_expenses: string
  total_expenses_by_currency: Record<string, string>
}

export interface DaySummary {
  day: string
  date: string
  income: string
  income_by_currency: Record<string, string>
  expense: string
  expense_by_currency: Record<string, string>
  net: string
  net_by_currency: Record<string, string>
}

export interface WeeklyReport {
  start_date: string
  end_date: string
  days: DaySummary[]
  total_income: string
  total_income_by_currency: Record<string, string>
  total_expense: string
  total_expense_by_currency: Record<string, string>
  net_income: string
  net_income_by_currency: Record<string, string>
}

export type FinancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface FinanceBucket {
  key: string
  label: string
  income: string
  expenses: string
  net: string
  transaction_count: number
  income_by_currency: Record<string, string>
  expenses_by_currency: Record<string, string>
  net_by_currency: Record<string, string>
}

export interface FinanceSource {
  name: string
  amount: string
  count: number
  amount_by_currency: Record<string, string>
}

export interface FinanceTransaction {
  id: number
  occurred_at: string
  amount: string
  currency: string
  source: string
  guest_name: string
  room_number: string
  reference: string | null
}

export interface FinanceReport {
  period: FinancePeriod
  start_date: string
  end_date: string
  total_income: string
  total_expenses: string
  net_income: string
  buckets: FinanceBucket[]
  by_source: FinanceSource[]
  transactions: FinanceTransaction[]
  transaction_count: number
  transactions_truncated: boolean
  updated_at: string
  income_by_currency: Record<string, string>
  expenses_by_currency: Record<string, string>
  net_by_currency: Record<string, string>
}

export interface MonthlyReport {
  month: string
  total_income: string
  total_income_by_currency: Record<string, string>
  total_expenses: string
  total_expenses_by_currency: Record<string, string>
  net_income: string
  net_income_by_currency: Record<string, string>
  total_guests: number
  average_daily_income: string
  average_daily_income_by_currency: Record<string, string>
  total_credit: string
  total_credit_by_currency: Record<string, string>
  total_penalties: string
  total_penalties_by_currency: Record<string, string>
  occupancy_rate: number
  days?: DaySummary[]
}

export interface SettingsData {
  checkout_deadline_hour: number
  checkout_deadline_minute: number
  late_checkout_penalty: string
  property_name: string
  currency: string
  contact_phone?: string | null
  address?: string | null
}

export interface DailyManifestItem {
  id: string
  activity_type: 'CHECKED_IN' | 'CHECKED_OUT' | 'OCCUPIED' | 'RESERVED'
  guest_id: number
  guest_name: string
  guest_phone: string
  guest_id_number?: string | null
  room_id: number
  room_number: string
  room_type?: string | null
  days_count: number
  amount_paid: string | number
  amount_paid_by_currency: Record<string, string | number>
  expected_amount: string | number
  currency: string
  check_in_date?: string | null
  checkout_date?: string | null
  status: string
  notes?: string | null
}

export interface DailyManifestReport {
  target_date: string
  total_guests_count: number
  checked_in_count: number
  checked_out_count: number
  occupied_count?: number
  reserved_count: number
  total_amount_paid: string | number
  total_amount_paid_by_currency: Record<string, string | number>
  items: DailyManifestItem[]
}

export interface PublicChangePasswordPayload {
  username: string
  current_password: string
  new_password: string
}

export interface AdminOverrideResetPayload {
  target_username: string
  new_password: string
  admin_username: string
  admin_password: string
}

export interface PasswordChangeResponse {
  message: string
  username: string
}

export interface Property {
  id: number
  name: string
  code: string
  contact_phone?: string | null
  address?: string | null
  currency: string
  checkout_deadline_hour: number
  checkout_deadline_minute: number
  late_checkout_penalty: string
  is_active: boolean
  total_users?: number
  total_rooms?: number
  total_reservations?: number
  total_revenue?: string | number
  total_expenses?: string | number
  net_income?: string | number
  created_at: string
  updated_at: string
}

export interface PropertyCreate {
  name: string
  code: string
  contact_phone?: string | null
  address?: string | null
  currency?: string
  checkout_deadline_hour?: number
  checkout_deadline_minute?: number
  late_checkout_penalty?: string
  admin_username: string
  admin_full_name: string
  admin_password: string
  admin_email?: string | null
}

export interface PropertyUpdate {
  name?: string
  contact_phone?: string | null
  address?: string | null
  currency?: string
  checkout_deadline_hour?: number
  checkout_deadline_minute?: number
  late_checkout_penalty?: string
  is_active?: boolean
}

export interface SuperAdminStats {
  total_properties: number
  active_properties: number
  suspended_properties: number
  total_rooms: number
  total_stays: number
  total_reservations?: number
  total_revenue?: string | number
  total_expenses?: string | number
  total_net_income?: string | number
}