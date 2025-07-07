"use client";

import React, { FC, useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  Wallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { SolanaMobileWalletAdapter } from "@solana-mobile/wallet-adapter-mobile";
import { clusterApiUrl } from "@solana/web3.js";

export const WalletProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // A state to track if the component has mounted. This is a robust way
  // to ensure that browser-only code does not run on the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const wallets = useMemo(() => {
    // Return an empty array if not mounted yet (prevents server-side execution)
    if (!mounted) return [];

    return [
      /**
       * Wallets that implement the new wallet standard may be found here:
       * @see https://github.com/solana-labs/wallet-standard
       *
       * Alternatively, you can support specific wallets by adding their adapters:
       * @see https://github.com/solana-labs/wallet-adapter#wallets
       *
       * MOBILE SUPPORT: Mobile wallet support is handled by including adapters
       * for wallets that have mobile apps (like Phantom and Solflare), as well
       * as the SolanaMobileWalletAdapter for wallets that support the mobile standard.
       */
      new SolanaMobileWalletAdapter({
        appIdentity: { name: "Exnus Points" },
        cluster: network,
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];
  }, [mounted, network]);


  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* Disable autoConnect to prevent potential race conditions with the mobile adapter */}
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
