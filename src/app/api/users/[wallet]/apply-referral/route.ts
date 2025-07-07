'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'db.json');
const POINTS_PER_REFERRAL = 1000;
const JOIN_BONUS_FOR_REFEREE = 500;

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

export async function POST(request: Request, { params }: { params: { wallet: string } }) {
    const { wallet } = params;
    try {
        const { referralCode } = await request.json();

        if (!referralCode) {
            return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
        }

        const db = await readDb();
        const user = db.users[wallet];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.referralCodeApplied) {
            return NextResponse.json({ error: 'Referral code has already been applied' }, { status: 400 });
        }
        
        if (user.referralCode.toUpperCase() === referralCode.toUpperCase()) {
            return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
        }

        let referrerKey = null;
        for (const key in db.users) {
            if (db.users[key].referralCode.toUpperCase() === referralCode.toUpperCase()) {
                referrerKey = key;
                break;
            }
        }

        if (referrerKey) {
            user.points += JOIN_BONUS_FOR_REFEREE;
            
            db.users[referrerKey].points += POINTS_PER_REFERRAL;
            if (!db.users[referrerKey].referrals) {
                 db.users[referrerKey].referrals = { count: 0, referredUsers: [] };
            }
            db.users[referrerKey].referrals.count += 1;
            db.users[referrerKey].referrals.referredUsers.push({
                wallet: wallet,
                joinDate: new Date().toISOString(),
            });
            
            user.referralCodeApplied = true;
            db.users[wallet] = user;
            await writeDb(db);

            return NextResponse.json(user);

        } else {
             return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

    } catch (error) {
        console.error('Apply Referral API Error:', error);
        return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
    }
}
