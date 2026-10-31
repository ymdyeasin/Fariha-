/* ===== SETUP (একবারই করতে হবে) =====
1. supabase.com এ প্রজেক্ট বানান। Authentication > Providers > Email এ "Allow new users to sign up" বন্ধ করুন।
2. Authentication > Users > Add user দিয়ে শুধু নিজের ইমেইল/পাসওয়ার্ড বানান (Auto confirm ঠিক দিন)।
3. SQL Editor এ নিচের কোড চালান (OWNER_EMAIL জায়গায় আপনার ইমেইল বসান, ৩ জায়গায়):

create table site_published(id int primary key, content jsonb not null);
create table site_draft(id int primary key, content jsonb not null);
alter table site_published enable row level security;
alter table site_draft enable row level security;
create policy "pub read" on site_published for select using (true);
create policy "pub owner" on site_published for all to authenticated using ((auth.jwt()->>'email')='OWNER_EMAIL') with check ((auth.jwt()->>'email')='OWNER_EMAIL');
create policy "draft owner" on site_draft for all to authenticated using ((auth.jwt()->>'email')='OWNER_EMAIL') with check ((auth.jwt()->>'email')='OWNER_EMAIL');
insert into storage.buckets(id,name,public) values('media','media',true);
create policy "media read" on storage.objects for select using (bucket_id='media');
create policy "media owner" on storage.objects for all to authenticated using (bucket_id='media' and (auth.jwt()->>'email')='OWNER_EMAIL') with check (bucket_id='media' and (auth.jwt()->>'email')='OWNER_EMAIL');

4. Project Settings > API থেকে URL ও anon key নিচে বসান। service_role key কখনো বসাবেন না।
===================================== */
// 1) Paste your own values from Supabase → Project Settings → API.
// The anon key is meant to be public; security comes from Row Level Security (see README).
// NEVER put the service_role key here.
const SUPABASE_URL = 'https://irjnvsctucialpninhih.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kP16QKE7jiwCFCKijaScTg_1Y8BBhgU';
let sb = null;
try { sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { console.warn('Supabase এখনো সেট করা হয়নি — ডিফল্ট কনটেন্ট দেখানো হচ্ছে।'); }
const need = () => { if (!sb) throw new Error('Supabase এখনো সেট করা হয়নি। script.js এর উপরে URL ও key বসান।'); };

const DEFAULTS = {
  title: 'A Little Book of Fariha',
  intro: 'কিছু অনুভূতি শব্দে প্রকাশ করা কঠিন। কিছু কথা মনের ভেতরেই থেকে যায়, কিছু স্মৃতি নীরবে সুন্দর হয়ে ওঠে। এই ছোট্ট ডিজিটাল বইটি তেমনই কিছু লেখা, কবিতা, স্মৃতি আর সুন্দর মুহূর্তের সংগ্রহ।',
  about: 'এটি একটি ব্যক্তিগত ডিজিটাল স্মৃতির বই—কিছু লেখা, কবিতা আর সুন্দর মুহূর্তের সংগ্রহ।',
  theme: { c1: '#a5c8ff', c2: '#c9b6ff', c3: '#ffc2e2' },
  nav: { home: 'Home', about: 'About', letter: 'A Letter', poems: 'My Poems', story: 'A Story', photos: 'Photo Gallery', videos: 'Video Gallery', music: 'My Music' },
  letter: { title: 'কিছু না-বলা কথা', body: `প্রিয় ফারিহা,

তোমাকে কিছু কথা বলার ইচ্ছে অনেক দিন ধরেই মনের মধ্যে জমে আছে। জানি না কথাগুলো কীভাবে শুরু করব, কিংবা কীভাবে শেষ করব। তবুও আজ কিছু না-বলা অনুভূতি শব্দের মাধ্যমে প্রকাশ করতে চাই।

প্রায় দুই বছর ধরে তোমাকে ভালো লাগার এই অনুভূতিটা আমার মনের মধ্যে রয়ে গেছে। সময়ের সঙ্গে অনেক কিছু বদলেছে, অনেক দিন চলে গেছে, কিন্তু এই অনুভূতিটা নীরবে থেকে গেছে।

হয়তো কখনো তোমাকে বুঝিয়ে বলতে পারিনি, হয়তো বলার মতো সঠিক সময়ও খুঁজে পাইনি। তাই কথাগুলো মনের মধ্যেই রেখে দিয়েছি।

তোমাকে নিয়ে আমার কোনো দাবি নেই, কোনো প্রত্যাশার বোঝাও দিতে চাই না। তুমি তোমার মতো ভালো থেকো, নিজের স্বপ্নগুলো পূরণ করো, জীবনের প্রতিটি সুন্দর মুহূর্ত উপভোগ করো।

এই চিঠিটি কোনো উত্তর পাওয়ার জন্য নয়। শুধু মনের মধ্যে জমে থাকা কিছু কথা সুন্দরভাবে লিখে রাখার জন্য।

তোমার জীবনে সুখ, শান্তি আর সাফল্য আসুক—এই কামনাই করি।

ইতি,
একজন নীরব অনুভূতির মানুষ।` },
  poems: [
    { title: 'নীরব অনুভূতি', body: `তোমাকে নিয়ে লেখা হয় না,
তবুও কত কথা জমে রয়।
নীরব কোনো বিকেলের মতো,
মনটা তোমার কথা ভেবে যায়।

কিছু অনুভূতি বলা হয় না,
কিছু কথা থাকে অজানা।
দূর থেকেই ভালো থাকুক,
মনের ছোট্ট এই কামনা।

ফুলের মতো সুন্দর হোক,
তোমার প্রতিটি সকাল।
হাসিতে ভরে উঠুক জীবন,
কেটে যাক সব মেঘের জাল।` },
    { title: 'দূর থেকে শুভকামনা', body: `তুমি হয়তো জানো না,
কেউ তোমার ভালো থাকা চায়।
তোমার হাসির সুন্দর মুহূর্ত,
নীরবে কারও মনে জায়গা পায়।

কোনো দাবি নেই, নেই কোনো অভিমান,
নেই তোমাকে কিছু বলার তাড়া।
শুধু চাই তোমার স্বপ্নগুলো,
একদিন ছুঁয়ে যাক আকাশের পাড়া।

জীবনের পথে এগিয়ে যেও,
আলোয় ভরে উঠুক প্রতিটি দিন।
দূর থেকে রইল শুভকামনা,
সুন্দর হোক তোমার রঙিন জীবন।` },
    { title: 'একটি ছোট্ট অনুভূতি', body: `কিছু নাম থাকে মনে,
কোনো শব্দ ছাড়াই।
কিছু স্মৃতি বেঁচে থাকে,
কোনো গল্প না হয়েই।

সময় চলে যায় নিজের পথে,
দিন বদলায় প্রতিদিন।
তবুও কিছু অনুভূতি থেকে যায়,
মনের পাতায় রঙিন।` }
  ],
  // Story title: "একটি না-বলা গল্প" — split into chapters (editable/addable)
  storyTitle: 'একটি না-বলা গল্প',
  story: [
    { title: 'শুরু', body: `গল্পটা শুরু হয়েছিল খুব সাধারণভাবে। কোনো সিনেমার মতো বিশেষ মুহূর্ত ছিল না, ছিল না কোনো সাজানো আয়োজন। জীবনের স্বাভাবিক দিনগুলোর মধ্যেই একজন মানুষের প্রতি একটু আলাদা ভালো লাগা তৈরি হয়েছিল।

প্রথমে বিষয়টি হয়তো খুব সাধারণ মনে হয়েছিল। কিন্তু দিন যেতে যেতে সেই ছোট্ট অনুভূতিটা মনের মধ্যে জায়গা করে নেয়।` },
    { title: 'সময়', body: `সময় কেটে গেছে। অনেক সকাল এসেছে, অনেক সন্ধ্যা নেমেছে। জীবনের ব্যস্ততার মাঝে কত কিছুই বদলে গেছে। কিন্তু কিছু অনুভূতি ঠিক আগের মতোই নীরবে থেকে গেছে।

এই গল্পে বড় কোনো ঘটনা নেই, নেই কোনো নাটকীয় প্রতিশ্রুতি। আছে শুধু কিছু না-বলা কথা, কিছু কল্পনার মুহূর্ত, কিছু সুন্দর ভাবনা আর একজন মানুষের ভালো থাকার জন্য আন্তরিক শুভকামনা।

হয়তো এই গল্পের সব কথা কখনো বলা হবে না। হয়তো এটি শুধু একটি ব্যক্তিগত স্মৃতি হিসেবেই থেকে যাবে।` },
    { title: 'শেষ পাতা', body: `তবুও গল্পটির সৌন্দর্য এখানেই—সব অনুভূতির শেষ পরিণতি জানা জরুরি নয়। কিছু অনুভূতি শুধু সুন্দরভাবে মনে রেখে দেওয়ার জন্যই যথেষ্ট।

এটি কোনো অসম্পূর্ণ সম্পর্কের দাবি নয়। এটি একজন মানুষের মনের ভেতরে লেখা একটি নীরব গল্প।

আর গল্পের শেষ পাতায় লেখা থাকুক:

'তুমি ভালো থেকো। তোমার জীবন সুন্দর হোক।'` }
  ],
  photos: [], videos: [], music: []
};

const DB = {
  async published() { if (!sb) return null; const { data } = await sb.from('site_published').select('content').eq('id', 1).maybeSingle(); return data?.content || null; },
  async draft() { if (!sb) return null; const { data } = await sb.from('site_draft').select('content').eq('id', 1).maybeSingle(); return data?.content || null; },
  async saveDraft(c) { need(); const { error } = await sb.from('site_draft').upsert({ id: 1, content: c }); if (error) throw error; },
  async publish(c) { need(); const { error } = await sb.from('site_published').upsert({ id: 1, content: c }); if (error) throw error; },
  async upload(file) { need();
    const path = Date.now() + '-' + file.name.replace(/[^\w.-]/g, '_');
    const { error } = await sb.storage.from('media').upload(path, file);
    if (error) throw error;
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  }
};
// Public site: rendering, navigation, music, lightbox. admin.js flips `edit` on for the owner.
let C = structuredClone(DEFAULTS), edit = false;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const get = p => p.split('.').reduce((a, k) => a?.[k], C);
const setp = (p, v) => { const k = p.split('.'), l = k.pop(); k.reduce((a, x) => a[x], C)[l] = v; };
const E = (p, t = 'span') => `<${t} class="ed" data-path="${p}">${esc(get(p))}</${t}>`;
const PAGES = ['home', 'about', 'letter', 'poems', 'story', 'photos', 'videos', 'music'];
const ctl = (a, i) => edit ? `<span class="ctl">${[['up', '↑'], ['down', '↓'], ['del', '✕']].map(([x, s]) => `<button data-act="${x}" data-arr="${a}" data-i="${i}">${s}</button>`).join('')}</span>` : '';
const add = a => edit ? `<button class="orb sm" data-act="add" data-arr="${a}">+ Add</button>` : '';
const upl = (a, t) => edit ? `<label class="orb sm">${t}<input type="file" multiple hidden data-up="${a}" accept="${{ photos: 'image/*', videos: 'video/*', music: 'audio/*' }[a]}"></label>` : '';

function apply() { for (const k of ['c1', 'c2', 'c3']) document.documentElement.style.setProperty('--' + k, C.theme[k]); }

const reader = (a, j) => {
  const x = C[a][j]; if (!x) return '<p>—</p>';
  return `<article class="paper">${E(`${a}.${j}.title`, 'h2')}${E(`${a}.${j}.body`, 'p')}</article>
  <div class="pager"><a class="${j > 0 ? '' : 'off'}" href="#${a}/${j - 1}">Previous</a><a class="${j < C[a].length - 1 ? '' : 'off'}" href="#${a}/${j + 1}">Next</a></div>`;
};

function view() {
  const [p0, n] = location.hash.slice(1).split('/'), p = PAGES.includes(p0) ? p0 : 'home', i = +n || 0;
  let h = '';
  const title = `<h2>${esc(C.nav[p])}</h2>`;
  if (p == 'home') h = `<section class="glass hero">${E('title', 'h1')}${E('intro', 'p')}<div class="orbs">${PAGES.slice(2).map(x => `<a class="orb" href="#${x}">${E('nav.' + x)}</a>`).join('')}</div></section>`;
  if (p == 'about') h = `<section class="glass pad">${title}${E('about', 'p')}</section>`;
  if (p == 'letter') h = `<section class="glass pad">${title}<p>Tap the envelope ♡</p><div class="env ${edit ? 'open' : ''}" onclick="this.classList.toggle('open')"><div class="flap"></div>♡</div><article class="paper">${E('letter.title', 'h3')}${E('letter.body', 'p')}</article></section>`;
  if (p == 'poems') h = `<section class="glass pad">${title}${n !== undefined && !edit ? reader('poems', i) :
    `<div class="grid">${C.poems.map((x, j) => edit ? `<article class="card">${ctl('poems', j)}${E(`poems.${j}.title`, 'h3')}${E(`poems.${j}.body`, 'p')}</article>` :
      `<a class="card" href="#poems/${j}"><h3>${esc(x.title)}</h3><p>${esc(x.body.split('\n').slice(0, 2).join('\n'))}…</p></a>`).join('')}</div>${add('poems')}`}</section>`;
  if (p == 'story') h = `<section class="glass pad">${title}${E('storyTitle', 'h3')}${edit ? C.story.map((x, j) => `<article class="card">${ctl('story', j)}${E(`story.${j}.title`, 'h3')}${E(`story.${j}.body`, 'p')}</article>`).join('') + add('story') : reader('story', i)}</section>`;
  if (p == 'photos') h = `<section class="glass pad">${title}<div class="grid gal">${C.photos.map((x, j) => `<figure class="card">${ctl('photos', j)}<img src="${esc(x.url)}" alt="">${E(`photos.${j}.caption`, 'figcaption')}</figure>`).join('') || '<p>No photos yet.</p>'}</div>${upl('photos', 'Upload Photos')}</section>`;
  if (p == 'videos') h = `<section class="glass pad">${title}<div class="grid">${C.videos.map((x, j) => `<div class="card">${ctl('videos', j)}<video controls preload="metadata" playsinline src="${esc(x.url)}"></video>${E(`videos.${j}.title`, 'h3')}${E(`videos.${j}.desc`, 'p')}</div>`).join('') || '<p>No videos yet.</p>'}</div>${upl('videos', 'Upload Videos')}</section>`;
  if (p == 'music') h = `<section class="glass pad player">${title}<div class="eq" id="eq"><i></i><i></i><i></i><i></i></div><h3 id="np">—</h3><div class="pc"><button class="orb sm" data-m="prev">⏮</button><button class="orb sm" data-m="toggle">⏯</button><button class="orb sm" data-m="next">⏭</button></div><input type="range" min="0" max="1" step=".05" value="${au.volume}" data-vol aria-label="Volume"></section>
    <div class="grid">${C.music.map((x, j) => `<div class="card">${ctl('music', j)}<button class="orb sm" data-play="${j}">▶</button> ${E(`music.${j}.title`, 'b')} — ${E(`music.${j}.artist`)}${E(`music.${j}.desc`, 'p')}</div>`).join('') || '<p>No songs yet.</p>'}</div>${upl('music', 'Upload Songs')}`;
  const k = PAGES.indexOf(p);
  const pager = p == 'home' ? '' : `<div class="pager"><a class="${k > 0 ? '' : 'off'}" href="#${PAGES[k - 1]}">Previous</a><a href="#home">Back to Home</a><a class="${k < PAGES.length - 1 ? '' : 'off'}" href="#${PAGES[k + 1]}">Next</a></div>`;
  $('#app').innerHTML = `<div class="turn">${h}${pager}</div>`;
  $('#nav').innerHTML = PAGES.map(x => `<a href="#${x}" class="${x == p ? 'on' : ''}">${esc(C.nav[x])}</a>`).join('');
  document.body.classList.toggle('editing', edit);
  document.querySelectorAll('#app .ed').forEach(e => e.contentEditable = edit);
  syncM();
}

// ---- Music (plays only after a click) ----
const au = new Audio(); let ti = -1;
au.onended = () => pl(ti + 1); au.onplay = au.onpause = () => syncM();
function pl(i) { if (!C.music.length) return; ti = (i + C.music.length) % C.music.length; au.src = C.music[ti].url; au.play(); }
function syncM() { const e = $('#eq'), n = $('#np'); if (e) e.classList.toggle('on', !au.paused); if (n) n.textContent = ti >= 0 ? (C.music[ti]?.title || '') : '—'; }

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.play !== undefined) pl(+t.dataset.play);
  if (t.dataset.m == 'prev') pl(ti - 1);
  if (t.dataset.m == 'next') pl(ti + 1);
  if (t.dataset.m == 'toggle') { if (ti < 0) pl(0); else au.paused ? au.play() : au.pause(); }
  if (t.matches('.gal img') && !edit) { $('#lb').innerHTML = `<img src="${t.src}" alt="">`; $('#lb').hidden = false; }
  if (t.closest('#lb')) $('#lb').hidden = true;
});
document.addEventListener('input', e => {
  if (e.target.dataset.vol !== undefined) au.volume = e.target.value;
  if (edit && e.target.dataset.path) setp(e.target.dataset.path, e.target.innerText);
});

// ---- Boot ----
for (let k = 0; k < 12; k++) { const s = document.createElement('span'); s.textContent = '🌸'; s.style.cssText = `left:${Math.random() * 100}%;animation-delay:${-Math.random() * 22}s;font-size:${14 + Math.random() * 18}px`; $('#petals').append(s); }
$('#openBook').onclick = () => $('#cover').classList.add('hide');
window.addEventListener('hashchange', view);
(async () => { try { const pub = await DB.published(); if (pub) C = pub; } catch (e) { console.warn(e); } apply(); view(); })();