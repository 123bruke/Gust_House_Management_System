import type { CSSProperties, ReactElement } from 'react'

/**
 * Google Material Symbols (Rounded) icon wrapper.
 * Renders a ligature-based icon glyph from the Material Symbols font.
 */

export interface IconProps {
  name: string
  size?: number
  className?: string
  filled?: boolean
  style?: CSSProperties
}

export function Icon({ name, size = 18, className = '', filled = false, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      role="img"
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'GRAD' 0`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export type IconComponent = (props: Omit<IconProps, 'name'>) => ReactElement

function make(name: string) {
  return function MaterialGlyph(props: Omit<IconProps, 'name'>) {
    return <Icon name={name} {...props} />
  }
}

/* ------------------------------------------------------------------ */
/* Named aliases — drop-in replacements for the lucide-react icons     */
/* previously used throughout the app (same JSX API: size, className). */
/* ------------------------------------------------------------------ */

export const AlertCircle = make('error_outline')
export const AlertTriangle = make('warning')
export const ArrowRight = make('arrow_forward')
export const ArrowUpRight = make('arrow_outward')
export const Ban = make('block')
export const Banknote = make('payments')
export const BarChart3 = make('bar_chart')
export const BedDouble = make('bed')
export const Building = make('cottage')
export const Building2 = make('apartment')
export const Calendar = make('calendar_month')
export const CalendarCheck = make('event_available')
export const CalendarDays = make('calendar_month')
export const CalendarPlus = make('calendar_add_on')
export const Check = make('check')
export const CheckCircle2 = make('check_circle')
export const ChevronDown = make('expand_more')
export const ChevronLeft = make('chevron_left')
export const ChevronRight = make('chevron_right')
export const CircleDollarSign = make('currency_exchange')
export const ClipboardList = make('list_alt')
export const Clock = make('schedule')
export const Coins = make('paid')
export const CreditCard = make('credit_card')
export const DoorClosed = make('door_front')
export const DoorOpen = make('meeting_room')
export const Download = make('download')
export const Eye = make('visibility')
export const EyeOff = make('visibility_off')
export const FileSpreadsheet = make('table_chart')
export const Globe = make('language')
export const HelpCircle = make('help_outline')
export const History = make('history')
export const Info = make('info')
export const KeyRound = make('key')
export const Layers = make('layers')
export const LayoutDashboard = make('dashboard')
export const Loader2 = make('progress_activity')
export const Lock = make('lock')
export const LockKeyhole = make('lock')
export const LogIn = make('login')
export const LogOut = make('logout')
export const MapPin = make('location_on')
export const Maximize2 = make('open_in_full')
export const Menu = make('menu')
export const Pencil = make('edit')
export const Phone = make('phone')
export const Plus = make('add')
export const Power = make('power_settings_new')
export const Printer = make('print')
export const Receipt = make('receipt_long')
export const ReceiptText = make('receipt_long')
export const RefreshCw = make('refresh')
export const Save = make('save')
export const Search = make('search')
export const Settings = make('settings')
export const ShieldAlert = make('gpp_maybe')
export const ShieldCheck = make('verified_user')
export const Smartphone = make('smartphone')
export const Sparkles = make('auto_awesome')
export const SprayCan = make('cleaning_services')
export const TrendingDown = make('trending_down')
export const TrendingUp = make('trending_up')
export const Trash2 = make('delete')
export const Undo2 = make('undo')
export const Upload = make('upload')
export const User = make('person')
export const UserCheck = make('how_to_reg')
export const UserCog = make('manage_accounts')
export const UserPlus = make('person_add')
export const UserRound = make('person')
export const Users = make('group')
export const Wallet = make('wallet')
export const X = make('close')
export const XCircle = make('cancel')