'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'db.json');

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

export async function GET() {
    try {
        const db = await readDb();
        const users = Object.entries(db.users || {}).map(([wallet, data]: [string, any]) => ({
            wallet,
            points: data.points || 0,
            referralCount: (data.referrals && data.referrals.count) || 0,
        }));

        users.sort((a, b) => b.points - a.points);
        return NextResponse.json(users);
    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
    }
}
