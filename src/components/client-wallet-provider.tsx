'use client';

import dynamic from 'next/dynamic';
import type { FC, ReactNode } from 'react';

const WalletProvider = dynamic(
  () => import('@/components/wallet-provider').then((mod) => mod.WalletProvider),
  { ssr: false }
);

export const ClientWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <WalletProvider>{children}</WalletProvider>;
};
