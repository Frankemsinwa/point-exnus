'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error("ADMIN_PASSWORD environment variable not set.");
            return NextResponse.json({ error: 'Admin functionality is not configured.' }, { status: 500 });
        }
        
        const authorized = password === adminPassword;

        return NextResponse.json({ authorized });

    } catch (error) {
        console.error('Admin Auth API Error:', error);
        return NextResponse.json({ error: 'Failed to verify authorization' }, { status: 500 });
    }
}
