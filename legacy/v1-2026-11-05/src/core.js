(function () {
 const C = typeof module !== 'undefined' ? require('./content.js') : globalThis.BSX_CONTENT;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function initial(seed=20261029){return {schemaVersion:1,contentVersion:C.version,seed:seed>>>0,day:1,phase:'prep',cash:C.startCash,rep:C.startRep,burn:0,oil:1,material:1,price:1,menu:['soy','congee','stick','noodle'],aff:{grandpa:0,nurse:0},helper:false,queue:[],history:[],negativeDays:0,quality:null,result:'',eventId:null,ledger:null};}
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
 function quote(s){const ds=C.dishes.filter(d=>s.menu.includes(d.id)); const price=Math.round(ds.reduce((n,d)=>n+d.price*C.priceFactors[s.price],0)/ds.length);return {price,capacity:s.helper?80:60};}
 function effects(s,e){s.cash+=e.cash||0;s.rep=clamp(s.rep+(e.rep||0),0,100);s.burn=clamp(s.burn+(e.burn||0),0,100);for(const k of ['grandpa','nurse'])s.aff[k]=clamp(s.aff[k]+(e[k]||0),0,7);}
 function settle(s,quality){
   const opening=s.cash; let cap=quote(s).capacity;
   const due=s.queue.filter(e=>e.day<=s.day);s.queue=s.queue.filter(e=>e.day>s.day);due.forEach(e=>{effects(s,e);cap+=e.capacity||0;});
   s.quality=clamp(quality,0,1);
   const demand=Math.floor(45*C.demandFactors[s.price]*(0.3+s.rep/70)*(1+(s.aff.grandpa+s.aff.nurse)/70)*(s.burn>=60?0.85:1)*(0.88+random(s)*0.24));
   const served=Math.max(0,Math.min(demand,cap));const ds=C.dishes.filter(d=>s.menu.includes(d.id));
   const sales=ds.map((d,i)=>{const qty=Math.floor(served/ds.length)+(i<served%ds.length?1:0);const unitPrice=Math.round(d.price*C.priceFactors[s.price]);const unitCost=Math.round(d.cost*C.materialFactors[s.material])+C.oilCosts[s.oil];return {id:d.id,qty,unitPrice,unitCost};});
   const revenue=sales.reduce((v,d)=>v+d.qty*d.unitPrice,0);const ingredients=sales.reduce((v,d)=>v+d.qty*d.unitCost,0);const fixed=C.fixedCost+(s.helper?3000:0);
   s.cash+=revenue-ingredients-fixed;s.rep=clamp(s.rep+(quality>=0.85?1:quality<0.4?-1:0)-Math.floor(Math.max(0,demand-cap)/10)*0.3,0,100);
   if(s.day%2===1)s.aff.grandpa=clamp(s.aff.grandpa+1,0,7);
   if(s.burn<30&&s.day%2===0)s.aff.nurse=clamp(s.aff.nurse+1,0,7);
   s.ledger={day:s.day,opening,revenue,ingredients,fixed,served,demand,quality:s.quality,sales,scheduled:due.reduce((v,e)=>v+(e.cash||0),0),eventCash:0,closing:s.cash};
   const event=C.events.find(e=>e.day===s.day);s.eventId=event?event.id:null;s.phase=event?'event':'ledger';s.result=event?'':(quality>=0.85?'这锅火候正好，街坊吃得舒心。':'一天忙完，老周仔细擦净了灶台。');
 }
 function reduce(state,a){
   const s=JSON.parse(JSON.stringify(state));
   if(a.type==='setting'&&s.phase==='prep'&&['oil','material','price'].includes(a.key)&&Number.isInteger(a.value)&&a.value>=0&&a.value<=2)s[a.key]=a.value;
   if(a.type==='dish'&&s.phase==='prep'&&C.dishes.some(d=>d.id===a.id)){if(s.menu.includes(a.id)){if(s.menu.length>1)s.menu=s.menu.filter(id=>id!==a.id);}else s.menu.push(a.id);}
   if(a.type==='open'&&s.phase==='prep')s.phase='cook';
   if(a.type==='cook'&&s.phase==='cook'&&Number.isFinite(a.quality))settle(s,a.quality);
   if(a.type==='choose'&&s.phase==='event'){
     const event=C.events.find(e=>e.id===s.eventId);const e=event&&event.choices[a.index];if(!e)return state;
     const before=s.cash;effects(s,e);if(e.audit)effects(s,s.burn>0?{cash:-3000,rep:-3,burn:-10}:{rep:2});
     if(e.delayed)s.queue.push({...e.delayed,day:s.day+e.delayed.after});if(e.helper)s.helper=true;
     s.result=e.result;s.ledger.eventCash+=s.cash-before;s.ledger.closing=s.cash;s.phase='ledger';
   }
   if(a.type==='next'&&s.phase==='ledger'){
     s.history.push({...s.ledger,rep:s.rep,event:s.eventId});s.negativeDays=s.cash<0?s.negativeDays+1:0;
     if(s.day>=C.days||s.negativeDays>=3)s.phase='end';else{s.day++;s.phase='prep';s.ledger=null;s.eventId=null;s.result='';}
   }
   return s;
 }
 function valid(s){return !!s&&s.schemaVersion===1&&s.contentVersion===C.version&&Number.isInteger(s.day)&&s.day>=1&&s.day<=C.days&&['prep','cook','event','ledger','end'].includes(s.phase)&&['cash','rep','burn','seed'].every(k=>Number.isFinite(s[k]))&&['oil','material','price'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<=2)&&Array.isArray(s.menu)&&s.menu.length>0&&new Set(s.menu).size===s.menu.length&&s.menu.every(id=>C.dishes.some(d=>d.id===id))&&s.aff&&Object.values(s.aff).every(Number.isFinite)&&Array.isArray(s.queue)&&Array.isArray(s.history)&&(!['ledger','event'].includes(s.phase)||!!s.ledger&&Array.isArray(s.ledger.sales))&&(s.phase!=='event'||C.events.some(e=>e.id===s.eventId));}
 const api={initial,reduce,quote,valid};if(typeof module!=='undefined')module.exports=api;else globalThis.BSX_CORE=api;
})();
