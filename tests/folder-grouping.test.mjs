import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
// Load the actual TypeScript helpers without adding a test-runner dependency.
function load(file) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', compiled)((name) => load(path.resolve(path.dirname(file), name + '.ts')), module, module.exports);
  return module.exports;
}
const { groupLinks } = load(path.resolve('src/lib/startpage.ts'));
const links = [{id:'a',group_name:'',position:0},{id:'b',group_name:'  ',position:1}];
assert.deepEqual(groupLinks(links).map(([name,items])=>[name,items.map(l=>l.id)]), [['Folder 1',['a','b']]]);
const after = groupLinks([...links,{id:'c',group_name:'Website',position:2}]);
assert.deepEqual(after.map(([name,items])=>[name,items.map(l=>l.id)]), [['Folder 1',['a','b']],['Website',['c']]]);
assert.equal(groupLinks([...links,{id:'d',group_name:'Folder 1',position:3}])[0][1].length,3);
assert.equal(after.flatMap(([,items])=>items).length,3);
console.log('Regression passed: unfiled links remain grouped and visible after adding another folder.');
