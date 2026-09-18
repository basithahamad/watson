import { SITE_URL } from './layout';

export const dynamic = 'force-dynamic';

// A single-page site: the sections are anchors on the home page, so the sitemap
// lists the page itself rather than inventing URLs that do not exist.
export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }
  ];
}
