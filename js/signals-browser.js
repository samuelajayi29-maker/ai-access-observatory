/* Progressive enhancement: headlines remain readable without JavaScript. */
(() => {
  const root = document.querySelector('[data-signal-browser]');
  if (!root) return;
  const search = root.querySelector('[data-signal-search]');
  const pillar = root.querySelector('[data-signal-pillar]');
  const count = root.querySelector('[data-signal-count]');
  const country = root.querySelector('[data-signal-country]'), state = root.querySelector('[data-signal-state]'), after = root.querySelector('[data-signal-after]');
  const metadata = JSON.parse(document.getElementById('signal-browser-data').textContent);
  const tagged = new Set(Object.values(metadata).flatMap(row=>row.countries));
  const gaps = [...country.options].filter(o=>/^[A-Z]{3}$/.test(o.value) && !tagged.has(o.value));
  root.querySelector('[data-signal-blindspots]').textContent = gaps.length ? 'No tagged signals in this feed for '+gaps.length+' countries: '+gaps.map(o=>o.textContent).join(', ')+'. These are monitoring gaps, not evidence of inactivity.' : 'Every country has at least one tagged signal; coverage depth still varies.';
  const groups = [...root.querySelectorAll('.signal-group')].map(group => ({
    group,
    name: group.querySelector('summary span').textContent.trim(),
    items: [...group.querySelectorAll('.feed > li')].map(node => ({node, text: node.textContent.toLocaleLowerCase(), meta: metadata[node.querySelector('a').getAttribute('href')] || {countries:[],date:'',state:'needs_source_review'}}))
  }));
  function update() {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    groups.forEach(({group, name, items}) => {
      let found = 0;
      items.forEach(({node, text, meta}) => {
        const match = (!pillar.value || name === pillar.value) && words.every(word => text.includes(word)) && (!country.value || (country.value==='unassigned' ? !meta.countries.length : meta.countries.includes(country.value))) && (!state.value || meta.state===state.value) && (!after.value || meta.date && meta.date>=after.value);
        node.hidden = !match;
        if (match) found++;
      });
      group.hidden = !found;
      if (words.length || pillar.value || country.value || state.value || after.value) group.open = true;
      visible += found;
    });
    count.textContent = `${visible} of ${groups.reduce((sum, g) => sum + g.items.length, 0)} headlines shown.`;
    root.querySelector('[data-signal-empty]').hidden = visible > 0;
  }
  search.addEventListener('input', update);
  [pillar,country,state,after].forEach(control=>control.addEventListener('change',update));
  root.querySelector('[data-signal-reset]').addEventListener('click', () => {
    search.value = ''; [pillar,country,state,after].forEach(control=>control.value=''); update(); search.focus();
  });
  update();
})();
