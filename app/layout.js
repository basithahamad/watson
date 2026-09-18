import './globals.css';
import { read } from '../lib/store';

// Absolute URLs are required for Open Graph and canonical tags; the domain is a
// deployment fact rather than content, so it comes from the environment.
export const SITE_URL = process.env.SITE_URL || 'https://watsonwatsonassociates.com';

export async function generateMetadata() {
  const site = await read('site').catch(() => ({}));
  const seo = site.seo || {};
  const title = seo.title || "Watson & Watson Associates, LLC — Consulting & Speaker's Bureau";
  const description = seo.description ||
    'Strategic communications and consulting at the intersection of higher education, ' +
    'journalism, and leadership development.';
  const image = seo.ogImage || '/assets/img/ww-hero.jpg';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: seo.siteName || 'Watson & Watson Associates',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: seo.siteName || 'Watson & Watson Associates',
      title,
      description,
      url: '/',
      locale: 'en_US',
      images: [{ url: image, width: 1800, height: 1350, alt: title }]
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
    }
  };
}

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
