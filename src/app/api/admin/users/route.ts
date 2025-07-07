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
      return { users: {} };
    }
    console.error('Failed to read db.json:', error);
    return { users: {} };
  }
}

export async function GET() {
    try {
        const db = await readDb();
        const users = Object.entries(db.users || {}).map(([wallet, data]: [string, any]) => ({
            wallet,
            points: data.points || 0,
            referralCount: data.referrals?.count || 0,
        }));
        
        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin Users API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin user data' }, { status: 500 });
    }
}
