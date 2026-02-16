'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';


const QrReader = dynamic(() => import('react-qr-reader').then((mod) => mod.QrReader), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">Loading Camera...</div>,
});

interface QRScannerProps {
    onScan: (data: string | null) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);

    const handleResult = (result: any, error: any) => {
        if (result) {
            onScan(result?.text);
        }
        if (error) {
            
            
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="relative overflow-hidden rounded-lg shadow-lg border-2 border-indigo-500/20">
                <QrReader
                    constraints={{ facingMode: 'environment' }}
                    onResult={handleResult}
                    className="w-full"
                    containerStyle={{ width: '100%' }}
                />
                <div className="absolute inset-0 border-2 border-indigo-500/50 opacity-50 pointer-events-none rounded-lg"></div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            <p className="text-gray-500 text-xs mt-4 text-center">
                Point your camera at the admin invite QR code.
            </p>
        </div>
    );
}
