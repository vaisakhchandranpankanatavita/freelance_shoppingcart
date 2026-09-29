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
const tabs=[['D',43],['stock',129],['po',215],['sale',300],['more',386]];
for(const [n,x] of tabs){ await pg.mouse.click(x,860); await w(1300); await pg.screenshot({path:`H_${n}.png`,clip:{x:0,y:0,width:430,height:110}}); }
await b.close();
})();
