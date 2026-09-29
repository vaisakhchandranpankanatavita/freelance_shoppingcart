const fs=require('fs');const {execSync}=require('child_process');
const d=process.argv[2];const {meta}=JSON.parse(fs.readFileSync(`${d}/meta.json`));
const t0=meta[0][1];let lst='';
for(let i=0;i<meta.length;i++){const dur=i<meta.length-1?meta[i+1][1]-meta[i][1]:0.1;
 lst+=`file 'f${String(meta[i][0]).padStart(5,'0')}.jpg'\nduration ${Math.max(dur,0.001).toFixed(4)}\n`;}
lst+=`file 'f${String(meta[meta.length-1][0]).padStart(5,'0')}.jpg'\n`;
fs.writeFileSync(`${d}/list.txt`,lst);
execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${d}/list.txt -vf "fps=30,scale=780:1688:flags=lanczos,format=yuv420p" -c:v libx264 -crf 14 ${d}/raw.mp4`);
console.log('dur',meta[meta.length-1][1]-t0);
