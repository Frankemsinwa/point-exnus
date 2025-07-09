'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';


export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.rpc('get_all_users_with_referral_counts');

        if (error) {
            console.error('Admin Users RPC Error:', error);
            throw error;
        }

        const users = data.map((user: any) => ({
            wallet: user.wallet_address,
            points: user.points,
            referralCount: user.referral_count,
        }));
        
        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin Users API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin user data' }, { status: 500 });
    }
}
