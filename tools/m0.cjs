const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://127.0.0.1:4173');await p.waitForTimeout(2500);await p.screenshot({path:'output/m0/baseline-0.png'});
const s=await p.evaluate(()=>{try{return JSON.stringify(window.__bsx&&window.__bsx.snapshot())}catch(e){return 'ERR '+e}});
console.log('snapshot',s);console.log('render_game_to_text',await p.evaluate(()=>typeof window.render_game_to_text),'advanceTime',await p.evaluate(()=>typeof window.advanceTime));
await p.mouse.click(300,500);await p.waitForTimeout(800);await p.screenshot({path:'output/m0/baseline-1.png'});console.log('errors',errs);await b.close();})();
