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
await pg.mouse.click(386,858); await w(1800);
await pg.screenshot({path:'M1.png'});
await pg.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{if(e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!=='visible')e.scrollTop=1e5})});
await w(700); await pg.screenshot({path:'M2.png'});
await b.close();
})();
