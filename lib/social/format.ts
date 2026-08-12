export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function profileDisplayName(profile: {
  display_name: string | null;
  wallet_address: string;
}) {
  return profile.display_name ?? truncateAddress(profile.wallet_address);
}

export function profilePath(walletAddress: string) {
  return `/profile/${walletAddress.toLowerCase()}`;
}
