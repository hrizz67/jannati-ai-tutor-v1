import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const DIST_INDEX_PATH = path.join(ROOT_DIR, 'dist/index.html');

function readOption(argv, name, fallback = '') {
  const direct = argv.find(value => value.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] || fallback : fallback;
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function smokeTestDeployment(argv = process.argv.slice(2)) {
  const target = readOption(argv, '--url', packageJson.homepage);
  const attempts = Math.max(1, Number(readOption(argv, '--attempts', '12')) || 12);
  const delayMs = Math.max(0, Number(readOption(argv, '--delay-ms', '10000')) || 10000);

  if (!target) throw new Error('Deployment URL is required through --url or package.json homepage.');
  if (!fs.existsSync(DIST_INDEX_PATH)) throw new Error('Local dist/index.html is required before deployment smoke testing.');

  const localHtml = fs.readFileSync(DIST_INDEX_PATH, 'utf8');
  const localAssetMatch = localHtml.match(/<script[^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
  if (!localAssetMatch) throw new Error('Local dist/index.html does not reference a hashed index JavaScript asset.');
  const expectedAssetPath = new URL(localAssetMatch[1], packageJson.homepage).pathname;

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const pageUrl = new URL(target);
      pageUrl.searchParams.set('release', `${packageJson.version}-${Date.now()}`);
      const pageResponse = await fetch(pageUrl, { redirect: 'follow', cache: 'no-store' });
      if (!pageResponse.ok) throw new Error(`HTML returned HTTP ${pageResponse.status}.`);

      const html = await pageResponse.text();
      const assetMatch = html.match(/<script[^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
      if (!assetMatch) throw new Error('Production HTML does not reference a hashed index JavaScript asset.');

      const assetUrl = new URL(assetMatch[1], pageResponse.url);
      if (assetUrl.pathname !== expectedAssetPath) {
        throw new Error(`Production entry asset ${assetUrl.pathname} has not reached expected ${expectedAssetPath}.`);
      }
      const assetResponse = await fetch(assetUrl, { redirect: 'follow', cache: 'no-store' });
      if (!assetResponse.ok) throw new Error(`JavaScript asset returned HTTP ${assetResponse.status}.`);

      console.log(`Deployment smoke test PASS: ${pageResponse.url}`);
      console.log(`Asset PASS: ${assetUrl.href}`);
      return { pageUrl: pageResponse.url, assetUrl: assetUrl.href };
    } catch (error) {
      lastError = error;
      console.warn(`Smoke test attempt ${attempt}/${attempts} failed: ${error.message || error}`);
      if (attempt < attempts) await sleep(delayMs);
    }
  }

  throw new Error(`Deployment smoke test failed: ${lastError?.message || lastError}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  smokeTestDeployment().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

export { readOption, smokeTestDeployment };
