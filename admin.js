// Owner-only tools. Real protection is Supabase RLS (README SQL); this file is just the UI.
const bar = $('#bar');
const BLANK = { poems: () => ({ title: 'নতুন কবিতা', body: 'এখানে লিখুন…' }), story: () => ({ title: 'নতুন অধ্যায়', body: 'এখানে লিখুন…' }) };

async function enter() {
  C = (await DB.draft()) || (await DB.published()) || C; apply(); edit = false;
  bar.hidden = false;
  bar.innerHTML = [['bEdit', 'Edit Website'], ['bPrev', 'Preview Changes'], ['bSave', 'Save Draft'], ['bPub', 'Publish Changes'], ['bDis', 'Discard Changes'], ['bDash', 'Dashboard'], ['bOut', 'Logout']]
    .map(([id, t]) => `<button class="orb sm" id="${id}">${t}</button>`).join('');
  const on = (id, f) => $('#' + id).onclick = async () => { try { await f(); } catch (e) { alert(e.message); } };
  on('bEdit', () => { edit = true; view(); });
  on('bPrev', () => { edit = false; view(); });
  on('bSave', async () => { await DB.saveDraft(C); alert('Draft saved.'); });
  on('bPub', async () => {
    if (!confirm('Publish these changes? Visitors will see them immediately.')) return;
    await DB.saveDraft(C); await DB.publish(C); alert('Published.');
  });
  on('bDis', async () => {
    if (!confirm('Discard all draft changes and go back to the published version?')) return;
    C = (await DB.published()) || structuredClone(DEFAULTS); await DB.saveDraft(C); apply(); view();
  });
  on('bDash', dash);
  on('bOut', async () => { await sb.auth.signOut(); location.reload(); });
  view();
}

function dash() {
  let d = $('#dash'); if (!d) { d = document.createElement('dialog'); d.id = 'dash'; document.body.append(d); }
  d.innerHTML = `<h3>Dashboard</h3>${['c1', 'c2', 'c3'].map((k, n) => `<label>Background color ${n + 1} <input type="color" data-c="${k}" value="${C.theme[k]}"></label>`).join('')}
  <p>Use Edit Website to change any text, then Save Draft or Publish Changes.</p><button class="orb sm" onclick="this.closest('dialog').close()">Close</button>`;
  d.oninput = e => { if (e.target.dataset.c) { C.theme[e.target.dataset.c] = e.target.value; apply(); } };
  d.showModal();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || !edit) return;
  const a = C[b.dataset.arr], i = +b.dataset.i, act = b.dataset.act;
  if (act == 'del') { if (!confirm('Delete this item?')) return; a.splice(i, 1); }
  else if (act == 'up' && i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; }
  else if (act == 'down' && i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; }
  else if (act == 'add') { a.push(BLANK[b.dataset.arr]()); }
  view();
});

document.addEventListener('change', async e => {
  const f = e.target.dataset.up; if (!f || !edit) return;
  try {
    for (const file of e.target.files) {
      const url = await DB.upload(file), name = file.name.replace(/\.\w+$/, '');
      C[f].push(f == 'photos' ? { url, caption: 'ক্যাপশন লিখুন' } : f == 'videos' ? { url, title: name, desc: 'বর্ণনা লিখুন' } : { url, title: name, artist: 'Artist', desc: 'বর্ণনা লিখুন' });
    }
  } catch (err) { alert('Upload failed: ' + err.message); }
  view();
});

$('#adminBtn').onclick = () => $('#login').showModal();
$('#cx').onclick = () => $('#login').close();
$('#go').onclick = async () => {
  if (!sb) { $('#le').textContent = 'Supabase এখনো সেট করা হয়নি।'; return; }
  const { error } = await sb.auth.signInWithPassword({ email: $('#em').value, password: $('#pw').value });
  if (error) { $('#le').textContent = error.message; return; }
  $('#login').close(); enter();
};
sb && sb.auth.getSession().then(({ data }) => { if (data.session) enter(); });