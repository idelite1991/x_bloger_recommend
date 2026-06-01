import { mkdir, writeFile, copyFile, stat, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const tones = ['lime','violet','blue','pink','cyan','amber','green','orange','red','teal'];
const toneCss = {
  lime:['#c8ff3d','#33440b'], violet:['#be8cff','#311a52'], blue:['#7cc7ff','#123a59'],
  pink:['#ff80c7','#501733'], cyan:['#63f3ff','#0e4a4d'], amber:['#ffd76d','#4b3510'],
  green:['#6eff9b','#113b22'], orange:['#ffae55','#51300f'], red:['#ff7b72','#4b1515'], teal:['#5ef0cf','#0f463c']
};

const cleanHandle = h => String(h || '').trim().replace(/^@/, '');
const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const initials = h => cleanHandle(h).slice(0,2).toUpperCase() || 'X';

async function fetchAvatar(account, avatarDir) {
  const handle = cleanHandle(account.handle);
  const file = path.join(avatarDir, `${handle}.png`);
  if (existsSync(file)) {
    const info = await stat(file);
    if (info.size >= 1800) return true;
    await rm(file, { force: true });
  }
  if (account.avatarPath) {
    await copyFile(account.avatarPath, file);
    return true;
  }
  const url = account.avatarUrl || `https://unavatar.io/x/${encodeURIComponent(handle)}`;
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 1800) throw new Error(`avatar too small: ${b.length}`);
      await writeFile(file, b);
      return true;
    } catch (e) {
      if (i === 1) console.warn(`Avatar fallback for @${handle}: ${e.message}`);
    }
  }
  return false;
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'google-chrome','chromium','microsoft-edge'
  ].filter(Boolean);
  return candidates.find(c => c.includes('\\') || c.includes('/') ? existsSync(c) : true);
}

