import { read } from '../lib/store';
import { SERVICE_ICONS, CONTACT_ICONS } from './icons';
import ContactForm, { NewsletterForm } from './ContactForm';

// Content is edited through /admin and must appear immediately, so this page is
// rendered per request rather than cached at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [site, content] = await Promise.all([read('site'), read('content')]);

  const hero = site.hero || {};
  const about = site.about || {};
  const services = site.services || {};
  const spk = site.speakersSection || {};
  const band = site.band || {};
  const book = site.book || {};
  const tst = site.testimonialsSection || {};
  const contact = site.contact || {};
  const footer = site.footer || {};
  const topbar = site.topbar || {};

  const speakers = content.speakers || [];
  const testimonials = content.testimonials || [];

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>{topbar.note}</span>
          <span><a href={`mailto:${topbar.email}`}>{topbar.email}</a></span>
        </div>
      </div>

      <header className="nav">
        <div className="wrap">
          <a className="logo" href="#top">
            <img className="logo-img" src="/assets/img/ww-logo.png" alt="Watson &amp; Watson Associates, LLC" />
          </a>
          <nav>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#speakers">Speaker&apos;s Bureau</a></li>
              <li><a href="#book">Book</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#contact">Contact</a></li>
              <li className="nav-cta"><a className="btn btn-gold" href="#contact">Request a Speaker</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="hero" id="top" style={{ padding: 0 }}>
        <div className="hero-inner">
          <div className="wrap">
            <span className="eyebrow">{hero.eyebrow}</span>
            <h1>{hero.headline} <em>{hero.headlineEm}</em></h1>
            <p className="lead" dangerouslySetInnerHTML={{ __html: hero.lead || '' }} />
            <div className="hero-actions">
              <a className="btn btn-gold" href="#contact">{hero.cta1}</a>
              <a className="btn btn-outline" href="#speakers">{hero.cta2}</a>
            </div>
          </div>
          <div className="hero-stats">
            {(hero.stats || []).map((s, i) => (
              <div className="hstat" key={i}><b>{s.value}</b><span>{s.label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="wrap">
          <div className="about-photo">
            <div className="frame">
              <img src="/assets/img/ww-about.jpg" alt="Consulting team collaborating around a table" />
            </div>
            <div className="about-badge"><b>{about.badgeValue}</b><span>{about.badgeLabel}</span></div>
          </div>
          <div>
            <span className="eyebrow">{about.eyebrow}</span>
            <h2>{about.heading}</h2>
            {(about.paragraphs || []).map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p || '' }} />)}
            <div className="mission-cards">
              <div className="mission-card">
                <h3>{about.missionHeading}</h3>
                <p dangerouslySetInnerHTML={{ __html: about.mission || '' }} />
              </div>
              <div className="mission-card">
                <h3>{about.visionHeading}</h3>
                <p dangerouslySetInnerHTML={{ __html: about.vision || '' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{services.eyebrow}</span>
            <h2>{services.heading}</h2>
            <p dangerouslySetInnerHTML={{ __html: services.intro || '' }} />
          </div>
          <div className="svc-grid">
            {(services.items || []).map((s, i) => (
              <div className="svc" key={i}>
                <span className="svc-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="svc-icon">{SERVICE_ICONS[i] || SERVICE_ICONS[SERVICE_ICONS.length - 1]}</div>
                <h3>{s.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: s.description || '' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="speakers" id="speakers">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{spk.eyebrow}</span>
            <h2>{spk.heading}</h2>
            <p dangerouslySetInnerHTML={{ __html: spk.intro || '' }} />
          </div>
          <div className="spk-grid">
            {speakers.map((s, i) => (
              <article className="spk" key={s.id || i}>
                {s.image && <img src={s.image.startsWith('/') ? s.image : `/${s.image}`} alt={s.name} />}
                <div className="veil" />
                <div className="txt">
                  <h3>{s.name}</h3>
                  <div className="role">{s.role}</div>
                  <p dangerouslySetInnerHTML={{ __html: s.bio || '' }} />
                  <div className="topics">
                    {(s.topics || []).map((t, j) => <span className="topic" key={j}>{t}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="spk-cta">
            <a className="btn btn-navy" href="#contact">{spk.ctaLabel}</a>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div>
            <h2>{band.heading} <em>{band.headingEm}</em> {band.headingAfter}</h2>
            <p dangerouslySetInnerHTML={{ __html: band.text || '' }} />
          </div>
          <a className="btn btn-gold" href="#contact">{band.ctaLabel}</a>
        </div>
      </section>

      <section className="book" id="book">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{book.eyebrow}</span>
            <h2>{book.title}</h2>
            <div className="book-sub">{book.meta}</div>
            <p style={{ marginTop: '1.1rem' }} dangerouslySetInnerHTML={{ __html: book.description || '' }} />
          </div>
          <div className="praise">
            {(book.quotes || []).map((q, i) => (
              <blockquote key={i}>
                <q dangerouslySetInnerHTML={{ __html: q.quote || '' }} />
                <cite><b>{q.name}</b>{q.affiliation}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{tst.eyebrow}</span>
            <h2>{tst.heading}</h2>
            <p dangerouslySetInnerHTML={{ __html: tst.intro || '' }} />
          </div>
          <div className="tst-grid">
            {testimonials.map((t, i) => (
              <div className="tst" key={t.id || i}>
                <q dangerouslySetInnerHTML={{ __html: t.quote || '' }} />
                <div className="tst-who">
                  {t.image && (
                    <div className="tst-ava">
                      <img src={t.image.startsWith('/') ? t.image : `/${t.image}`} alt="" />
                    </div>
                  )}
                  <div><b>{t.name}</b><span>{t.title}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="wrap">
          <div className="news-inner">
            <div>
              <span className="eyebrow">{site.newsletter?.eyebrow || 'Stay Connected'}</span>
              <h2>{site.newsletter?.heading || 'Insights for leaders, delivered to your inbox'}</h2>
              <p dangerouslySetInnerHTML={{ __html: site.newsletter?.text || 'Join our mailing list for leadership insights, speaking availability, and firm updates.' }} />
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="wrap">
          <div>
            <span className="eyebrow">{contact.eyebrow}</span>
            <h2>{contact.heading}</h2>
            <p className="contact-intro" dangerouslySetInnerHTML={{ __html: contact.intro || '' }} />
            {(contact.items || []).map((c, i) => (
              <div className="contact-item" key={i}>
                <div className="ci-icon">{CONTACT_ICONS[c.type] || CONTACT_ICONS.email}</div>
                <div>
                  <b>{c.label}</b>
                  <span>
                    {c.type === 'email' ? <a href={`mailto:${c.value}`}>{c.value}</a> : c.value}
                  </span>
                </div>
              </div>
            ))}
            <div className="socials">
              {(contact.socials || []).map((s, i) => (
                <a href={s.url || '#'} aria-label={s.name || s.label} key={i}>{s.label}</a>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="logo" style={{ marginBottom: '1.1rem' }}>
                <img className="logo-img-foot" src="/assets/img/ww-logo.png" alt="Watson &amp; Watson Associates, LLC" />
              </div>
              <p>{footer.blurb}</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#speakers">Speaker&apos;s Bureau</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4>Engage</h4>
              <ul>
                <li><a href="#contact">Book a Consultation</a></li>
                <li><a href="#contact">Request a Speaker</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4>Connect</h4>
              <ul>
                {(contact.socials || []).map((s, i) => (
                  <li key={i}><a href={s.url || '#'}>{s.name || s.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>{footer.copyright}</span>
            <span><a href="#">Privacy Policy</a> &nbsp;·&nbsp; <a href="#">Terms of Use</a></span>
          </div>
        </div>
      </footer>
    </>
  );
}
