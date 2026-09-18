import { SITE_URL } from './layout';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The editor and the API are not content.
        disallow: ['/admin', '/api/']
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
