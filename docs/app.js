const INDEX_URL = './api/index.json';

let indexCache = null;

async function loadIndex() {
  if (indexCache) return indexCache;
  const res = await fetch(INDEX_URL, { cache: 'no-store' });
  indexCache = await res.json();
  return indexCache;
}

function norm(s) {
  return (s || '').toLowerCase().trim();
}

async function renderResults(matches) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  for (const m of matches) {
    const wrapper = document.createElement('div');
    wrapper.className = 'result';

    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
      <div class="result-title">${m.company_name}</div>
      <div class="result-subtitle">
        ${m.company_id.type}: ${m.company_id.value}
      </div>
    `;

    const details = document.createElement('div');
    details.className = 'result-details';

    header.addEventListener('click', async () => {
      if (details.classList.contains('open')) {
        details.classList.remove('open');
        return;
      }

      // close others (very simple, optional)
      document.querySelectorAll('.result-details.open').forEach(d => d.classList.remove('open'));

      if (!details.dataset.loaded) {
        details.textContent = 'Loading…';

        try {
          const res = await fetch(`./api/companies/${m.slug}.json`, { cache: 'no-store' });

          if (res.status === 404) {
            details.textContent = 'No filing recorded in this registry for this company.';
          } else {
            const data = await res.json();
            const inj = data.injunctions || [];
            details.innerHTML = `
              <p class="muted">
                <strong>${data.company_id.type}:</strong> ${data.company_id.value}
                • <strong>Last reviewed:</strong> ${data.last_reviewed}
              </p>
              ${inj.length ? '<h3>Injunctions</h3>' : ''}
              ${inj.map(c => `
                <div class="case">
                  <div><strong>Court:</strong> ${c.court} (${c.jurisdiction})</div>
                  <div><strong>Status:</strong> ${c.status}</div>
                  <div><strong>Filed:</strong> ${c.filed_date}</div>
                  <div><a href="${c.source_url}" target="_blank" rel="noopener">Source record</a></div>
                </div>
              `).join('')}
              <p class="disclaimer">This is not legal advice. See source links for authoritative information.</p>
            `;

            details.dataset.loaded = 'true';
          }
        } catch {
          details.textContent = 'Error loading record.';
        }
      }

      details.classList.add('open');
    });

    wrapper.appendChild(header);
    wrapper.appendChild(details);
    container.appendChild(wrapper);
  }
}

async function onQuery() {
  const q = norm(document.getElementById('query').value);
  if (!q) {
    document.getElementById('results').innerHTML = '';
    return;
  }

  const idx = await loadIndex();
  const matches = idx.companies.filter(c =>
    norm(c.company_name).includes(q) ||
    norm(c.company_id.value).includes(q)
  );

  renderResults(matches);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('query').addEventListener('input', onQuery);
});