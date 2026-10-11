#!/usr/bin/env node
/**
 * Turns a freshly seeded kickstart stack into the Circle K demo: runs the migrations in contentstack/ in order.
 *
 *   npm run setup:stack -- <stack api key>
 *
 * Needs the Contentstack CLI, logged in (csdx auth:login) to the stack's region. Creates .env from .env.example
 * if it is missing and sets the API key; the first migration creates the delivery and preview tokens and writes
 * them into .env. Every migration is idempotent, so the script can be rerun.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Order matters: landing-page creates the Landing Page type and the tokens, deals uses the Circle K images
const MIGRATIONS = ['landing-page', 'circlek-assets', 'homepage-copy', 'deals'];

const root = path.join(__dirname, '..');
const dir = path.join(root, 'contentstack');
const envFile = path.join(root, '.env');

if (!fs.existsSync(envFile)) {
  fs.copyFileSync(path.join(root, '.env.example'), envFile);
  console.log('Created .env from .env.example');
}
let dotenv = fs.readFileSync(envFile, 'utf8');

const argKey = process.argv[2];
if (argKey) {
  dotenv = dotenv.replace(/^NG_APP_CONTENTSTACK_API_KEY=.*$/m, `NG_APP_CONTENTSTACK_API_KEY=${argKey}`);
  fs.writeFileSync(envFile, dotenv);
}
const apiKey = /^NG_APP_CONTENTSTACK_API_KEY=(blt\w+)/m.exec(dotenv)?.[1];
if (!apiKey) {
  console.error('No stack API key. Usage: npm run setup:stack -- <stack api key>');
  process.exit(1);
}

// Use the globally installed CLI: npm run puts every parent folder's node_modules/.bin first on PATH,
// which can pick up an old local csdx
const PATH = process.env.PATH.split(path.delimiter).filter((p) => !p.endsWith(path.join('node_modules', '.bin'))).join(path.delimiter);

// csdx creates a package.json in its working directory: remove it afterwards
const hadPackageJson = fs.existsSync(path.join(dir, 'package.json'));
try {
  for (const name of MIGRATIONS) {
    console.log(`\n== ${name}`);
    const run = spawnSync('csdx', ['cm:stacks:migration', '--file-path', `${name}.migration.js`, '-k', apiKey], {
      cwd: dir,
      stdio: 'inherit',
      env: { ...process.env, PATH },
    });
    if (run.error || run.status !== 0) {
      console.error(`\n${name} failed${run.error ? `: ${run.error.message}` : ''}. Fix the cause and rerun; finished steps are skipped.`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  if (!hadPackageJson) fs.rmSync(path.join(dir, 'package.json'), { force: true });
}

if (!process.exitCode) console.log('\nStack ready. Turn on Live Preview (Settings > Live Preview, environment "preview"), then: npm start');
