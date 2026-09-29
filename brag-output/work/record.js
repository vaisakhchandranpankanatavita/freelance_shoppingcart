const p=require('puppeteer-core');
const fs=require('fs');
const w=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.argv[2]||'rec1';
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

const cat=(id,n)=>({id,category_name:n,category_type:'Selling,Purchase',status:'Y'});
const P=(id,cat_id,n,q,pr,low=10)=>({id,category_id:cat_id,item_name:n,short_name:n,status:'Y',category:{id:cat_id,category_name:['','Cereals','Biscuits','Oils','Pulses','Beverages'][cat_id]},quantity:q,selling_price:pr,low_stock_alert:low});
const products=[P(1,1,'Atta 5kg',140,245),P(2,1,'Basmati Rice 5kg',96,610),P(3,2,'Marie Biscuits',6,30),P(4,3,'Sunflower Oil 1L',8,152),P(5,4,'Toor Dal 1kg',64,168),P(6,5,'Tea Powder 500g',52,235),P(7,1,'Sugar 1kg',9,46),P(8,4,'Moong Dal 1kg',44,142),P(9,3,'Coconut Oil 500ml',30,210),P(10,2,'Cream Biscuits',120,25)];
const ok=(data,message='OK')=>({status:true,message,data});
const routes={
 '/login':()=>({status:true,message:'Login successful',access_token:'demo',refresh_token:'demo',user:{id:1,name:'Admin',username:'Admin',login_id:'1001',roles:['Admin']}}),
 '/get-products':()=>ok(products),
 '/products':()=>ok({current_page:1,data:products}),
 '/branch':()=>ok([{id:1,name:'Main Street',status:'Y'},{id:2,name:'Market Road',status:'Y'},{id:3,name:'Station Square',status:'Y'}]),
 '/categories':()=>ok([cat(1,'Cereals'),cat(2,'Biscuits'),cat(3,'Oils'),cat(4,'Pulses'),cat(5,'Beverages')]),
 '/suppliers':()=>ok([{id:1,name:'Supplier Med',status:'Y'},{id:2,name:'Fresh Farms',status:'Y'},{id:3,name:'Daily Dairy',status:'Y'},{id:4,name:'Spice Route',status:'Y'}]),
};
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--hide-scrollbars']});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
pg.on('request',r=>{
  const u=new URL(r.url());
  if(!u.host.includes('serieux.in')) return r.continue();
  if(r.method()==='OPTIONS') return r.respond({status:204,headers:cors});
  const path=u.pathname.replace(/^\/api/,'').replace(/\/$/,'');
  const h=routes[path];
  if(h) return r.respond({status:200,contentType:'application/json',headers:cors,body:JSON.stringify(h())});
  r.respond({status:200,contentType:'application/json',headers:cors,body:JSON.stringify(ok([]))});
});
await pg.setViewport({width:390,height:844,deviceScaleFactor:2});
const cdp=await pg.createCDPSession();
const meta=[]; let n=0;
cdp.on('Page.screencastFrame',async f=>{
  const i=n++; fs.writeFileSync(`${OUT}/f${String(i).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));
  meta.push([i,f.metadata.timestamp]);
  cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});
});
// tap ripple overlay (captured in frames)
await pg.evaluateOnNewDocument(()=>{
  setInterval(()=>{document.querySelectorAll('body > div:not(#root)').forEach(e=>e.style.setProperty('display','none','important'));},100);
  addEventListener('DOMContentLoaded',()=>{
    const s=document.createElement('style');
    s.textContent='@keyframes rip{from{transform:translate(-50%,-50%) scale(.3);opacity:.55}to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}';
    document.head.appendChild(s);
    addEventListener('pointerdown',e=>{const d=document.createElement('div');
      d.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:64px;height:64px;border-radius:50%;background:#1EB7EB;pointer-events:none;z-index:99999;animation:rip .55s ease-out forwards`;
      document.body.appendChild(d);setTimeout(()=>d.remove(),600);},true);
  });
});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,everyNthFrame:1});
const marks={};
const T0=Date.now(); const mark=k=>marks[k]=(Date.now()-T0)/1000;
mark('start');
await w(6600); mark('login');
await pg.click('input'); await w(500);
mark('type');
await pg.keyboard.type('1001',{delay:380});
mark('typed');
await w(5600); mark('dash');   // loader ~3.6s + settle
await w(1200);
// scroll dashboard
await pg.mouse.move(195,500);
await pg.evaluate(()=>{const s=[...document.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!=='visible'&&e.clientWidth>300); window.__s=s; if(s) s.scrollTo({top:230,behavior:'smooth'});});
mark('scroll'); await w(1800);
await pg.evaluate(()=>window.__s&&window.__s.scrollTo({top:0,behavior:'smooth'}));
await w(1200);
const tap=async(text)=>{const pt=await pg.evaluate(t=>{const el=[...document.querySelectorAll('div,span')].filter(e=>e.children.length===0&&e.textContent.trim()===t).pop(); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2-14};},text); console.log('tap',text,pt); if(pt) await pg.mouse.click(pt.x,pt.y);};
const drag=async(x0,x1,y=515)=>{await pg.mouse.move(x0,y);await pg.mouse.down();for(let i=1;i<=14;i++){await pg.mouse.move(x0+(x1-x0)*i/14,y);await w(16);}await pg.mouse.up();};
mark('picker'); await drag(300,110); await w(1100); await drag(300,110); await w(1100); await drag(110,300); await w(800); await drag(110,300); await w(900);
await pg.screenshot({path:`${OUT}/picker.png`});
const tapOpen=async()=>{const pt=await pg.evaluate(()=>{const el=[...document.querySelectorAll('div,span')].filter(e=>e.children.length===0&&/^Open /.test(e.textContent.trim())).pop(); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};}); console.log('open',pt); if(pt) await pg.mouse.click(pt.x,pt.y);};
mark('tapbill');
const hasForm=()=>pg.evaluate(()=>!!document.querySelector('input[placeholder="Customer name"]'));
await tapOpen(); await w(1500);
if(!(await hasForm())){ await tap('NEW BILL'); await w(1500); }
if(!(await hasForm())){ await pg.mouse.click(195,802); await w(1200); await tap('New bill'); await w(1500); }
console.log('form',await hasForm());

mark('items');
await pg.click('input[placeholder="Customer name"]'); await pg.keyboard.type('Ravi Kumar',{delay:70}); await w(200);
await pg.click('input[placeholder^="Phone number"]'); await pg.keyboard.type('9876543210',{delay:45}); await w(300);
await pg.evaluate(()=>document.activeElement&&document.activeElement.blur());
await tap('Atta 5kg'); await w(800); await tap('Basmati Rice 5kg'); await w(1000);
await pg.screenshot({path:`${OUT}/cart.png`});
mark('gen'); await tap('Generate bill'); await w(3200);
mark('end');
await pg.screenshot({path:`${OUT}/end.png`});
await cdp.send('Page.stopScreencast');
fs.writeFileSync(`${OUT}/meta.json`,JSON.stringify({meta,marks}));
console.log(marks,n);
await b.close();
})();
