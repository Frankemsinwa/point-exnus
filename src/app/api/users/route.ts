'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel } from '@/lib/utils';

const INITIAL_POINTS = 0;

// Helper function to get full user details, including referrals
async function fetchUserWithReferrals(wallet: string) {
    console.log(`[API][fetchUser] Attempting to fetch user data for wallet: ${wallet}`);
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', wallet)
        .single();
    
    // User not found is an expected case, return null.
    if (userError && userError.code === 'PGRST116') {
        console.log(`[API][fetchUser] User not found for wallet: ${wallet}. This is an expected case for new users.`);
        return null;
    }
    // For other errors, we should throw them to be caught by the handler.
    if (userError) {
        console.error(`[API][fetchUser] Supabase error while fetching user data for ${wallet}:`, JSON.stringify(userError, null, 2));
        throw userError;
    }
    console.log(`[API][fetchUser] Successfully fetched user data for ${wallet}.`);

    console.log(`[API][fetchUser] Attempting to fetch referrals for wallet: ${wallet}`);
    const { data: referredUsers, error: referralsError } = await supabaseAdmin
        .from('referred_users')
        .select('referee_wallet, join_date')
        .eq('referrer_wallet', wallet);

    if (referralsError) {
        console.error(`[API][fetchUser] Supabase error while fetching referrals for ${wallet}:`, JSON.stringify(referralsError, null, 2));
        throw referralsError;
    }
    console.log(`[API][fetchUser] Successfully fetched ${referredUsers.length} referrals for ${wallet}.`);
    
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
    let wallet: string | undefined;
    try {
        const body = await request.json();
        wallet = body.wallet;
        
        if (!wallet) {
            console.error('[API][POST] Wallet address not provided in request body.');
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }
        
        console.log(`[API][POST] Received request for wallet: ${wallet}`);
        const existingUser = await fetchUserWithReferrals(wallet);

        if (existingUser) {
            console.log(`[API][POST] Returning existing user data for wallet: ${wallet}`);
            return NextResponse.json(existingUser, { status: 200 });
        }

        console.log(`[API][POST] User not found. Proceeding to create a new user for wallet: ${wallet}`);
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

        console.log(`[API][POST] Attempting to insert new user for wallet: ${wallet}`);
        const { data: insertedData, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUserPayload)
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') { // unique_violation for race condition
                console.warn(`[API][POST] Race condition detected for wallet: ${wallet}. A user was created between check and insert. Refetching...`);
                const userJustCreated = await fetchUserWithReferrals(wallet);
                return NextResponse.json(userJustCreated, { status: 200 });
            }
             console.error(`[API][POST] Critical Supabase error during user insertion for wallet ${wallet}:`, JSON.stringify(insertError, null, 2));
             return NextResponse.json({ error: 'Failed to create user due to a database error.', details: insertError.message }, { status: 500 });
        }
        
        console.log(`[API][POST] Successfully created new user for wallet: ${wallet}`);
        const responseUser = {
            ...keysToCamel(insertedData),
            referrals: {
                count: 0,
                referredUsers: []
            }
        };

        return NextResponse.json(responseUser, { status: 201 });

    } catch (error: any) {
        console.error(`[API][POST] An unhandled exception occurred for wallet ${wallet || 'unknown'}:`, JSON.stringify(error, null, 2));
        return NextResponse.json({ error: 'An unexpected error occurred on the server.', details: error.message }, { status: 500 });
    }
}
