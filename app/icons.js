// Section iconography. These belong to the design, not to the editable content,
// so they live in code and are matched to services by position. A service added
// in the admin beyond this list reuses the last icon.
export const SERVICE_ICONS = [
  <svg viewBox="0 0 24 24" key="a"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M17 9a4 4 0 0 1 0 6M20 6.5a8 8 0 0 1 0 11" /></svg>,
  <svg viewBox="0 0 24 24" key="b"><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="4" /></svg>,
  <svg viewBox="0 0 24 24" key="c"><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /></svg>,
  <svg viewBox="0 0 24 24" key="d"><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="M14 6l4 4" /></svg>,
  <svg viewBox="0 0 24 24" key="e"><path d="M4 4h7v16H4zM13 4h7v16h-7z" /><path d="M7 8h1M16 8h1" /></svg>,
  <svg viewBox="0 0 24 24" key="f"><path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" /><path d="M12 8v4M12 15v.5" /></svg>,
  <svg viewBox="0 0 24 24" key="g"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3M7 9h10M7 13h6" /></svg>,
  <svg viewBox="0 0 24 24" key="h"><path d="M3 6h13v13a2 2 0 0 0 2 2H5a2 2 0 0 1-2-2V6Z" /><path d="M16 10h5v9a2 2 0 0 1-2 2M6 10h7M6 14h7" /></svg>,
  <svg viewBox="0 0 24 24" key="i"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
];

export const CONTACT_ICONS = {
  email: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  phone: <svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>,
  location: <svg viewBox="0 0 24 24"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
};
