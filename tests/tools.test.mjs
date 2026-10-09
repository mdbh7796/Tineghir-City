import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function loadTools(storage) {
  const src = readFileSync('public/js/tools.js', 'utf8');
  const sandbox = {
    window: storage ? { localStorage: storage } : {},
    document: { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${src}; globalThis.__out = window.__tools;`, sandbox);
  return sandbox.__out;
}

function memStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

test('readList returns [] on corrupt JSON', () => {
  const tools = loadTools(memStore({ 'tineghir-plan': 'not-json{{' }));
  assert.deepEqual(tools.readList('tineghir-plan'), []);
});

test('writeList round-trips string lists', () => {
  const s = memStore();
  const tools = loadTools(s);
  assert.equal(tools.writeList('tineghir-plan', ['todra-gorge', 'souks']), true);
  assert.deepEqual(tools.readList('tineghir-plan'), ['todra-gorge', 'souks']);
});

test('writeList fails closed without storage', () => {
  const tools = loadTools(null);
  assert.deepEqual(tools.readList('tineghir-plan'), []);
  assert.equal(tools.writeList('tineghir-plan', ['x']), false);
});
