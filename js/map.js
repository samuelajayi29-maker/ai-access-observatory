/* Country borders own pointer selection. The name picker also reaches small islands. */
(() => {
  'use strict';
  const host = document.querySelector('[data-map]'), node = document.getElementById('map-data');
  if (!host || !node) return;
  const data = JSON.parse(node.textContent), panel = host.querySelector('[data-panel]');
  const svg = host.querySelector('.map__svg'), legend = host.querySelector('[data-legend]');
  const picker = host.querySelector('[data-map-picker]'), hover = host.querySelector('[data-map-hover]');
  const focusButton = host.querySelector('[data-map-focus]'), resetButton = host.querySelector('[data-map-reset]');
  const shapes = [...host.querySelectorAll('[data-iso]')], tabs = [...host.querySelectorAll('.map__tab')];
  const fullBox = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  let current = data.layers[params.get('layer')] ? params.get('layer') : 'jobs';
  let selected = null, focused = false, frame = 0;
  const names = data.names || Object.fromEntries(shapes.map(el => [el.dataset.iso, el.getAttribute('aria-label').split(':')[0]]));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const label = v => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  function band(value) {
    if (value == null) return 'none';
    const i = (data.breaks[current] || []).findIndex(cut => value <= cut);
    return i < 0 ? '5' : String(i + 1);
  }
  function format(key, value) {
    return value == null ? 'No information' : new Intl.NumberFormat('en', {maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1}).format(value) + ' ' + data.meta[key].unit;
  }
  function paint() {
    host.dataset.layer = current;
    shapes.forEach(el => {
      const value = data.layers[current][el.dataset.iso];
      const prefix = el.classList.contains('map__c') ? 'map__c' : 'map__mark';
      el.setAttribute('class', prefix + ' ' + prefix + '--' + band(value));
      el.setAttribute('aria-label', names[el.dataset.iso] + ': ' + format(current, value));
    });
    legend.innerHTML = data.legends[current];
    const meta = data.meta[current];
    host.querySelector('[data-map-definition]').textContent = meta.indicator + ' · ' + Object.keys(data.layers[current]).length + ' countries with values. Different layers have different coverage.';
    tabs.forEach(tab => { const on = tab.dataset.layer === current; tab.classList.toggle('is-on', on); tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; });
  }
  function zoom(box) {
    cancelAnimationFrame(frame);
    const start = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    if (reduced()) { svg.setAttribute('viewBox', box.join(' ')); return; }
    let time;
    function step(now) {
      if (time == null) time = now;
      const t = reduced() ? 1 : Math.min(1, (now-time)/440), eased = 1-Math.pow(1-t,3);
      svg.setAttribute('viewBox', start.map((v,i) => v+(box[i]-v)*eased).join(' '));
      if (t < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
  }
  function focusCountry() {
    const shape = shapes.find(el => el.dataset.iso === selected);
    if (!shape) return;
    const b = shape.getBBox(), ratio = fullBox[2]/fullBox[3];
    const w = Math.min(fullBox[2], Math.max(b.width*1.8, b.height*ratio*1.8, fullBox[2]/5));
    const h = w/ratio, cx = b.x+b.width/2, cy = b.y+b.height/2;
    const x = Math.max(0, Math.min(fullBox[2]-w, cx-w/2));
    const y = Math.max(0, Math.min(fullBox[3]-h, cy-h/2));
    zoom([x,y,w,h]); focused = true; resetButton.disabled = false;
    focusButton.setAttribute('aria-pressed','true');
  }
  function updateURL() {
    const url = new URL(location.href); url.searchParams.set('country', selected); url.searchParams.set('layer', current);
    try { history.replaceState(null,'', url.pathname+url.search+url.hash); } catch (_) {}
  }
  function show(iso, user = false) {
    if (!names[iso]) return;
    selected = iso;
    shapes.forEach(el => { const on = el.dataset.iso === iso; el.setAttribute('aria-pressed', String(on)); el.tabIndex = on ? 0 : -1; });
    host.querySelectorAll('[data-map-select]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.mapSelect === iso)));
    picker.value = iso; hover.textContent = names[iso]; focusButton.disabled = false;
    const rows = ['jobs','access','infra'].map(key => {
      const meta = data.meta[key], row = (data.records[key] || {})[iso], value = data.layers[key][iso];
      const detail = row || meta;
      return '<section class="map__row'+(current===key?' is-current':'')+'"><h4>'+esc(meta.label)+'</h4><p class="map__measure">'+esc(meta.indicator)+'</p><p class="map__value">'+esc(format(key,value))+'</p>'+
        (value == null ? '<p class="map__none">No value in this map layer’s source sample.</p>' : '<p class="map__prov">'+esc(detail.evidence_status==='derived' ? 'Calculated' : label(detail.evidence_status))+' · '+esc(detail.evidence_status==='derived' && detail.temporal_status==='measured' ? 'Historical inputs' : label(detail.temporal_status))+'</p><details class="map__evidence"><summary>Source and definition</summary><p>'+esc(detail.date ? 'Recorded '+detail.date : 'Observation date not stated')+'</p><p>'+(detail.source_url ? '<a href="'+esc(detail.source_url)+'" target="_blank" rel="noopener">'+esc(detail.source||'Source')+'</a>' : esc(detail.source||'Source not stated'))+'</p><p>'+esc(detail.methodology||meta.methodology||'See the method page for scope and definition.')+'</p></details>')+'</section>';
    }).join('');
    const profile = data.pages[iso] || 'countries.html#country-'+encodeURIComponent(iso);
    panel.innerHTML = '<p class="eyebrow">Country snapshot</p><h3 class="map__panel-title">'+esc(names[iso])+'</h3>'+rows+'<div class="map__journey"><a href="'+esc(profile)+'">Country profile →</a><a href="data-explorer.html?view=compare&amp;countries='+iso+'#make-a-chart">Compare this country →</a></div><p class="map__prov">Record compiled '+esc(data.compiled)+'</p>';
    if (user && window.IAExperience) { window.IAExperience.select(iso,names[iso]); window.IAExperience.reveal(panel); }
    if (focused) focusCountry();
    if (user) updateURL();
  }
  host.addEventListener('click', event => {
    const tab = event.target.closest('.map__tab');
    if (tab) { current = tab.dataset.layer; paint(); if (selected) show(selected,true); return; }
    const target = event.target.closest('[data-iso],[data-map-select]');
    if (target) show(target.dataset.iso || target.dataset.mapSelect,true);
  });
  picker.addEventListener('change', () => { if (picker.value) show(picker.value,true); });
  focusButton.addEventListener('click', focusCountry);
  resetButton.addEventListener('click', () => { focused=false; zoom(fullBox); resetButton.disabled=true; focusButton.setAttribute('aria-pressed','false'); });
  svg.addEventListener('pointerover', event => { const shape=event.target.closest('[data-iso]'); if(shape) hover.textContent=names[shape.dataset.iso]; });
  svg.addEventListener('pointerleave', () => { hover.textContent=selected ? names[selected] : 'Select a country'; });
  svg.addEventListener('focusin', event => { if(event.target.dataset.iso) hover.textContent=names[event.target.dataset.iso]; });
  host.addEventListener('keydown', event => {
    const tab=event.target.closest('.map__tab');
    if(tab && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault(); const i=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
      tabs[next].focus(); tabs[next].click(); return;
    }
    if(event.key==='Escape' && focused) { resetButton.click(); return; }
    const shape=event.target.closest('[data-iso]');
    if(!shape) return;
    if(event.key==='Enter'||event.key===' ') { event.preventDefault(); show(shape.dataset.iso,true); }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault(); const ordered=shapes.slice().sort((a,b)=>names[a.dataset.iso].localeCompare(names[b.dataset.iso]));
      const i=ordered.indexOf(shape),next=ordered[(i+(['ArrowRight','ArrowDown'].includes(event.key)?1:ordered.length-1))%ordered.length];
      shapes.forEach(el=>el.tabIndex=el===next?0:-1); next.focus();
    }
  });
  paint();
  const initial=params.get('country') || window.IAExperience?.current()?.iso;
  if(names[initial]) show(initial); else if(shapes[0]) { shapes.forEach(el=>el.tabIndex=-1); shapes[0].tabIndex=0; }
  window.IAExperience?.ready.then(countries => {
    data.pages=Object.fromEntries(countries.map(c=>[c.iso3,c.filename]));
    countries.forEach(c=>{if(names[c.iso3])names[c.iso3]=c.name;});
    const remembered=window.IAExperience.current()?.iso;
    if(selected)show(selected);else if(names[remembered])show(remembered);
  });
  window.__mapReady=true;
})();
