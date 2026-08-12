import { verifyMessage, type Address } from "viem";
import {
  buildSocialMessage,
  isFreshTimestamp,
  normalizeWalletAddress,
  type SocialAction,
} from "./messages";

export type VerifiedSocialRequest = {
  wallet: Address;
  action: SocialAction;
  body?: string;
  target?: Address;
  displayName?: string;
  bio?: string;
};

export async function verifySocialRequest(input: {
  action: SocialAction;
  wallet: string;
  signature: `0x${string}`;
  timestamp: number;
  body?: string;
  target?: string;
  displayName?: string;
  bio?: string;
}): Promise<VerifiedSocialRequest> {
  if (!isFreshTimestamp(input.timestamp)) {
    throw new Error("Signature expired. Sign again and retry.");
  }

  const wallet = normalizeWalletAddress(input.wallet);
  const message = buildSocialMessage({
    action: input.action,
    wallet: input.wallet,
    timestamp: input.timestamp,
    body: input.body,
    target: input.target,
    displayName: input.displayName,
    bio: input.bio,
  });

  const valid = await verifyMessage({
    address: wallet,
    message,
    signature: input.signature,
  });

  if (!valid) {
    throw new Error("Wallet signature did not match the request.");
  }

  return {
    wallet,
    action: input.action,
    body: input.body,
    target: input.target ? normalizeWalletAddress(input.target) : undefined,
    displayName: input.displayName,
    bio: input.bio,
  };
}
