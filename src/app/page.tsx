"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import LandingPage from "@/components/landing-page";
import Dashboard from "@/components/dashboard";
import { useEffect, useState } from "react";

export default function Home() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {connected ? <Dashboard /> : <LandingPage />}
    </>
  );
}
