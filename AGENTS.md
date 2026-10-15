# Chaos Ecosystem

> Built with Arc Studio — money-powered apps on Arc

## What This App Does

A mini-ecosystem of three onchain apps built on Arc Testnet, interconnected via shared identity and USDC payments.

- **ChaosID** — Onchain identity & reputation. Register once, earn reputation from Board and Market transactions.
- **ChaosBoard** — Bounty board. Post tasks with locked USDC, claim and complete for reward.
- **ChaosMarket** — Marketplace. List services/goods, buy with USDC escrow, confirm delivery to release funds.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, GSAP
- 3D: @react-three/fiber v8, @react-three/drei v9, three.js
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry + OpenZeppelin 5.1.0
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC at 0x3600000000000000000000000000000000000000 (6 decimals)

## Deployed Contracts (Arc Testnet)

| Contract | Address | Explorer |
|---|---|---|
| ChaosID | 0x763cba888b02b29e3bf631fb78de732e439f54a9 | https://explorer.testnet.arc.io/address/0x763cba888b02b29e3bf631fb78de732e439f54a9 |
| ChaosBoard | 0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7 | https://explorer.testnet.arc.io/address/0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7 |
| ChaosMarket | 0x55203bc963be0731c8f013bc1de7f1fbb253b311 | https://explorer.testnet.arc.io/address/0x55203bc963be0731c8f013bc1de7f1fbb253b311 |

## Key Files

- `src/App.tsx` — routing between ID / Board / Market pages
- `src/components/ChaosNav.tsx` — shared nav bar
- `src/components/ChaosIDPage.tsx` — identity + reputation page
- `src/components/ChaosBoardPage.tsx` — bounty board page
- `src/components/ChaosMarketPage.tsx` — marketplace page
- `src/components/ReputationSphere.tsx` — Three.js sphere visualization
- `src/types.ts` — shared TypeScript types

## Contract Integration Notes

- ChaosBoard and ChaosMarket must be authorized callers on ChaosID to call `recordTransaction`.
- Owner of all contracts: Circle platform deployer wallet `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42`
- To authorize Board/Market on ChaosID: call `setAuthorizedCaller(address, true)` from the owner wallet.
- USDC approval required before `postBounty` (Board) and `buyListing` (Market).
