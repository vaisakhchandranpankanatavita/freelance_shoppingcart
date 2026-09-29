const p=require('puppeteer-core');
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
await pg.setViewport({width:390,height:844,deviceScaleFactor:2});
await pg.goto('http://localhost:8081',{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,4000));
await pg.screenshot({path:'s1.png'});
console.log(await pg.evaluate(()=>[...document.querySelectorAll('input,[role=button],[role=tab]')].map(e=>e.tagName+':'+(e.placeholder||e.innerText||'').slice(0,30)).join(' | ')));
await b.close();
})();
