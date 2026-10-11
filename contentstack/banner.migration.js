/**
 * References demo: a simple Banner content type, referenced from Landing Page and Deal Page.
 *
 * A global field (like `deal`) copies a structure into each entry. A reference points at a separate entry
 * instead: one banner can appear on many pages, and editing it once changes it everywhere.
 *
 *  - Content type `banner`: title, message, link label, link URL.
 *  - A single `banner` reference field on `landing_page` and `deal_page`.
 *  - Two sample banners; the app banner is shared by three pages.
 *
 * Idempotent: re-running updates the content type, and leaves existing banners and page links alone.
 *
 *   csdx cm:stacks:migration --file-path contentstack/banner.migration.js -k <stack api key>
 */
const ENVIRONMENT = 'preview';
const LOCALE = 'en-us';

const base = (uid, display_name, extra = {}) => ({
  uid, display_name, mandatory: false, unique: false, multiple: false, non_localizable: false, ...extra,
});
const text = (uid, name, extra = {}) =>
  base(uid, name, { data_type: 'text', field_metadata: { description: '', default_value: '', version: 3 }, ...extra });

const BANNER = {
  title: 'Banner',
  uid: 'banner',
  description: 'A short message with a link, shown at the top of a page. Referenced from Landing Page and Deal Page.',
  options: { is_page: false, singleton: false, title: 'title', sub_title: [] },
  schema: [
    base('title', 'Title (internal name)', { data_type: 'text', mandatory: true, unique: true, field_metadata: { _default: true, version: 3 } }),
    text('message', 'Message', { mandatory: true }),
    text('link_label', 'Link label'),
    text('link_url', 'Link URL'),
  ],
};

// One reference field, the same on both page types. ref_multiple: false = at most one banner per page.
const BANNER_FIELD = base('banner', 'Banner', {
  data_type: 'reference',
  reference_to: [BANNER.uid],
  field_metadata: { ref_multiple: false, ref_multiple_content_types: true },
});

// Illustrative copy
const BANNERS = [
  { title: 'Circle K app', message: 'Pay at the pump and unlock app-only deals with the Circle K app.', link_label: 'Get the app', link_url: '/coffee#app' },
  { title: 'EV charging', message: 'Fast charging up to 300 kW at selected stations. Grab a coffee while you wait.', link_label: 'Find a charger', link_url: '/ev-charging#finder' },
];

// Which page shows which banner: the app banner is one entry, used on three pages
const LINKS = [
  ['landing_page', '/coffee', 'Circle K app'],
  ['deal_page', '/deals/meal-deal', 'Circle K app'],
  ['deal_page', '/deals/barista-coffee', 'Circle K app'],
  ['landing_page', '/ev-charging', 'EV charging'],
  ['deal_page', '/deals/car-wash', 'EV charging'],
];

module.exports = async ({ stackSDKInstance: stack }) => {
  const publish = { publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] }, locale: LOCALE };

  // ---- 1. The Banner content type: it must exist before other types can reference it
  let ct = null;
  try { ct = await stack.contentType(BANNER.uid).fetch(); } catch { /* new */ }
  if (ct) {
    Object.assign(ct, { title: BANNER.title, description: BANNER.description, schema: BANNER.schema, options: BANNER.options });
    await ct.update();
    console.log('Updated content type banner');
  } else {
    await stack.contentType().create({ content_type: BANNER });
    console.log('Created content type banner');
  }

  // ---- 2. The reference field on both page types, right after the URL
  for (const uid of ['landing_page', 'deal_page']) {
    const page = await stack.contentType(uid).fetch();
    if (page.schema.some((f) => f.uid === BANNER_FIELD.uid)) continue;
    page.schema.splice(page.schema.findIndex((f) => f.uid === 'url') + 1, 0, BANNER_FIELD);
    await page.update();
    console.log(`Added Banner reference to ${uid}`);
  }

  // ---- 3. Sample banners
  const existing = (await stack.contentType(BANNER.uid).entry().query().find()).items ?? [];
  const bannerUid = {};
  for (const banner of BANNERS) {
    let entry = existing.find((e) => e.title === banner.title);
    if (!entry) {
      entry = await stack.contentType(BANNER.uid).entry().create({ entry: banner }, { locale: LOCALE });
      await entry.publish(publish);
      console.log(`Created and published banner "${banner.title}"`);
    }
    bannerUid[banner.title] = entry.uid;
  }

  // ---- 4. Point pages at a banner, unless an editor already chose one. A reference is stored as uid + content type.
  for (const [contentType, url, title] of LINKS) {
    const entry = ((await stack.contentType(contentType).entry().query({ query: { url } }).find()).items ?? [])[0];
    if (!entry || entry.banner?.length) continue;
    entry.banner = [{ uid: bannerUid[title], _content_type_uid: BANNER.uid }];
    await entry.update({ locale: LOCALE });
    await entry.publish(publish);
    console.log(`Linked banner "${title}" on ${url}`);
  }
};
