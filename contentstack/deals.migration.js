/**
 * Reusability demo: one "Deal" global field used in two content types.
 *
 *  - Global field `deal`: category, title, summary, image, badge, valid until, intro, steps, button.
 *  - New content type `deal_page` (URL /deals/...): its `blocks` field has a Deal block (the global field)
 *    and a Rich text block for terms.
 *  - `landing_page` gets the same Deal block, so a landing page can feature a deal.
 *
 * Also creates three sample deal pages, features one deal on /coffee, and publishes them.
 * Idempotent: re-running updates the global field and content types, and leaves existing entries alone.
 *
 *   csdx cm:stacks:migration --file-path contentstack/deals.migration.js -k <stack api key>
 */
const ENVIRONMENT = 'preview';
const LOCALE = 'en-us';

// ---- Field helpers (same shapes as landing-page.migration.js) --------------------------------
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
const date = (uid, name, extra = {}) =>
  base(uid, name, { data_type: 'isodate', startDate: null, endDate: null, field_metadata: { description: '', default_value: {}, date_only: true }, ...extra });
const select = (uid, name, choices, extra = {}) =>
  base(uid, name, {
    data_type: 'text', display_type: 'dropdown',
    enum: { advanced: true, choices: choices.map(([value, key]) => ({ value, key })) },
    field_metadata: { description: '', default_value: choices[0][0], default_key: choices[0][1], version: 3 },
    ...extra,
  });
const group = (uid, name, schema, extra = {}) =>
  base(uid, name, { data_type: 'group', field_metadata: { description: '', instruction: '' }, schema, ...extra });

// A modular block whose fields come from a global field: no schema, just `reference_to`
const globalFieldBlock = (uid, title, globalFieldUid) => ({ uid, title, reference_to: globalFieldUid });

// ---- The reusable global field ----------------------------------------------------------------
const DEAL = {
  uid: 'deal',
  title: 'Deal',
  description: 'A Circle K deal. Reused by Deal Page and Landing Page modular blocks.',
  schema: [
    select('category', 'Category', [['food', 'Food'], ['drinks', 'Drinks'], ['coffee', 'Coffee'], ['fuel', 'Fuel'], ['car_wash', 'Car wash']]),
    text('title', 'Title', { mandatory: true }),
    multiline('summary', 'Summary'),
    file('image', 'Image'),
    text('badge', 'Badge (sticker on the image, e.g. "Pick one")'),
    date('valid_until', 'Valid until'),
    multiline('intro', 'Intro'),
    group('steps', 'How it works', [text('text', 'Step', { mandatory: true })], { multiple: true }),
    text('cta_label', 'Button label'),
    text('cta_url', 'Button URL'),
  ],
};

const DEAL_PAGE = {
  title: 'Deal Page',
  uid: 'deal_page',
  description: 'A single deal, like the deal details screen in the Circle K app.',
  options: { is_page: true, singleton: false, title: 'title', sub_title: [], url_pattern: '/:title', url_prefix: '/deals/' },
  schema: [
    base('title', 'Title', { data_type: 'text', mandatory: true, unique: true, field_metadata: { _default: true, version: 3 } }),
    base('url', 'URL', { data_type: 'text', mandatory: true, unique: true, field_metadata: { _default: true, version: 3 } }),
    base('blocks', 'Blocks', {
      data_type: 'blocks', multiple: true, field_metadata: { instruction: '', description: '' },
      blocks: [
        globalFieldBlock('deal', 'Deal', DEAL.uid),
        { uid: 'rich_text', title: 'Rich text', schema: [html('content', 'Content', { mandatory: true })] },
      ],
    }),
  ],
};

