"use client";

import { useState } from "react";
import LandingPage from "@/components/landing-page";
import Dashboard from "@/components/dashboard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectWallet = () => {
    // In a real app, this would involve a library like Web3Modal, Wagmi, etc.
    // For this UI demo, we'll just simulate the connection.
    setIsConnected(true);
  };

  return (
    <>
      {isConnected ? <Dashboard /> : <LandingPage onConnectWallet={handleConnectWallet} />}
    </>
  );
}
