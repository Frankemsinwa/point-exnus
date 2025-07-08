'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { wallet } = await request.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet is required' }, { status: 400 });
        }

        const adminWallet = process.env.ADMIN_WALLET;

        if (!adminWallet) {
            console.error("ADMIN_WALLET environment variable not set.");
            return NextResponse.json({ error: 'Admin functionality is not configured.' }, { status: 500 });
        }
        
        const authorized = wallet.toLowerCase() === adminWallet.toLowerCase();

        return NextResponse.json({ authorized });

    } catch (error) {
        console.error('Admin Auth API Error:', error);
        return NextResponse.json({ error: 'Failed to verify authorization' }, { status: 500 });
    }
}
