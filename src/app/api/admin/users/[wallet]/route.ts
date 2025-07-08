'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel } from '@/lib/utils';


export async function PUT(request: Request, { params }: { params: { wallet: string } }) {
    const { wallet: targetWallet } = params;

    try {
        const { adminWallet, points } = await request.json();

        if (!adminWallet) {
            return NextResponse.json({ error: 'Admin wallet is required for authorization' }, { status: 401 });
        }
        
        const adminWalletsEnv = process.env.ADMIN_WALLETS;
        if (!adminWalletsEnv) {
            console.error("ADMIN_WALLETS environment variable not set.");
            return NextResponse.json({ error: 'Admin functionality is not configured.' }, { status: 500 });
        }

        const adminWallets = adminWalletsEnv.split(',').map(w => w.trim().toLowerCase());
        if (!adminWallets.includes(adminWallet.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const pointsValue = Number(points);
        if (typeof pointsValue !== 'number' || pointsValue < 0 || !Number.isInteger(pointsValue)) {
            return NextResponse.json({ error: 'Points must be a non-negative integer.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ points: pointsValue })
            .eq('wallet_address', targetWallet)
            .select()
            .single();

        if (error) {
            console.error('Supabase admin update error:', error);
            if (error.code === 'PGRST116') {
                 return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
        }
        
        return NextResponse.json(keysToCamel(data));

    } catch (error) {
        console.error('Admin Point Update API Error:', error);
        return NextResponse.json({ error: 'Failed to update user points' }, { status: 500 });
    }
}
