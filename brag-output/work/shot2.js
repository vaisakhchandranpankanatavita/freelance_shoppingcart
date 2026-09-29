const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
await pg.setViewport({width:390,height:844,deviceScaleFactor:1});
await pg.goto('http://localhost:8081',{waitUntil:'networkidle0'});
await w(6000);
await pg.screenshot({path:'s2.png'});
console.log(await pg.evaluate(()=>[...document.querySelectorAll('input')].map(e=>e.placeholder+'|'+e.type).join(' ; ')));
await pg.keyboard.type('1001',{delay:150});
await w(5000);
await pg.screenshot({path:'s3.png'});
await b.close();
})();
