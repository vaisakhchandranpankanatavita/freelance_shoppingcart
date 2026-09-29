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
  ['Atta','Cereals',2,55],['Basmati Rice','Cereals',3,120],['Toor Dal','Pulses',4,140],['Sunflower Oil','Oils',80,160],['Sugar','Staples',120,45],['Tea Powder','Beverages',60,300],['Milk','Dairy',0,28],['Biscuits','Snacks',200,10]
  ].map(([n,c,q,pr],i)=>({id:i+1,item_name:n,category:{category_name:c},stock:q,price:pr,status:'Y'}))}}));
 if(u.includes('/branches')||u.includes('/categories')||u.includes('/suppliers')) return r.respond(J({status:true,data:[{id:1,name:'Main',status:'Y'}]}));
 r.abort();});
await pg.setViewport({width:430,height:900});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500); await pg.click('input'); await pg.keyboard.type('1001',{delay:100});
await w(6500);
const find=t=>pg.evaluate(t=>{[...document.querySelectorAll('*')].find(x=>x.textContent===t&&x.children.length===0).scrollIntoView({block:'start'})},t);
await find('Stock health'); await w(1800); await pg.screenshot({path:'W1.png'});
await find('Category breakdown'); await w(1800); await pg.screenshot({path:'W2.png'});
await b.close();
})();
