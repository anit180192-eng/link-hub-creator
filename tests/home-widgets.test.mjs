import assert from 'node:assert/strict';
import { parseWidgets, cleanVisits, rankVisits, SEVEN_DAYS } from '../src/lib/home-widgets.ts';
assert.equal(parseWidgets(null).length,5, 'legacy profiles keep all widgets');
assert.deepEqual(parseWidgets([]),[], 'new or intentionally empty profiles stay empty');
assert.deepEqual(parseWidgets([{id:'recent',size:'compact'}, {id:'clock',size:'wide'}, {id:'recent'}, {id:'bogus'}]),[{id:'recent',size:'compact'},{id:'clock',size:'wide'}]);
const now = 1000000000;
assert.equal(cleanVisits([{id:'old',at:now-SEVEN_DAYS-1},{id:'future',at:now+1},{id:'ok',at:now},null],now).length,1);
const ranked=rankVisits([{id:'a',at:now-20},{id:'a',at:now-10},{id:'b',at:now},{id:'expired',at:now-SEVEN_DAYS-1}],now);
assert.deepEqual(ranked.map(x=>x.id),['a','b']);
assert.equal(ranked[0].count,2);
assert.equal(rankVisits(Array.from({length:25},(_,i)=>({id:String(i),at:now-i})),now).slice(0,20).length,20);
assert.deepEqual(parseWidgets({id:'clock'}),[]);
console.log('Widget compatibility, ordering, validation, seven-day expiry and ranking passed.');

const { parseFeaturedLinks, featuredLinkUrl, WIDGETS } = await import('../src/lib/home-widgets.ts');
assert.equal(WIDGETS.length, 10);
const featured = Array.from({length: 12}, (_, i) => ({id: `f${i}`, name: `Link ${i}`, url: `https://example.com/${i}`}));
assert.equal(parseFeaturedLinks(featured).length, 10, 'saved payloads cannot render more than ten featured links');
assert.equal(featuredLinkUrl('example.com'), 'https://example.com/');
for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.com', 'https://user:password@example.com', '', 'http://']) {
  assert.equal(featuredLinkUrl(url), null, `reject unsafe or invalid URL: ${url}`);
}
assert.deepEqual(parseFeaturedLinks([null, {id:'bad',name:'',url:'https://example.com'}, featured[0], featured[0], {...featured[1], url:featured[0].url}]), [featured[0]], 'ignore malformed and duplicate links');
const layout = parseWidgets([{id:'featured',size:'compact',links:featured}, {id:'clock',size:'wide'}]);
assert.equal(layout[0].links.length, 10);
assert.deepEqual(parseWidgets(JSON.parse(JSON.stringify(layout))), layout, 'featured links survive storage round trip');
const resized = parseWidgets(layout.map(widget => ({...widget,size:'wide'})).reverse());
assert.deepEqual(resized[1].links, layout[0].links, 'resize and reorder preserve featured links');
assert.deepEqual(parseWidgets([{id:'featured',size:'wide'}])[0].links, [], 'new featured widget starts empty');
console.log('Featured Links: ten-link cap, URL safety, duplicate filtering, persistence and layout changes passed.');
