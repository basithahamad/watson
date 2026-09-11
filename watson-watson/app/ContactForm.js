'use client';

// Carried over from the static site as-is. Both this and the newsletter form are
// still placeholders — nothing is sent or stored yet. Wiring them to a real
// destination is tracked separately.
export default function ContactForm() {
  return (
    <form
      className="contact-form"
      onSubmit={e => {
        e.preventDefault();
        alert('Demo only — submissions will be emailed and/or stored once the site is live.');
      }}
    >
      <h3>Send us a message</h3>
      <div className="cf-grid">
        <div><label>First name</label><input type="text" required /></div>
        <div><label>Last name</label><input type="text" required /></div>
        <div><label>Email</label><input type="email" required /></div>
        <div><label>Phone</label><input type="tel" /></div>
        <div className="full">
          <label>I&apos;m interested in…</label>
          <select>
            <option>Booking a consultation</option>
            <option>Requesting a speaker</option>
            <option>General inquiry</option>
          </select>
        </div>
        <div className="full">
          <label>Message</label>
          <textarea placeholder="Tell us about your organization and goals…" />
        </div>
        <div className="full"><button className="btn btn-gold" type="submit">Submit Inquiry</button></div>
      </div>
    </form>
  );
}

export function NewsletterForm() {
  return (
    <form
      className="news-form"
      onSubmit={e => {
        e.preventDefault();
        alert('Demo only — this form will connect to Brevo.');
      }}
    >
      <input type="text" placeholder="First name" aria-label="First name" />
      <input type="text" placeholder="Last name" aria-label="Last name" />
      <input className="full" type="email" placeholder="Email address" aria-label="Email address" required />
      <button className="btn btn-navy full" type="submit">Subscribe</button>
      <span className="news-note">We respect your privacy. Unsubscribe at any time.</span>
    </form>
  );
}
