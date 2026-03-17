const INDEX_URL = './api/index.json';

let indexCache = null;

async function loadIndex() {
  if (indexCache) return indexCache;
  const res = await fetch(INDEX_URL, { cache: 'no-store' });
  indexCache = await res.json();
  return indexCache;
}

function norm(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function renderResults(matches) {
  const results = document.getElementById('results');
  results.innerHTML = '';
  matches.slice(0, 50).forEach(m => {
    const el = document.createElement('div');
    el.className = 'result';
    el.innerHTML = `
      <div>
        <strong>${m.company_name}</strong><br/>
        <small>${m.company_id.type}: ${m.company_id.value}</small>
      </div>
      <span class="badge warn">Has filing</span>
    `;
    el.onclick = () => window.location.href = `./company.html?slug=${encodeURIComponent(m.slug)}`;
    results.appendChild(el);
  });
}

async function onQuery() {
  const q = norm(document.getElementById('query').value);
  if (!q) { document.getElementById('results').innerHTML = ''; return; }
  const idx = await loadIndex();
  const matches = idx.companies.filter(c => {
    const n = norm(c.company_name);
    const id = norm(c.company_id.value);
    return n.includes(q) || id.includes(q);
  }).sort((a, b) => a.company_name.localeCompare(b.company_name));
  renderResults(matches);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('query');
  input.addEventListener('input', onQuery);
});