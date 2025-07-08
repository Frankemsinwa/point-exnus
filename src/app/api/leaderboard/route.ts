'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('get_leaderboard');
        
        if (error) {
            console.error('Leaderboard RPC Error:', error);
            throw error;
        }

        // The RPC function returns the data in the desired shape.
        const users = data.map((user: any) => ({
            wallet: user.wallet_address,
            points: user.points,
            referralCount: user.referral_count,
        }));
        
        return NextResponse.json(users);

    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
    }
}
