/* Reading aids enhance the source HTML; downloads and evidence remain intact. */
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const page = document.body.dataset.page || '';
  const headings = [...main.querySelectorAll('h2')]
    .filter(h => !h.closest('details,aside,.country-snapshot,.evidence-guide,.country-detail,.explorer-result'));
  if (headings.length >= 4 && page !== 'index.html' && page !== 'access.html' && !page.startsWith('essay-')) {
    const nav = document.createElement('nav');
    nav.className = 'wrap page-sections'; nav.setAttribute('aria-label', 'On this page');
    const label = document.createElement('strong'); label.textContent = 'On this page'; nav.append(label);
    const seen = new Set();
    headings.forEach((h, i) => {
      const text = h.textContent.trim();
      if (seen.has(text)) return; seen.add(text);
      if (!h.id) h.id = 'section-' + i;
      const a = document.createElement('a'); a.href = '#' + h.id; a.textContent = text; nav.append(a);
    });
    const intro = main.querySelector('.pagehead'); if (intro) intro.after(nav);
  }
  main.querySelectorAll('.cp-row').forEach(row => {
    const provenance = row.querySelector('.cp-recompute'), tier = row.querySelector('.cp-tier');
    if (!provenance) return;
    const details = document.createElement('details'), summary = document.createElement('summary');
    details.className = 'calculation-detail'; summary.textContent = 'Calculation and evidence detail';
    details.append(summary);
    if (tier) { const p = document.createElement('p'); p.textContent = tier.textContent; details.append(p); tier.remove(); }
    details.append(provenance); row.append(details);
  });
  main.querySelectorAll('figure').forEach(figure => {
    const links = [...figure.querySelectorAll('a')].filter(a=>['SVG','PNG','CSV','Embed'].includes(a.textContent.trim()));
    if (links.length < 2) return;
    const details = document.createElement('details'), summary = document.createElement('summary'), actions = document.createElement('div');
    details.className = 'chart-reuse'; summary.textContent = 'Download or reuse this chart'; actions.className = 'chart-actions';
    links.forEach(a=>actions.append(a)); details.append(summary,actions); figure.append(details);
  });
  if (page === 'research.html') {
    const records = [...main.querySelectorAll('.rs-item')]; if (!records.length) return;
    const controls = document.createElement('section'); controls.className = 'library-filters';
    controls.setAttribute('aria-label', 'Find research');
    controls.innerHTML = '<label>Search research<input type="search" placeholder="Title, author, country or topic" data-library-search></label><label>Publication type<select data-library-type><option value="">All publication types</option></select></label><label>Pillar<select data-library-pillar><option value="">All pillars</option></select></label><p role="status" data-library-count></p>';
    const types = controls.querySelector('[data-library-type]'), pillars = controls.querySelector('[data-library-pillar]');
    [...new Set(records.map(r=>r.dataset.researchVenue))].filter(Boolean).sort().forEach(v=>types.add(new Option(v.replaceAll('-',' '),v)));
    [...new Set(records.map(r=>r.dataset.researchPillar))].filter(Boolean).sort().forEach(v=>pillars.add(new Option(v,v)));
    function filter() {
      const words = controls.querySelector('input').value.toLowerCase().trim().split(/\s+/).filter(Boolean); let count = 0;
      records.forEach(r=>{r.hidden = !words.every(w=>r.textContent.toLowerCase().includes(w)) || !!(types.value && r.dataset.researchVenue!==types.value) || !!(pillars.value && r.dataset.researchPillar!==pillars.value); if(!r.hidden)count++;});
      controls.querySelector('[data-library-count]').textContent = count ? `${count} of ${records.length} papers and reports shown.` : 'No matching research. Try another search or publication type.';
    }
    controls.addEventListener('input',filter); controls.addEventListener('change',filter);
    main.querySelector('.rs-list').before(controls); filter();
  }
})();
