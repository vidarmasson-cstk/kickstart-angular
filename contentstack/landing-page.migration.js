/**
 * Adds a Circle K style "Landing Page" content type with marketing block types, two sample landing
 * pages, a delivery + preview token for the app, and points the preview environment at Angular's port.
 *
 * Idempotent: re-running updates the content type and leaves existing entries and tokens alone.
 *
 *   csdx cm:stacks:migration --file-path contentstack/landing-page.migration.js -k <stack api key>
 */
const fs = require('fs');
const path = require('path');

const ENVIRONMENT = 'preview';
const LOCALE = 'en-us';
const APP_URL = 'http://localhost:4200/';

// ---- Field helpers ---------------------------------------------------------------------------
const base = (uid, display_name, extra = {}) => ({
  uid, display_name, mandatory: false, unique: false, multiple: false, non_localizable: false, ...extra,
});
const text = (uid, name, extra = {}) =>
  base(uid, name, { data_type: 'text', field_metadata: { description: '', default_value: '', version: 3 }, ...extra });
const multiline = (uid, name, extra = {}) =>
  base(uid, name, { data_type: 'text', field_metadata: { description: '', default_value: '', multiline: true, version: 3 }, ...extra });
const html = (uid, name, extra = {}) =>
  base(uid, name, {
    data_type: 'text',
    field_metadata: {
      allow_rich_text: true, description: '', multiline: false, rich_text_type: 'custom',
      options: ['html', 'bold', 'italic', 'underline', 'lists', 'link', 'h2', 'h3'], version: 3,
    },
    ...extra,
  });
const file = (uid, name, extra = {}) =>
  base(uid, name, { data_type: 'file', extensions: [], field_metadata: { description: '', rich_text_type: 'standard' }, ...extra });
const select = (uid, name, choices, extra = {}) =>
  base(uid, name, {
    data_type: 'text', display_type: 'dropdown',
    enum: { advanced: true, choices: choices.map(([value, key]) => ({ value, key })) },
    field_metadata: { description: '', default_value: choices[0][0], default_key: choices[0][1], version: 3 },
    ...extra,
  });
const group = (uid, name, schema, extra = {}) =>
  base(uid, name, { data_type: 'group', field_metadata: { description: '', instruction: '' }, schema, ...extra });
const cta = (prefix = 'cta') => [text(`${prefix}_label`, 'Button label'), text(`${prefix}_url`, 'Button URL')];
const block = (uid, title, schema) => ({ uid, title, schema });

const BLOCKS = [
  block('hero', 'Hero', [
    text('headline', 'Headline', { mandatory: true }),
    multiline('subheadline', 'Subheadline'),
    file('image', 'Image'),
    ...cta(),
    select('theme', 'Theme', [['red', 'Circle K red'], ['image', 'Image with dark overlay'], ['light', 'Light']]),
  ]),
  block('offer_cards', 'Offer cards', [
    text('heading', 'Heading'),
    multiline('intro', 'Intro'),
    group('offers', 'Offers', [
      text('title', 'Title', { mandatory: true }),
      multiline('description', 'Description'),
      text('price', 'Price'),
      text('price_note', 'Price note'),
      text('badge', 'Badge (e.g. "New", "App deal")'),
      file('image', 'Image'),
      text('link_url', 'Link URL'),
    ], { multiple: true }),
  ]),
  block('services_grid', 'Services grid', [
    text('heading', 'Heading'),
    multiline('intro', 'Intro'),
    group('services', 'Services', [
      text('title', 'Title', { mandatory: true }),
      multiline('description', 'Description'),
      text('icon', 'Icon (emoji or short label)'),
      text('link_url', 'Link URL'),
    ], { multiple: true }),
  ]),
  block('text_and_image', 'Text and image', [
    text('heading', 'Heading'),
    html('copy', 'Copy'),
    file('image', 'Image'),
    select('image_position', 'Image position', [['right', 'Image right'], ['left', 'Image left']]),
    ...cta(),
  ]),
  block('promo_banner', 'Promo banner', [
    text('heading', 'Heading', { mandatory: true }),
    multiline('text', 'Text'),
    select('background', 'Background', [['red', 'Red'], ['orange', 'Orange'], ['dark', 'Dark']]),
    ...cta(),
    multiline('legal', 'Small print'),
  ]),
  block('stats', 'Stats', [
    text('heading', 'Heading'),
    group('items', 'Items', [text('value', 'Value', { mandatory: true }), text('label', 'Label')], { multiple: true }),
  ]),
  block('app_download', 'App download', [
    text('heading', 'Heading', { mandatory: true }),
    multiline('text', 'Text'),
    file('image', 'Image'),
    text('app_store_url', 'App Store URL'),
    text('google_play_url', 'Google Play URL'),
  ]),
  block('station_finder', 'Station finder', [
    text('heading', 'Heading', { mandatory: true }),
    multiline('text', 'Text'),
    text('placeholder', 'Search placeholder'),
    text('button_label', 'Button label'),
    text('finder_url', 'Station finder URL'),
  ]),
  block('faq', 'FAQ', [
    text('heading', 'Heading'),
    group('items', 'Questions', [text('question', 'Question', { mandatory: true }), html('answer', 'Answer')], { multiple: true }),
  ]),
  block('rich_text', 'Rich text', [html('content', 'Content', { mandatory: true })]),
];

