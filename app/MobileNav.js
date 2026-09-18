'use client';

import { useEffect, useState } from 'react';

// Below 920px the desktop nav is hidden, which previously left phone visitors
// with no way to reach any section. This is the replacement: a real button with
// aria-expanded, closing on Escape, on outside navigation, and after a choice.
export function MobileNav({ items, cta }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-burger"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(o => !o)}
      >
        <span className={open ? 'burger-bars open' : 'burger-bars'} aria-hidden="true">
          <i /><i /><i />
        </span>
      </button>

      <div id="mobile-menu" className={open ? 'mobile-menu open' : 'mobile-menu'} hidden={!open}>
        <ul>
          {items.map(item => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
            </li>
          ))}
          {cta && (
            <li>
              <a className="btn btn-gold" href={cta.href} onClick={() => setOpen(false)}>{cta.label}</a>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