// ---- Sample content (illustrative copy and prices) --------------------------------------------
const samplePages = (img) => [
  {
    title: '€3 Meal Deal',
    url: '/deals/meal-deal',
    blocks: [
      { deal: {
        category: 'food', title: '€3 Meal Deal', summary: 'Hot dog or wrap, a fountain drink and a bag of crisps!',
        image: img.meal_deal, badge: 'Pick one', valid_until: '2027-01-31',
        intro: 'Get ready for the best combo around!',
        steps: [
          { text: 'Take your pick between our famous hot dog or a freshly made wrap.' },
          { text: 'Add any size fountain drink.' },
          { text: 'Finish it off with a bag of crisps of your choice.' },
          { text: 'Scan the Circle K app at the till to get the deal price.' },
        ],
        cta_label: 'Get the app', cta_url: '/coffee#app',
      } },
      { rich_text: { content: '<h3>Terms</h3><p>Valid at participating stations while stocks last. One deal per transaction. Not valid with other offers.</p>' } },
    ],
  },
  {
    title: 'Barista Coffee for €1.99',
    url: '/deals/barista-coffee',
    blocks: [
      { deal: {
        category: 'coffee', title: 'Any barista coffee €1.99', summary: 'Latte, cappuccino or flat white, any size.',
        image: img.barista, badge: 'App only', valid_until: '2026-12-24',
        intro: 'Your morning just got better.',
        steps: [
          { text: 'Open the Circle K app and activate the deal.' },
          { text: 'Order any barista coffee at the counter or the machine.' },
          { text: 'Scan the app at the till.' },
        ],
        cta_label: 'Get the app', cta_url: '/coffee#app',
      } },
      { rich_text: { content: '<h3>Terms</h3><p>One coffee per day per app account. Plant-based milk included.</p>' } },
    ],
  },
  {
    title: 'Car Wash: Second Wash Half Price',
    url: '/deals/car-wash',
    blocks: [
      { deal: {
        category: 'car_wash', title: 'Second wash half price', summary: 'Buy a premium wash, get your next one at 50% off.',
        image: img.car_wash, badge: '-50%', valid_until: '2026-11-30',
        intro: 'Keep it shiny all winter.',
        steps: [
          { text: 'Buy any premium wash at the till or in the app.' },
          { text: 'You get a voucher for your next wash in the app.' },
          { text: 'Use it within 30 days at any Circle K car wash.' },
        ],
        cta_label: 'Find a car wash', cta_url: '/ev-charging#finder',
      } },
    ],
  },
];

// The deal featured on the /coffee landing page: same global field, different page type
const featuredDeal = (img) => ({
  deal: {
    category: 'coffee', title: 'Any barista coffee €1.99', summary: 'Latte, cappuccino or flat white, any size. Activate it in the app.',
    image: img.barista, badge: 'App only', valid_until: '2026-12-24',
    cta_label: 'See the deal', cta_url: '/deals/barista-coffee',
  },
});

async function upsertContentType(stack, def) {
  let ct = null;
  try { ct = await stack.contentType(def.uid).fetch(); } catch { /* new */ }
  if (ct) {
    // Keep fields added by later migrations (e.g. the Banner reference from banner.migration.js) where they are
    const schema = [...def.schema];
    ct.schema.forEach((f, i) => { if (!schema.some((d) => d.uid === f.uid)) schema.splice(i, 0, f); });
    Object.assign(ct, { title: def.title, description: def.description, schema, options: def.options });
    await ct.update();
    console.log(`Updated content type ${def.uid}`);
  } else {
    await stack.contentType().create({ content_type: def });
    console.log(`Created content type ${def.uid}`);
  }
}

module.exports = async ({ stackSDKInstance: stack }) => {
  const publish = { publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] }, locale: LOCALE };

  // ---- 1. Global field first: content types can only reference what exists
  let gf = null;
  try { gf = await stack.globalField(DEAL.uid).fetch(); } catch { /* new */ }
  if (gf) {
    Object.assign(gf, { title: DEAL.title, description: DEAL.description, schema: DEAL.schema });
    await gf.update();
    console.log('Updated global field deal');
  } else {
    await stack.globalField().create({ global_field: DEAL });
    console.log('Created global field deal');
  }

  // ---- 2. New Deal Page content type
  await upsertContentType(stack, DEAL_PAGE);

  // ---- 3. Landing Page gets the same global field as a block (after the hero, before other blocks)
  const lp = await stack.contentType('landing_page').fetch();
  const blocksField = lp.schema.find((f) => f.uid === 'blocks');
  if (!blocksField.blocks.some((b) => b.uid === 'deal')) {
    blocksField.blocks.splice(1, 0, globalFieldBlock('deal', 'Deal', DEAL.uid));
    await lp.update();
    console.log('Added Deal block to landing_page');
  }

  // ---- 4. Sample content, using images already in the stack
  const assets = (await stack.asset().query().find()).items ?? [];
  const byTitle = (t) => assets.find((a) => a.title === t)?.uid;
  const img = { meal_deal: byTitle('Meal deal'), barista: byTitle('Hot drink with Circle K Extra'), car_wash: byTitle('Car wash') };

  const existing = (await stack.contentType('deal_page').entry().query().find()).items ?? [];
  for (const page of samplePages(img)) {
    if (existing.some((e) => e.url === page.url)) { console.log(`Kept ${page.url}`); continue; }
    const entry = await stack.contentType('deal_page').entry().create({ entry: page }, { locale: LOCALE });
    await entry.publish(publish);
    console.log(`Created and published ${page.url}`);
  }

  const coffee = ((await stack.contentType('landing_page').entry().query({ query: { url: '/coffee' } }).find()).items ?? [])[0];
  if (coffee && !coffee.blocks.some((b) => b.deal)) {
    coffee.blocks.splice(1, 0, featuredDeal(img));
    await coffee.update({ locale: LOCALE });
    await coffee.publish(publish);
    console.log('Featured a deal on /coffee');
  }
};
