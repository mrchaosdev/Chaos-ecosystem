# Architecture

## Shape of the project

Chaos Ecosystem is a client-side Vite application plus three Solidity contracts. There is no application server, user database, or shared API. The browser connects to an injected EVM wallet through wagmi and ConnectKit, reads Arc Testnet state through viem, and asks the wallet to sign writes.

```text
Browser (React + Vite)
  ├─ ChaosID UI ─────── ChaosID.sol
  ├─ ChaosBoard UI ──── ChaosBoard.sol ── USDC
  ├─ ChaosMarket UI ─── ChaosMarket.sol ─ USDC
  └─ Bridge UI ──────── Circle CCTP
```

ChaosBoard and ChaosMarket call ChaosID after successful payouts. Those calls are best-effort: a failed reputation update does not revert the payout. See [Contracts](contracts.md) for the exact transitions and caveats.

## App navigation

`src/App.tsx` holds the current page in React state and renders `ChaosNav` plus one page component. The pages are `id`, `board`, `market`, and `bridge`. A profile URL matching `/id/0x<40 hex characters>` opens the shared-address profile view.

Main UI files:

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Page state and shared-address route detection |
| `src/config.ts` | wagmi chains, injected wallet connector, RPC transports |
| `src/components/ChaosNav.tsx` | App tabs, wallet connect, link to ChaosPay |
| `src/components/ChaosIDPage.tsx` | Profile registration, reputation, activity reads |
| `src/components/ChaosBoardPage.tsx` | Bounty list and bounty actions |
| `src/components/ChaosMarketPage.tsx` | Listing list and escrow actions |
| `src/components/BridgePage.tsx` | Bridge page entry point |
| `src/components/AdminPanel.tsx` | ChaosID owner controls and caller authorization |
| `src/onchain-facts.ts` | Chain, explorer, and token facts used by tracing helpers |

## Network and wallet

The application is configured for Arc Testnet (chain ID `5042002`) and Ethereum Mainnet (for ENS resolution). The onchain features in these pages target Arc Testnet. The connector is `injected()`, so the browser needs an injected wallet such as MetaMask. A wallet address is the identity key; connecting the same wallet to ChaosPay does not create a shared login session.

The Arc Testnet USDC ERC-20 address is `0x3600000000000000000000000000000000000000`, with 6 decimals. Arc also exposes USDC as its native gas asset; the app's ERC-20 approval and escrow flows use the 6-decimal token interface.

## Relationship to ChaosPay

ChaosPay is a separately deployed app on Arc Mainnet at [chaospayment.xyz](https://chaospayment.xyz/). Chaos Ecosystem runs on Arc Testnet. The two apps currently link to each other and can recognize the same public wallet address, but they do not share a backend, account, session, or reputation state. Mainnet invoice history is not yet read into ChaosID.

Do not treat an address's testnet reputation as proof of mainnet payment history. A future read-only invoice feed would need an explicit, verified mainnet registry configuration and a clear separation between observed payment history and the testnet reputation score.
