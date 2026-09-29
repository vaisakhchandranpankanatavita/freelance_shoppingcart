const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
const mock={
 '/products':{data:[
  {id:1,name:'Basmati Rice 5kg',category:{name:'Grains'},stock:4,selling_price:640,low_stock_alert:10,unit:'bag'},
  {id:2,name:'Sunflower Oil 1L',category:{name:'Oils'},stock:120,selling_price:165},
  {id:3,name:'Toor Dal 1kg',category:{name:'Grains'},stock:60,selling_price:150},
  {id:4,name:'Amul Milk 500ml',category:{name:'Dairy'},stock:2,selling_price:30,low_stock_alert:8},
  {id:5,name:'Tea 250g',category:{name:'Beverages'},stock:80,selling_price:120},
  {id:6,name:'Bread',category:{name:'Bakery'},stock:40,selling_price:45}]},
 '/branch':{data:[{id:1,name:'Main',status:1},{id:2,name:'City',status:1},{id:3,name:'Old',status:0}]},
 '/categories':{data:[{id:1},{id:2},{id:3},{id:4},{id:5}]},
 '/suppliers':{data:[{id:1},{id:2},{id:3}]},
};
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
pg.on('request',r=>{const u=new URL(r.url()); if(!u.host.includes('serieux.in')) return r.continue();
  const m=mock[u.pathname.replace('/api','')]; if(!m) return r.abort();
  r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(m)});});
await pg.setViewport({width:1280,height:1100});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500);
await pg.click('input'); await pg.keyboard.type('1001',{delay:100});
await w(6500);
await pg.screenshot({path:'dash1.png',clip:{x:425,y:100,width:430,height:900}});
await pg.evaluate(()=>{const s=[...document.querySelectorAll('div')].filter(d=>d.scrollHeight>d.clientHeight+50&&getComputedStyle(d).overflowY!=='visible');s.forEach(d=>d.scrollTop=9999)});
await w(1200);
await pg.screenshot({path:'dash2.png',clip:{x:425,y:100,width:430,height:900}});
await b.close();
})();
