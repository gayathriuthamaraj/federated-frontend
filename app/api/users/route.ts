import { NextResponse } from 'next/server';
import { mockUsers } from '@/app/data/mockData';

export async function GET() {
    return NextResponse.json(mockUsers);
}
