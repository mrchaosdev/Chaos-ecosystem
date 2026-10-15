const sections = [
  { id: 'start', label: 'Bắt đầu' },
  { id: 'apps', label: 'Các ứng dụng' },
  { id: 'flows', label: 'Luồng sử dụng' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'limits', label: 'Lưu ý & giới hạn' },
]

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
  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-5 pb-20 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-white/[0.08] pb-8 sm:pb-12">
          <p className="font-mono text-[9px] tracking-[0.22em] text-[#ff4d00]">CHAOS// ECOSYSTEM · DOCUMENTATION</p>
          <h1 className="mt-4 font-mono text-3xl font-black tracking-tight sm:text-5xl">Dùng Chaos Ecosystem</h1>
          <p className="mt-4 max-w-2xl font-mono text-xs leading-7 text-white/45">
            Hướng dẫn kết nối ví, khám phá các ứng dụng và hiểu rõ những gì đang chạy onchain trên Arc Testnet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] tracking-wider">
            <span className="border border-[#ff4d00]/30 px-3 py-2 text-[#ff4d00]">ARC TESTNET · CHAIN ID 5042002</span>
            <a href="https://chaos-ecosystem.vercel.app/" className="border border-white/10 px-3 py-2 text-white/50 hover:text-white">MỞ ECOSYSTEM ↗</a>
            <a href="https://chaospayment.xyz/" target="_blank" rel="noreferrer" className="border border-white/10 px-3 py-2 text-white/50 hover:text-white">CHAOS PAY ↗</a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:h-fit lg:pt-8">
            <p className="mb-3 font-mono text-[9px] tracking-[0.18em] text-white/25">TRÊN TRANG</p>
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {sections.map(section => <a key={section.id} href={`#${section.id}`} className="border border-white/[0.06] px-3 py-2 font-mono text-[10px] text-white/45 transition-colors hover:border-[#ff4d00]/30 hover:text-white lg:border-0 lg:px-0">{section.label}</a>)}
            </nav>
          </aside>

          <div>
            <DocSection id="start" eyebrow="01 / QUICK START" title="Bắt đầu trong vài bước">
              <ol className="space-y-3">
                <Step n="01">Mở Ecosystem bằng ví EVM như MetaMask hoặc ví trình duyệt tương thích.</Step>
                <Step n="02">Chuyển mạng sang Arc Testnet (chain ID 5042002). Dùng nút Faucet trong app để nhận token test nếu faucet khả dụng.</Step>
                <Step n="03">Kết nối ví. ChaosID, Board và Market đều dùng cùng địa chỉ ví trên testnet.</Step>
                <Step n="04">Trước khi đăng bounty hoặc mua listing, cấp quyền USDC (approve) cho contract; kiểm tra kỹ số tiền và giao dịch trong ví.</Step>
              </ol>
              <p className="border-l-2 border-[#ff4d00]/50 pl-4 text-white/40">Token tại đây là token testnet, không phải USDC có giá trị trên mainnet.</p>
            </DocSection>

            <DocSection id="apps" eyebrow="02 / THE ECOSYSTEM" title="Mỗi app làm gì?">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['CHAOS ID', 'Tạo một hồ sơ cho ví, xem điểm reputation, số giao dịch và volume được ghi nhận onchain.'],
                  ['CHAOS BOARD', 'Đăng bounty bằng USDC testnet. Người khác nhận việc, gửi trạng thái hoàn tất và poster quyết định duyệt trả thưởng.'],
                  ['CHAOS MARKET', 'Tạo listing và mua bán qua luồng escrow USDC. Listing chỉ được đưa lên; tiền chỉ vào escrow khi người mua mua.'],
                  ['BRIDGE', 'Giao diện chuyển tài sản giữa các chain được hỗ trợ qua Circle CCTP. Kiểm tra chain, token và phí trước khi gửi.'],
                ].map(([name, description]) => <article key={name} className="border border-white/[0.07] bg-white/[0.015] p-4"><h3 className="font-mono text-[10px] font-bold tracking-[0.15em] text-white">{name}</h3><p className="mt-2 text-[11px] leading-6 text-white/45">{description}</p></article>)}
              </div>
              <p>ChaosPay là sản phẩm riêng trên Arc Mainnet. Hiện hai app chỉ chia sẻ điều hướng và địa chỉ ví; tài khoản, lịch sử thanh toán và reputation chưa đồng bộ.</p>
            </DocSection>

            <DocSection id="flows" eyebrow="03 / TRANSACTION FLOWS" title="Luồng giao dịch chính">
              <h3 className="text-[11px] font-bold text-white">ChaosBoard</h3>
              <p>Poster approve USDC → đăng bounty (reward được chuyển vào contract) → ví khác claim → claimer đánh dấu submitted → poster approve để trả reward. Poster có thể hủy bounty còn Open.</p>
              <h3 className="pt-2 text-[11px] font-bold text-white">ChaosMarket</h3>
              <p>Seller tạo listing → buyer approve USDC và mua → seller đánh dấu delivered → buyer xác nhận để trả tiền. Nếu seller chưa đánh dấu delivered, buyer có thể reclaim sau 7 ngày. Nếu seller đã đánh dấu delivered, seller có thể claim sau hạn xác nhận bổ sung 7 ngày.</p>
              <h3 className="pt-2 text-[11px] font-bold text-white">ChaosID reputation</h3>
              <p>Hồ sơ có thể đăng ký một lần cho mỗi ví. Board/Market chỉ cập nhật reputation khi địa chỉ contract được ChaosID cho phép; giao dịch chính vẫn có thể hoàn tất nếu cập nhật reputation thất bại.</p>
            </DocSection>

            <DocSection id="contracts" eyebrow="04 / ONCHAIN REFERENCES" title="Địa chỉ contract">
              <p>Tất cả địa chỉ dưới đây thuộc Arc Testnet. Bấm địa chỉ để mở Arc Testnet Explorer.</p>
              <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {contracts.map(([name, address]) => <div key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-white/65">{name}</span><a className="break-all text-[10px] text-[#ff8152] hover:text-white" href={`https://explorer.testnet.arc.io/address/${address}`} target="_blank" rel="noreferrer">{address} ↗</a></div>)}
              </div>
            </DocSection>

            <DocSection id="limits" eyebrow="05 / READ BEFORE USING" title="Giới hạn hiện tại">
              <ul className="list-disc space-y-2 pl-5">
                <li>Đây là prototype trên testnet. Đừng gửi tiền thật hoặc dùng các contract này như sản phẩm mainnet đã được kiểm toán.</li>
                <li>ChaosBoard không lưu bằng chứng công việc và không có tranh chấp. Poster có thể reclaim bounty sau deadline, kể cả khi đã có trạng thái submitted.</li>
                <li>ChaosMarket không có bằng chứng giao hàng hay bên phân xử. Sau khi seller đánh dấu delivered, buyer không thể dùng luồng refund.</li>
                <li>Reputation là bộ đếm đơn giản. Caller được owner cho phép có thể ghi điểm và volume; đây không phải đánh giá độc lập về độ tin cậy.</li>
                <li>Dữ liệu ghi lên chain là công khai. Không đưa thông tin cá nhân, bí mật, thông tin đăng nhập hoặc nội dung riêng tư vào profile, bounty hay listing.</li>
              </ul>
              <p className="pt-2"><a href="https://github.com/mrchaosdev/Chaos-ecosystem" target="_blank" rel="noreferrer" className="text-[#ff8152] hover:text-white">Mã nguồn và tài liệu kỹ thuật trên GitHub ↗</a></p>
            </DocSection>
          </div>
        </div>
        <footer className="pt-8 font-mono text-[9px] tracking-wider text-white/20">CHAOS// ECOSYSTEM · ARC TESTNET · DOCS</footer>
      </div>
    </main>
  )
}
