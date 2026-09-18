// Drives the Site Content form. Adding a field here and a matching key in
// data/site.json is all that's needed to expose new copy to the client.
// `fields` are single values; `lists` are repeatable rows with add/remove/reorder.
export const SITE_SCHEMA = [
  { key: 'nav', title: 'Navigation', hint: 'The header menu and the mobile menu, in order', fields: [
    { k: 'ctaLabel', label: 'Button label' },
    { k: 'ctaHref', label: 'Button link — e.g. #contact' }],
    lists: [{ k: 'items', label: 'Menu links', cols: [['label', 'Label'], ['href', 'Link — e.g. #services']] }] },

  { key: 'topbar', title: 'Top Bar', hint: 'The thin strip above the navigation', fields: [
    { k: 'note', label: 'Left-hand note' }, { k: 'email', label: 'Contact email' }] },

  { key: 'hero', title: 'Hero', hint: 'The first screen visitors see', fields: [
    { k: 'eyebrow', label: 'Tagline above headline' },
    { k: 'headline', label: 'Headline — first part' },
    { k: 'headlineEm', label: 'Headline — highlighted words' },
    { k: 'lead', label: 'Intro paragraph', type: 'textarea', full: true },
    { k: 'cta1', label: 'Button 1 label' }, { k: 'cta2', label: 'Button 2 label' }],
    lists: [{ k: 'stats', label: 'Statistics', cols: [['value', 'Figure'], ['label', 'Description']] }] },

  { key: 'about', title: 'About Us', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'heading', label: 'Heading', full: true },
    { k: 'badgeValue', label: 'Badge figure' }, { k: 'badgeLabel', label: 'Badge caption' },
    { k: 'missionHeading', label: 'Mission heading' }, { k: 'visionHeading', label: 'Vision heading' },
    { k: 'mission', label: 'Mission statement', type: 'textarea', full: true },
    { k: 'vision', label: 'Vision statement', type: 'textarea', full: true }],
    lists: [{ k: 'paragraphs', label: 'Body paragraphs', plain: true, type: 'textarea' }] },

  { key: 'services', title: 'Consulting Services', hint: 'Numbering and icons are automatic', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'heading', label: 'Heading' },
    { k: 'intro', label: 'Intro line', type: 'textarea', full: true }],
    lists: [{ k: 'items', label: 'Services', cols: [['title', 'Title'], ['description', 'Description', 'textarea']] }] },

  { key: 'speakersSection', title: "Speaker's Bureau heading", hint: 'Speakers themselves live in the Speaker’s Bureau tab', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'heading', label: 'Heading' },
    { k: 'intro', label: 'Intro line', type: 'textarea', full: true },
    { k: 'ctaLabel', label: 'Button label' }] },

  { key: 'band', title: 'Call-to-action band', fields: [
    { k: 'heading', label: 'Heading — first part' },
    { k: 'headingEm', label: 'Heading — highlighted words' },
    { k: 'headingAfter', label: 'Heading — remainder' },
    { k: 'ctaLabel', label: 'Button label' },
    { k: 'text', label: 'Supporting line', type: 'textarea', full: true }] },

  { key: 'book', title: 'Featured Book', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'title', label: 'Book title' },
    { k: 'meta', label: 'Publisher / foreword line', full: true },
    { k: 'description', label: 'Description', type: 'textarea', full: true }],
    lists: [{ k: 'quotes', label: 'Endorsements', cols: [['quote', 'Quote', 'textarea'], ['name', 'Name'], ['affiliation', 'Affiliation', 'textarea']] }] },

  { key: 'testimonialsSection', title: 'Testimonials heading', hint: 'The quotes themselves live in the Testimonials tab', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'heading', label: 'Heading' },
    { k: 'intro', label: 'Intro line', type: 'textarea', full: true }] },

  { key: 'contact', title: 'Contact', fields: [
    { k: 'eyebrow', label: 'Section label' }, { k: 'heading', label: 'Heading' },
    { k: 'intro', label: 'Intro line', type: 'textarea', full: true }],
    lists: [
      { k: 'items', label: 'Contact details', cols: [['label', 'Label'], ['value', 'Value'], ['type', 'Type: email, phone or location']] },
      { k: 'socials', label: 'Social links', cols: [['name', 'Network'], ['label', 'Icon text'], ['url', 'URL']] }] },

  { key: 'footer', title: 'Footer', fields: [
    { k: 'blurb', label: 'Footer blurb', type: 'textarea', full: true },
    { k: 'copyright', label: 'Copyright line', full: true }] }
];
