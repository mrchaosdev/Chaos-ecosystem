# Chaos Ecosystem

A set of interconnected apps for Arc Testnet: ChaosID identity and reputation, ChaosBoard bounties, and ChaosMarket escrow listings. This source was exported from Arc Studio.

## Stack

- React 18, Vite, TypeScript, Tailwind CSS
- wagmi, viem, ConnectKit
- Solidity 0.8.28, Foundry, OpenZeppelin 5.1.0
- Arc Testnet (chain ID 5042002), USDC (6 decimals)

## Local development

Install dependencies with Bun (`bun install`), then run `bun run dev`. Contract commands use Foundry: `forge build` and `forge test`.

The deployed addresses and current contract ownership are documented in [AGENTS.md](AGENTS.md). Contracts are testnet prototypes; review their escrow and reputation rules before any mainnet use.
