import { ImageResponse } from 'next/og';
import { read } from '../lib/store';

// The share card, rendered at the 1200x630 every platform asks for. A link to
// the firm now previews as the firm rather than as a cropped photograph.
export const alt = 'Watson & Watson Associates, LLC';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const site = await read('site').catch(() => ({}));
  const hero = site.hero || {};
  const eyebrow = hero.eyebrow || 'Consulting & Speaker’s Bureau';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #081627 0%, #0f2743 55%, #1c3f66 100%)',
          color: '#fff',
          fontFamily: 'serif'
        }}
      >
        <div style={{ display: 'flex', width: 120, height: 8, background: '#c29a4a', borderRadius: 4 }} />

        <div style={{ display: 'flex', fontSize: 84, marginTop: 40, lineHeight: 1.08 }}>
          Watson &amp; Watson
        </div>
        <div style={{ display: 'flex', fontSize: 46, color: '#e2c078', marginTop: 8, fontStyle: 'italic' }}>
          Associates, LLC
        </div>

        <div style={{ display: 'flex', fontSize: 28, marginTop: 30, color: '#c8d3e2', maxWidth: 900 }}>
          {eyebrow}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 52,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#c29a4a',
            fontFamily: 'sans-serif'
          }}
        >
          watsonwatsonassociates.com
        </div>
      </div>
    ),
    size
  );
}
