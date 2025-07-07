'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'db.json');
const INITIAL_POINTS = 1000;

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(dbPath, JSON.stringify({ users: {} }, null, 2), 'utf-8');
      return { users: {} };
    }
    console.error('Failed to read or create db.json:', error);
    return { users: {} };
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const { wallet } = await request.json();
        
        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const db = await readDb();

        if (db.users[wallet]) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newReferralCode = wallet.substring(0, 8).toUpperCase();
        const newUser: any = {
            points: INITIAL_POINTS,
            referrals: { count: 0, referredUsers: [] },
            referralCode: newReferralCode,
            tasksCompleted: { x: false, telegram: false, discord: false },
            miningActivated: false,
            miningSessionStart: null,
            referralCodeApplied: false,
        };

        db.users[wallet] = newUser;
        await writeDb(db);

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('POST User API Error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
