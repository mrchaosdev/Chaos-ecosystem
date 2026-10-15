# Security, privacy, and current limits

## Treat as a testnet prototype

The deployed contracts and UI target Arc Testnet. Do not send real funds or copy these contracts to mainnet without an independent review, tests for every state transition, and a deliberate deployment plan. Testnet USDC has no mainnet value, but escrow mistakes can still permanently lock test tokens.

## Contract trust boundaries

- **ChaosID owner:** can add or remove callers that write reputation. An authorized caller can award arbitrary reputation to any registered wallet by choosing the submitted amount. Reputation is therefore controlled by the owner-managed allowlist and the caller contracts.
- **ChaosBoard poster:** decides whether submitted work is accepted. `submitWork` stores no proof, and the contract has no dispute process. After a non-zero deadline expires, the poster can reclaim the bounty even from `Submitted` state.
- **ChaosMarket seller and buyer:** delivery is only a seller-set status. The contract has no proof or arbitration path. Once the seller marks delivery, the buyer cannot use `reclaimExpiredListing`; the seller can claim after the extra seven-day confirmation window.
- **No emergency recovery:** the contracts do not provide a general owner withdrawal for escrow funds. Funds can remain locked if a state path is not reached (for example, a bounty with no usable expiry and no approval).

The exact contract transitions are documented in [contracts.md](contracts.md). Read the deployed bytecode and current storage on the explorer before interacting; local source or UI state alone does not establish what is deployed.

## Onchain data is public

Bounty titles/descriptions and listing titles/descriptions/categories are written to public chain storage. Wallet addresses, transaction amounts, profile timestamps, reputation and transaction counts are public. Do not put personal information, credentials, private URLs, or confidential work details in these fields.

## Separate networks

Chaos Ecosystem is configured for Arc Testnet. ChaosPay is on Arc Mainnet. They share only navigation and the user's wallet address today. A testnet ChaosID score is not a validated mainnet payment history, and neither app should imply that it is. Any future reputation import from ChaosPay must read the mainnet InvoiceRegistry separately and define how those reads affect (or do not affect) testnet reputation.

## Repository and deployment secrets

The repo ignores `.env`, `.env.*`, generated contract output, traces, and console logs. Keep Circle API keys, entity secrets, RPC-proxy tokens, and deployer private keys outside Git. Rotate a credential if it was ever committed or pasted into public logs. Browser-facing `VITE_*` variables are public after build and must not contain secrets.

## Verification coverage

The current `contracts/test` directory contains only a placeholder; there are no project-specific Foundry tests in this export. Frontend typechecking is not a substitute for contract testing or an audit. Before another deployment, add and run tests for authorization, escrow accounting, expiry boundaries, token failures, reputation callbacks, and reentrancy-sensitive flows.
