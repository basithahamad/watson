'use client';

import { useState } from 'react';

// Sign-ups are stored in MySQL and listed in the admin's Subscribers tab, where
// they can be exported for whichever mailing service the newsletter goes out
// through. Nothing is sent from here.
export function NewsletterForm({ buttonLabel = 'Subscribe', note = 'We respect your privacy. Unsubscribe at any time.' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');     // idle | sending | done | error
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Something went wrong — please try again.');
      setState('done');
    } catch (err) {
      setMsg(err.message);
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="news-note">Thank you — you’re on the list.</p>;
  }

  return (
    <form className="news-form" onSubmit={submit}>
      <input type="text" placeholder="First name" aria-label="First name"
        value={name} onChange={e => setName(e.target.value)} />
      <input type="email" placeholder="Email address" aria-label="Email address" required
        value={email} onChange={e => setEmail(e.target.value)} />
      <button className="btn btn-gold" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Subscribing…' : buttonLabel}
      </button>
      <span className="news-note">{state === 'error' ? msg : note}</span>
    </form>
  );
}
