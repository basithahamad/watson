'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './admin.css';
import { SITE_SCHEMA } from './siteSchema';
import { RichText } from './RichText';

const CODE_KEY = 'ww_admin_code';
const BLANK = { speakers: [], testimonials: [] };

// Long-form copy is edited as rich text: bold, italic, colour and links. It is
// rendered inside a paragraph on the public page, so block formatting
// (headings, lists) is deliberately unavailable — see RichText's inline mode.
function InlineRich({ value, onChange }) {
  const ref = useRef(null);
  return <RichText inline editorRef={ref} initialHtml={value ?? ''} onChange={onChange} />;
}


// Downscale then upload, returning the stored URL. Shared by the speaker and
// testimonial editors and by the photograph fields in Site Content.
async function uploadImage(file, code) {
  const blob = await new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
    const rd = new FileReader();
    rd.onerror = () => reject(new Error('Could not read that file.'));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a readable image."));
      img.onload = () => {
        const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc);
        cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.85);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });

  const body = new FormData();
  body.append('file', blob, file.name || 'photo.jpg');
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-code': code }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Upload failed.');
  return j.url;
}

// A stored photograph plus an Upload button, so swapping an image on the public
// page is a file picker rather than a path typed from memory.
function ImageField({ label, value, onChange, code }) {
  const ref = useRef(null);
  const [msg, setMsg] = useState('');

  async function pick(input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    setMsg('Uploading…');
    try {
      onChange(await uploadImage(file, code));
      setMsg('');
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    }
  }

  return (
    <>
      <label>{label}</label>
      <div className="imgfield">
        <div className="imgfield-thumb" onClick={() => ref.current?.click()}>
          {value ? <img src={value} alt="" /> : <span>none</span>}
        </div>
        <div className="imgfield-main">
          <input type="text" value={value ?? ''} placeholder="/uploads/… or /assets/img/…"
            onChange={e => onChange(e.target.value)} />
          <div className="imgfield-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => ref.current?.click()}>
              Upload photo
            </button>
            <small>{msg}</small>
          </div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pick(e.target)} />
    </>
  );
}

export default function Admin() {
  const [code, setCode] = useState(null);          // null = not signed in yet
  const [doc, setDoc] = useState(BLANK);
  const [site, setSite] = useState(null);
  const [tab, setTab] = useState('speakers');
  const [editing, setEditing] = useState(null);    // {item, index} | null
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState('');

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'x-admin-code': code || '' }),
    [code]
  );

  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2400); };

  useEffect(() => {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved) setCode(saved);
  }, []);

  useEffect(() => {
    if (!code) return;
    fetch('/api/content').then(r => r.json()).then(d => setDoc({
      speakers: Array.isArray(d.speakers) ? d.speakers : [],
      testimonials: Array.isArray(d.testimonials) ? d.testimonials : []
    })).catch(() => {});
  }, [code]);

  useEffect(() => {
    if (!code || tab !== 'site' || site) return;
    fetch('/api/site').then(r => r.json()).then(setSite).catch(() => setSite({}));
  }, [code, tab, site]);

  if (!code) return <Gate onIn={setCode} />;

  const isSite = tab === 'site';
  const list = doc[tab] || [];

  async function persist(next) {
    const r = await fetch('/api/content', { method: 'PUT', headers: headers(), body: JSON.stringify(next) });
    if (r.ok) { setDoc(next); flash('Saved ✓'); setEditing(null); }
    else flash('Save failed — try signing in again');
  }

  async function saveSite() {
    const r = await fetch('/api/site', { method: 'PUT', headers: headers(), body: JSON.stringify(site) });
    if (r.ok) { setDirty(false); flash('Site content published'); }
    else flash('Save failed — try signing in again');
  }

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span><b>Watson &amp; Watson</b> · Content Editor</span>
          <span>
            <a href="/" target="_blank" rel="noopener">View site ↗</a>
            &nbsp;·&nbsp;
            <a href="#" onClick={e => { e.preventDefault(); localStorage.removeItem(CODE_KEY); location.reload(); }}>Sign out</a>
          </span>
        </div>
      </div>

      <main className="wrap">
        {editing ? (
          <Editor
            kind={tab}
            entry={editing}
            code={code}
            onCancel={() => setEditing(null)}
            onSave={item => {
              const next = { ...doc, [tab]: [...list] };
              if (editing.index >= 0) next[tab][editing.index] = item;
              else next[tab].push(item);
              persist(next);
            }}
            onDelete={() => {
              const next = { ...doc, [tab]: list.filter((_, i) => i !== editing.index) };
              persist(next);
            }}
          />
        ) : (
          <div className="list-view">
            <div className="head">
              <h1>{isSite ? 'Site Content' : tab === 'speakers' ? 'Speakers' : 'Testimonials'}</h1>
              {!isSite && (
                <button className="btn btn-navy" onClick={() => setEditing({ item: {}, index: -1 })}>
                  ＋ New {tab === 'speakers' ? 'Speaker' : 'Testimonial'}
                </button>
              )}
            </div>

            <div className="tabs">
              {[['speakers', "Speaker's Bureau"], ['testimonials', 'Testimonials'], ['site', 'Site Content']].map(([k, lbl]) => (
                <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{lbl}</button>
              ))}
            </div>

            <div className="note">
              {isSite
                ? 'Edit the wording on the public page. Layout, colours and fonts are fixed by the design and are not editable here.'
                : 'Changes appear on the site immediately.'}
            </div>

            {isSite
              ? <SiteForm site={site} setSite={setSite} setDirty={setDirty} dirty={dirty} onSave={saveSite} code={code} />
              : <ListTable kind={tab} list={list} onEdit={(item, index) => setEditing({ item, index })} />}
          </div>
        )}
      </main>

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </>
  );
}

