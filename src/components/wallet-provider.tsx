"use client";

import React, { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";

export const WalletProvider: FC<{ children: React.ReactNode }> = ({
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
       *
       * MOBILE SUPPORT: Mobile wallet support is handled by including adapters
       * for wallets that have mobile apps (like Phantom and Solflare). The UI
       * will automatically detect the mobile environment and prompt users to
       * connect with their installed wallet app.
       */
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
