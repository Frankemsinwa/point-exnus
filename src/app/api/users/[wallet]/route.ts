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

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: Request, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  try {
    const db = await readDb();
    const user = db.users[wallet];

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
    const db = await readDb();

    if (db.users[wallet]) {
        db.users[wallet] = { ...db.users[wallet], ...updatedData };
        await writeDb(db);
        return NextResponse.json(db.users[wallet]);
    } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('PUT User API Error:', error);
    return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
  }
}
