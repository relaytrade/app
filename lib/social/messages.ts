import { getAddress, type Address } from "viem";

export type SocialAction = "post" | "follow" | "unfollow" | "update_profile";

const MESSAGE_PREFIX = "Relay Social Action";

export function normalizeWalletAddress(address: string): Address {
  return getAddress(address);
}

export function buildSocialMessage(params: {
  action: SocialAction;
  wallet: string;
  timestamp: number;
  body?: string;
  target?: string;
  displayName?: string;
  bio?: string;
}) {
  const wallet = normalizeWalletAddress(params.wallet).toLowerCase();
  const lines = [
    MESSAGE_PREFIX,
    `Action: ${params.action}`,
    `Wallet: ${wallet}`,
    `Timestamp: ${params.timestamp}`,
  ];

  if (params.action === "post") {
    lines.push(`Body: ${params.body ?? ""}`);
  }

  if (params.action === "follow" || params.action === "unfollow") {
    lines.push(`Target: ${normalizeWalletAddress(params.target!).toLowerCase()}`);
  }

  if (params.action === "update_profile") {
    lines.push(`DisplayName: ${params.displayName ?? ""}`);
    lines.push(`Bio: ${params.bio ?? ""}`);
  }

  return lines.join("\n");
}

/** Reject stale signatures so a captured sign request cannot be replayed later. */
export const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export function isFreshTimestamp(timestamp: number) {
  const age = Math.abs(Date.now() - timestamp);
  return age <= SIGNATURE_MAX_AGE_MS;
}
