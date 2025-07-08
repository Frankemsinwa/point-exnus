'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel } from '@/lib/utils';

const POINTS_PER_REFERRAL = 100;
const JOIN_BONUS_FOR_REFEREE = 10;

async function fetchUserWithReferrals(wallet: string) {
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', wallet)
        .single();
    
    if (userError) {
        if (userError.code === 'PGRST116') return null;
        throw userError;
    }

    const { data: referredUsers, error: referralsError } = await supabaseAdmin
        .from('referred_users')
        .select('referee_wallet, join_date')
        .eq('referrer_wallet', wallet);

    if (referralsError) throw referralsError;
    
    const userCamel = keysToCamel(userData);

    return {
        ...userCamel,
        miningSessionStart: userCamel.miningSessionStart ? new Date(userCamel.miningSessionStart).getTime() : null,
        referrals: {
            count: referredUsers.length,
            referredUsers: referredUsers.map(ru => ({
                wallet: ru.referee_wallet,
                joinDate: ru.join_date,
            })),
        },
    };
}

export async function POST(request: Request, { params }: { params: { wallet: string } }) {
    const { wallet } = params;
    try {
        const { referralCode } = await request.json();

        if (!referralCode) {
            return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
        }

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('points, referral_code, referral_code_applied')
            .eq('wallet_address', wallet)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.referral_code_applied) {
            return NextResponse.json({ error: 'Referral code has already been applied' }, { status: 400 });
        }
        
        if (user.referral_code.toUpperCase() === referralCode.toUpperCase()) {
            return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
        }

        const { data: referrer, error: referrerError } = await supabaseAdmin
            .from('users')
            .select('wallet_address, points')
            .eq('referral_code', referralCode.toUpperCase())
            .single();
        
        if (referrerError || !referrer) {
             return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

        // Using a transaction to ensure all or nothing
        const { error: rpcError } = await supabaseAdmin.rpc('apply_referral', {
            p_referee_wallet: wallet,
            p_referrer_wallet: referrer.wallet_address,
            p_referee_bonus: JOIN_BONUS_FOR_REFEREE,
            p_referrer_bonus: POINTS_PER_REFERRAL
        });

        if (rpcError) {
            console.error('RPC apply_referral error:', rpcError);
            return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
        }
        
        const updatedUser = await fetchUserWithReferrals(wallet);
        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Apply Referral API Error:', error);
        return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
    }
}
