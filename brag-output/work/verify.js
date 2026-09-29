const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setViewport({width:1280,height:1100,deviceScaleFactor:1});
await pg.goto('http://localhost:8081',{waitUntil:'networkidle0'});
// splash: capture the end of glide and login
for(const t of [4800,5600,6200,7200]){ await w(t===4800?4800:t-[4800,5600,6200,7200][[4800,5600,6200,7200].indexOf(t)-1]); await pg.screenshot({path:`v_splash_${t}.png`,clip:{x:425,y:100,width:430,height:900}}); }
await pg.click('input');
await pg.keyboard.type('1001',{delay:120});
await w(100);
for(const t of [300,800,1400,2200,3000]){ await w(t===300?0:0); }
const shots=[300,900,1500,2300,3100];
let last=0;
for(const t of shots){ await w(t-last); last=t; await pg.screenshot({path:`v_load_${t}.png`,clip:{x:425,y:100,width:430,height:900}}); }
await b.close();
})();
