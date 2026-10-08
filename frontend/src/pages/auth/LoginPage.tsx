import { useState } from 'react'
import { Eye, EyeOff, HelpCircle, Icon, LockKeyhole, ShieldCheck, UserRound } from '../../components/common/MaterialIcon'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useI18n } from '../../i18n'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import type { Role } from '../../types/api'

export function LoginPage() {
  const { login, user, isAuthenticated, logout } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('ADMIN')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username.trim(), password, role)
      window.location.href = '/dashboard'
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : t('login.unableToSignIn')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] flex flex-col justify-between selection:bg-[#FFF0F2] selection:text-[#FF385C]">
      {/* Top Header */}
      <header className="w-full min-h-18 sm:min-h-20 px-4 sm:px-12 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-faint)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <img src="/roomtracker-logo.png" alt="RoomTracker" className="h-14 w-20 shrink-0 object-contain sm:h-16 sm:w-24" />
          <div>
            <span className="block text-base font-bold text-[var(--ink)] tracking-tight leading-tight">
              Family Guest House
            </span>
            <span className="block text-[11px] font-medium text-[var(--ink-muted)]">
              {t('nav.managementSystem')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-0.5"
            role="group"
            aria-label={t('login.languageSelection')}
          >
            <button
              type="button"
              onClick={() => setLang('am')}
              aria-label={t('lang.amharic')}
              aria-pressed={lang === 'am'}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'am'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              አማ
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-label={t('lang.english')}
              aria-pressed={lang === 'en'}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'en'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toNight')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-2.5 py-2 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={17} />
            <span>{theme === 'dark' ? t('theme.lightMode') : t('theme.nightMode')}</span>
          </button>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            <HelpCircle size={15} />
            <span>{t('login.helpSupport')}</span>
          </button>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center p-6 py-12 sm:py-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-7 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
            {isAuthenticated && user ? (
              /* Already Signed In View */
              <div className="text-center space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF9EB] text-[#008A05] text-xs font-semibold">
                  <ShieldCheck size={13} />
                  <span>{t('login.currentlySignedIn')}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                    {t('login.welcomeBackName', { name: user.full_name })}
                  </h1>
                  <p className="text-xs text-[var(--ink-muted)] mt-1.5">
                    {t('login.signedInAs', {
                      role: user.role === 'SUPER_ADMIN'
                        ? t('role.superAdmin')
                        : user.role === 'ADMIN'
                          ? t('role.administrator')
                          : t('role.receptionist'),
                    })}{' '}
                    (@{user.username}).
                  </p>
                </div>
                <div className="space-y-2.5 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full h-11 text-xs font-semibold rounded-xl"
                    onClick={() => { window.location.href = '/dashboard' }}
                  >
                    {t('login.continueToDashboard')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-11 text-xs font-semibold rounded-xl text-[#C13515] border-[var(--line)] hover:bg-[#FFF7F5]"
                    onClick={() => logout()}
                  >
                    {t('login.signOutSwitchUser')}
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal Sign In Form */
              <>
                {/* Greeting & Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F2] text-[#FF385C] text-xs font-semibold mb-3">
                    <ShieldCheck size={13} />
                    <span>{t('login.staffPortal')}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
                    {t('login.welcomeBack')}
                  </h1>
                  <p className="text-sm text-[var(--ink-muted)] mt-1.5 leading-relaxed">
                    {t('login.signInPrompt')}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="role" className="block text-xs font-semibold text-[var(--ink)]">
                      {t('login.roleLabel')}
                    </label>
                    <select
                      id="role"
                      required
                      value={role}
                      onChange={(event) => setRole(event.target.value as Role)}
                      className="h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                    >
                      <option value="ADMIN">{t('role.administrator')}</option>
                      <option value="SUPER_ADMIN">{t('role.superAdmin')}</option>
                      <option value="RECEPTION">{t('role.receptionist')}</option>
                    </select>
                  </div>
                  {/* Username field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="block text-xs font-semibold text-[var(--ink)]"
                    >
                      {t('login.usernameOrPhone')}
                    </label>
                    <div className="relative flex items-center h-12 rounded-xl border border-[var(--line)] hover:border-[var(--line-strong)] focus-within:border-[var(--ink)] focus-within:ring-1 focus-within:ring-[var(--ink)] bg-[var(--surface)] px-3.5 transition-all">
                      <UserRound size={17} className="text-[var(--ink-muted)] shrink-0 mr-2.5" />
                      <input
                        id="username"
                        required
                        autoFocus
                        autoComplete="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('login.usernameOrPhone')}
                        className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-[var(--ink)]"
                    >
                      {t('login.password')}
                    </label>
                    <div className="relative flex items-center h-12 rounded-xl border border-[var(--line)] hover:border-[var(--line-strong)] focus-within:border-[var(--ink)] focus-within:ring-1 focus-within:ring-[var(--ink)] bg-[var(--surface)] px-3.5 transition-all">
                      <LockKeyhole size={17} className="text-[var(--ink-muted)] shrink-0 mr-2.5" />
                      <input
                        id="password"
                        required
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.enterPassword')}
                        className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] focus:outline-none transition-colors cursor-pointer"
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-[var(--danger-tint)] border border-[var(--line)] text-xs text-[var(--danger)] leading-relaxed flex items-start gap-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] mt-1.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    className="w-full h-12 text-sm font-semibold rounded-xl mt-2"
                  >
                    {submitting ? t('login.signingIn') : t('login.signInToGH')}
                  </Button>
                </form>
              </>
            )}

            {/* Note */}
            <div className="mt-8 pt-6 border-t border-[var(--line-faint)] text-center">
              <span className="text-xs text-[var(--ink-muted)] flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-soft)]" />
                {t('login.authorizedOnly')}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 text-center text-xs text-[var(--ink-muted)] border-t border-[var(--line-faint)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Family Guest House. {t('login.allRightsReserved')}</span>
          <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)]">
            <span>{t('login.privacy')}</span>
            <span>·</span>
            <span>{t('login.terms')}</span>
            <span>·</span>
            <span>{t('login.managementSystem')}</span>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('login.needHelp')}
        description={t('login.helpDescription')}
      >
        <div className="space-y-4 text-xs text-[var(--ink-muted)] leading-relaxed">
          <p>
            {t('login.helpCredentials')}
          </p>
          <p>
            <strong className="text-[var(--ink)]">{t('login.forgotPassword')}</strong>
            <br />
            {t('login.forgotHint')}
          </p>
          <div className="pt-2 border-t border-[var(--line-faint)]">
            <p className="text-[11px] text-[var(--ink-faint)]">
              {t('login.frontDeskInternal')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}