const CONTENT_TYPE = {
  title: 'Landing Page',
  uid: 'landing_page',
  description: 'Marketing landing page built from blocks.',
  options: { is_page: true, singleton: false, title: 'title', sub_title: [], url_pattern: '/:title', url_prefix: '/' },
  schema: [
    base('title', 'Title', { data_type: 'text', mandatory: true, unique: true, field_metadata: { _default: true, version: 3 } }),
    base('url', 'URL', { data_type: 'text', mandatory: true, unique: true, field_metadata: { _default: true, version: 3 } }),
    base('blocks', 'Blocks', { data_type: 'blocks', multiple: true, blocks: BLOCKS, field_metadata: { instruction: '', description: '' } }),
    group('seo', 'SEO', [text('meta_title', 'Meta title'), multiline('meta_description', 'Meta description')]),
  ],
};

// ---- Sample pages (illustrative copy and prices) ---------------------------------------------
const samplePages = (img) => [
  {
    title: 'Coffee & Food',
    url: '/coffee',
    seo: { meta_title: 'Fresh coffee and food on the go', meta_description: 'Barista-style coffee, hot food and snacks at your local station.' },
    blocks: [
      { hero: { headline: 'Great coffee. Every stop.', subheadline: 'Freshly ground beans, hot food and sweet treats, ready when you are.', image: img[0], cta_label: 'See offers', cta_url: '#offers', theme: 'image' } },
      { offer_cards: { heading: 'This week’s offers', intro: 'Grab a deal with the app or at the till.', offers: [
        { title: 'Any hot drink', description: 'Coffee, tea or hot chocolate, any size.', price: '€1.99', price_note: 'With the app', badge: 'App deal', image: img[1] },
        { title: 'Coffee + pastry', description: 'Your favourite coffee with a fresh cinnamon bun.', price: '€3.49', price_note: 'Until Sunday', badge: 'New', image: img[2] },
        { title: 'Hot dog meal', description: 'Classic hot dog, crisps and a soft drink.', price: '€4.99', price_note: 'All day', image: img[3] },
      ] } },
      { text_and_image: { heading: 'Ground fresh for every cup', copy: '<p>Our beans are roasted for a smooth, full flavour and ground fresh for every cup.</p><ul><li>Rainforest Alliance certified beans</li><li>Oat and soy milk at no extra cost</li><li>Bring your own cup and save</li></ul>', image: img[1], image_position: 'right', cta_label: 'Find a station', cta_url: '/ev-charging' } },
      { promo_banner: { heading: 'Get your 6th coffee free', text: 'Collect stamps in the app with every hot drink.', background: 'orange', cta_label: 'Get the app', cta_url: '#app', legal: 'Illustrative demo offer. Terms apply.' } },
      { app_download: { heading: 'Deals in your pocket', text: 'Pay at the pump, collect rewards and unlock app-only offers.', image: img[2], app_store_url: 'https://apps.apple.com', google_play_url: 'https://play.google.com' } },
    ],
  },
  {
    title: 'EV Charging',
    url: '/ev-charging',
    seo: { meta_title: 'Fast EV charging', meta_description: 'High-power chargers with coffee and food while you wait.' },
    blocks: [
      { hero: { headline: 'Charge up. Refuel yourself too.', subheadline: 'High-power chargers at stations near you, with coffee and food while you wait.', image: img[3], cta_label: 'Find a charger', cta_url: '#finder', theme: 'red' } },
      { stats: { heading: 'Charging made simple', items: [{ value: '150 kW', label: 'Up to, at fast chargers' }, { value: '20 min', label: 'Typical top-up' }, { value: '24/7', label: 'At many stations' }] } },
      { services_grid: { heading: 'While you charge', intro: 'Make the most of your stop.', services: [
        { title: 'Coffee & food', description: 'Fresh coffee, hot food and snacks.', icon: '☕', link_url: '/coffee' },
        { title: 'Car wash', description: 'Automatic and self-service wash.', icon: '🚿' },
        { title: 'Free Wi-Fi', description: 'Stay connected while you wait.', icon: '📶' },
        { title: 'Clean restrooms', description: 'Open whenever we are.', icon: '🚻' },
      ] } },
      { station_finder: { heading: 'Find a charger near you', text: 'Search by city or postcode.', placeholder: 'City or postcode', button_label: 'Search', finder_url: '#' } },
      { faq: { heading: 'Questions about charging', items: [
        { question: 'How do I pay?', answer: '<p>Tap a card at the charger or pay in the app.</p>' },
        { question: 'Which cars can charge?', answer: '<p>All cars with a CCS2 connector. Some stations also offer Type 2.</p>' },
        { question: 'Can I reserve a charger?', answer: '<p>Not yet: chargers are first come, first served.</p>' },
      ] } },
    ],
  },
];

