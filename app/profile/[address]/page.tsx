import { WalletAuthGate } from "@/components/WalletAuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ProfileView } from "@/components/social/ProfileView";

type ProfilePageProps = {
  params: Promise<{ address: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params;

  return (
    <WalletAuthGate mode="require-auth">
      <AppHeader />
      <ProfileView address={address} />
    </WalletAuthGate>
  );
}
