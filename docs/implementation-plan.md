# Project status and next steps

This file replaces the original Arc Studio build prompt with the current repository state. The contracts and frontend described here are the Arc Testnet export; see [architecture](architecture.md), [contracts](contracts.md), and [security](security.md) for implementation details.

## Current state

- Chaos Ecosystem is a standalone Vite app deployed at [chaos-ecosystem.vercel.app](https://chaos-ecosystem.vercel.app/).
- It contains ChaosID, ChaosBoard, ChaosMarket, and a Bridge page.
- ChaosID, ChaosBoard, and ChaosMarket have Arc Testnet deployments listed in the root README and `contracts/contract-metadata/`.
- ChaosBoard and ChaosMarket include best-effort calls to ChaosID when a payout completes. ChaosID must authorize both contract addresses for those writes to succeed.
- The frontend has links to ChaosPay, and ChaosPay links back. ChaosPay is on Arc Mainnet; this app is on Arc Testnet. There is no shared API, backend account, or cross-chain reputation integration.
- The contracts have no project-specific Foundry tests in this export.

## Recommended order

1. **Make the escrow rules testable.** Add Foundry tests for every state transition, exact token accounting, expiry boundaries, unauthorized calls, failed token transfers, and the reputation callback.
2. **Resolve the contract-level product gaps.** Decide how bounty deadlines treat submitted work; define a real dispute or refund path for Market; make UI wording match the contract; and decide what happens to funds when a party disappears.
3. **Validate the deployed testnet configuration.** Confirm the deployed code, constructor token/ChaosID addresses, current owner, and `authorizedCallers` state from Arc Testnet. Exercise the complete user flows with test USDC.
4. **Decide whether mainnet is appropriate.** Only after the contract design, tests, and an independent security review should a mainnet deployment be considered. Testnet addresses must never be reused as mainnet configuration.
5. **Integrate ChaosPay data as a separate read.** If useful, read ChaosPay's Arc Mainnet InvoiceRegistry in a read-only view. Keep invoice/payment history clearly separated from Arc Testnet reputation unless a reviewed cross-chain model is designed.

## Deliberately not shared today

The apps run and deploy independently. Their current integration is cross-navigation plus the same wallet address when a user connects it to both. They do not share sessions, a database, API keys, contract state, or balances across chains.