function Gate({ onIn }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  async function submit() {
    // Deliberately invalid body: a correct code returns 400 (rejected before any
    // write), a wrong one returns 401. Nothing is ever modified by signing in.
    const r = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-code': v },
      body: 'null'
    });
    if (r.status === 401) { setErr('Incorrect code — try again.'); return; }
    localStorage.setItem(CODE_KEY, v);
    onIn(v);
  }
  return (
    <div id="gate">
      <div className="box">
        <div style={{ fontSize: '2rem' }}>🔐</div>
        <h2>Watson &amp; Watson Associates</h2>
        <p>Content Editor — enter the access code to continue.</p>
        {/* A real form with a password field is what makes a browser or password
            manager offer to save and autofill the code. A text input outside a
            form is ignored by all of them. */}
        <form onSubmit={e => { e.preventDefault(); submit(); }}>
          <input type="text" name="username" autoComplete="username"
            value="Content Editor" readOnly aria-hidden="true" tabIndex={-1}
            style={{ display: 'none' }} />
          <input type="password" name="password" autoComplete="current-password"
            value={v} placeholder="Access code" aria-label="Access code"
            onChange={e => setV(e.target.value)} />
          <button type="submit" className="btn btn-navy"
            style={{ width: '100%', justifyContent: 'center', marginTop: '.7rem' }}>Sign In</button>
        </form>
        <div className="err">{err}</div>
      </div>
    </div>
  );
}

