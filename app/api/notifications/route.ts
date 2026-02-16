import { NextResponse } from 'next/server';
import { mockNotifications } from '@/app/data/mockData';

export async function GET() {
    return NextResponse.json(mockNotifications);
}

export async function POST(request: Request) {
    const { notificationId } = await request.json();

    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
    }

    return NextResponse.json({ success: true });
}
