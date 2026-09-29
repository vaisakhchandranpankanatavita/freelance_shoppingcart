const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
const J=o=>({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
pg.on('request',r=>{const u=r.url();
 if(!u.includes('serieux.in')) return r.continue();
 if(r.method()==='OPTIONS') return r.respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
 if(u.includes('/products')) return r.respond(J({status:true,data:{current_page:1,data:[
  ...['Atta','Basmati Rice','Toor Dal','Sunflower Oil','Sugar','Tea Powder'].map((n,i)=>({id:i+1,item_name:n,category_id:1,category:{category_name:'Cereals'},stock:[2,3,4,80,120,60][i],price:[55,120,140,160,45,300][i],status:'Y'}))]}}));
 if(u.includes('/branches')||u.includes('/categories')||u.includes('/suppliers')) return r.respond(J({status:true,data:[{id:1,name:'Main',status:'Y'}]}));
 r.abort();});
await pg.setViewport({width:430,height:900});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500); await pg.click('input'); await pg.keyboard.type('1001',{delay:100});
await w(6500);
await pg.evaluate(()=>{[...document.querySelectorAll('*')].find(x=>x.textContent==='Needs restocking'&&x.children.length===0).scrollIntoView({block:'start'})});
await w(800); await pg.screenshot({path:'S0.png'});
await pg.evaluate(()=>{[...document.querySelectorAll('*')].find(x=>x.textContent==='Needs restocking'&&x.children.length===0).scrollIntoView({block:'start'})});
const pos=await pg.evaluate(()=>{const e=document.querySelector('[aria-label^="Show all"]');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
await pg.mouse.click(pos.x,pos.y); await w(250); await pg.screenshot({path:'S1.png'});
await w(900); await pg.screenshot({path:'S2.png'});
await b.close();
})();
