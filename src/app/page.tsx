"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import LandingPage from "@/components/landing-page";
import Dashboard from "@/components/dashboard";

export default function Home() {
  const { connected } = useWallet();

  return (
    <>
      {connected ? <Dashboard /> : <LandingPage />}
    </>
  );
}
