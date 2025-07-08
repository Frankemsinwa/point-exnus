'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { wallet } = await request.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet is required' }, { status: 400 });
        }

        const adminWalletsEnv = process.env.ADMIN_WALLETS;

        if (!adminWalletsEnv) {
            console.error("ADMIN_WALLETS environment variable not set.");
            return NextResponse.json({ error: 'Admin functionality is not configured.' }, { status: 500 });
        }
        
        const adminWallets = adminWalletsEnv.split(',').map(w => w.trim().toLowerCase());
        const authorized = adminWallets.includes(wallet.toLowerCase());

        return NextResponse.json({ authorized });

    } catch (error) {
        console.error('Admin Auth API Error:', error);
        return NextResponse.json({ error: 'Failed to verify authorization' }, { status: 500 });
    }
}
