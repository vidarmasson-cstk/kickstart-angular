/**
 * Replaces the kickstart's placeholder images with Circle K imagery from circlek.ie: uploads the images,
 * points the landing pages and the home page at them, republishes, and deletes the old placeholder assets.
 *
 * Idempotent: images already uploaded (matched by title) are reused.
 *
 *   csdx cm:stacks:migration --file-path contentstack/circlek-assets.migration.js -k <stack api key>
 *
 * The images belong to Circle K and are used here for an internal demo only.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENVIRONMENT = 'preview';
const LOCALE = 'en-us';
const BASE = 'https://www.circlek.ie/media-assets/';

const IMAGES = {
  coffee_hero: ['hero-desktop/2025-08/CK%20-%20Coffee%20-%20header%20image_desktop.png', 'Circle K coffee', 'A freshly made Circle K coffee'],
  coffee_cup: ['styles/image_1360/s3/image/2025-08/CK%20-%20Coffee%20-%20image_2.png', 'Coffee to go', 'Coffee to go in a Circle K cup'],
  drink_lifestyle: ['styles/image_1360/s3/image/2024-05/CK_Extra%20-%20What%20You%20Get_Drink_lifestyle_v2.png', 'Hot drink with Circle K Extra', 'A customer enjoying a hot drink'],
  bakery: ['card/2024-03/food_bakery.png', 'Fresh bakery', 'Freshly baked pastries'],
  meal_deal: ['styles/image_1360/s3/image/2024-03/food_meal_deal_2.png', 'Meal deal', 'A Circle K meal deal'],
  barista: ['card/2024-03/food_barrista.png', 'Barista coffee', 'Barista-style coffee'],
  hot_bakery: ['card/2024-03/food_hot_bakery.png', 'Hot food', 'Hot food from the counter'],
  ev_header: ['hero-desktop/2022-11/ev_header.jpeg', 'EV charging', 'An electric car charging at a Circle K station'],
  ev_howto: ['card/2025-04/CK%20-%20EV%20-%20Instrutions_01.jpg', 'How to charge', 'Plugging in at a Circle K charger'],
  car_wash: ['card/2023-09/car_wash_tile_1.jpg', 'Car wash', 'A car in the Circle K car wash'],
  fuel_banner: ['carousel-image/2024-09/CK_updated%20fuel%20banner_1000x640.png', 'Circle K fuel', 'Fuelling up at a Circle K station'],
};

module.exports = async ({ stackSDKInstance: stack }) => {
  // ---- 1. Upload (or reuse) the Circle K images
  const existing = (await stack.asset().query().find()).items ?? [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'circlek-'));
  const uid = {};
  for (const [key, [file, title, description]] of Object.entries(IMAGES)) {
    const found = existing.find((a) => a.title === title);
    if (found) { uid[key] = found.uid; continue; }
    const res = await fetch(BASE + file, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.log(`Skipped ${key}: download failed (${res.status})`); continue; }
    const name = decodeURIComponent(file.split('/').pop()).replace(/[^A-Za-z0-9._-]+/g, '-');
    const local = path.join(tmp, name);
    fs.writeFileSync(local, Buffer.from(await res.arrayBuffer()));
    const asset = await stack.asset().create({ upload: local, title, description });
    await asset.publish({ publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] } });
    uid[key] = asset.uid;
    console.log(`Uploaded ${title}`);
  }
  const newUids = new Set(Object.values(uid));

  // ---- 2. Point the content at the new images
  const update = async (ctUid, url, apply) => {
    const entries = (await stack.contentType(ctUid).entry().query({ query: { url } }).find()).items ?? [];
    for (const e of entries) {
      const entry = await stack.contentType(ctUid).entry(e.uid).fetch({ locale: LOCALE });
      apply(entry);
      await entry.update({ locale: LOCALE });
      await entry.publish({ publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] }, locale: LOCALE });
      console.log(`Updated and republished ${ctUid} ${url}`);
    }
  };
  const block = (entry, type) => (entry.blocks ?? []).filter((b) => b[type]).map((b) => b[type]);

  await update('landing_page', '/coffee', (e) => {
    block(e, 'hero').forEach((b) => { b.image = uid.coffee_hero; });
    block(e, 'offer_cards').forEach((b) => {
      const imgs = [uid.drink_lifestyle, uid.bakery, uid.meal_deal];
      (b.offers ?? []).forEach((o, i) => { o.image = imgs[i % imgs.length]; });
    });
    block(e, 'text_and_image').forEach((b) => { b.image = uid.coffee_cup; });
    block(e, 'app_download').forEach((b) => { b.image = uid.barista; });
  });

  await update('landing_page', '/ev-charging', (e) => {
    block(e, 'hero').forEach((b) => { b.image = uid.ev_header; b.theme = 'image'; });
  });

  await update('page', '/', (e) => {
    e.image = uid.fuel_banner;
    const imgs = [uid.car_wash, uid.hot_bakery, uid.ev_howto, uid.coffee_cup];
    (e.blocks ?? []).forEach((b, i) => { if (b.block) b.block.image = imgs[i % imgs.length]; });
  });

  // ---- 3. Remove the old placeholder images (only those no longer used)
  for (const a of existing) {
    if (newUids.has(a.uid) || Object.values(IMAGES).some(([, title]) => title === a.title)) continue;
    const refs = await stack.asset(a.uid).fetch({ include_publish_details: false }).catch(() => null);
    if (!refs) continue;
    await stack.asset(a.uid).delete();
    console.log(`Deleted old asset ${a.title || a.filename}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
};
