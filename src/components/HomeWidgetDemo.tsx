import { useState } from 'react';
import { GripVertical, ArrowUp, Plus, Check } from 'lucide-react';
import { useDragOrder } from './workspace/useDragOrder';
import { moveItem } from '@/lib/reorder';
const samples = [{id:'notes', name:'Sticky notes'}, {id:'clock',name:'Clock & date'}, {id:'tasks',name:'Checklist'}];
export function HomeWidgetDemo() {
  const [order,setOrder] = useState(['notes','clock','tasks']);
  const [open,setOpen] = useState<number | null>(null);
  const [notes,setNotes] = useState(['A little space for a big idea.','Plan something good this week.']);
  const [done,setDone] = useState(false);
  const drag = useDragOrder(order,'homepage-widget-demo',false,setOrder);
  return <div className="lp-widget-demo">
    <div className="lp-widget-demo-title"><b>Your Home, your choice.</b><span>INTERACTIVE SAMPLE</span></div>
    <p className="lp-widget-hint">Toggle a widget. Drag its dotted handle. Click a note to expand.</p>
    <div className="lp-widget-options" role="group" aria-label="Sample widgets">
      {samples.map(sample => <button type="button" key={sample.id} aria-pressed={order.includes(sample.id)} onClick={() => setOrder(old => old.includes(sample.id) ? old.filter(id => id !== sample.id) : [...old,sample.id])}>{order.includes(sample.id) ? <Check size={12}/> : <Plus size={12}/>} {sample.name}</button>)}
    </div>
    <div className="lp-widget-grid">
      {order.map((id,index) => <section key={id} className={`lp-widget-card ${drag.over === id ? 'lp-widget-over' : ''}`} {...drag.targetProps(id)}>
        <header><b>{samples.find(s=>s.id===id)?.name}</b><button type="button" disabled={index===0} aria-label={`Move sample ${id} earlier`} title="Move earlier" onClick={()=>setOrder(moveItem(order,index,index-1))}><ArrowUp size={13}/></button><button type="button" disabled={order.length<2} aria-label={`Drag sample ${id}`} title="Drag to reorder" {...drag.handleProps(id)}><GripVertical size={15}/></button></header>
        {id==='notes' && <><div className="lp-mini-notes">{notes.map((note,i)=><button type="button" key={i} aria-label={`Expand sample note ${i+1}`} aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)}>{note}</button>)}</div>{open!==null && <div className="lp-note-editor"><label htmlFor="sample-note">Your sample note</label><textarea id="sample-note" maxLength={2000} rows={3} value={notes[open]} onChange={e=>setNotes(old=>old.map((n,i)=>i===open?e.target.value:n))}/><button type="button" onClick={()=>setOpen(null)}>Done</button></div>}</>}
        {id==='clock' && <div className="lp-sample-clock"><strong>09:41</strong><span>Monday · your daily starting point</span><small>Example time</small></div>}
        {id==='tasks' && <label className="lp-sample-task"><input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)}/><span style={done?{textDecoration:'line-through'}:undefined}>Make room for your next idea</span></label>}
      </section>)}
    </div>
    {!order.length && <p className="lp-widget-empty">A fresh start. Choose a sample widget above.</p>}
    <p className="lp-widget-hint">Demo only. Changes here don’t affect your page and reset when you leave.</p>
  </div>;
}
