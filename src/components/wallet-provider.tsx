"use client";

// Polyfills required for the mobile wallet adapter
import 'get-random-values';
import 'fast-text-encoding';

import React, { FC, useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { SolanaMobileWalletAdapter } from "@solana-mobile/wallet-adapter-mobile";
import { clusterApiUrl } from "@solana/web3.js";

export const WalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement the new wallet standard may be found here:
       * @see https://github.com/solana-labs/wallet-standard
       *
       * Alternatively, you can support specific wallets by adding their adapters:
       * @see https://github.com/solana-labs/wallet-adapter#wallets
       */
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      /**
       * The SolanaMobileWalletAdapter allows users on mobile browsers to connect
       * to any wallet app that supports the mobile wallet standard. It is crucial
       * for a seamless mobile experience.
       */
      new SolanaMobileWalletAdapter({
        appIdentity: { name: "Exnus Points" },
        cluster: network,
      }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
