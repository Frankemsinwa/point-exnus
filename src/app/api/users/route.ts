'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel } from '@/lib/utils';

const INITIAL_POINTS = 0;

export async function POST(request: NextRequest) {
    try {
        const { wallet } = await request.json();
        
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.ip;
        
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('wallet_address')
            .eq('wallet_address', wallet)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116: "exact one row not found"
             console.error('Supabase check error:', checkError);
             return NextResponse.json({ error: 'Database error while checking for user' }, { status: 500 });
        }

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newReferralCode = wallet.substring(0, 8).toUpperCase();
        
        const newUser = {
            wallet_address: wallet,
            points: INITIAL_POINTS,
            referral_code: newReferralCode,
            tasks_completed: { x: false, telegram: false, discord: false },
            mining_activated: false,
            mining_session_start: null,
            referral_code_applied: false,
            ip_address: ip,
        };

        const { data, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (insertError) {
             console.error('Supabase insert error:', insertError);
             return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
        
        // The user data from the dashboard expects a `referrals` object.
        const responseUser = {
            ...keysToCamel(data),
            referrals: {
                count: 0,
                referredUsers: []
            }
        };

        return NextResponse.json(responseUser, { status: 201 });
    } catch (error) {
        console.error('POST User API Error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
