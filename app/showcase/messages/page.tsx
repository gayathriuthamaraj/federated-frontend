"use client";

import { useState } from 'react';
import { mockMessages } from '../../data/mockData';

export default function MessagesPage() {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);

    const selectedMessage = mockMessages.find(m => m.id === selectedChat);

    return (
        <div className="flex h-full">
            {/* Chat List */}
            <div className="w-80 border-r border-bat-gray/10 bg-bat-dark">
                <div className="p-4 border-b border-bat-gray/10">
                    <h1 className="text-2xl font-bold text-bat-gray">Messages</h1>
                </div>

                <div className="overflow-y-auto">
                    {mockMessages.map(message => (
                        <div
                            key={message.id}
                            onClick={() => setSelectedChat(message.id)}
                            className={`
                  flex items-center gap-3 p-4 cursor-pointer
                  transition-all duration-200
                  ${selectedChat === message.id
                                    ? 'bg-bat-yellow/10 border-l-4 border-bat-yellow'
                                    : 'hover:bg-bat-black border-l-4 border-transparent'
                                }
                `}
                        >
                            <div className="relative">
                                <img
                                    src={message.user.avatarUrl}
                                    alt={message.user.displayName}
                                    className="w-12 h-12 rounded-full border-2 border-bat-yellow/50"
                                />
                                {message.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                        {message.unreadCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-bat-gray font-bold truncate">{message.user.displayName}</h3>
                                <p className="text-gray-400 text-sm truncate">{message.lastMessage}</p>
                            </div>

                            <span className="text-gray-500 text-xs">{message.timestamp}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedMessage ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-bat-gray/10 bg-bat-dark flex items-center gap-3">
                            <img
                                src={selectedMessage.user.avatarUrl}
                                alt={selectedMessage.user.displayName}
                                className="w-10 h-10 rounded-full border-2 border-bat-yellow/50"
                            />
                            <div>
                                <h2 className="text-bat-gray font-bold">{selectedMessage.user.displayName}</h2>
                                <p className="text-gray-500 text-sm">@{selectedMessage.user.username}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-4">
                                {/* Sample messages */}
                                <div className="flex justify-end">
                                    <div className="bg-bat-yellow text-bat-black px-4 py-2 rounded-lg max-w-xs">
                                        Hey! How's it going?
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-bat-dark px-4 py-2 rounded-lg max-w-xs">
                                        <p className="text-bat-gray">{selectedMessage.lastMessage}</p>
                                    </div>
                                </div>
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
                                />
                                <button className="
                    px-6 py-3 rounded-lg font-bold
                    bg-bat-yellow text-bat-black
                    hover:bg-yellow-400
                    transition-all duration-200
                  ">
                                    Send
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