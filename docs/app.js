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

function companyDetailsTemplate(data) {
  const inj = data.injunctions || [];
  const rows = inj.map(c => `
    <div class="case">
      <div><strong>Court:</strong> ${c.court} (${c.jurisdiction})</div>
      <div><strong>Type:</strong> ${c.type || '—'} | <strong>Status:</strong> ${c.status}</div>
      <div><strong>Filed:</strong> ${c.filed_date} | <strong>Case #</strong> ${c.case_number}</div>
      ${c.summary ? `<div><strong>Summary:</strong> ${c.summary}</div>` : ''}
      ${c.source_url ? `<div><a href="${c.source_url}" target="_blank" rel="noopener noreferrer">Source record</a></div>` : ''}
    </div>
  `).join('');

  return `
    <p class="muted">
      <strong>${data.company_id.type}:</strong> ${data.company_id.value}
      • <strong>Last reviewed:</strong> ${data.last_reviewed}
    </p>
    ${inj.length ? `<h3>Injunctions</h3>${rows}` : '<p>No injunction details found in record.</p>'}
    <p class="disclaimer">This is not legal advice. See source links for authoritative information.</p>
  `;
}

function renderResults(matches) {
  const results = document.getElementById('results');
  results.innerHTML = '';

  matches.slice(0, 100).forEach(m => {
    const el = document.createElement('div');
    el.className = 'result';
    el.setAttribute('data-slug', m.slug);

    // Header row
    const header = document.createElement('div');
    header.className = 'result-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', `details-${m.slug}`);
    toggleBtn.innerHTML = `
      <span class="chevron" aria-hidden="true">▶</span>
      <span class="result-title">
        <span class="name">${m.company_name}</span>
        <span class="id">${m.company_id.type}: ${m.company_id.value}</span>
      </span>
    `;

    const badge = document.createElement('span');
    badge.className = 'badge warn';
    badge.textContent = 'Has filing';

    header.appendChild(toggleBtn);
    header.appendChild(badge);

    // Details block BELOW the header
    const details = document.createElement('div');
    details.className = 'result-details';
    details.id = `details-${m.slug}`;
    details.setAttribute('role', 'region');
    details.setAttribute('aria-live', 'polite');
    details.setAttribute('aria-label', `Details for ${m.company_name}`);

    el.appendChild(header);
    el.appendChild(details);
    results.appendChild(el);
    
    // Toggle behavior (open/close)
    toggleBtn.addEventListener('click', async () => {
      const isOpen = details.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      const chevron = toggleBtn.querySelector('.chevron');
      chevron.classList.toggle('open', isOpen);

      if (isOpen && !details.dataset.loaded) {
        details.innerHTML = '<p class="loading">Loading…</p>';
        try {
          const res = await fetch(`./api/companies/${m.slug}.json`, { cache: 'no-store' });
          if (res.status === 404) {
            details.innerHTML = '<p>No filing recorded in this registry for this company.</p>';
          } else if (res.ok) {
            const data = await res.json();
            details.innerHTML = companyDetailsTemplate(data);
            details.dataset.loaded = 'true';
          } else {
            details.innerHTML = `<p>Unable to load details (status ${res.status}).</p>`;
          }
        } catch {
          details.innerHTML = '<p>Network error loading details.</p>';
        }
      }
    });
  });
}

async function onQuery() {
  const q = norm(document.getElementById('query').value);
  if (!q) { document.getElementById('results').innerHTML = ''; return; }

  const idx = await loadIndex();
  const matches = idx.companies
    .filter(c => {
      const n = norm(c.company_name);
      const id = norm(c.company_id.value);
      return n.includes(q) || id.includes(q);
    })
    .sort((a, b) => a.company_name.localeCompare(b.company_name));

  renderResults(matches);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('query');
  input.addEventListener('input', onQuery);
});