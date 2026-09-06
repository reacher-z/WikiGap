import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, basename, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const manifest = readJSON(join(root, 'manifest.json'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.content_scripts.flatMap(entry => entry.js), ['content.js']);
const files = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap(entry => [...entry.js, ...(entry.css || [])]),
];
for (const file of files) assert.ok(existsSync(join(root, file)), `Missing manifest resource: ${file}`);
for (const name of readdirSync(root).filter(name => name.endsWith('.js'))) {
  new vm.Script(readFileSync(join(root, name), 'utf8'), { filename: name });
}

const titles = [];
const alternateFiles = [];
for (const name of readdirSync(join(root, 'json')).filter(name => name.endsWith('.json')).sort()) {
  const data = readJSON(join(root, 'json', name));
  const title = basename(name, '.json');
  if (data[title]?.languages) {
    titles.push(title);
    for (const [language, value] of Object.entries(data[title].languages)) {
      assert.ok(['zh', 'fr', 'ru'].includes(language), `${name}: unsupported language ${language}`);
      assert.ok(value.headers && typeof value.headers === 'object', `${name}: missing headers`);
      for (const header of Object.values(value.headers)) {
        assert.ok(Array.isArray(header.entries), `${name}: entries must be an array`);
      }
    }
  } else {
    alternateFiles.push(name);
  }
}
assert.equal(titles.length, 26, 'Update the documented fixture count if the bundled set changes');
assert.equal(alternateFiles.length, 5, 'Review alternate files if their count changes');
for (const title of ['Poutine', 'Biryani', 'Oolong']) assert.ok(titles.includes(title));

const requests = [];
const context = vm.createContext({
  document: { title: 'Poutine - Wikipedia', addEventListener() {} },
  window: { addEventListener() {} },
  chrome: {
    runtime: {
      getURL(path) { return `local-fixture:${path}`; },
      onMessage: { addListener() {} },
    },
  },
  console: { log() {}, warn() {}, error() {} },
  fetch: async url => {
    assert.ok(url.startsWith('local-fixture:json/'), 'Network access is not allowed in this check');
    const path = resolve(root, url.slice('local-fixture:'.length));
    assert.ok(path.startsWith(join(root, 'json') + sep), 'Fixture path escapes json/');
    requests.push(path);
    return { ok: existsSync(path), json: async () => readJSON(path) };
  },
});
vm.runInContext(readFileSync(join(root, 'content.js'), 'utf8'), context, { filename: 'content.js' });
const state = () => JSON.parse(vm.runInContext('JSON.stringify({totalFacts, languageFacts})', context));

assert.equal(await vm.runInContext('fetchFacts()', context), true);
const poutine = state();
assert.equal(poutine.totalFacts, 30);
for (const language of ['zh', 'fr', 'ru']) {
  assert.equal(poutine.languageFacts[language].length, 10);
  assert.ok(poutine.languageFacts[language].every(fact => typeof fact.fact === 'string'));
}
context.document.title = 'Article without a bundled fixture - Wikipedia';
assert.equal(await vm.runInContext('fetchFacts()', context), false);
assert.equal(state().totalFacts, 0);
assert.ok(Object.values(state().languageFacts).every(facts => facts.length === 0));
assert.equal(requests.length, 2);

console.log(`PASS: manifest resources, JavaScript syntax, ${titles.length} article fixtures, ${alternateFiles.length} alternate files`);
console.log('PASS: real loader reads 30 Poutine facts and resets to zero for an unsupported article');
console.log('Scope: local fixtures and isolated loader only; no Chrome UI, network, or participant data accessed');
