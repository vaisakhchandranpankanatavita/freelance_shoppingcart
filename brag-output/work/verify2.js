const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
pg.on('request',r=>r.url().includes('serieux.in')?r.abort():r.continue());
await pg.setViewport({width:1280,height:1100});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500);
await pg.click('input');
await pg.keyboard.type('1001',{delay:100});
const t0=Date.now();
for(let i=0;i<14;i++){ await pg.screenshot({path:`L_${String(i).padStart(2,'0')}.png`,clip:{x:425,y:100,width:430,height:900}}); await w(250);}
console.log('elapsed',Date.now()-t0);
await b.close();
})();
