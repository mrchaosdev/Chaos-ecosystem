import { useLocale } from '@/i18n/LocaleProvider'

const contracts = [
  ['ChaosID', '0x763cba888b02b29e3bf631fb78de732e439f54a9'],
  ['ChaosBoard', '0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7'],
  ['ChaosMarket', '0x55203bc963be0731c8f013bc1de7f1fbb253b311'],
  ['Arc Testnet USDC', '0x3600000000000000000000000000000000000000'],
]

function DocSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-white/[0.07] py-10 sm:py-14">
      <p className="font-mono text-[9px] tracking-[0.2em] text-[#ff4d00]">{eyebrow}</p>
      <h2 className="mt-3 font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      <div className="mt-5 space-y-4 font-mono text-xs leading-7 text-white/55">{children}</div>
    </section>
  )
}
function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return <li className="flex gap-3"><span className="shrink-0 text-[#ff4d00]">{n}</span><span>{children}</span></li>
}

export function DocsPage() {
  const { t, locale } = useLocale()
  const sections = [
    { id: 'start', key: 'docs.start' }, { id: 'apps', key: 'docs.apps' },
    { id: 'flows', key: 'docs.flows' }, { id: 'contracts', key: 'docs.contracts' },
    { id: 'limits', key: 'docs.limits' },
  ]
  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-5 pb-20 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-white/[0.08] pb-8 sm:pb-12">
          <p className="font-mono text-[9px] tracking-[0.22em] text-[#ff4d00]">{t('docs.kicker')}</p>
          <h1 className="mt-4 font-mono text-3xl font-black tracking-tight sm:text-5xl">{t('docs.title')}</h1>
          <p className="mt-4 max-w-2xl font-mono text-xs leading-7 text-white/45">
            {t('docs.intro')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] tracking-wider">
            <span className="border border-[#ff4d00]/30 px-3 py-2 text-[#ff4d00]">ARC TESTNET · CHAIN ID 5042002</span>
            <a href="https://chaos-ecosystem.vercel.app/" className="border border-white/10 px-3 py-2 text-white/50 hover:text-white">{t('docs.open')}</a>
            <a href={`https://chaospayment.xyz/${locale}/`} target="_blank" rel="noreferrer" className="border border-white/10 px-3 py-2 text-white/50 hover:text-white">{t('nav.pay')} ↗</a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:h-fit lg:pt-8">
            <p className="mb-3 font-mono text-[9px] tracking-[0.18em] text-white/25">{t('docs.toc')}</p>
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {sections.map(section => <a key={section.id} href={`#${section.id}`} className="border border-white/[0.06] px-3 py-2 font-mono text-[10px] text-white/45 transition-colors hover:border-[#ff4d00]/30 hover:text-white lg:border-0 lg:px-0">{t(section.key)}</a>)}
            </nav>
          </aside>

          <div>
            <DocSection id="start" eyebrow="01 / QUICK START" title={t('docs.startTitle')}>
              <ol className="space-y-3">
                <Step n="01">{t('docs.step1')}</Step><Step n="02">{t('docs.step2')}</Step>
                <Step n="03">{t('docs.step3')}</Step><Step n="04">{t('docs.step4')}</Step>
              </ol>
              <p className="border-l-2 border-[#ff4d00]/50 pl-4 text-white/40">{t('docs.testOnly')}</p>
            </DocSection>

            <DocSection id="apps" eyebrow="02 / THE ECOSYSTEM" title={t('docs.appsTitle')}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['CHAOS ID', t('docs.id')], ['CHAOS BOARD', t('docs.board')],
                  ['CHAOS MARKET', t('docs.market')], ['BRIDGE', t('docs.bridge')],
                ].map(([name, description]) => <article key={name} className="border border-white/[0.07] bg-white/[0.015] p-4"><h3 className="font-mono text-[10px] font-bold tracking-[0.15em] text-white">{name}</h3><p className="mt-2 text-[11px] leading-6 text-white/45">{description}</p></article>)}
              </div>
              <p>{t('docs.paySeparate')}</p>
            </DocSection>

            <DocSection id="flows" eyebrow="03 / TRANSACTION FLOWS" title={t('docs.flowsTitle')}>
              <h3 className="text-[11px] font-bold text-white">ChaosBoard</h3><p>{t('docs.boardFlow')}</p>
              <h3 className="pt-2 text-[11px] font-bold text-white">ChaosMarket</h3><p>{t('docs.marketFlow')}</p>
              <h3 className="pt-2 text-[11px] font-bold text-white">ChaosID reputation</h3><p>{t('docs.idFlow')}</p>
            </DocSection>

            <DocSection id="contracts" eyebrow="04 / ONCHAIN REFERENCES" title={t('docs.contractsTitle')}>
              <p>{t('docs.contractsBody')}</p>
              <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {contracts.map(([name, address]) => <div key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-white/65">{name}</span><a className="break-all text-[10px] text-[#ff8152] hover:text-white" href={`https://explorer.testnet.arc.io/address/${address}`} target="_blank" rel="noreferrer">{address} ↗</a></div>)}
              </div>
            </DocSection>

            <DocSection id="limits" eyebrow="05 / READ BEFORE USING" title={t('docs.limitsTitle')}>
              <ul className="list-disc space-y-2 pl-5">
                <li>{t('docs.limit1')}</li><li>{t('docs.limit2')}</li><li>{t('docs.limit3')}</li><li>{t('docs.limit4')}</li><li>{t('docs.limit5')}</li>
              </ul>
              <p className="pt-2"><a href="https://github.com/mrchaosdev/Chaos-ecosystem" target="_blank" rel="noreferrer" className="text-[#ff8152] hover:text-white">{t('docs.github')}</a></p>
            </DocSection>
          </div>
        </div>
        <footer className="pt-8 font-mono text-[9px] tracking-wider text-white/20">{t('docs.footer')}</footer>
      </div>
    </main>
  )
}
