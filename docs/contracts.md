# Contracts and user flows

All amounts below are raw USDC units on Arc Testnet (6 decimals). The deployed addresses are listed in the repository README and in `contracts/contract-metadata/`.

## ChaosID

`contracts/ChaosID.sol` stores one profile per wallet:

- `reputationScore`
- `txCount`
- `volumeUsdc`
- `joinedAt`
- `exists`

Anyone can call `register()` once for their own wallet. Profile reads are public. `recordTransaction(user, amount)` is restricted to `authorizedCallers`; the owner manages this allowlist with `setAuthorizedCaller`.

For each accepted call, the contract adds one transaction, adds `amount` to volume, and adds `10 + floor(amount / 10 USDC)` points. This is a simple counter, not a reviewed trust score. Authorized callers can submit arbitrary user/amount pairs, so the allowlist is a trust boundary.

## ChaosBoard

1. `postBounty(title, description, reward, deadline)` pulls the full reward from the poster. The poster must approve USDC first.
2. A different wallet can call `claimBounty(id)`.
3. The claimer calls `submitWork(id)`. The contract records only the status change; it accepts no proof or deliverable.
4. The poster calls `approveBounty(id)` to release the reward to the claimer. ChaosID reputation is then attempted for the claimer.
5. The poster may cancel an `Open` bounty. For a `Claimed` or `Submitted` bounty with a non-zero deadline, the poster may call `reclaimExpiredBounty` after that deadline.

The deadline is not enforced by `claimBounty`, `submitWork`, or `approveBounty`. A poster can still approve after the deadline, and can also reclaim after the deadline even if work was submitted. The contract has no dispute or arbitration process.

## ChaosMarket

1. `createListing(...)` creates a listing; it does not escrow funds.
2. The buyer approves USDC and calls `buyListing(id)`. The price is transferred into the contract and a seven-day `disputeDeadline` is recorded.
3. The seller calls `markDelivered(id)`.
4. The buyer calls `confirmDelivery(id)` to release payment to the seller. ChaosID reputation is then attempted for the seller.
5. If the seller has not marked delivery, the buyer can call `reclaimExpiredListing` after the seven-day deadline. If delivery was marked, the seller can claim payment with `claimUnconfirmedListing` after the deadline plus another seven days.
6. The seller can cancel an `Active` listing. There is no cancel path after purchase.

Despite the UI's “buyer protection” wording, the contract has no dispute case, evidence submission, or neutral adjudicator. After `markDelivered`, the buyer cannot use the refund function; the seller can eventually claim after the additional confirmation window.

## Cross-contract reputation setup

ChaosBoard and ChaosMarket call `ChaosID.recordTransaction` from their own contract addresses. The ChaosID owner must authorize each deployed address on the same chain. If a caller is not authorized or the recipient has not registered, the app transaction can still finish: the call is wrapped in `try/catch`, and the originating contract emits `ChaosIdUpdateFailed`.

Do not rely on a UI indicator alone to confirm reputation was recorded; inspect the resulting events/state on Arc Testnet Explorer.

## No mainnet deployment

These deployments and the UI configuration are for Arc Testnet. The constructor binds Board and Market to a USDC address and a ChaosID address; changing those bindings requires a new deployment or an owner action where the contract provides one. Review and test any new deployment before funding it. This document is not an endorsement to use the contracts with real funds.
