'use client';
export default function SignOut() { return <button type="button" className="linkbtn" onClick={async () => { await fetch('/api/account/logout', { method: 'POST' }); window.location.href = '/'; }}>Sign out</button>; }
