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
const box=await pg.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.textContent==='Quick actions'&&x.children.length===0);e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {y:r.y}});
await w(600);
await pg.screenshot({path:'P1.png'});
// click the neighbour to the right of centre (x≈215+132)
await pg.mouse.click(347,382); await w(900); await pg.mouse.click(215,382);
await w(900);
await pg.screenshot({path:'P3.png'});
console.log(await pg.evaluate(()=>[...document.querySelectorAll('[aria-label^="Open"]')].map(e=>e.getAttribute('aria-label'))));
await b.close();
})();
