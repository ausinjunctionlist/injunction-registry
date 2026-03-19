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

const DATE_FMT = new Intl.DateTimeFormat('en-AU', { day:'2-digit', month:'short', year:'numeric' });

function fmtDate(iso) {
  if (!iso) return '';                  // no date
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
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
                • <strong>Last reviewed:</strong> ${fmtDate(data.last_reviewed)}
              </p>
              ${inj.length ? '<h3>Injunctions</h3>' : ''}
              ${inj.map(c => `
                <div class="case">
                  <div><strong>Court:</strong> ${c.court} (${c.jurisdiction})</div>
                  <div><strong>Status:</strong> ${c.status}</div>
                  <div><strong>Filed:</strong> ${fmtDate(c.filed_date)}</div>
                  <div><strong>Citation:</strong> <a href="${c.source_url}" target="_blank" rel="noopener">${c.citation}</a></div>
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
  const recentSection = document.getElementById('recent-section');
  if (recentSection) {
    recentSection.style.display = document.getElementById('query').value ? 'none' : '';
  }
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

function byDateDesc(a, b) {
  // sort by latest_filed_date desc; nulls at bottom
  const da = a.latest_filed_date ? Date.parse(a.latest_filed_date) : 0;
  const db = b.latest_filed_date ? Date.parse(b.latest_filed_date) : 0;
  return db - da;
}

async function renderRecent(limit = 5) {
  const recentContainer = document.getElementById('recent');
  if (!recentContainer) return;

  try {
    const idx = await loadIndex();
    // Only companies with a usable date
    const recent = idx.companies
      .filter(c => !!c.latest_filed_date)
      .sort(byDateDesc)
      .slice(0, limit);

    if (recent.length === 0) {
      recentContainer.innerHTML = '<p class="muted">No recent filings.</p>';
      return;
    }

    // Render just a compact line and keep it clickable to expand (reuse the same inline renderer)
    recentContainer.innerHTML = '';
    recent.forEach(m => {
      const card = document.createElement('div');
      card.className = 'result';

      const header = document.createElement('div');
      header.className = 'result-header';
      header.innerHTML = `
        <div class="result-title">${m.company_name}</div>
        <div class="result-subtitle">
          ${m.company_id.type}: ${m.company_id.value}
          ${m.latest_filed_date ? ` • Filed: ${m.latest_filed_date}` : ''}
        </div>
      `;

      const details = document.createElement('div');
      details.className = 'result-details';

      header.addEventListener('click', async () => {
        const opening = !details.classList.contains('open');
        document.querySelectorAll('.result-details.open').forEach(d => d.classList.remove('open'));
        if (!opening) return;

        if (!details.dataset.loaded) {
          details.textContent = 'Loading…';
          try {
            const res = await fetch(`./api/companies/${m.slug}.json`, { cache: 'no-store' });
            if (res.status === 404) {
              details.textContent = 'No filing recorded in this registry for this company.';
            } else if (res.ok) {
              const data = await res.json();
              const inj = data.injunctions || [];
              details.innerHTML = `
                <p class="muted">
                  <strong>${data.company_id.type}:</strong> ${data.company_id.value}
                  • <strong>Last reviewed:</strong> ${fmtDate(data.last_reviewed)}
                </p>
                ${inj.length ? '<h3>Injunctions</h3>' : ''}
                ${inj.map(c => `
                  <div class="case">
                    <div><strong>Court:</strong> ${c.court} (${c.jurisdiction})</div>
                    <div><strong>Status:</strong> ${c.status}</div>
                    <div><strong>Filed:</strong> ${fmtDate(c.filed_date)}</div>
                    <div><strong>Citation:</strong> <a href="${c.source_url}" target="_blank" rel="noopener">${c.citation}</a></div>
                  </div>
                `).join('')}
                <p class="disclaimer">This is not legal advice. See source links for authoritative information.</p>
              `;
              details.dataset.loaded = 'true';
            } else {
              details.textContent = `Unable to load details (status ${res.status}).`;
            }
          } catch {
            details.textContent = 'Network error loading details.';
          }
        }

        details.classList.add('open');
      });

      card.appendChild(header);
      card.appendChild(details);
      recentContainer.appendChild(card);
    });
  } catch {
    recentContainer.innerHTML = '<p class="muted">Unable to load recent filings.</p>';
  }
}


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('query').addEventListener('input', onQuery);
  renderRecent(5);
});