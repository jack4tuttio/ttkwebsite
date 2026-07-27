const FALLBACK_AVATAR =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="420"
      height="420"
      viewBox="0 0 420 420"
    >
      <rect width="420" height="420" fill="#17181d"/>
      <circle cx="210" cy="165" r="72" fill="#343740"/>
      <path
        d="M90 390c8-90 55-140 120-140s112 50 120 140"
        fill="#343740"
      />
    </svg>
  `);

const state = {
  reports: [],
  query: '',
  category: 'all'
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return entities[character];
  });
}

function renderCategories() {
  const categories = [
    ...new Set(
      state.reports.flatMap((report) => report.categories)
    )
  ].sort();

  $('categoryFilter').innerHTML = `
    <option value="all">All categories</option>

    ${categories
      .map((category) => {
        const safeCategory = escapeHtml(category);

        return `
          <option value="${safeCategory}">
            ${safeCategory}
          </option>
        `;
      })
      .join('')}
  `;
}

function getFilteredReports() {
  const query = state.query.toLowerCase();

  return state.reports.filter((report) => {
    const profile = report.profile || {};

    const searchableText = [
      report.userId,
      profile.name || '',
      profile.displayName || '',
      report.summary,
      report.status,
      ...report.categories
    ]
      .join(' ')
      .toLowerCase();

    const matchesCategory =
      state.category === 'all' ||
      report.categories.includes(state.category);

    const matchesSearch =
      !query || searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });
}

function createCategoryBadges(categories) {
  return categories
    .map(
      (category) => `
        <span class="category-badge">
          <span aria-hidden="true">⚑</span>
          ${escapeHtml(category)}
        </span>
      `
    )
    .join('');
}

function render() {
  const reports = getFilteredReports();

  $('cards').innerHTML = reports
    .map((report) => {
      const profile = report.profile || {};

      const displayName =
        profile.displayName ||
        profile.name ||
        `User ${report.userId}`;

      const username =
        profile.name ||
        'Unknown username';

      const avatar =
        profile.avatar ||
        FALLBACK_AVATAR;

      return `
        <article
          class="user-card"
          data-user-id="${escapeHtml(report.userId)}"
          tabindex="0"
          role="button"
          aria-label="Open report for ${escapeHtml(displayName)}"
        >
          <div class="avatar-wrap">
            <img
              class="user-avatar"
              src="${escapeHtml(avatar)}"
              alt="Avatar for ${escapeHtml(displayName)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'"
            >

            <span class="avatar-flag" aria-hidden="true">⚑</span>
          </div>

          <div class="user-card-content">
            <div class="user-card-heading">
              <div>
                <h3>${escapeHtml(displayName)}</h3>
                <p>@${escapeHtml(username)}</p>
              </div>

              <span class="status-badge">
                ${escapeHtml(report.status)}
              </span>
            </div>

            <div class="category-list">
              ${createCategoryBadges(report.categories)}
            </div>

            <p class="report-summary">
              ${escapeHtml(report.summary)}
            </p>

            <div class="card-footer">
              <span>Added ${escapeHtml(report.added)}</span>
              <span>View report →</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  $('empty').hidden = reports.length !== 0;

  const categoryCount = new Set(
    state.reports.flatMap((report) => report.categories)
  ).size;

  $('stats').innerHTML = `
    <strong>${state.reports.length}</strong> listed accounts
    <span>•</span>
    <strong>${categoryCount}</strong> categories
  `;

  document.querySelectorAll('.user-card').forEach((card) => {
    const openCard = () => {
      const report = state.reports.find(
        (item) => item.userId === card.dataset.userId
      );

      if (report) {
        openProfile(report);
      }
    };

    card.addEventListener('click', openCard);

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });
}

function openProfile(report) {
  const profile = report.profile || {};

  const displayName =
    profile.displayName ||
    profile.name ||
    `User ${report.userId}`;

  const username =
    profile.name ||
    'Unknown username';

  const avatar =
    profile.avatar ||
    FALLBACK_AVATAR;

  const created = profile.created
    ? new Date(profile.created).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unavailable';

  $('profileContent').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-wrap">
        <img
          class="profile-avatar"
          src="${escapeHtml(avatar)}"
          alt="Avatar for ${escapeHtml(displayName)}"
          onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'"
        >
      </div>

      <div>
        <span class="eyebrow">Community report</span>
        <h2>${escapeHtml(displayName)}</h2>
        <p>@${escapeHtml(username)}</p>
      </div>
    </div>

    <div class="category-list profile-categories">
      ${createCategoryBadges(report.categories)}
    </div>

    <section class="profile-section">
      <h3>Report summary</h3>
      <p>${escapeHtml(report.summary)}</p>
    </section>

    <section class="profile-section">
      <h3>Account details</h3>

      <dl class="details-grid">
        <div>
          <dt>User ID</dt>
          <dd>${escapeHtml(report.userId)}</dd>
        </div>

        <div>
          <dt>Account created</dt>
          <dd>${escapeHtml(created)}</dd>
        </div>

        <div>
          <dt>Report added</dt>
          <dd>${escapeHtml(report.added)}</dd>
        </div>

        <div>
          <dt>Status</dt>
          <dd>${escapeHtml(report.status)}</dd>
        </div>
      </dl>

      <a
        class="roblox-link"
        href="https://www.roblox.com/users/${encodeURIComponent(
          report.userId
        )}/profile"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Roblox profile
        <span aria-hidden="true">↗</span>
      </a>
    </section>

    <p class="disclaimer">
      This page records a community-submitted allegation. It is not an
      official Roblox finding. Do not use this listing to harass or threaten
      another person.
    </p>
  `;

  $('profileDialog').showModal();
}

async function init() {
  try {
    const response = await fetch(
      `data.json?v=${Date.now()}`,
      {
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(
        `Could not load generated Roblox data (${response.status})`
      );
    }

    const payload = await response.json();

    if (!Array.isArray(payload.reports)) {
      throw new Error('data.json has an invalid format');
    }

    state.reports = payload.reports;

    renderCategories();
    render();
  } catch (error) {
    console.error(error);

    $('error').hidden = false;
    $('error').textContent =
      `${error.message}. Run the “Build and deploy website” workflow ` +
      'and ensure GitHub Pages is configured to use GitHub Actions.';
  } finally {
    $('loading').hidden = true;
  }
}

$('searchInput').addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  render();
});

$('searchInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    $('browse').scrollIntoView({
      behavior: 'smooth'
    });
  }
});

$('searchButton').addEventListener('click', () => {
  state.query = $('searchInput').value.trim();

  render();

  $('browse').scrollIntoView({
    behavior: 'smooth'
  });
});

$('categoryFilter').addEventListener('change', (event) => {
  state.category = event.target.value;
  render();
});

$('closeDialog').addEventListener('click', () => {
  $('profileDialog').close();
});

$('profileDialog').addEventListener('click', (event) => {
  if (event.target === $('profileDialog')) {
    $('profileDialog').close();
  }
});

document.addEventListener('DOMContentLoaded', init);
