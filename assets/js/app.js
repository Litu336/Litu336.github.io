(() => {
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const showError = (targetId) => {
    const target = byId(targetId);
    if (target) target.append(byId('error-template').content.cloneNode(true));
  };

  let publications = [];
  let activeCategory = '全部';

  function renderProfile(data) {
    const { profile, contact } = data;
    document.title = data.meta.siteTitle;
    byId('profile-name').textContent = profile.name;
    byId('profile-title').textContent = `${profile.title} · ${profile.englishName}`;
    byId('profile-affiliation').textContent = profile.affiliation;
    byId('profile-summary').textContent = profile.summary;
    byId('profile-facts').innerHTML = [
      ['机构', profile.affiliation], ['院系 / 方向', profile.department], ['所在地', profile.location]
    ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
    byId('contact-email').href = `mailto:${contact.email}`;
    byId('contact-email').textContent = contact.email;
    byId('contact-links').innerHTML = contact.links.map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} ↗</a>`).join('');
    byId('footer-updated').textContent = `吴承秘 · 最后更新于 ${data.meta.lastUpdated}`;
  }

  function renderResearch(areas) {
    byId('research-list').innerHTML = areas.map((area, index) => `<article class="research-item"><h3>${String(index + 1).padStart(2, '0')} · ${escapeHtml(area.title)}</h3><div><p>${escapeHtml(area.description)}</p><div class="keyword-list">${area.keywords.map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('')}</div></div></article>`).join('');
  }

  function renderEducation(items) {
    byId('education-list').innerHTML = items.map((item) => `<li class="timeline-item"><time>${escapeHtml(item.period)}</time><div><h3>${escapeHtml(item.degree)} · ${escapeHtml(item.field)}</h3><p class="institution">${escapeHtml(item.institution)}</p><p class="education-description">${escapeHtml(item.description)}</p></div></li>`).join('');
  }

  function renderMetrics(data) {
    const categories = new Set(data.publications.map((item) => item.category)).size;
    byId('achievement-summary').innerHTML = `<div class="metric"><strong>${data.publications.length}</strong><span>论文与报告</span></div><div class="metric"><strong>${data.projects.length}</strong><span>研究项目</span></div><div class="metric"><strong>${categories}</strong><span>成果类别</span></div>`;
  }

  function renderFilters() {
    const categories = ['全部', ...new Set(publications.map((item) => item.category))];
    byId('publication-filters').innerHTML = categories.map((category) => `<button class="filter-button" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`).join('');
    byId('publication-filters').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderPublications();
    }));
  }

  function renderPublications() {
    const filtered = activeCategory === '全部' ? publications : publications.filter((item) => item.category === activeCategory);
    byId('publication-count').textContent = `显示 ${filtered.length} 项成果`;
    byId('publication-list').innerHTML = filtered.map((item) => `<article class="publication-item"><span class="publication-year">${escapeHtml(item.year)}</span><span class="publication-meta">${escapeHtml(item.category)} · ${escapeHtml(item.status)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.authors)} · ${escapeHtml(item.venue)}</p>${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">查看成果 ↗</a>` : ''}</article>`).join('') || '<p class="result-count">该类别暂无成果。</p>';
  }

  function renderProjects(items) {
    byId('projects-list').innerHTML = items.map((item) => `<article class="project-card"><span class="project-period">${escapeHtml(item.period)} · ${escapeHtml(item.status)}</span><h4>${escapeHtml(item.title)}</h4><p class="project-role">${escapeHtml(item.role)}</p><p>${escapeHtml(item.description)}</p></article>`).join('');
  }

  function initTheme() {
    byId('theme-button').addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('academic-theme', nextTheme);
    });
  }

  function initMenu() {
    const button = byId('menu-button');
    const nav = byId('site-nav');
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { button.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }));
  }

  function initVisitCount() {
    const key = 'academic-profile-visits';
    const next = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(next));
    byId('visit-count').textContent = next;
  }

  function initCopyEmail() {
    byId('copy-email').addEventListener('click', async () => {
      const button = byId('copy-email');
      try {
        await navigator.clipboard.writeText(byId('contact-email').textContent);
        button.textContent = '已复制';
      } catch { button.textContent = '请手动复制'; }
      setTimeout(() => { button.textContent = '复制邮箱'; }, 1800);
    });
  }

  async function init() {
    initTheme(); initMenu(); initVisitCount(); initCopyEmail();
    try {
      const response = await fetch('data/profile.json');
      if (!response.ok) throw new Error('无法读取配置文件');
      const data = await response.json();
      publications = data.publications;
      renderProfile(data); renderResearch(data.researchAreas); renderEducation(data.education); renderMetrics(data); renderFilters(); renderPublications(); renderProjects(data.projects);
    } catch (error) {
      ['research-list', 'education-list', 'publication-list'].forEach(showError);
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();