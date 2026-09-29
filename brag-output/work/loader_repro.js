const p=require('puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
const mode=process.argv[2]||'real'; // real | demo
(async()=>{
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const pg=await b.newPage();
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.setRequestInterception(true);
const H={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
const J=o=>({status:200,contentType:'application/json',headers:H,body:JSON.stringify(o)});
pg.on('request',r=>{const u=r.url();
 if(!u.includes('serieux.in')) return r.continue();
 if(mode==='demo') return r.abort();
 if(r.method()==='OPTIONS') return r.respond({status:204,headers:H});
 if(u.includes('/login')) return r.respond(J({status:true,message:'ok',access_token:'a',refresh_token:'b',user:{id:1,name:'Admin',username:'Admin',login_id:'1001',roles:['Admin']}}));
 if(u.includes('/logout')) return r.respond(J({status:true}));
 return r.respond(J({status:true,data:[]}));});
await pg.setViewport({width:430,height:900});
await pg.goto('http://localhost:8081',{waitUntil:'domcontentloaded'});
await w(7500);
const run=async(tag)=>{
  await pg.click('input'); await pg.keyboard.type('1001',{delay:80});
  const t0=Date.now(); const seen=[];
  for(let i=0;i<24;i++){ await pg.screenshot({path:`R_${mode}_${tag}_${String(i).padStart(2,'0')}.png`,clip:{x:0,y:0,width:430,height:900}});
    seen.push(await pg.evaluate(()=>document.querySelector('[aria-label="Signing you in"]')?'L':(document.body.innerText.includes('Store Dashboard')?'D':'-'))); await w(120);}
  console.log(mode,tag,seen.join(''),Date.now()-t0);
};
await run('first');
await w(3000);
// logout via More
await pg.evaluate(()=>{[...document.querySelectorAll('[role=tab]')].pop().click()}); await w(1500);
await pg.evaluate(()=>document.querySelector('[aria-label="Log out"]').click()); await w(800);
await pg.evaluate(()=>{const c=[...document.querySelectorAll('*')].filter(x=>x.children.length===0&&x.textContent==='Log out');c[c.length-1].click()}); await w(8500);
console.log('after logout has Sign in:',await pg.evaluate(()=>document.body.innerText.includes('Sign in')));
await run('second');
await b.close();
})();
