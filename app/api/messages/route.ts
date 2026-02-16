import { NextResponse } from 'next/server';
import { mockMessages } from '@/app/data/mockData';

interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
}


const conversations = new Map<string, Message[]>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        
        return NextResponse.json(mockMessages);
    }

    
    const messages = conversations.get(conversationId) || [];
    return NextResponse.json(messages);
}

export async function POST(request: Request) {
    const { conversationId, senderId, content } = await request.json();

    if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
    }

    const newMessage: Message = {
        id: String(Date.now()),
        senderId,
        content,
        timestamp: new Date().toISOString()
    };

    conversations.get(conversationId)!.push(newMessage);

    return NextResponse.json(newMessage);
}
