# Development and deployment

## Requirements

- Bun `1.3.14` (recorded in `.bun-version`)
- Foundry `v1.7.1` only when compiling or testing Solidity (recorded in `.foundry-version`)
- An injected EVM wallet for using the browser app

## Install and run

From the repository root:

```sh
bun install
bun run dev
```

Vite normally serves the app at `http://localhost:5173`. The root app is a single-page application. The `/id/<wallet-address>` path is used for shared profiles; configure the host's SPA fallback to `index.html` if direct navigation to that path returns 404.

The frontend does not require a `.env` file. `src/config.ts` contains the chain configuration and uses an injected wallet connector. Avoid adding secrets to `VITE_*` variables: Vite exposes those values in the browser bundle.

## Useful commands

| Command | Purpose |
| --- | --- |
| `bun run typecheck` | TypeScript check |
| `bun run check` | Runs lint, then typecheck |
| `bun run contracts:build` | Compiles contracts with Foundry |
| `bun run contracts:test` | Runs Foundry tests; this checkout has no project test cases yet |
| `bun run vite build` | Creates the static frontend in `dist/` |
| `bun run deploy:self --help` | Shows the Circle developer-controlled-wallet deploy CLI options |
| `bun run compass:deploy --help` | Shows the Compass deployment CLI options |

The current `lint` script runs Oxlint with `--fix`, so `bun run lint` and `bun run check` may edit files. Review the working tree after running them.

## Deploy the frontend

The frontend is a static Vite SPA. For a Vercel project, use the repository root as the project root, install with `bun install`, build with `bun run vite build`, and publish `dist`. `vercel.json` rewrites every path to `index.html` so `/id/<address>` and `/docs` deep links reach the SPA router; without it Vercel answers 404 for any path but `/`. The production site is [chaos-ecosystem.vercel.app](https://chaos-ecosystem.vercel.app/).

Frontend deployment does not deploy or change contracts. Pushing to the production branch may trigger the hosting provider's production build, depending on the Vercel Git settings.

## Deploy contracts

Contract deployment scripts are separate from the Vite frontend:

- `scripts/self-deploy.ts` uses Circle developer-controlled wallets. It expects a Circle API key (`CIRCLE_DEVELOPER_CONTROLLED_API_KEY`, `CIRCLE_API_KEY`, or `CIRCLE_SCP_API_KEY`) and entity secret (`CIRCLE_ENTITY_SECRET`, `ENTITY_SECRET`, or `CIRCLE_SCP_ENTITY_SECRET`).
- `scripts/compass-deploy.ts` supports fork verification and deployment through Circle/Compass. Its options and required chain arguments are shown by `bun run compass:deploy --help`. The private-key signer additionally reads `DEPLOYER_PRIVATE_KEY`; RPC-proxy settings may be needed when `--rpc` is omitted.
- `contracts/script/DeployCreate2.s.sol` is a Foundry script that expects `FACTORY_ADDRESS`, `CREATE2_SALT`, and `CREATION_CODE` (and optionally `DEPLOY_VALUE`).

These scripts can broadcast real transactions. Use their help output and the code's fork/verify modes before any live deployment. Do not pass keys on command lines, commit `.env`, deploy to mainnet by accident, or reuse the testnet constructor addresses for a different chain.

## Environment file policy

`.env` and `.env.*` are ignored by Git. Keep local credentials in an ignored `.env` file and use a secret manager in deployment automation. Do not add a populated `.env.example`; frontend development does not need one, and deployment credentials must never be copied into examples.
