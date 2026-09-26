import assert from 'node:assert/strict';
import {cleanNotes,cleanTasks,cleanFocus,DEFAULT_FOCUS,remainingSeconds,productivityKey,monthDays} from '../src/lib/productivity-widgets.ts';
import {parseWidgets} from '../src/lib/home-widgets.ts';
assert.deepEqual(parseWidgets(null).map(w=>w.id),['clock','world','favourites','visited','recent']);
assert.deepEqual(parseWidgets([]),[]);
assert.deepEqual(parseWidgets([{id:'notes',size:'wide'},{id:'clock',size:'compact'},{id:'tasks'},{id:'focus'},{id:'calendar'}]).map(w=>w.id),['notes','clock','tasks','focus','calendar']);
assert.deepEqual(cleanNotes([null,{id:'a',text:'hello'},{id:'a',text:'duplicate'},{id:2,text:'bad'}]),[{id:'a',text:'hello'}]);
assert.equal(cleanNotes(Array.from({length:25},(_,i)=>({id:String(i),text:'x'.repeat(3000)}))).length,20);
assert.equal(cleanNotes([{id:'x',text:'x'.repeat(3000)}])[0].text.length,2000);
assert.deepEqual(cleanTasks([{id:'a',text:'test',done:'yes'}]),[{id:'a',text:'test',done:false}]);
assert.notEqual(productivityKey('profile-one','notes'),productivityKey('profile-two','notes'));
assert.notEqual(productivityKey('profile-one','notes'),productivityKey('profile-one','tasks'));
assert.deepEqual(cleanFocus({duration:1500,remaining:-10,endsAt:null}),DEFAULT_FOCUS);
assert.deepEqual(cleanFocus({duration:1500,remaining:Infinity,endsAt:null}),DEFAULT_FOCUS);
const running={duration:1500,remaining:1500,endsAt:100000};
assert.equal(remainingSeconds(running,95000),5);
assert.equal(remainingSeconds(running,150000),0);
assert.equal(remainingSeconds({...running,endsAt:null,remaining:25},150000),25);
assert.equal(remainingSeconds(running,-2000000),1500);
assert.equal(monthDays(2024,1).filter(Boolean).length,29);
assert.equal(monthDays(2025,1).filter(Boolean).length,28);
assert.equal(monthDays(2026,8)[1],1); // September starts Tuesday.
assert.equal(monthDays(2026,10).length,42); // November starts Sunday.
console.log('Phase 2: legacy layouts, opt-in additions, validation, storage separation, timer expiry and calendar passed.');
