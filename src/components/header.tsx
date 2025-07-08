'use client';

import dynamic from 'next/dynamic';

const ConnectWalletButton = dynamic(
  () => import('./connect-wallet-button'),
  { ssr: false }
);

export default function Header() {
  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Exnus Points</span>
        </div>
        <div className="ml-auto">
            <ConnectWalletButton />
        </div>
    </header>
  );
}
