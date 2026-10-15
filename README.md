# Chaos Ecosystem

Chaos Ecosystem is a set of Arc Testnet apps built around a shared wallet identity:

- **ChaosID** — onchain profile and reputation.
- **ChaosBoard** — USDC-funded bounties.
- **ChaosMarket** — USDC escrow for listings.
- **Bridge** — Circle CCTP transfers between supported chains.

The apps are a separate project from [ChaosPay](https://chaospayment.xyz/). Both use Arc, but ChaosPay is on Arc Mainnet while this repository's contracts and UI use Arc Testnet. The apps currently share links and wallet addresses only; there is no shared account service or cross-chain reputation feed.

## Run locally

Requirements: [Bun](https://bun.sh/) 1.3.14 (see `.bun-version`). Foundry v1.7.1 is needed only for Solidity commands (see `.foundry-version`).

```sh
bun install
bun run dev
```

Vite prints the local URL, normally `http://localhost:5173`. The frontend has no required `.env` file. Connect an injected EVM wallet and switch it to Arc Testnet (chain ID `5042002`). The app reads and writes against the deployed testnet contracts listed below.

## Check and build

```sh
bun run typecheck
bun run check
bun run contracts:build
bun run contracts:test
```

`bun run check` runs lint and TypeScript checks. The current lint command includes `--fix` and may edit files. `contracts/test` currently contains no project test cases; `contracts:test` only runs Foundry's test runner.

## Deployed testnet contracts

| Contract | Address | Explorer |
| --- | --- | --- |
| ChaosID | `0x763cba888b02b29e3bf631fb78de732e439f54a9` | [Arc Testnet Explorer](https://explorer.testnet.arc.io/address/0x763cba888b02b29e3bf631fb78de732e439f54a9) |
| ChaosBoard | `0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7` | [Arc Testnet Explorer](https://explorer.testnet.arc.io/address/0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7) |
| ChaosMarket | `0x55203bc963be0731c8f013bc1de7f1fbb253b311` | [Arc Testnet Explorer](https://explorer.testnet.arc.io/address/0x55203bc963be0731c8f013bc1de7f1fbb253b311) |

The configured Arc Testnet USDC ERC-20 is `0x3600000000000000000000000000000000000000` (6 decimals). Contract addresses, constructor args, and deployment records are also in `contracts/contract-metadata/`.

## Documentation

- [Architecture and app flows](docs/architecture.md)
- [Contracts and state transitions](docs/contracts.md)
- [Development and deployment](docs/development.md)
- [Security, privacy, and known limitations](docs/security.md)
- [Current status and roadmap](docs/implementation-plan.md)

## Important

These contracts hold testnet USDC and are prototypes. Read the security and contract-flow notes before using them. Do not deploy them to mainnet or send real funds based on the current UI copy.
