const p=require('puppeteer-core');const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();await pg.setViewport({width:390,height:844});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(9000);
console.log(await pg.evaluate(()=>{let e=document.elementFromPoint(20,820);const r=[];while(e&&e.id!=='root'&&r.length<7){const b=e.getBoundingClientRect();r.push(e.tagName+' '+[b.left,b.top,b.width,b.height].map(Math.round)+' cls='+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).slice(0,60)+' label='+e.getAttribute('aria-label')+' d='+(e.getAttribute('d')||'').slice(0,30));e=e.parentElement;}return r.join('\n');}));
await b.close();})();
