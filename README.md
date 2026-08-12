<div align="center">

# Relay

**Social trading, unified across chains.**

Follow verified on-chain traders, see the trades they actually make, and copy them with one tap, all without ever handing your keys to anyone.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Non custodial](https://img.shields.io/badge/custody-non--custodial-7c5cfc)
![License](https://img.shields.io/badge/license-MIT-35d399)

</div>

---

## What this is

Most trading apps make you choose between two things: a social feed that helps you find good ideas, or an execution layer you can actually trust with your money. Relay is an attempt to stop treating those as separate products.

The core idea is simple. Every trade a verified trader makes is visible, with the thesis behind it, in a feed built the way a social app is built. When you see a trade worth copying, you copy it. You sign it yourself, from your own wallet. Relay never custodies a cent.

This repository is the working build, starting from the ground up. It is not a finished product yet. It is the actual code, developed in the open, one real milestone at a time.

## Design principles

A few decisions this project holds itself to, on purpose:

- **Non custodial by default.** Relay reads, suggests, and pre-fills. It does not move money on your behalf without your signature. This is a product decision, not just a technical one.
- **Verified, not self-reported.** Trader performance shown in the app is computed from actual on-chain activity, never from numbers a trader typed in themselves.
- **One chain done properly beats many chains done thinly.** The long-term vision is chain-agnostic. The build gets there by shipping something real on one chain first, not by building an abstraction layer for chains it doesn't support yet.
- **Ship the smallest version that tells the truth.** Every feature here either works for real or is clearly marked as not built yet. Nothing in this codebase pretends to be further along than it is.

## Status

This project is in early, active development. The table below is the honest picture, not an aspirational one.

| Area | Status |
|---|---|
| Design system and brand tokens | Ported |
| Wallet connect | Built |
| ETH/WETH wrap and unwrap (mainnet) | Built |
| Uniswap swap (mainnet) | Built |
| Uniswap swap (testnet) | Blocked: no official deployment |
| Token detail pages | Planned |
| Social feed and following | Planned |
| Copy trading | Planned |
| Verified trader leaderboard | Planned |

**Mainnet swap addresses** live in `lib/uniswap.ts` and `lib/tokens.ts`, sourced from [Uniswap's Robinhood Chain deployment page](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments) and [Robinhood token contracts](https://docs.robinhood.com/chain/contracts/). Swaps route through SwapRouter02 with QuoterV2 quotes across the 0.05%, 0.3%, and 1% fee tiers.

**Testnet (46630):** Uniswap still publishes no deployment for Robinhood testnet. The app shows a chain switch prompt instead of substituting mainnet addresses. See git history on README for the full investigation.

A note on dependencies: `npm audit` currently reports vulnerabilities that trace back to transitive packages inside the wallet connector ecosystem (MetaMask SDK, WalletConnect, Coinbase SDK), several layers below anything this project controls directly. They are not fixable without a breaking downgrade of wagmi that would reintroduce a version conflict with RainbowKit. This is being tracked, not ignored, and will be revisited as upstream packages catch up.

## Built with

- [Next.js](https://nextjs.org) with the App Router, TypeScript throughout
- A hand-ported design system, no UI framework dependency, so the visual language stays exact
- [Wagmi](https://wagmi.sh) and [viem](https://viem.sh) for wallet connectivity once that lands
- [Supabase](https://supabase.com) for auth, the social graph, and realtime feed updates
- Deployed on [Vercel](https://vercel.com)

## Why Robinhood Chain

Relay's execution layer runs on Robinhood Chain, an EVM-compatible Layer 2 built on Arbitrum. Two things about it mattered for this project specifically: it ships with Uniswap and Chainlink integrated natively, which means real swap execution and real price data from day one instead of waiting on third-party tooling to catch up, and it has native ERC-4337 account abstraction support, which opens a real path to delegated, non-custodial copy trading down the line.

## Contributing

This is an early-stage solo project right now. Issues and discussion are welcome. Pull requests are best coordinated in an issue first while the foundational architecture is still settling.

## License

MIT. See [LICENSE](./LICENSE).
