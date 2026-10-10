// Uploads the Circle K logo (public/circlek-logo.svg) as a stack asset and prints its URL, used in the header.

const fs = require('fs'); const path = require('path');
module.exports = async ({ stackSDKInstance: stack }) => {
  const existing = (await stack.asset().query({ query: { title: 'Circle K logo' } }).find()).items ?? [];
  const a = existing[0] ?? await stack.asset().create({ upload: path.join(__dirname, '..', 'public', 'circlek-logo.svg'), title: 'Circle K logo', description: 'Circle K logo' });
  console.log('LOGO_URL=' + a.url);
};