module.exports = async ({ stackSDKInstance, managementAPIClient }) => {
  const stack = stackSDKInstance;

  // 1. Content type: create, or update it in place
  let exists = true;
  try { await stack.contentType(CONTENT_TYPE.uid).fetch(); } catch { exists = false; }
  if (exists) {
    const ct = await stack.contentType(CONTENT_TYPE.uid).fetch();
    Object.assign(ct, { title: CONTENT_TYPE.title, description: CONTENT_TYPE.description, schema: CONTENT_TYPE.schema, options: CONTENT_TYPE.options });
    await ct.update();
    console.log('Updated content type landing_page');
  } else {
    await stack.contentType().create({ content_type: CONTENT_TYPE });
    console.log('Created content type landing_page');
  }

  // 2. Sample entries, using the stack's existing images
  const assets = (await stack.asset().query({ query: { content_type: { $regex: '^image/' } } }).find()).items ?? [];
  const img = [0, 1, 2, 3].map((i) => assets[i % Math.max(assets.length, 1)]?.uid).filter(Boolean);
  const existing = (await stack.contentType(CONTENT_TYPE.uid).entry().query().find()).items ?? [];
  for (const page of samplePages(img)) {
    if (existing.some((e) => e.url === page.url)) {
      console.log(`Entry ${page.url} exists, left as is`);
      continue;
    }
    const entry = await stack.contentType(CONTENT_TYPE.uid).entry().create({ entry: page }, { locale: LOCALE });
    await entry.publish({ publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] }, locale: LOCALE });
    console.log(`Created and published ${page.url}`);
  }

  // 3. Preview environment URL -> Angular dev server
  const env = await stack.environment(ENVIRONMENT).fetch();
  if (!env.urls?.some((u) => u.url === APP_URL)) {
    env.urls = [{ url: APP_URL, locale: LOCALE }];
    await env.update();
    console.log(`Preview environment URL set to ${APP_URL}`);
  }

  // 4. Delivery + preview token for the app, written straight into .env (never printed)
  const envFile = path.join(__dirname, '..', '.env');
  const dotenv = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  if (/NG_APP_CONTENTSTACK_DELIVERY_TOKEN=(your_|\s*$)/m.test(dotenv)) {
    const created = await stack.deliveryToken().create({
      token: {
        name: 'Angular kickstart',
        description: 'Used by the local Angular app',
        scope: [
          { module: 'environment', environments: [ENVIRONMENT], acl: { read: true } },
          { module: 'branch', branches: ['main'], acl: { read: true } },
        ],
      },
    });
    const apiKey = stack.api_key ?? stack.stackHeaders?.api_key;
    const res = await managementAPIClient.axiosInstance.post(
      `/stacks/delivery_tokens/${created.uid}/preview_token`, {}, { headers: { api_key: apiKey } },
    );
    const previewToken = res.data?.token?.preview_token;
    const updated = dotenv
      .replace(/^NG_APP_CONTENTSTACK_DELIVERY_TOKEN=.*$/m, `NG_APP_CONTENTSTACK_DELIVERY_TOKEN=${created.token}`)
      .replace(/^NG_APP_CONTENTSTACK_PREVIEW_TOKEN=.*$/m, `NG_APP_CONTENTSTACK_PREVIEW_TOKEN=${previewToken ?? ''}`);
    fs.writeFileSync(envFile, updated);
    console.log(`Delivery token created${previewToken ? ' with a preview token' : ' (preview token not returned: create it in the UI)'}; written to .env`);
  }
};
