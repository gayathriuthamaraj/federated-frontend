"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('mod_token');
    router.replace(token ? '/queue' : '/login');
  }, [router]);
  return null;
}
