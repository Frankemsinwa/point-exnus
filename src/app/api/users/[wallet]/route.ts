'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { keysToCamel, keysToSnake } from '@/lib/utils';


function transformUserForClient(userFromDb: any) {
    const { 
        task_x_completed, 
        task_telegram_completed, 
        task_discord_completed,
        ...rest
    } = userFromDb;

    const userCamel = keysToCamel(rest);

    return {
        ...userCamel,
        tasksCompleted: {
            x: task_x_completed || false,
            telegram: task_telegram_completed || false,
            discord: task_discord_completed || false,
        },
        miningSessionStart: userCamel.miningSessionStart ? new Date(userCamel.miningSessionStart).getTime() : null,
    };
}


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
    
    const clientUser = transformUserForClient(userData);

    return {
        ...clientUser,
        referrals: {
            count: referredUsers.length,
            referredUsers: referredUsers.map(ru => ({
                wallet: ru.referee_wallet,
                joinDate: ru.join_date,
            })),
        },
    };
}

export async function GET(request: Request, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  try {
    const user = await fetchUserWithReferrals(wallet);
    if (user) {
        return NextResponse.json(user);
    } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('GET User API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  try {
    const updatedData = await request.json();

    if (updatedData.tasksCompleted) {
        updatedData.taskXCompleted = updatedData.tasksCompleted.x;
        updatedData.taskTelegramCompleted = updatedData.tasksCompleted.telegram;
        updatedData.taskDiscordCompleted = updatedData.tasksCompleted.discord;
        delete updatedData.tasksCompleted;
    }

    if (updatedData.miningSessionStart) {
        updatedData.miningSessionStart = new Date(updatedData.miningSessionStart).toISOString();
    }
    
    if ('referrals' in updatedData) {
        delete updatedData.referrals;
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .update(keysToSnake(updatedData))
        .eq('wallet_address', wallet)
        .select()
        .single();

    if (error) {
        console.error('Supabase PUT error:', error);
        if (error.code === 'PGRST116') {
             return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    const fullUser = await fetchUserWithReferrals(wallet);
    return NextResponse.json(fullUser);

  } catch (error) {
    console.error('PUT User API Error:', error);
    return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
  }
}
