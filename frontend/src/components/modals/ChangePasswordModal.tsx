import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, X } from '../common/MaterialIcon'
import { changeOwnAccount, resetUserPassword } from '../../api/users'
import { getApiError } from '../../api/client'
import { Button } from '../common/Button'
import { useI18n } from '../../i18n'
import type { User } from '../../types/api'

interface ChangePasswordModalProps {
  user: User
  adminReset?: boolean
  onClose: () => void
  onSaved?: (user: User) => void
}

export function ChangePasswordModal({ user, adminReset = false, onClose, onSaved }: ChangePasswordModalProps) {
  const { t } = useI18n()
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [username, setUsername] = useState(user.username)
  const [showPasswords, setShowPasswords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setUsername(user.username)
  }, [user.id, user.username])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const passwordChanged = newPassword.length > 0
    const usernameChanged = username.trim() !== user.username
    if (!adminReset && !passwordChanged && !usernameChanged) {
      setError(t('password.noChanges'))
      return
    }
    if (passwordChanged && newPassword !== confirmation) {
      setError(t('password.mismatch'))
      return
    }
    setSaving(true)
    try {
      const updated = adminReset
        ? await resetUserPassword(user.id, newPassword)
        : await changeOwnAccount({
            ...(usernameChanged ? { username: username.trim() } : {}),
            ...(passwordChanged ? { new_password: newPassword } : {}),
          })
      onSaved?.(updated)
      onClose()
    } catch (requestError) {
      setError(getApiError(requestError, t('password.changeFailed')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0F2] text-[#FF385C]"><KeyRound size={19} /></div>
            <div>
              <h2 id="password-dialog-title" className="text-lg font-bold text-[#222222]">{adminReset ? t('password.setStaffTitle') : t('password.changeTitle')}</h2>
              <p className="text-xs text-[#717171]">{adminReset ? t('password.setStaffDesc', { name: user.full_name }) : t('password.accountHint')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#717171] hover:bg-[#F7F7F7]" aria-label={t('password.closeDialog')}><X size={18} /></button>
        </div>

        <div className="mt-6 space-y-4">
          {!adminReset && (
            <label className="block text-sm font-medium text-[#222222]">
              {t('password.username')}
              <input
                required
                minLength={7}
                maxLength={16}
                type="tel"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#DDDDDD] px-3.5 py-2.5 focus:border-[#FF385C] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20"
                autoComplete="username"
              />
            </label>
          )}
          <label className="block text-sm font-medium text-[#222222]">
            {t('password.new')}
            <input required={adminReset} minLength={6} maxLength={128} type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#DDDDDD] px-3.5 py-2.5 focus:border-[#FF385C] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20" autoComplete="new-password" />
          </label>
          <label className="block text-sm font-medium text-[#222222]">
            {t('password.confirm')}
            <input required={adminReset || newPassword.length > 0} minLength={6} maxLength={128} type={showPasswords ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#DDDDDD] px-3.5 py-2.5 focus:border-[#FF385C] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20" autoComplete="new-password" />
          </label>
          <button type="button" onClick={() => setShowPasswords((visible) => !visible)} className="flex items-center gap-2 text-xs font-medium text-[#717171] hover:text-[#222222]">
            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPasswords ? t('password.hide') : t('password.show')}
          </button>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={saving}>{adminReset ? t('password.set') : t('password.update')}</Button>
        </div>
      </form>
    </div>
  )
}