function ListTable({ kind, list, onEdit }) {
  if (!list.length) {
    return <div className="card"><table><tbody><tr><td style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
      Nothing here yet — use the New button above.
    </td></tr></tbody></table></div>;
  }
  return (
    <div className="card">
      <table>
        <thead>
          {kind === 'speakers'
            ? <tr><th /><th>Name</th><th className="t-hide">Role</th><th className="t-hide">Topics</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            : <tr><th /><th>Quote</th><th className="t-hide">Name</th><th className="t-hide">Title</th><th style={{ textAlign: 'right' }}>Actions</th></tr>}
        </thead>
        <tbody>
          {list.map((s, i) => (
            <tr key={s.id || i}>
              <td>{s.image ? <img className="thumb" src={s.image.startsWith('/') ? s.image : `/${s.image}`} alt="" /> : <span className="thumb" />}</td>
              <td className="t-title">{kind === 'speakers' ? s.name : `“${(s.quote || '').slice(0, 60)}…”`}</td>
              <td className="t-hide">{kind === 'speakers' ? s.role : s.name}</td>
              <td className="t-hide">{kind === 'speakers' ? (s.topics || []).join(', ') : s.title}</td>
              <td><div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(s, i)}>Edit</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Editor({ kind, entry, code, onSave, onCancel, onDelete }) {
  const a = entry.item || {};
  const [f, setF] = useState({
    name: a.name || '', role: a.role || '', bio: a.bio || '',
    topics: (a.topics || []).join(', '),
    quote: a.quote || '', title: a.title || '',
    image: a.image || ''
  });
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [upErr, setUpErr] = useState('');
  const [formErr, setFormErr] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Downscale in the browser to keep the upload small, then POST the file to the
  // server. What gets stored on the record is the returned URL — never the image
  // bytes themselves.
  function pick(input) {
    const file = input.files[0];
    if (!file) return;
    setUpErr('');
    setBusy(true);

    const fail = msg => { setUpErr(msg); setBusy(false); input.value = ''; };

    const rd = new FileReader();
    rd.onerror = () => fail('Could not read that file.');
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => fail("That file isn't a readable image.");
      img.onload = () => {
        const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc);
        cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);

        cv.toBlob(async blob => {
          if (!blob) return fail('Could not process that image.');
          try {
            const body = new FormData();
            // No Content-Type header — the browser sets it with the boundary.
            body.append('file', blob, 'photo.jpg');
            const r = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-code': code }, body });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.error || 'Upload failed.');
            set('image', j.url);
            setBusy(false);
            input.value = '';
          } catch (err) {
            fail(err.message);
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  // A contentEditable cannot carry `required`, so an empty quote used to save a
  // blank testimonial that rendered as an empty card on the public site.
  const isBlank = html => !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  function submit(e) {
    e.preventDefault();
    if (kind === 'testimonials' && isBlank(f.quote)) {
      setFormErr('Add a quote before saving.');
      return;
    }
    setFormErr('');
    const item = kind === 'speakers'
      ? { id: a.id || slug(f.name), name: f.name.trim(), role: f.role.trim(), bio: f.bio.trim(),
          topics: f.topics.split(',').map(t => t.trim()).filter(Boolean), image: f.image }
      : { id: a.id || slug(f.name), quote: f.quote.trim(), name: f.name.trim(), title: f.title.trim(), image: f.image };
    onSave(item);
  }

  return (
    <div className="editor open">
      <div className="head">
        <h1>{entry.index >= 0 ? 'Edit' : 'New'} {kind === 'speakers' ? 'Speaker' : 'Testimonial'}</h1>
        <button className="btn btn-ghost" onClick={onCancel}>← Back</button>
      </div>
      <div className="card">
        <form onSubmit={submit} noValidate={false}>
          {formErr && <div className="form-err">{formErr}</div>}
          <div className="grid">
            {kind === 'speakers' ? (
              <>
                <div><label>Name *</label><input type="text" required value={f.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label>Role</label><input type="text" value={f.role} onChange={e => set('role', e.target.value)} /></div>
                <div className="full"><label>Biography</label><InlineRich value={f.bio} onChange={v => set('bio', v)} /></div>
                <div className="full"><label>Speaking topics (comma separated)</label><input type="text" value={f.topics} onChange={e => set('topics', e.target.value)} /></div>
              </>
            ) : (
              <>
                <div className="full"><label>Quote *</label><InlineRich value={f.quote} onChange={v => set('quote', v)} /></div>
                <div><label>Name</label><input type="text" value={f.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label>Title / organisation</label><input type="text" value={f.title} onChange={e => set('title', e.target.value)} /></div>
              </>
            )}
            <div className="full">
              <label>Photo</label>
              <div className="imgdrop" onClick={() => !busy && fileRef.current?.click()}>
                {f.image && <img src={f.image.startsWith('/') ? f.image : `/${f.image}`} alt="" />}
                <span>
                  {busy ? 'Uploading…' : f.image ? 'Click to replace photo' : 'Click to upload a photo (JPG, PNG or WebP)'}
                </span>
              </div>
              {upErr && <div className="up-err">{upErr}</div>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }} onChange={e => pick(e.target)} />
            </div>
          </div>
          <div className="form-foot">
            {entry.index >= 0 && <button type="button" className="btn btn-danger" onClick={() => confirm('Delete this item?') && onDelete()}>Delete</button>}
            <span style={{ flex: 1 }} />
            <button type="submit" className="btn btn-gold" disabled={busy}>
              {busy ? 'Uploading…' : 'Save & Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SiteForm({ site, setSite, setDirty, dirty, onSave, code }) {
  if (!site) return <div className="card" style={{ padding: '2rem' }}>Loading…</div>;

  const touch = fn => { setSite(prev => { const next = structuredClone(prev); fn(next); return next; }); setDirty(true); };
  const setField = (sec, k, v) => touch(n => { (n[sec] = n[sec] || {})[k] = v; });
  const setCell = (sec, list, i, col, v) => touch(n => { if (col === null) n[sec][list][i] = v; else n[sec][list][i][col] = v; });
  const move = (sec, list, i, d) => touch(n => {
    const arr = n[sec][list], j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  });
  const remove = (sec, list, i) => { if (confirm('Remove this item?')) touch(n => n[sec][list].splice(i, 1)); };
  const add = (sec, spec) => touch(n => {
    const blank = spec.plain ? '' : Object.fromEntries(spec.cols.map(([k]) => [k, '']));
    (n[sec][spec.k] = n[sec][spec.k] || []).push(blank);
  });

  return (
    <>
      {SITE_SCHEMA.map(sec => {
        const d = site[sec.key] || {};
        return (
          <div className="site-sec" key={sec.key}>
            <h2>{sec.title}{sec.hint && <small>{sec.hint}</small>}</h2>
            <div className="site-body">
              {(sec.fields || []).map(f => (
                <div className={f.full ? 'full' : ''} key={f.k}>
                  {f.type !== 'image' && <label>{f.label}</label>}
                  {f.type === 'image'
                    ? <ImageField label={f.label} value={d[f.k]} code={code}
                        onChange={v => setField(sec.key, f.k, v)} />
                    : f.type === 'textarea'
                      ? <InlineRich value={d[f.k]} onChange={v => setField(sec.key, f.k, v)} />
                      : <input type="text" value={d[f.k] ?? ''} onChange={e => setField(sec.key, f.k, e.target.value)} />}
                </div>
              ))}

              {(sec.lists || []).map(l => {
                const arr = Array.isArray(d[l.k]) ? d[l.k] : [];
                return (
                  <div key={l.k} style={{ gridColumn: '1/-1', display: 'contents' }}>
                    <div className="sub-h">{l.label} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>({arr.length})</span></div>
                    {arr.map((item, i) => (
                      <div className="lrow" key={i}>
                        <div className="lnum">{String(i + 1).padStart(2, '0')}</div>
                        <div className="lfields">
                          {l.plain ? (
                            l.type === 'textarea'
                              ? <InlineRich value={item} onChange={v => setCell(sec.key, l.k, i, null, v)} />
                              : <input type="text" value={item ?? ''} onChange={e => setCell(sec.key, l.k, i, null, e.target.value)} />
                          ) : l.cols.map(([ck, clabel, ctype]) => (
                            <div key={ck}>
                              <label>{clabel}</label>
                              {ctype === 'textarea'
                                ? <InlineRich value={item?.[ck]} onChange={v => setCell(sec.key, l.k, i, ck, v)} />
                                : <input type="text" value={item?.[ck] ?? ''} onChange={e => setCell(sec.key, l.k, i, ck, e.target.value)} />}
                            </div>
                          ))}
                        </div>
                        <div className="lacts">
                          <button type="button" className="mini" disabled={i === 0} onClick={() => move(sec.key, l.k, i, -1)}>↑</button>
                          <button type="button" className="mini" disabled={i === arr.length - 1} onClick={() => move(sec.key, l.k, i, 1)}>↓</button>
                          <button type="button" className="mini del" onClick={() => remove(sec.key, l.k, i)}>✕</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="add-row" onClick={() => add(sec.key, l)}>＋ Add {l.label.replace(/s$/, '')}</button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="site-foot">
        <span className="dirty-note">{dirty ? 'Unsaved changes' : ''}</span>
        <button className="btn btn-gold" onClick={onSave}>Save &amp; Publish</button>
      </div>
    </>
  );
}

function slug(s) {
  return ((s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item')
    + '-' + Math.random().toString(36).slice(2, 6);
}
