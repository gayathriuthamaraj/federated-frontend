"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { KNOWN_SERVERS, findServerById, pinServer, getPinnedServer } from '../utils/servers';
import OTPInput from '../components/OTPInput';
import { loginWithPasskey, isPasskeySupported } from '../utils/passkey';

/* ── Social Mosaic — left panel ── */
const MOCK_POSTS = [
    { server: 'mastodon.io',   user: 'alice',  avatar: '🌸', text: 'Just discovered this amazing federated network!',         likes: 24, top: '8%',  left: '4%',  right: 'auto', animDelay: '0s',   animDur: '9s'  },
    { server: 'gotham.social', user: 'batman', avatar: '🦇', text: 'Gotham never sleeps — neither does the fediverse.',       likes: 58, top: '6%',  left: 'auto',right: '6%',  animDelay: '1.4s', animDur: '11s' },
    { server: 'pleroma.cc',    user: 'carol',  avatar: '🌿', text: 'Open source, open web. This is the future.',              likes: 17, top: '38%', left: '2%',  right: 'auto', animDelay: '0.6s', animDur: '8s'  },
    { server: 'sigma.net',     user: 'dave',   avatar: '⚡', text: 'No algorithm, no ads. Just real connections.',            likes: 41, top: '36%', left: 'auto',right: '2%',  animDelay: '2.1s', animDur: '10s' },
    { server: 'fedex.sh',      user: 'eve',    avatar: '🎨', text: 'Sharing my latest artwork across the Fediverse today!',  likes: 89, top: '68%', left: '5%',  right: 'auto', animDelay: '1.0s', animDur: '9.5s'},
    { server: 'relay.fedi',    user: 'fox',    avatar: '🦊', text: 'Federation means freedom. Your data, your rules.',       likes: 33, top: '70%', left: 'auto',right: '4%',  animDelay: '0.3s', animDur: '8.5s'},
];

