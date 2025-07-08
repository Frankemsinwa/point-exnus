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
    throw new Error('Failed to read database.');
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(request: Request, { params }: { params: { wallet: string } }) {
    const { wallet: targetWallet } = params;

    try {
        const { adminWallet, points } = await request.json();

        if (!adminWallet) {
            return NextResponse.json({ error: 'Admin wallet is required for authorization' }, { status: 401 });
        }
        
        const adminWalletsEnv = process.env.ADMIN_WALLETS;
        if (!adminWalletsEnv) {
            console.error("ADMIN_WALLETS environment variable not set.");
            return NextResponse.json({ error: 'Admin functionality is not configured.' }, { status: 500 });
        }

        const adminWallets = adminWalletsEnv.split(',').map(w => w.trim().toLowerCase());
        if (!adminWallets.includes(adminWallet.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const pointsValue = Number(points);
        if (typeof pointsValue !== 'number' || pointsValue < 0 || !Number.isInteger(pointsValue)) {
            return NextResponse.json({ error: 'Points must be a non-negative integer.' }, { status: 400 });
        }

        const db = await readDb();
        if (!db.users || !db.users[targetWallet]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        db.users[targetWallet].points = pointsValue;
        
        await writeDb(db);

        return NextResponse.json(db.users[targetWallet]);

    } catch (error) {
        console.error('Admin Point Update API Error:', error);
        return NextResponse.json({ error: 'Failed to update user points' }, { status: 500 });
    }
}
