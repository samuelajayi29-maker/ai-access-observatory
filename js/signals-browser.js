/* Progressive enhancement: headlines remain readable without JavaScript. */
(() => {
  const root = document.querySelector('[data-signal-browser]');
  if (!root) return;
  const search = root.querySelector('[data-signal-search]');
  const pillar = root.querySelector('[data-signal-pillar]');
  const count = root.querySelector('[data-signal-count]');
  const country = root.querySelector('[data-signal-country]'), state = root.querySelector('[data-signal-state]'), after = root.querySelector('[data-signal-after]'), before = root.querySelector('[data-signal-before]');
  const params = new URLSearchParams(location.search);
  [[country,'country'],[pillar,'pillar'],[state,'state']].forEach(([control,key])=>{if([...control.options].some(o=>o.value===params.get(key)))control.value=params.get(key);});
  search.value=params.get('q')||'';
  if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('from')||''))after.value=params.get('from');
  if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('to')||''))before.value=params.get('to');
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
    const invalidRange=Boolean(after.value && before.value && after.value>before.value);
    let visible = 0;
    groups.forEach(({group, name, items}) => {
      let found = 0;
      items.forEach(({node, text, meta}) => {
        const match = !invalidRange && (!pillar.value || name === pillar.value) && words.every(word => text.includes(word)) && (!country.value || (country.value==='unassigned' ? !meta.countries.length : meta.countries.includes(country.value))) && (!state.value || meta.state===state.value) && (!after.value || meta.date && meta.date>=after.value) && (!before.value || meta.date && meta.date<=before.value);
        node.hidden = !match;
        if (match) found++;
      });
      group.hidden = !found;
      const summary = group.querySelector('.signal-group__count');
      const matching = items.filter(item => !item.node.hidden);
      const latest = matching.map(item => item.meta.date).filter(Boolean).sort().pop();
      summary.textContent = found+' '+(found===1?'headline':'headlines')+(latest?' · latest '+latest:'');
      if (words.length || pillar.value || country.value || state.value || after.value || before.value) group.open = true;
      visible += found;
    });
    count.textContent = invalidRange ? 'Choose an end date on or after the start date.' : `${visible} of ${groups.reduce((sum, g) => sum + g.items.length, 0)} headlines shown.`;
    root.querySelector('[data-signal-empty]').hidden = visible > 0;
    const view=new URLSearchParams();[[search,'q'],[country,'country'],[pillar,'pillar'],[state,'state'],[after,'from'],[before,'to']].forEach(([control,key])=>{if(control.value)view.set(key,control.value);});
    history.replaceState(null,'',location.pathname+(view.size?'?'+view:'')+location.hash);
  }
  search.addEventListener('input', update);
  [pillar,country,state,after,before].forEach(control=>control.addEventListener('change',update));
  root.querySelector('[data-signal-reset]').addEventListener('click', () => {
    search.value = ''; [pillar,country,state,after,before].forEach(control=>control.value=''); update(); search.focus();
  });
  update();
})();