function buildHtml(input, accounts) {
  const title = input.title || `中文 X 圈，先订阅这 ${accounts.length} 个博主`;
  const subtitle = input.subtitle || '用户名 + 定位一次给全，按领域订阅，快速搭好你的信息源';
  const footer = input.footer || '订阅建议：先关注，再分组；每天刷 15 分钟，顺手在评论区补充实测、避坑和落地步骤。';
  const cards = accounts.map((a, i) => {
    const tone = tones.includes(a.tone) ? a.tone : tones[i % tones.length];
    const [accent, tagBg] = toneCss[tone];
    const h = cleanHandle(a.handle);
    const avatar = a.avatarOk ? `<img src="avatars/${encodeURIComponent(h)}.png" alt="" />` : `<span>${esc(initials(h))}</span>`;
    return `<article class="card" style="--accent:${accent};--tag-bg:${tagBg}"><div class="num">${String(i+1).padStart(2,'0')}</div><div class="avatar"><div class="avatar-glow"></div>${avatar}</div><div class="copy"><div class="handle">@${esc(h)}</div><div class="title">${esc(a.title)}</div><p>${esc(a.desc)}</p><span class="tag">${esc(a.tag || input.topic || 'X')}</span></div></article>`;
  }).join('');
  const h1 = esc(title).replaceAll(String(accounts.length), `<strong>${accounts.length}</strong>`);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>
*{box-sizing:border-box}html,body{margin:0;width:1600px;height:900px;overflow:hidden;background:#02070a;font-family:"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",Arial,sans-serif;color:#f7fbff}body{display:grid;place-items:center;letter-spacing:0}.poster{position:relative;width:1600px;height:900px;padding:30px 52px 32px;overflow:hidden;background:radial-gradient(circle at 16% 9%,rgba(117,255,177,.22),transparent 24%),radial-gradient(circle at 86% 9%,rgba(92,179,255,.18),transparent 24%),radial-gradient(circle at 50% 100%,rgba(183,255,60,.10),transparent 32%),linear-gradient(180deg,#02070a 0%,#071014 52%,#020507 100%)}.poster:before{content:"";position:absolute;inset:0;opacity:.24;background-image:radial-gradient(circle,rgba(164,255,87,.35) 0 1.3px,transparent 1.4px),linear-gradient(rgba(151,255,194,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(151,255,194,.05) 1px,transparent 1px);background-size:16px 16px,56px 56px,56px 56px;mask-image:radial-gradient(ellipse at center,#000 0 62%,transparent 84%)}header{position:relative;z-index:1;text-align:center;margin-bottom:26px}h1{margin:0;font-size:48px;line-height:1.08;font-weight:900;text-shadow:0 0 22px rgba(173,255,52,.12);letter-spacing:0}h1 strong{color:#caff3f;font-size:1.13em;padding:0 7px}.subtitle{margin-top:12px;color:rgba(242,249,255,.78);font-size:21px;font-weight:600}.grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,1fr);gap:11px 16px;height:650px}.card{position:relative;display:grid;grid-template-columns:118px 1fr;align-items:center;min-width:0;padding:12px 24px 12px 18px;border:1.4px solid color-mix(in srgb,var(--accent),transparent 34%);border-radius:10px;background:linear-gradient(145deg,rgba(255,255,255,.058),rgba(255,255,255,.018)),rgba(3,15,18,.80);box-shadow:inset 0 0 0 1px rgba(255,255,255,.035),0 0 22px color-mix(in srgb,var(--accent),transparent 86%);overflow:hidden}.card:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,color-mix(in srgb,var(--accent),transparent 89%),transparent 42%)}.num{position:absolute;left:17px;top:11px;color:#caff3f;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}.avatar{position:relative;width:78px;height:78px;margin-left:34px;border-radius:50%;display:grid;place-items:center;border:2px solid rgba(255,255,255,.85);background:linear-gradient(135deg,color-mix(in srgb,var(--accent),#111 32%),#071014 58%,#000);box-shadow:0 0 20px color-mix(in srgb,var(--accent),transparent 72%);overflow:hidden}.avatar-glow{position:absolute;inset:0;border-radius:inherit;border:1px solid rgba(255,255,255,.20);box-shadow:inset 0 0 18px rgba(0,0,0,.42);z-index:2}.avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit}.avatar span{position:relative;color:#fff;font-size:25px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.5)}.copy{position:relative;min-width:0;padding-left:18px}.handle{font-size:29px;line-height:1;font-weight:900;color:#fff;white-space:nowrap;text-shadow:0 1px 10px rgba(255,255,255,.08)}.title{margin-top:6px;color:rgba(255,255,255,.91);font-size:18px;line-height:1.22;font-weight:800;white-space:nowrap}p{margin:5px 0 0;color:rgba(238,246,255,.82);font-size:16.5px;line-height:1.28;font-weight:500}.tag{position:absolute;right:24px;top:17px;display:inline-flex;align-items:center;height:23px;padding:0 10px;border-radius:6px;color:var(--accent);background:color-mix(in srgb,var(--tag-bg),#000 12%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent),transparent 72%);font-size:14.5px;font-weight:800}footer{position:relative;z-index:1;display:flex;align-items:center;gap:18px;margin-top:24px;height:52px;padding:0 22px;border:1.4px solid rgba(198,255,65,.55);border-radius:10px;background:rgba(1,12,11,.76);box-shadow:inset 0 0 0 1px rgba(255,255,255,.035),0 0 28px rgba(186,255,65,.10);font-size:20px;font-weight:700;color:rgba(246,255,251,.90)}.bulb{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#caff3f;border:1px solid rgba(202,255,63,.62);box-shadow:0 0 14px rgba(202,255,63,.22);flex:0 0 auto;font-size:19px}</style></head><body><main class="poster"><header><h1>${h1}</h1><div class="subtitle">${esc(subtitle)}</div></header><section class="grid">${cards}</section><footer><div class="bulb">i</div><div>${esc(footer)}</div></footer></main></body></html>`;
}

async function main(){
  const inputFile = process.argv[2];
  const outputDir = process.argv[3] || path.join(process.cwd(),'x-topic-blogger-pack-output');
  if(!inputFile){ console.error('Usage: node render-poster.mjs <input.json> [output-dir]'); process.exit(1); }
  const input = JSON.parse(await readFile(inputFile,'utf8'));
  const accounts = (input.accounts || []).slice(0,10);
  if(accounts.length < 1) throw new Error('input.accounts is required');
  await mkdir(outputDir,{recursive:true});
  const avatarDir = path.join(outputDir,'avatars');
  await mkdir(avatarDir,{recursive:true});
  await Promise.all(accounts.map(async a => { a.handle = `@${cleanHandle(a.handle)}`; a.avatarOk = await fetchAvatar(a, avatarDir); }));
  const htmlFile = path.join(outputDir,'x-blogger-pack.html');
  const pngFile = path.join(outputDir,'x-blogger-pack.png');
  const jsonFile = path.join(outputDir,'x-blogger-pack.json');
  await writeFile(htmlFile, buildHtml(input, accounts), 'utf8');
  await writeFile(jsonFile, JSON.stringify({ ...input, accounts }, null, 2), 'utf8');
  const browser = findBrowser();
  if(!browser) throw new Error('No Edge/Chrome browser found for PNG export');
  await execFileAsync(browser, ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1600,900',`--screenshot=${pngFile}`,pathToFileURL(htmlFile).href], { timeout:30000 });
  console.log(JSON.stringify({ png:pngFile, html:htmlFile, json:jsonFile, avatars:avatarDir }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
