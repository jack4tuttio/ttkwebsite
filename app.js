const FALLBACK_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="#232936"/><text x="50%" y="54%" text-anchor="middle" fill="#9ba4b3" font-size="54" font-family="Arial">?</text></svg>`);

const state = { reports: [], query: '', category: 'all' };
const $ = (id) => document.getElementById(id);

function parseFlaggedFile(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map((line, index) => {
      const [userId, categories, summary, evidence, added, status = 'Flagged'] = line.split('|').map(v => v?.trim());
      if (!userId || !categories || !summary) throw new Error(`Invalid flagged.txt entry on data line ${index + 1}`);
      return {
        userId,
        categories: categories.split(',').map(v => v.trim()).filter(Boolean),
        summary,
        evidence: (evidence || '').split(',').map(v => v.trim()).filter(Boolean),
        added: added || 'Unknown',
        status
      };
    });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function enrichReport(report) {
  let profile = { id: Number(report.userId), name: `User ${report.userId}`, displayName: `User ${report.userId}`, created: null, description: '' };
  try {
    profile = await fetchJson(`https://users.roblox.com/v1/users/${encodeURIComponent(report.userId)}`);
  } catch (error) {
    console.warn('Roblox profile lookup failed', error);
  }

  let avatar = FALLBACK_AVATAR;
  try {
    const thumb = await fetchJson(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(report.userId)}&size=180x180&format=Png&isCircular=false`);
    avatar = thumb?.data?.[0]?.imageUrl || avatar;
  } catch (error) {
    console.warn('Roblox thumbnail lookup failed', error);
  }
  return { ...report, profile, avatar };
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch { return '#'; }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function renderCategories() {
  const categories = [...new Set(state.reports.flatMap(r => r.categories))].sort();
  $('categoryFilter').innerHTML = '<option value="all">All categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function filteredReports() {
  const query = state.query.toLowerCase();
  return state.reports.filter(report => {
    const haystack = [report.userId, report.profile.name, report.profile.displayName, report.summary, ...report.categories].join(' ').toLowerCase();
    const categoryMatch = state.category === 'all' || report.categories.includes(state.category);
    return categoryMatch && (!query || haystack.includes(query));
  });
}

function render() {
  const reports = filteredReports();
  $('cards').innerHTML = reports.map((report, i) => `
    <article class="user-card" tabindex="0" data-index="${state.reports.indexOf(report)}">
      <div class="card-top">
        <img class="avatar" src="${escapeHtml(report.avatar)}" alt="Avatar for ${escapeHtml(report.profile.displayName)}" onerror="this.src='${FALLBACK_AVATAR}'">
        <div class="identity">
          <h3>${escapeHtml(report.profile.displayName)}</h3>
          <div class="handle">@${escapeHtml(report.profile.name)}</div>
        </div>
      </div>
      <div class="badges">${report.categories.map(c => `<span class="badge">⚑ ${escapeHtml(c)}</span>`).join('')}</div>
      <p class="summary">${escapeHtml(report.summary)}</p>
      <div class="card-footer"><span>${escapeHtml(report.added)}</span><span class="status">${escapeHtml(report.status)}</span></div>
    </article>`).join('');

  $('empty').hidden = reports.length !== 0;
  $('stats').innerHTML = `<span><strong>${state.reports.length}</strong> listed accounts</span><span><strong>${new Set(state.reports.flatMap(r => r.categories)).size}</strong> categories</span>`;
  document.querySelectorAll('.user-card').forEach(card => {
    const open = () => openProfile(state.reports[Number(card.dataset.index)]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

function openProfile(report) {
  const created = report.profile.created ? new Date(report.profile.created).toLocaleDateString() : 'Unavailable';
  const evidence = report.evidence.length
    ? `<ul class="evidence-list">${report.evidence.map((url, i) => `<li><a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener noreferrer">Evidence link ${i + 1}</a></li>`).join('')}</ul>`
    : '<p class="handle">No public evidence link supplied.</p>';

  $('profileContent').innerHTML = `
    <div class="profile">
      <div class="profile-hero">
        <img class="avatar" src="${escapeHtml(report.avatar)}" alt="Avatar for ${escapeHtml(report.profile.displayName)}">
        <div>
          <p class="eyebrow">Community report</p>
          <h2>${escapeHtml(report.profile.displayName)}</h2>
          <p class="handle">@${escapeHtml(report.profile.name)}</p>
          <div class="badges">${report.categories.map(c => `<span class="badge">⚑ ${escapeHtml(c)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="profile-grid">
        <section class="profile-section">
          <h3>Report summary</h3>
          <p class="summary" style="display:block">${escapeHtml(report.summary)}</p>
          <h3>Evidence</h3>${evidence}
        </section>
        <aside class="profile-section">
          <h3>Account details</h3>
          <div class="meta-list">
            <span><strong>User ID:</strong> ${escapeHtml(report.userId)}</span>
            <span><strong>Created:</strong> ${escapeHtml(created)}</span>
            <span><strong>Added:</strong> ${escapeHtml(report.added)}</span>
            <span><strong>Status:</strong> ${escapeHtml(report.status)}</span>
            <a href="https://www.roblox.com/users/${encodeURIComponent(report.userId)}/profile" target="_blank" rel="noopener noreferrer">Open Roblox profile ↗</a>
          </div>
        </aside>
      </div>
      <div class="disclaimer">This page records a community-submitted allegation. It is not an official Roblox finding. Review the linked evidence and use your own judgment.</div>
    </div>`;
  $('profileDialog').showModal();
}

async function init() {
  try {
    const text = await fetch(`flagged.txt?v=${Date.now()}`).then(r => {
      if (!r.ok) throw new Error('Could not load flagged.txt');
      return r.text();
    });
    const reports = parseFlaggedFile(text);
    state.reports = await Promise.all(reports.map(enrichReport));
    renderCategories();
    render();
  } catch (error) {
    $('error').hidden = false;
    $('error').textContent = `${error.message}. Make sure flagged.txt is in the same folder as index.html.`;
  } finally {
    $('loading').hidden = true;
  }
}

$('searchInput').addEventListener('input', e => { state.query = e.target.value.trim(); render(); });
$('searchButton').addEventListener('click', () => { state.query = $('searchInput').value.trim(); render(); $('browse').scrollIntoView(); });
$('categoryFilter').addEventListener('change', e => { state.category = e.target.value; render(); });
$('closeDialog').addEventListener('click', () => $('profileDialog').close());
$('profileDialog').addEventListener('click', e => { if (e.target === $('profileDialog')) $('profileDialog').close(); });
$('themeButton').addEventListener('click', () => document.documentElement.classList.toggle('light'));

init();
