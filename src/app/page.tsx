"use client";

import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { connected, connecting } = useWallet();

  if (connecting) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-accent" />
      </div>
    );
  }

  return connected ? <Dashboard /> : <LandingPage />;
}
