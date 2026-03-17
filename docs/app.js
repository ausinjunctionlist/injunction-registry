const INDEX_URL = './api/index.json';

let indexCache = null;

async function loadIndex() {
  if (indexCache) return indexCache;
  const res = await fetch(INDEX_URL, { cache: 'no-store' });
  indexCache = await res.json();
  return indexCache;
}

function normalize(s) {
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
      <span class="badge ${m.has_injunction ? 'warn' : 'ok'}">
        ${m.has_injunction ? 'Has filing' : 'No filing recorded'}
      </span>
    `;
    el.onclick = () => loadDetails(m.slug);
    results.appendChild(el);
  });
}

async function loadDetails(slug) {
  const detailsEl = document.getElementById('details');
  detailsEl.textContent = 'Loading...';
  try {
    const res = await fetch(`./api/companies/${slug}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const inj = data.injunctions || [];
    detailsEl.innerHTML = `
      <h2>${data.company_name}</h2>
      <p><strong>${data.company_id.type}:</strong> ${data.company_id.value}</p>
      <p><strong>Has injunction filed:</strong> ${data.has_injunction ? 'Yes' : 'No'}</p>
      <p><strong>Last reviewed:</strong> ${data.last_reviewed}</p>
      ${inj.length ? '<h3>Injunctions</h3>' : ''}
      ${inj.map(c => `
        <div class="case">
          <div><strong>Court:</strong> ${c.court} (${c.jurisdiction})</div>
          <div><strong>Type:</strong> ${c.type || '—'} | <strong>Status:</strong> ${c.status}</div>
          <div><strong>Filed:</strong> ${c.filed_date} | <strong>Case #</strong> ${c.case_number}</div>
          ${c.summary ? `<div><strong>Summary:</strong> ${c.summary}</div>` : ''}
          <div><a href="${c.source_url}" target="_blank" rel="noopener">Source record</a></div>
        </div>
      `).join('')}
    `;
  } catch (e) {
    detailsEl.textContent = 'No details found.';
  }
}

async function onQuery() {
  const q = normalize(document.getElementById('query').value);
  const detailsEl = document.getElementById('details');
  detailsEl.innerHTML = '';
  if (!q) { document.getElementById('results').innerHTML = ''; return; }

  const idx = await loadIndex();
  const matches = idx.companies.filter(c => {
    const n = normalize(c.company_name);
    const id = normalize(c.company_id.value);
    return n.includes(q) || id.includes(q);
  }).sort((a, b) => a.company_name.localeCompare(b.company_name));
  renderResults(matches);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('query');
  input.addEventListener('input', onQuery);
});