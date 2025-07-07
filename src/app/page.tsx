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
    // On page load, check for a referral code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      // Store it in session storage to be picked up after wallet connection
      sessionStorage.setItem("pending_referral_code", refCode);
    }
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
