import { useState } from 'react'
import { Building2, User, AlertCircle } from '../common/MaterialIcon'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { createProperty } from '../../api/superAdmin'
import { getApiError } from '../../api/client'
import { useI18n } from '../../i18n'

interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [address, setAddress] = useState('')
  const [currency, setCurrency] = useState('ETB')
  const [deadlineHour, setDeadlineHour] = useState(4)
  const [deadlineMinute, setDeadlineMinute] = useState(0)
  const [penalty, setPenalty] = useState('600')

  const [adminUsername, setAdminUsername] = useState('')
  const [adminFullName, setAdminFullName] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setName('')
    setCode('')
    setContactPhone('')
    setAddress('')
    setCurrency('ETB')
    setDeadlineHour(4)
    setDeadlineMinute(0)
    setPenalty('600')
    setAdminUsername('')
    setAdminFullName('')
    setAdminPassword('')
    setAdminEmail('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('propertyForm.nameRequired'))
      return
    }
    if (!code.trim()) {
      setError(t('propertyForm.codeRequired'))
      return
    }
    if (!adminUsername.trim() || !adminFullName.trim() || !adminPassword.trim()) {
      setError(t('propertyForm.adminRequired'))
      return
    }
    if (adminPassword.length < 6) {
      setError(t('propertyForm.adminPasswordMin'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await createProperty({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contact_phone: contactPhone.trim() || null,
        address: address.trim() || null,
        currency: currency.trim().toUpperCase() || 'ETB',
        checkout_deadline_hour: Number(deadlineHour),
        checkout_deadline_minute: Number(deadlineMinute),
        late_checkout_penalty: penalty,
        admin_username: adminUsername.replace(/\D/g, ''),
        admin_full_name: adminFullName.trim(),
        admin_password: adminPassword,
        admin_email: adminEmail.trim() || null,
      })

      resetForm()
      onSuccess()
      onClose()
    } catch (err) {
      setError(getApiError(err, t('propertyForm.onboardFailed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          resetForm()
          onClose()
        }
      }}
      title={t('propertyForm.title')}
      description={t('propertyForm.description')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Property Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
            <Building2 size={16} className="text-[#FF385C]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {t('propertyForm.info')}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Input
                label={t('propertyForm.name')}
                placeholder={t('propertyForm.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.code')}
                placeholder={t('propertyForm.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                required
                disabled={loading}
              />
              <p className="text-[11px] text-neutral-400 mt-1">{t('propertyForm.codeHelper')}</p>
            </div>
            <div>
              <Input
                label={t('propertyForm.contactPhone')}
                placeholder="+251 911 234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.address')}
                placeholder={t('propertyForm.addressPlaceholder')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={`${t('settings.currencyCode')} *`}
                placeholder="ETB"
                value={currency}
                maxLength={10}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.latePenalty')}
                type="number"
                min="0"
                step="1"
                placeholder="600"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Initial Property Admin */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
            <User size={16} className="text-[#FF385C]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {t('propertyForm.adminSection')}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Input
                label={t('propertyForm.adminFullName')}
                placeholder={t('propertyForm.adminFullNamePlaceholder')}
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.adminPhone')}
                placeholder="e.g. 0908296773"
                value={adminUsername}
                type="tel"
                onChange={(e) => setAdminUsername(e.target.value.replace(/[^0-9+]/g, ''))}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.tempPassword')}
                type="password"
                placeholder={t('propertyForm.tempPasswordPlaceholder')}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                label={t('propertyForm.adminEmail')}
                type="email"
                placeholder="admin@property.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onClose()
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
            <Building2 size={16} />
            <span>{t('propertyForm.onboard')}</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
