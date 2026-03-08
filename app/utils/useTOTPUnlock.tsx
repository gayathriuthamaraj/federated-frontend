"use client";

import { useState, useCallback, useRef } from "react";
import TOTPUnlockModal from "../components/TOTPUnlockModal";

interface UseTOTPUnlockOptions {
    homeServer: string;
    accessToken: string;
}

/**
 * useTOTPUnlock — ask the user to verify their authenticator code and unlock
 * their Ed25519 private key on demand.
 *
 * Usage:
 *
 *   const { requestPrivateKey, unlockModal } = useTOTPUnlock({
 *       homeServer: identity.home_server,
 *       accessToken: localStorage.getItem('access_token') ?? '',
 *   });
 *
 *   // In your JSX, render `unlockModal` somewhere (e.g. at the bottom of the page)
 *   return (
 *       <>
 *           <button onClick={async () => {
 *               const key = await requestPrivateKey();
 *               if (key) {
 *                   const sig = await signData(payload, key);
 *                   // … use sig, then key falls out of scope
 *               }
 *           }}>Sign post</button>
 *           {unlockModal}
 *       </>
 *   );
 */
export function useTOTPUnlock({ homeServer, accessToken }: UseTOTPUnlockOptions) {
    const [visible, setVisible] = useState(false);
    // Holds the resolve/reject from the in-flight Promise
    const resolveRef = useRef<((key: string | null) => void) | null>(null);

    /**
     * Shows the unlock modal. Returns the decrypted private key on success,
     * or null if the user cancels.  The key is never stored anywhere.
     */
    const requestPrivateKey = useCallback((): Promise<string | null> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setVisible(true);
        });
    }, []);

    function handleUnlocked(privateKeyHex: string) {
        setVisible(false);
        resolveRef.current?.(privateKeyHex);
        resolveRef.current = null;
    }

    function handleCancel() {
        setVisible(false);
        resolveRef.current?.(null);
        resolveRef.current = null;
    }

    const unlockModal = visible ? (
        <TOTPUnlockModal
            homeServer={homeServer}
            accessToken={accessToken}
            onUnlocked={handleUnlocked}
            onCancel={handleCancel}
        />
    ) : null;

    return { requestPrivateKey, unlockModal };
}
