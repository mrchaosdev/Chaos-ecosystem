import { useLocale, type Locale } from '@/i18n/LocaleProvider'

const labels: Record<Locale, string> = { en: 'EN', vi: 'VI', zh: '中文', ru: 'RU' }

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale()
  return (
    <label className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-white/35">
      {!compact && <span>{t('lang.name')}</span>}
      <select
        value={locale}
        onChange={event => setLocale(event.target.value as Locale)}
        aria-label={t('lang.name')}
        className="cursor-pointer border border-white/[0.1] bg-[#0a0a0a] px-2 py-1.5 text-white/65 outline-none transition-colors hover:border-[#ff4d00]/50"
      >
        {(Object.keys(labels) as Locale[]).map(code => <option key={code} value={code}>{labels[code]}</option>)}
      </select>
    </label>
  )
}