function SocialMosaic() {
    // indigo theme
    const accent = '#4F46E5';
    const accentLight = '#818CF8';
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Radial glow */}
            <div style={{ position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 70%)' }} />
            {/* Dot grid */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.25 }}>
                {Array.from({length: 12}, (_,row) => Array.from({length:8}, (_,col) => (
                    <circle key={`${row}-${col}`} cx={`${(col+1)*12.5}%`} cy={`${(row+1)*8.3}%`}
                        r="1.2" fill={accent} opacity="0.3" />
                )))}
            </svg>
            {/* Connection lines + packets */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18, pointerEvents:'none' }}>
                {[['15%','12%','50%','50%'],['85%','10%','50%','50%'],['12%','42%','50%','50%'],
                  ['88%','40%','50%','50%'],['15%','72%','50%','50%'],['85%','74%','50%','50%']].map(([x1,y1,x2,y2],i)=>(
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1" strokeDasharray="5 8"/>
                ))}
                {[{p:'M 15% 12% L 50% 50%',dur:'3s',d:'0s'},{p:'M 85% 10% L 50% 50%',dur:'4s',d:'0.8s'},
                  {p:'M 12% 42% L 50% 50%',dur:'3.5s',d:'1.5s'},{p:'M 88% 40% L 50% 50%',dur:'2.8s',d:'0.3s'},
                  {p:'M 15% 72% L 50% 50%',dur:'3.2s',d:'2.1s'},{p:'M 85% 74% L 50% 50%',dur:'4.2s',d:'1.1s'}
                ].map((pk,i) => (
                    <circle key={i} r="3" fill={accent} opacity="0.7">
                        <animateMotion dur={pk.dur} begin={pk.d} repeatCount="indefinite" path={pk.p} calcMode="linear"/>
                    </circle>
                ))}
            </svg>
            {/* Center hub */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:72, height:72, borderRadius:'50%', background:'#fff',
                border:`2px solid ${accentLight}`, zIndex:20, animation:'depth-float 7s ease-in-out infinite',
                boxShadow:`0 0 0 8px rgba(79,70,229,0.07), 0 0 0 20px rgba(79,70,229,0.03), 0 8px 32px rgba(79,70,229,0.18)`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill={accent} />
                </svg>
            </div>
            {/* Post cards */}
            {MOCK_POSTS.map((post, i) => (
                <div key={i} style={{ position:'absolute', top:post.top, left:post.left, right:post.right,
                    width:210, background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)',
                    border:'1px solid rgba(79,70,229,0.12)', borderRadius:14, padding:'12px 14px',
                    boxShadow:'0 4px 24px rgba(79,70,229,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                    animation:`depth-float ${post.animDur} ${post.animDelay} ease-in-out infinite`, zIndex:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', fontSize:'1rem',
                            background:'linear-gradient(135deg,#EEF2FF,#C7D2FE)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            border:`1.5px solid rgba(79,70,229,0.2)`, flexShrink:0 }}>{post.avatar}</div>
                        <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#1A1B2E', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>@{post.user}</div>
                            <div style={{ fontSize:'0.65rem', color:accent, opacity:0.8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{post.server}</div>
                        </div>
                    </div>
                    <p style={{ fontSize:'0.75rem', color:'#374151', lineHeight:1.45, margin:0 }}>{post.text}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:8, fontSize:'0.65rem', color:'#9CA3AF' }}>
                        <span>♥ {post.likes}</span>
                        <span style={{ marginLeft:'auto', background:'rgba(79,70,229,0.08)', borderRadius:20,
                            padding:'2px 7px', color:accent, fontSize:'0.6rem', fontWeight:600 }}>federated</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Login Page ── */
export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername]             = useState('');
    const [password, setPassword]             = useState('');
    const [serverId, setServerId]             = useState<string>(() => getPinnedServer()?.server_id ?? '');
    const [error, setError]                   = useState('');
    const [isLoading, setIsLoading]           = useState(false);
    const [showPassword, setShowPassword]     = useState(false);
    const [loginStage, setLoginStage]         = useState<'credentials' | 'totp' | 'backup'>('credentials');
    const [partialToken, setPartialToken]     = useState('');
    const [totpCode, setTotpCode]             = useState('');
    const [backupCode, setBackupCode]         = useState('');
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const onMove = (e: MouseEvent) => {
            const r = card.getBoundingClientRect();
            const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
            const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
            card.style.transform = `perspective(900px) rotateY(${dx * 3}deg) rotateX(${-dy * 2.5}deg)`;
        };
        const onLeave = () => { card.style.transition = 'transform 0.5s ease'; card.style.transform = 'none'; };
        window.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
        return () => { window.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave); };
    }, []);

    const doLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setIsLoading(true);
        try {
            const srv = findServerById(serverId);
            if (!srv) { setError('Please select a server.'); return; }
            pinServer(srv);
            const res = await fetch(`${srv.url}/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.toLowerCase(), password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); return; }
            if (data.totp_required) { setPartialToken(data.partial_token); setLoginStage('totp'); return; }
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);
        } catch { setError('Network error — is the server running?'); }
        finally { setIsLoading(false); }
    };
    const doTOTP = async (code: string) => {
        setError(''); setIsLoading(true);
        try {
            const srv = findServerById(serverId)!;
            const res = await fetch(`${srv.url}/login/totp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partial_token: partialToken, totp_code: code }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Invalid code'); return; }
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);
        } catch { setError('Network error'); }
        finally { setIsLoading(false); }
    };
    const doBackup = async () => {
        setError(''); setIsLoading(true);
        try {
            const srv = findServerById(serverId)!;
            const res = await fetch(`${srv.url}/login/backup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partial_token: partialToken, backup_code: backupCode }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Invalid backup code'); return; }
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);
        } catch { setError('Network error'); }
        finally { setIsLoading(false); }
    };
    const doPasskey = async () => {
        setError(''); setPasskeyLoading(true);
        try {
            const srv = findServerById(serverId);
            if (!srv) { setError('Select a server first'); return; }
            pinServer(srv);
            const result = await loginWithPasskey(srv.url, username.includes('@') ? username : `${username}@${srv.id}`);
            login(result.user_id, result.home_server, result.access_token, result.refresh_token);
        } catch (err: any) { setError(err?.message || 'Passkey login failed'); }
        finally { setPasskeyLoading(false); }
    };

    const accent   = '#4F46E5';
    const accentLt = '#818CF8';
    const inputSt: React.CSSProperties = {
        width:'100%', padding:'0.68rem 0.9rem', borderRadius:10, boxSizing:'border-box',
        background:'#F7F8FF', border:'1px solid #C7C9E8', color:'#1A1B2E',
        fontSize:'0.9rem', outline:'none', fontFamily:'inherit',
        transition:'border-color 150ms, box-shadow 150ms',
    };
    const onFocus = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(79,70,229,0.18)`;
    };
    const onBlur = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = '#C7C9E8'; e.currentTarget.style.boxShadow = 'none';
    };
    const btnPrimary: React.CSSProperties = {
        width:'100%', padding:'0.82rem', borderRadius:11, border:'none', cursor:'pointer',
        background:`linear-gradient(135deg, ${accentLt} 0%, ${accent} 100%)`,
        color:'#fff', fontWeight:800, fontSize:'0.95rem', letterSpacing:'0.02em',
        boxShadow:'0 0 0 1px rgba(79,70,229,0.3), 0 4px 20px rgba(79,70,229,0.3)',
        transition:'opacity 150ms, transform 120ms',
    };

    return (
        <div className="flex min-h-screen" style={{ background: '#F7F8FF' }}>

            {/* ═══ LEFT — Social Mosaic ═══ */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden"
                style={{ width:'55%', background:'linear-gradient(145deg, #F7F8FF 0%, #EEF2FF 50%, #F7F8FF 100%)',
                    borderRight:'1px solid rgba(79,70,229,0.1)' }}>

                <div style={{ padding:'2.5rem 3rem', position:'relative', zIndex:30 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill={accent} />
                        </svg>
                        <span style={{ fontWeight:800, fontSize:'1.15rem', letterSpacing:'0.18em', color:'#1A1B2E' }}>GOTHAM</span>
                    </div>
                    <p style={{ fontSize:'0.72rem', color:'#9CA3AF', letterSpacing:'0.09em', marginTop:4 }}>FEDERATED SOCIAL NETWORK</p>
                </div>

                <div style={{ flex:1, position:'relative' }}><SocialMosaic /></div>

                <div style={{ padding:'2rem 3rem 2.5rem', position:'relative', zIndex:30 }}>
                    <p style={{ fontSize:'1.05rem', fontWeight:700, color:'#1A1B2E', lineHeight:1.45, margin:0 }}>
                        Connect across the open web.
                    </p>
                    <p style={{ fontSize:'0.82rem', color:'#6B7280', marginTop:6, lineHeight:1.55 }}>
                        Posts, replies, and follows flow freely between servers — no walled gardens.
                    </p>
                    <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                        {['Open source','No ads','Own your data','ActivityPub'].map(tag => (
                            <span key={tag} style={{ fontSize:'0.7rem', fontWeight:600, padding:'3px 10px',
                                borderRadius:20, border:`1px solid rgba(79,70,229,0.25)`,
                                color:accent, background:'rgba(79,70,229,0.06)', letterSpacing:'0.04em' }}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT — Login Form ═══ */}
            <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background:'#F7F8FF' }}>
                <div ref={cardRef} className="w-full max-w-[390px]"
                    style={{ animation:'project-in 650ms cubic-bezier(0.34,1.56,0.64,1) both',
                        transformStyle:'preserve-3d', transition:'transform 0.12s ease-out' }}>

                    <div className="lg:hidden flex items-center justify-center gap-2 mb-7">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill={accent} />
                        </svg>
                        <span style={{ fontWeight:800, fontSize:'1.1rem', letterSpacing:'0.18em', color:'#1A1B2E' }}>GOTHAM</span>
                    </div>

                    <div style={{ background:'#FFFFFF', border:'1px solid rgba(79,70,229,0.12)', borderRadius:20,
                        padding:'2.25rem', boxShadow:'0 4px 6px rgba(79,70,229,0.04), 0 16px 48px rgba(79,70,229,0.09)' }}>

                        {loginStage === 'credentials' && (<>
                            <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'#1A1B2E', marginBottom:'0.22rem', lineHeight:1.25 }}>Welcome back</h1>
                            <p style={{ color:'#6B7280', fontSize:'0.875rem', marginBottom:'1.6rem' }}>Sign in to your Gotham account</p>

                            {error && (
                                <div style={{ padding:'0.7rem 0.9rem', borderRadius:10, marginBottom:'1rem',
                                    background:'rgba(225,29,72,0.06)', border:'1px solid rgba(225,29,72,0.2)',
                                    color:'#E11D48', fontSize:'0.84rem', display:'flex', alignItems:'center',
                                    gap:'0.4rem', animation:'scale-in 180ms ease both' }}>
                                    <span>⚠</span> {error}
                                </div>
                            )}

                            <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                                <div>
                                    <label className="input-label">Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                        required autoComplete="username" disabled={isLoading}
                                        placeholder="you or you@server" style={inputSt}
                                        onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                <div>
                                    <label className="input-label">Home Server</label>
                                    <select value={serverId}
                                        onChange={e => { setServerId(e.target.value); const s=findServerById(e.target.value); if(s) pinServer(s); }}
                                        required disabled={isLoading}
                                        style={{ ...inputSt, cursor:'pointer', appearance:'none' } as React.CSSProperties}
                                        onFocus={onFocus} onBlur={onBlur}>
                                        <option value="">— Choose a server —</option>
                                        {KNOWN_SERVERS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.id}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Password</label>
                                    <div style={{ position:'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'} value={password}
                                            onChange={e => setPassword(e.target.value)} required
                                            autoComplete="current-password" disabled={isLoading}
                                            placeholder="••••••••"
                                            style={{ ...inputSt, paddingRight:'2.7rem' }}
                                            onFocus={onFocus} onBlur={onBlur} />
                                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                            style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                                                color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                                            {showPassword
                                                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            }
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading}
                                    style={{ ...btnPrimary, marginTop:'0.2rem', opacity: isLoading ? 0.7 : 1 }}>
                                    {isLoading
                                        ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem', justifyContent:'center' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                style={{ animation:'spin-ring 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                                            Signing in…
                                          </span>
                                        : 'Sign In →'}
                                </button>
                            </form>

                            {isPasskeySupported() && (<>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', margin:'1.1rem 0' }}>
                                    <div style={{ flex:1, height:1, background:'#E2E3F0' }} />
                                    <span style={{ color:'#9CA3AF', fontSize:'0.73rem' }}>or</span>
                                    <div style={{ flex:1, height:1, background:'#E2E3F0' }} />
                                </div>
                                <button onClick={doPasskey} disabled={passkeyLoading}
                                    style={{ width:'100%', padding:'0.72rem', borderRadius:11,
                                        border:'1.5px solid #E2E3F0', background:'transparent',
                                        color:'#374151', fontSize:'0.875rem', fontWeight:600,
                                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 150ms' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=accent; (e.currentTarget as HTMLElement).style.color=accent; (e.currentTarget as HTMLElement).style.background='rgba(79,70,229,0.05)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E2E3F0'; (e.currentTarget as HTMLElement).style.color='#374151'; (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                                    {passkeyLoading ? 'Waiting…' : 'Sign in with passkey'}
                                </button>
                            </>)}

                            <div style={{ marginTop:'1.3rem', textAlign:'center' }}>
                                <p style={{ color:'#6B7280', fontSize:'0.84rem' }}>
                                    No account?{' '}
                                    <Link href="/register" style={{ color:accent, fontWeight:700, textDecoration:'none' }}>Create one</Link>
                                </p>
                                <p style={{ marginTop:'0.3rem' }}>
                                    <Link href="/recover" style={{ color:'#9CA3AF', fontSize:'0.76rem', textDecoration:'none', borderBottom:'1px dashed #C7C9E8' }}>Recover account</Link>
                                </p>
                            </div>
                        </>)}

                        {loginStage === 'totp' && (<>
                            <div style={{ textAlign:'center', marginBottom:'1.4rem' }}>
                                <div style={{ width:50, height:50, borderRadius:'50%', margin:'0 auto 0.8rem',
                                    background:'rgba(79,70,229,0.08)', border:`2px solid ${accentLt}`,
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.35rem' }}>🔐</div>
                                <h2 style={{ fontWeight:800, fontSize:'1.3rem', color:'#1A1B2E' }}>Two-factor auth</h2>
                                <p style={{ color:'#6B7280', fontSize:'0.84rem', marginTop:'0.28rem' }}>Enter the code from your authenticator</p>
                            </div>
                            {error && <div style={{ padding:'0.68rem', borderRadius:10, background:'rgba(225,29,72,0.06)',
                                border:'1px solid rgba(225,29,72,0.2)', color:'#E11D48', fontSize:'0.84rem', marginBottom:'0.9rem', textAlign:'center' }}>{error}</div>}
                            <OTPInput onComplete={(code) => { setTotpCode(code); doTOTP(code); }} />
                            <button onClick={() => doTOTP(totpCode)} disabled={isLoading || totpCode.length < 6}
                                style={{ ...btnPrimary, marginTop:'1rem', opacity: isLoading || totpCode.length < 6 ? 0.42 : 1 }}>
                                {isLoading ? 'Verifying…' : 'Verify Code'}
                            </button>
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.8rem' }}>
                                <button onClick={() => setLoginStage('credentials')} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', fontSize:'0.8rem' }}>← Back</button>
                                <button onClick={() => setLoginStage('backup')} style={{ background:'none', border:'none', color:accent, cursor:'pointer', fontSize:'0.8rem' }}>Use backup code</button>
                            </div>
                        </>)}

                        {loginStage === 'backup' && (<>
                            <h2 style={{ fontWeight:800, fontSize:'1.3rem', color:'#1A1B2E', marginBottom:'0.3rem' }}>Backup code</h2>
                            <p style={{ color:'#6B7280', fontSize:'0.875rem', marginBottom:'1rem' }}>Enter one of your saved backup codes</p>
                            {error && <div style={{ padding:'0.68rem', borderRadius:10, background:'rgba(225,29,72,0.06)', color:'#E11D48', fontSize:'0.84rem', marginBottom:'0.8rem' }}>{error}</div>}
                            <input type="text" value={backupCode} onChange={e => setBackupCode(e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX-XXXX" style={{ ...inputSt, fontFamily:'monospace', letterSpacing:'0.1em', fontSize:'1rem' }}
                                onFocus={onFocus} onBlur={onBlur} />
                            <button onClick={doBackup} disabled={isLoading || !backupCode.trim()}
                                style={{ ...btnPrimary, marginTop:'0.8rem', opacity: isLoading || !backupCode.trim() ? 0.42 : 1 }}>
                                {isLoading ? 'Verifying…' : 'Use Backup Code'}
                            </button>
                            <button onClick={() => setLoginStage('totp')} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', fontSize:'0.8rem', marginTop:'0.55rem', display:'block' }}>← Use TOTP instead</button>
                        </>)}
                    </div>

                    <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.7rem', color:'#9CA3AF', letterSpacing:'0.08em' }}>
                        POWERED BY ACTIVITYPUB · OPEN STANDARD
                    </p>
                </div>
            </div>
        </div>
    );
}
