'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { wallet } = await request.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const adminWallets = process.env.ADMIN_WALLETS?.split(',') || [];
        const authorized = adminWallets.includes(wallet);

        return NextResponse.json({ authorized });

    } catch (error) {
        console.error('Admin Auth API Error:', error);
        return NextResponse.json({ error: 'Failed to verify authorization' }, { status: 500 });
    }
}
