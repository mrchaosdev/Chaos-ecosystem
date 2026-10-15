Mình đã có đủ thông tin. Đây là plan đầy đủ:

---

## CHAOS ECOSYSTEM — BUILD PLAN

### Phase 1: ChaosID

**Smart Contracts:**
- `ChaosID.sol` — lưu profile onchain: địa chỉ ví, reputation score, join timestamp
- Reputation tăng tự động khi có giao dịch từ ChaosBoard và ChaosMarket
- Đọc thêm lịch sử từ InvoiceRegistry của ChaosPayment (read-only, không cần modify)

**Frontend:**
- Profile card với Three.js sphere — kích thước/màu thay đổi theo reputation score
- Activity feed đọc events onchain thật
- Shared nav bar dùng cho cả ecosystem

**Animation:**
- Three.js sphere (reputation viz)
- Framer Motion cho activity feed
- GSAP counter cho số liệu

---

### Phase 2: ChaosBoard

**Smart Contracts:**
- `ChaosBoard.sol` — đăng bounty, lock USDC escrow, claim, submit, approve/dispute
- Tích hợp gọi `ChaosID.sol` để cộng reputation khi hoàn thành

**Frontend:**
- Danh sách bounty với filter (Open / In Progress / Done)
- Flow: Post bounty → Lock USDC → Claim → Submit proof → Approve → Giải ngân
- Bottom sheet cho post bounty form (spring animation)

**Animation:**
- React Bits card hover physics
- GSAP đếm tổng USDC đang locked
- Framer Motion status badge flip

---

### Phase 3: ChaosMarket

**Smart Contracts:**
- `ChaosMarket.sol` — list item, buy, escrow, confirm delivery, release/refund
- Tích hợp `ChaosID.sol` cho reputation sau giao dịch

**Frontend:**
- Grid listing sản phẩm/dịch vụ
- Escrow progress bar real-time
- Buy flow với bottom sheet

---

### Stack cụ thể

| Layer | Công cụ |
|---|---|
| Chain | Arc Testnet (Chain ID 5042002) |
| Smart contract | Solidity + Foundry + OpenZeppelin 5.1.0 |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet | wagmi v2 + ConnectKit |
| 3D | React Three Fiber + Three.js |
| Animation | Framer Motion + GSAP |
| UI components | React Bits (card physics) |
| Icons | lucide-react + @web3icons/react |
| Font | Space Grotesk (display) + JetBrains Mono (data) |
| USDC | ERC-20 tại `0x3600...` (Arc Testnet) |

---

### Thứ tự build

```
Phase 1: ChaosID
  → Contract: ChaosID.sol
  → UI: Profile page + 3D sphere + nav bar

Phase 2: ChaosBoard
  → Contract: ChaosBoard.sol (gọi ChaosID)
  → UI: Bounty list + post + claim + approve flow

Phase 3: ChaosMarket
  → Contract: ChaosMarket.sol (gọi ChaosID)
  → UI: Listing grid + buy + escrow flow
```

---

### Lưu ý quan trọng

- Build và test trên **Arc Testnet** trước — không đụng mainnet trong quá trình dev
- Tất cả contract có security review tự động trước khi deploy
- ChaosPayment (mainnet) được đọc dữ liệu read-only — không modify contract đó
- Reputation là onchain thật, không phải mock

---

Bạn muốn bắt đầu Phase 1 (ChaosID) ngay không? Chuyển sang **Build mode** để mình bắt tay vào code.
