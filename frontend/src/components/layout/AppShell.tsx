import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  KeyRound,
  Users,
  Wallet,
  X,
  Building2,
  Icon,
} from '../common/MaterialIcon'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useI18n } from '../../i18n'
import { Avatar } from '../common/Avatar'
import { ChangePasswordModal } from '../modals/ChangePasswordModal'

interface NavItem {
  labelKey: string
  to: string
  icon: typeof LayoutDashboard
  roles: string[]
  badge?: string
}

interface NavSection {
  titleKey: string
  roles: string[]
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    titleKey: 'nav.platform',
    roles: ['SUPER_ADMIN'],
    items: [
      { labelKey: 'nav.properties', to: '/super-admin/properties', icon: Building2, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    titleKey: 'nav.operations',
    roles: ['ADMIN', 'RECEPTION', 'SUPER_ADMIN'],
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTION', 'SUPER_ADMIN'] },
      { labelKey: 'nav.reservations', to: '/reservations', icon: CalendarDays, roles: ['ADMIN', 'RECEPTION', 'SUPER_ADMIN'] },
      { labelKey: 'nav.guests', to: '/guests', icon: Users, roles: ['ADMIN', 'RECEPTION', 'SUPER_ADMIN'] },
      { labelKey: 'nav.expenses', to: '/expenses', icon: Wallet, roles: ['ADMIN', 'RECEPTION', 'SUPER_ADMIN'] },
    ],
  },
  {
    titleKey: 'nav.management',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    items: [
      { labelKey: 'nav.rooms', to: '/rooms', icon: BedDouble, roles: ['ADMIN', 'SUPER_ADMIN'] },
      { labelKey: 'nav.stays', to: '/stays', icon: ClipboardList, roles: ['ADMIN', 'SUPER_ADMIN'] },
      { labelKey: 'nav.reports', to: '/reports', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
      { labelKey: 'nav.settings', to: '/settings', icon: Settings, roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
]

export function AppShell() {
  const { user, logout, updateAuthenticatedUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, toggleLang, formatDate } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const profileTone =
    user?.role === 'ADMIN'
      ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/50'
      : user?.role === 'SUPER_ADMIN'
        ? 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60'
        : 'border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/50'
  const profileTextTone =
    user?.role === 'ADMIN'
      ? 'text-emerald-800 dark:text-emerald-200'
      : user?.role === 'SUPER_ADMIN'
        ? 'text-slate-800 dark:text-slate-100'
        : 'text-blue-800 dark:text-blue-200'
  const translatedRole =
    user?.role === 'SUPER_ADMIN'
      ? t('role.superAdmin')
      : user?.role === 'ADMIN'
        ? t('role.administrator')
        : t('role.receptionDesk')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter sections and items based on user role
  const userRole = user?.role ?? 'RECEPTION'
  const visibleSections = navSections
    .filter((section) => section.roles.includes(userRole))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(userRole)),
    }))

  // Derive current page title from path
  const currentItem = navSections
    .flatMap((s) => s.items)
    .find((item) => item.to === location.pathname)

