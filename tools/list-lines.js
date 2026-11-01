#!/usr/bin/env node
// Prints every line the app can speak (from js/lines.js) as a JSON array.
// Used by tools/make_voice.py.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['js/data.js', 'js/lines.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}
process.stdout.write(JSON.stringify(sandbox.window.Lines.all(), null, 2));
