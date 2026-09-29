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
await w(7500);
await pg.screenshot({path:'C_signin.png'});
await pg.click('input'); await pg.keyboard.type('1001',{delay:100});
const t=[0,150,300,450,700,1000,1500,2200];let last=0;
for(const x of t){await w(x-last);last=x;await pg.screenshot({path:`C_${x}.png`});}
await b.close();
})();