  return (
    <div className="min-h-screen flex bg-white text-[#222222]">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#DDDDDD] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-[88px] px-4 flex items-center justify-between border-b border-[#F0F0F0]">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-white dark:bg-black">
                <img src="/roomtracker-logo.png" alt="RoomTracker" className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0">
                <span className="block text-base font-bold text-[#222222] tracking-tight leading-tight">
                  {user?.role === 'SUPER_ADMIN' ? t('nav.platformConsole') : (user?.property_name || 'Family Guest House')}
                </span>
                <span className="block text-[11px] font-medium text-[#717171]">
                  {user?.role === 'SUPER_ADMIN' ? t('nav.multiTenant') : t('nav.managementSystem')}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="lg:hidden p-1.5 text-[#717171] hover:text-[#222222] rounded-lg hover:bg-[#F7F7F7]"
              onClick={() => setMobileOpen(false)}
              aria-label={t('nav.closeMenu')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {visibleSections.map((section) => (
              <div key={section.titleKey} className="space-y-1">
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#717171]">
                  {t(section.titleKey)}
                </div>
                {section.items.map((item) => {
                  const IconComp = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-[#FFF0F2] text-[#222222] font-semibold shadow-[inset_0_0_0_1px_rgba(255,56,92,0.15)]'
                            : 'text-[#555555] hover:bg-[#F7F7F7] hover:text-[#222222]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <IconComp
                              size={18}
                              filled={isActive}
                              className={`transition-colors ${
                                isActive
                                  ? 'text-[#FF385C]'
                                  : 'text-[#717171] group-hover:text-[#222222]'
                              }`}
                            />
                            <span>{t(item.labelKey)}</span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF385C]" />
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#F0F0F0] space-y-3">
            <div className="px-3 py-2 rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0) || (user?.role === 'SUPER_ADMIN' ? 'S' : user?.role === 'ADMIN' ? 'A' : 'R')}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#222222] truncate">
                  {user?.full_name || (user?.role === 'SUPER_ADMIN' ? t('role.platformSuperAdmin') : user?.role === 'ADMIN' ? t('role.administrator') : t('role.receptionStaff'))}
                </span>
                <span className="block text-[11px] text-[#717171] truncate">
                  {user?.role === 'SUPER_ADMIN' ? t('role.platformSuperAdmin') : user?.role === 'ADMIN' ? t('role.administrator') : t('role.receptionDesk')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#717171] hover:text-[#C13515] hover:bg-[#FFF7F5] transition-colors duration-150"
            >
              <LogOut size={16} />
              <span>{t('nav.signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Top Bar */}
        <header className="sticky top-0 z-30 h-[64px] sm:h-[72px] bg-white/90 backdrop-blur-md border-b border-[#DDDDDD] px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Page context */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="lg:hidden p-2 text-[#222222] rounded-xl hover:bg-[#F7F7F7] border border-[#DDDDDD]"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.openMenu')}
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#717171]">
              <span className="font-bold text-sm text-[#222222]">
                {currentItem ? t(currentItem.labelKey) : 'Family Guest House'}
              </span>
              <span className="text-[#CCCCCC]">/</span>
              <span>{formatDate(new Date(), 'header')}</span>
            </div>
          </div>

          {/* Right: Language + Theme toggle + User Avatar Dropdown */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLang}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#EEEEEE] text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] transition cursor-pointer"
              aria-label={lang === 'am' ? t('lang.switchToEnglish') : t('lang.switchToAmharic')}
              title={lang === 'am' ? t('lang.switchToEnglish') : t('lang.switchToAmharic')}
            >
              <Icon name={lang === 'am' ? 'language' : 'translate'} size={18} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#EEEEEE] text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] transition cursor-pointer"
              aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toNight')}
              title={theme === 'dark' ? t('theme.toLight') : t('theme.toNight')}
            >
              {theme === 'dark' ? <Icon name="light_mode" size={18} /> : <Icon name="dark_mode" size={18} />}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left transition hover:bg-[var(--surface-2)] ${profileTone}`}
                aria-label={t('nav.userMenu')}
              >
                <Avatar
                  name={user?.full_name || t('common.staffUser')}
                  role={user?.role}
                  size="sm"
                />
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-semibold text-[#222222] leading-tight truncate max-w-[140px]">
                    {user?.full_name}
                  </span>
                  <span className={`block text-[11px] leading-tight capitalize ${profileTextTone}`}>
                    {translatedRole}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-[#717171] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 animate-fade-in rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-2 text-xs shadow-[0_10px_35px_rgba(0,0,0,0.1)]">
                  <div className={`mx-2 rounded-xl border px-3 py-2 ${profileTone}`}>
                    <span className="block font-bold text-xs text-[#222222] truncate">
                      {user?.full_name}
                    </span>
                    <span className={`block text-[11px] ${profileTextTone}`}>
                      {user?.username} · {translatedRole}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#222222] transition hover:bg-[#F7F7F7]"
                  >
                    {lang === 'am' ? <Icon name="language" size={14} className="text-[#717171]" /> : <Icon name="translate" size={14} className="text-[#717171]" />}
                    <span>{lang === 'am' ? t('lang.switchToEnglish') : t('lang.switchToAmharic')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#222222] transition hover:bg-[#F7F7F7]"
                  >
                    {theme === 'dark' ? <Icon name="light_mode" size={14} className="text-[#717171]" /> : <Icon name="dark_mode" size={14} className="text-[#717171]" />}
                    <span>{theme === 'dark' ? t('theme.lightMode') : t('theme.nightMode')}</span>
                  </button>
                  <div className="border-t border-[#F0F0F0] my-1" />
                  {user?.role === 'ADMIN' && (
                    <>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-[#222222] hover:bg-[#F7F7F7] transition"
                      >
                        <Settings size={14} className="text-[#717171]" />
                        <span>{t('settings.guestHouseSettings')}</span>
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(true)
                      setUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#222222] transition hover:bg-[#F7F7F7]"
                  >
                    <KeyRound size={14} className="text-[#717171]" />
                    <span>{t('settings.changePassword')}</span>
                  </button>
                  <div className="border-t border-[#F0F0F0] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      window.location.href = '/login'
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-[#C13515] hover:bg-[#FFF7F5] font-semibold text-left transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
      {passwordModalOpen && user && (
        <ChangePasswordModal
          user={user}
          onClose={() => setPasswordModalOpen(false)}
          onSaved={updateAuthenticatedUser}
        />
      )}
    </div>
  )
}