'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel } from '@/lib/utils';

const INITIAL_POINTS = 0;

// Helper function to get full user details, including referrals
async function fetchUserWithReferrals(wallet: string) {
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', wallet)
        .single();
    
    // User not found is an expected case, return null.
    if (userError && userError.code === 'PGRST116') {
        return null;
    }
    // For other errors, we should throw them to be caught by the handler.
    if (userError) {
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


export async function POST(request: NextRequest) {
    try {
        const { wallet } = await request.json();
        
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }
        
        // Atomically get or create the user.
        // First, try to fetch the user.
        const existingUser = await fetchUserWithReferrals(wallet);

        if (existingUser) {
            // User already exists, return their data.
            return NextResponse.json(existingUser, { status: 200 });
        }

        // User does not exist, so we create them.
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.ip;
        
        const newReferralCode = wallet.substring(0, 8).toUpperCase();
        
        const newUserPayload = {
            wallet_address: wallet,
            points: INITIAL_POINTS,
            referral_code: newReferralCode,
            tasks_completed: { x: false, telegram: false, discord: false },
            mining_activated: false,
            mining_session_start: null,
            referral_code_applied: false,
            ip_address: ip,
        };

        const { data: insertedData, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUserPayload)
            .select()
            .single();

        if (insertError) {
            // This handles the race condition where another request created the user
            // between our check and our insert.
            if (insertError.code === '23505') { // unique_violation
                const userJustCreated = await fetchUserWithReferrals(wallet);
                return NextResponse.json(userJustCreated, { status: 200 });
            }
             console.error('Supabase insert error:', insertError);
             return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
        
        const responseUser = {
            ...keysToCamel(insertedData),
            referrals: {
                count: 0,
                referredUsers: []
            }
        };

        return NextResponse.json(responseUser, { status: 201 });

    } catch (error) {
        console.error('Get/Create User API Error:', error);
        return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }
}
