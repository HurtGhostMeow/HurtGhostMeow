import { mkdir, writeFile } from 'node:fs/promises';
const response = await fetch('https://github.com/users/HurtGhostMeow/contributions', {signal: AbortSignal.timeout(30000)});
if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
const html = await response.text();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const tips = new Map([...html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)].map(m=>[attrs(m[1]).for,m[2].trim()]));
const days = [...html.matchAll(/<td\b[^>]*data-date="[^"]+"[^>]*>/g)].map(m=>{
  const a=attrs(m[0]), count=tips.get(a.id)?.match(/^(No|[\d,]+) contributions? on /)?.[1];
  if(!count || !/^[0-4]$/.test(a['data-level'])) throw new Error('Unexpected calendar markup; preserving old assets');
  return {date:a['data-date'],level:+a['data-level'],count:count==='No'?0:Number(count.replaceAll(',',''))};
}).sort((a,b)=>a.date.localeCompare(b.date));
if(days.length<350 || days.length>371 || new Set(days.map(d=>d.date)).size!==days.length) throw new Error('Incomplete calendar');
const colors=['#29212b','#694153','#a5637e','#da91b0','#ffd1e3'];
function svg(h,title,body){return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${h}" viewBox="0 0 960 ${h}" role="img"><title>${title}</title><style>
.breathe{animation:breathe 5s ease-in-out infinite}
.sweep{animation:sweep 8s linear infinite;opacity:0}
@keyframes breathe{0%,100%{opacity:.42}50%{opacity:.82}}
@keyframes sweep{0%{transform:translateX(-180px);opacity:0}8%{opacity:.13}85%{opacity:.13}100%{transform:translateX(980px);opacity:0}}
@media (prefers-reduced-motion:reduce){.breathe,.sweep{animation:none}.sweep{display:none}}
</style><defs><clipPath id="screen"><rect x="2" y="2" width="956" height="${h-4}" rx="23"/></clipPath><linearGradient id="beam"><stop stop-color="#ffd1e3" stop-opacity="0"/><stop offset=".8" stop-color="#ffd1e3" stop-opacity=".35"/><stop offset="1" stop-color="#ffd1e3" stop-opacity="0"/></linearGradient><radialGradient id="bg"><stop stop-color="#30212e"/><stop offset="1" stop-color="#100e16"/></radialGradient><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5H4" stroke="#000" stroke-opacity=".16"/></pattern></defs><rect x="1" y="1" width="958" height="${h-2}" rx="24" fill="url(#bg)" stroke="#694153"/><g font-family="Consolas,monospace" fill="#eec5d6">${body}</g><g clip-path="url(#screen)"><rect class="sweep" x="0" y="2" width="150" height="${h-4}" fill="url(#beam)"/></g><rect x="2" y="2" width="956" height="${h-4}" rx="23" fill="url(#scan)"/></svg>\n`;}
const font={H:['101','101','111','101','101'],U:['101','101','101','101','111'],R:['110','101','110','101','101'],T:['111','010','010','010','010'],G:['111','100','101','101','111'],O:['111','101','101','101','111'],S:['111','100','111','001','111'],M:['10001','11011','10101','10001','10001'],E:['111','100','110','100','111'],W:['10001','10001','10101','11011','10001']};
let dots='',cursor=64;
for(const c of 'HURTGHOSTMEOW'){
  const glyph=font[c];
  glyph.forEach((row,y)=>[...row].forEach((bit,x)=>{dots+=`<circle cx="${cursor+x*13}" cy="${91+y*13}" r="4" fill="${bit==='1'?'#efadc9':'#352733'}"/>`;}));
  cursor+=(glyph[0].length+1)*13;
}
const header=svg(248,'HurtGhostMeow · Pink VFD',`<text x="60" y="39" font-size="12" letter-spacing="3">VFD / PERSONAL SIGNAL</text><circle cx="889" cy="35" r="4" fill="#efadc9"/><g class="breathe" filter="url(#glow)" opacity=".65">${dots}</g>${dots}<text x="60" y="193" font-size="17">有朋自远方来，不亦乐乎</text><text x="60" y="220" font-size="12" fill="#bc92a7" letter-spacing="2">HARDWARE · CODE · CATS</text>`);
const start=Date.parse(days[0].date+'T00:00:00Z');
let pixels='',months='',lastMonth='';
for(const day of days){
 const offset=Math.round((Date.parse(day.date+'T00:00:00Z')-start)/86400000),x=61+Math.floor(offset/7)*16,y=116+(offset%7)*16;
 if(day.date.slice(0,7)!==lastMonth && offset%7===0){months+=`<text x="${x-5}" y="94" font-size="10" fill="#bc92a7">${day.date.slice(5,7)}</text>`;lastMonth=day.date.slice(0,7);}
 if(day.level) pixels+=`<circle class="breathe" style="animation-delay:-${(offset%7)*.4}s" cx="${x}" cy="${y}" r="5.4" fill="${colors[day.level]}" filter="url(#glow)" opacity=".7"/>`;
 pixels+=`<rect x="${x-4.5}" y="${y-4.5}" width="9" height="9" rx="2" fill="${colors[day.level]}"><title>${day.date}: ${day.count} contributions</title></rect>`;
}
const total=days.reduce((sum,d)=>sum+d.count,0);
const calendar=svg(294,`${total} contributions from ${days[0].date} to ${days.at(-1).date}`,`<text x="56" y="40" font-size="13" letter-spacing="2">CONTRIBUTION MEMORY</text><text x="56" y="66" font-size="12" fill="#bc92a7">${days[0].date} — ${days.at(-1).date}</text><text x="901" y="42" text-anchor="end" font-size="16">${total} contributions</text>${months}${pixels}<text x="56" y="264" font-size="11" fill="#bc92a7">ONE PIXEL / ONE DAY</text><text x="716" y="264" font-size="11" fill="#bc92a7">LESS</text>${colors.map((c,i)=>`<rect x="${755+i*22}" y="253" width="10" height="10" rx="2" fill="${c}"/>`).join('')}<text x="871" y="264" font-size="11" fill="#bc92a7">MORE</text>`);
await mkdir(new URL('../assets/',import.meta.url),{recursive:true});
await writeFile(new URL('../assets/vfd-header.svg',import.meta.url),header);
await writeFile(new URL('../assets/vfd-contributions.svg',import.meta.url),calendar);
console.log(`Generated ${days.length} real pixels / ${total} contributions`);
