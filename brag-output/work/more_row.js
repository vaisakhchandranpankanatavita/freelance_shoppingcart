const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
pg.on('request',r=>r.url().includes('serieux.in')?r.abort():r.continue());
await pg.setViewport({width:430,height:900});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500); await pg.click('input'); await pg.keyboard.type('1001',{delay:100});
await w(6500);
await pg.click('[aria-label="More"], [role=tab]:last-of-type').catch(()=>{});
await pg.evaluate(()=>{const t=[...document.querySelectorAll('[role=tab]')].pop(); t&&t.click();});
await w(1500);
await pg.screenshot({path:'M0.png'});
const pos=await pg.evaluate(()=>{const e=document.querySelector('[aria-label="Categories"]');const r=e.getBoundingClientRect();return {x:r.x+40,y:r.y+r.height/2}});
await pg.mouse.click(pos.x,pos.y);
const shots=[];
for(let i=0;i<8;i++){ await pg.screenshot({path:`MR_${i}.png`,clip:{x:0,y:pos.y-30,width:430,height:60}}); await w(40);}
await w(600);
console.log('navigated', await pg.evaluate(()=>document.body.innerText.includes('Categories')&&!!document.querySelector('input,[aria-label*="Add"]')), await pg.evaluate(()=>document.body.innerText.slice(0,80).replace(/\n/g,' | ')));
await b.close();
})();
