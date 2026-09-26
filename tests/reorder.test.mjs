import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path) {const source=fs.readFileSync(new URL(path, import.meta.url),'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',compiled)((name)=>load('../src/lib/'+name.replace('./','')+'.ts'),module,module.exports);return module.exports;}
const {moveItem,orderLinksByFolders}=load('../src/lib/reorder.ts');
const values=['a','b','c']; assert.deepEqual(moveItem(values,0,2),['b','c','a']); assert.deepEqual(moveItem(values,2,0),['c','a','b']); assert.deepEqual(values,['a','b','c']); assert.equal(moveItem(values,-1,1),values); assert.equal(moveItem(values,0,3),values); assert.equal(moveItem(values,1,1),values);
const links=[{id:'a',tab_id:'t',group_name:'A',position:0},{id:'b',tab_id:'t',group_name:'B',position:1},{id:'a2',tab_id:'t',group_name:'A',position:2}];
const folders=[{tab_id:'t',name:'A',position:1},{tab_id:'t',name:'B',position:0}];
assert.deepEqual(orderLinksByFolders(links,folders).map(x=>x.id),['b','a','a2']);
assert.deepEqual(links.map(x=>x.position),[0,1,2]);
assert.deepEqual(orderLinksByFolders(links,[]).map(x=>x.id),['a','b','a2']);
assert.deepEqual(orderLinksByFolders([...links,{id:'legacy',tab_id:null,group_name:'',position:3}], [...folders,{tab_id:'t',name:'Folder 1',position:-1}], 't').map(x=>x.id),['legacy','b','a','a2']);
assert.deepEqual(orderLinksByFolders([{id:'new',tab_id:'t',group_name:'Empty before',position:99},...links],[{tab_id:'t',name:'Empty before',position:-1},...folders]).map(x=>x.id),['new','b','a','a2']);
console.log('Reorder tests passed: moves, bounds, immutable input, legacy folders, saved folder order and newly populated folders.');
