/**
 * Replaces the kickstart's home page text with Circle K copy (images are left as they are), then republishes.
 *
 *   csdx cm:stacks:migration --file-path contentstack/homepage-copy.migration.js -k <stack api key>
 */
const ENVIRONMENT = 'preview';
const LOCALE = 'en-us';

const COPY = {
  title: 'Making your stop easy',
  description: 'Fuel, fast charging, fresh coffee and food on the go, at stations near you.',
  rich_text:
    '<p>Whether you are filling up, charging your car or grabbing a coffee, we make every stop quick and easy. ' +
    'Check out our <a href="/coffee">coffee and food offers</a> or find out how <a href="/ev-charging">EV charging</a> works.</p>',
  // In block order; matches the images on the blocks (car wash, hot food, EV charging)
  blocks: [
    {
      title: 'A spotless car in minutes',
      copy: '<p>Drive through our automatic car wash or use the self-service bays. Choose the programme that suits you, from a quick rinse to a full wash and wax.</p>',
    },
    {
      title: 'Fresh food, ready when you are',
      copy: '<p>Hot food, fresh sandwiches and pastries baked in store every day. Pair them with a barista-style coffee. <a href="/coffee">See this week’s offers</a>.</p>',
    },
    {
      title: 'Charge up on the go',
      copy: '<p>High-power chargers at stations near you: plug in, top up in around 20 minutes, and grab a coffee while you wait. <a href="/ev-charging">How EV charging works</a>.</p>',
    },
  ],
};

module.exports = async ({ stackSDKInstance: stack }) => {
  const found = (await stack.contentType('page').entry().query({ query: { url: '/' } }).find()).items ?? [];
  if (!found.length) throw new Error('No page entry with url "/"');
  const entry = await stack.contentType('page').entry(found[0].uid).fetch({ locale: LOCALE });

  entry.title = COPY.title;
  entry.description = COPY.description;
  entry.rich_text = COPY.rich_text;
  (entry.blocks ?? []).forEach((b, i) => {
    if (b.block && COPY.blocks[i]) Object.assign(b.block, COPY.blocks[i]);
  });

  await entry.update({ locale: LOCALE });
  await entry.publish({ publishDetails: { environments: [ENVIRONMENT], locales: [LOCALE] }, locale: LOCALE });
  console.log('Home page copy updated and republished');
};
