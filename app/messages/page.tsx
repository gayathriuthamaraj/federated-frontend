"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    sender: string;
    receiver: string;
    content: string;
    created_at: string;
}

interface Conversation {
    id: string;
    sender: string;
    receiver: string;
    content: string;
    created_at: string;
}

export default function MessagesPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    // Fetch conversations
    useEffect(() => {
        async function fetchConversations() {
            if (!identity) return;

            try {
                const res = await fetch(
                    `${identity.home_server}/messages?user_id=${encodeURIComponent(identity.user_id)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    setConversations(data.conversations || []);
                }
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchConversations();
    }, [identity]);

    // Fetch messages for selected conversation
    useEffect(() => {
        async function fetchMessages() {
            if (!identity || !selectedUserId) return;

            try {
                const res = await fetch(
                    `${identity.home_server}/messages/conversation?user_id=${encodeURIComponent(identity.user_id)}&other_user_id=${encodeURIComponent(selectedUserId)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        }

        fetchMessages();
    }, [identity, selectedUserId]);

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !identity || !selectedUserId) return;

        setSending(true);
        try {
            const res = await fetch(`${identity.home_server}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: identity.user_id,
                    recipient: selectedUserId,
                    content: newMessage,
                }),
            });

            if (res.ok) {
                // Add message to list
                const newMsg: Message = {
                    id: Date.now().toString(),
                    sender: identity.user_id,
                    receiver: selectedUserId,
                    content: newMessage,
                    created_at: new Date().toISOString(),
                };
                setMessages([...messages, newMsg]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    const getOtherUser = (conv: Conversation) => {
        return conv.sender === identity?.user_id ? conv.receiver : conv.sender;
    };

    return (
        <div className="flex h-screen">
            {/* Conversations List */}
            <div className="w-80 border-r border-bat-gray/10 bg-bat-dark">
                <div className="p-4 border-b border-bat-gray/10">
                    <h1 className="text-2xl font-bold text-bat-gray">Messages</h1>
                </div>

                <div className="overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherUser(conv);
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedUserId(otherUser)}
                                    className={`
                                        p-4 cursor-pointer transition-all duration-200
                                        ${selectedUserId === otherUser
                                            ? 'bg-bat-yellow/10 border-l-4 border-bat-yellow'
                                            : 'hover:bg-bat-black border-l-4 border-transparent'
                                        }
                                    `}
                                >
                                    <h3 className="text-bat-gray font-bold truncate">{otherUser}</h3>
                                    <p className="text-gray-400 text-sm truncate">{conv.content}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUserId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-bat-gray/10 bg-bat-dark">
                            <h2 className="text-bat-gray font-bold">{selectedUserId}</h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === identity?.user_id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender === identity?.user_id
                                                ? 'bg-bat-yellow text-bat-black'
                                                : 'bg-bat-dark text-bat-gray'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-bat-gray/10 bg-bat-dark">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="
                                        flex-1 px-4 py-3 rounded-lg
                                        bg-bat-black text-white
                                        border border-bat-gray/20
                                        focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                        outline-none transition-all duration-200
                                        placeholder-gray-600
                                    "
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={sending}
                                />
                                <button
                                    className="
                                        px-6 py-3 rounded-lg font-bold
                                        bg-bat-yellow text-bat-black
                                        hover:bg-yellow-400
                                        transition-all duration-200
                                        disabled:opacity-50
                                    "
                                    onClick={handleSendMessage}
                                    disabled={sending || !newMessage.trim()}
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
