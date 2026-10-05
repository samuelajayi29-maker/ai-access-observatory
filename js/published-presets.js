/* Editable views of the actual published SVGs; definitions and axes stay fixed. */
(() => {
  'use strict';
  const host = document.querySelector('[data-published-presets]');
  if (!host) return;
  const payload = JSON.parse(document.getElementById('published-presets-data').textContent);
  const simple = document.querySelector('[data-chart-builder]');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceList = inputs => (inputs || []).map(r => {
    const url = r.source_url || r.url || '', name = r.name || r.model || r.source || 'Source record';
    const link = /^https?:\/\//i.test(url) ? `<a href="${esc(url)}">${esc(name)}</a>` : esc(name);
    return `<li>${link}${r.source && r.source !== name ? ' · '+esc(r.source) : ''}<br>${esc([r.evidence_status,r.temporal_status,r.note].filter(Boolean).join(' · '))}</li>`;
  }).join('');
  host.innerHTML = `<label class="preset-start">Start from a published chart
    <select data-preset-mode><option value="">Choose individual measures instead</option>${payload.presets.map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label>
    <div data-preset-panel hidden></div>`;
  const mode = host.querySelector('[data-preset-mode]'), panel = host.querySelector('[data-preset-panel]');
  let spec, rows, cols, svg, title = '', restoredNotice = '';
  const selected = () => spec.rows.filter(r => rows.has(r.id));
  const cells = () => spec.kind === 'heatmap' ? spec.cells.filter(c => rows.has(c.row_id) && cols.has(c.column_id)) : selected();
  const xml = () => new XMLSerializer().serializeToString(svg);
  function download(blob, extension) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = spec.id + '-selection.' + extension; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function picker(axis, records, label) {
    return `<fieldset class="preset-picker"><legend>${esc(label)}</legend><label>Find ${esc(label.toLowerCase())}<input type="search" data-search="${axis}"></label>
      <div class="chart-actions"><button type="button" data-all="${axis}">Select all</button><button type="button" data-clear="${axis}">Clear</button></div>
      <div class="chart-picker">${records.map(r => `<label class="chart-record"><input type="checkbox" data-axis="${axis}" value="${r.id}"><span>${esc(r.label)}${r.value === null ? ' — No information' : ''}</span></label>`).join('')}</div></fieldset>`;
  }
  function activate(restore = false) {
    spec = payload.presets.find(p => p.id === mode.value);
    panel.hidden = !spec; simple.hidden = !!spec;
    if (!spec) return;
    rows = new Set(spec.rows.map(r => r.id)); cols = new Set(spec.columns.map(c => c.id)); title = ''; restoredNotice = '';
    if (restore) {
      const q = new URLSearchParams(location.search);
      for (const [param, set, records] of [['presetRows', rows, spec.rows], ['presetCols', cols, spec.columns]]) {
        if (q.has(param)) {
          set.clear();
          const ids = q.get(param).split(',').filter(Boolean);
          ids.forEach(id => { if (records.some(r => r.id === id)) set.add(id); });
          if (ids.some(id => !records.some(r => r.id === id))) restoredNotice = 'Some shared records are no longer available. Review the selection.';
        }
      }
      title = (q.get('presetTitle') || '').slice(0, 90);
      if (q.has('presetRevision') && q.get('presetRevision') !== spec.revision) restoredNotice += ' The data has changed since this link was made; this view uses the current published record.';
    }
    panel.innerHTML = `<p>${esc(spec.description)}</p><p class="preset-help">The full selection matches the published figure. Selections keep the original positions, scales and reference notes so comparisons stay consistent.</p>
      <div class="chart-workspace"><div class="chart-controls"><label>Your title (optional)<input data-preset-title maxlength="90" value="${esc(title)}"></label>
      ${picker('row', spec.rows, spec.row_label)}${spec.columns.length ? picker('col', spec.columns, spec.column_label) : ''}
      <button type="button" data-preset-reset>Reset to published figure</button></div>
      <div><p data-preset-count role="status"></p><p data-preset-notice role="status">${esc(restoredNotice)}</p><div class="chart-preview" data-preset-preview></div>
      <div class="chart-actions"><button type="button" data-export="svg">Download SVG</button><button type="button" data-export="png">Download PNG</button><button type="button" data-export="csv">Download data CSV</button><button type="button" data-preset-share>Copy share link</button></div>
      <label data-share-label hidden>Share link<input data-share-url readonly></label>
      <details class="resource-details"><summary>Selected values and source records</summary><div data-preset-table></div></details></div></div>`;
    panel.querySelectorAll('[data-axis]').forEach(input => input.addEventListener('change', () => {
      const set = input.dataset.axis === 'row' ? rows : cols;
      input.checked ? set.add(input.value) : set.delete(input.value); render();
    }));
    panel.querySelectorAll('[data-all],[data-clear]').forEach(button => button.addEventListener('click', () => {
      const axis = button.dataset.all || button.dataset.clear, set = axis === 'row' ? rows : cols;
      set.clear(); if (button.dataset.all) (axis === 'row' ? spec.rows : spec.columns).forEach(r => set.add(r.id)); render();
    }));
    panel.querySelectorAll('[data-search]').forEach(input => input.addEventListener('input', () => {
      input.closest('fieldset').querySelectorAll('.chart-record').forEach(label => label.hidden = !label.textContent.toLowerCase().includes(input.value.toLowerCase()));
    }));
    panel.querySelector('[data-preset-title]').addEventListener('input', e => { title = e.target.value; render(); });
    panel.querySelector('[data-preset-reset]').addEventListener('click', () => activate());
    panel.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', () => exportFile(button.dataset.export)));
    panel.querySelector('[data-preset-share]').addEventListener('click', share);
    render();
  }
  function render() {
    panel.querySelectorAll('[data-axis]').forEach(input => input.checked = (input.dataset.axis === 'row' ? rows : cols).has(input.value));
    const records = cells(), known = records.filter(r => r.value !== null && r.value !== undefined).length;
    const full = rows.size === spec.rows.length && cols.size === spec.columns.length;
    const count = `${rows.size} of ${spec.rows.length} ${spec.row_label.toLowerCase()}${spec.columns.length ? `; ${cols.size} of ${spec.columns.length} countries; ${known} of ${records.length} cells with information` : `; ${known} with information`}`;
    panel.querySelector('[data-preset-count]').textContent = count;
    svg = new DOMParser().parseFromString(spec.svg, 'image/svg+xml').documentElement;
    svg.querySelectorAll('[data-preset-row]').forEach(g => { if (!rows.has(g.dataset.presetRow)) g.remove(); });
    svg.querySelectorAll('[data-preset-col]').forEach(g => { if (!cols.has(g.dataset.presetCol)) g.remove(); });
    if (title) {
      const headline = [...svg.querySelectorAll('text')].find(t => t.getAttribute('y') === '38');
      if (headline) { headline.textContent = title; if (title.length > 50) { headline.setAttribute('textLength', svg.viewBox.baseVal.width - 56); headline.setAttribute('lengthAdjust','spacingAndGlyphs'); } }
    }
    if (!full || title) {
      svg.setAttribute('aria-label', `${title || spec.title}. ${count}. ${spec.description}`);
      svg.querySelectorAll('desc').forEach(d => d.remove());
      const box = svg.getAttribute('viewBox').split(/\s+/).map(Number), h = box[3], w = box[2];
      const ns = 'http://www.w3.org/2000/svg', rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('y',h); rect.setAttribute('width',w); rect.setAttribute('height',96); rect.setAttribute('fill','#fbfaf8'); svg.append(rect);
      const shortCount = `${rows.size}/${spec.rows.length} selected groups${spec.columns.length ? `; ${cols.size}/${spec.columns.length} countries` : ''}; ${known}/${records.length} values available`;
      const lines = [records.length ? 'EDITED SELECTION · '+shortCount : 'NO RECORDS SELECTED · Choose records to show data.', 'Axes, percentages, benchmarks and source notes retain the original published sample.', 'InferenceAfrica · '+spec.revision];
      lines.forEach((line,i) => { const t = document.createElementNS(ns,'text'); t.setAttribute('x',28); t.setAttribute('y',h+24+i*22); t.setAttribute('font-size',12); t.setAttribute('font-family','Arial,sans-serif'); t.setAttribute('fill','#1a1815'); t.textContent=line; svg.append(t); });
      svg.setAttribute('viewBox',`0 0 ${w} ${h+96}`); svg.setAttribute('height',h+96);
    }
    const preview = panel.querySelector('[data-preset-preview]'); preview.replaceChildren(svg);
    panel.querySelector('[data-preset-table]').innerHTML = `<table><thead><tr><th>Selection</th><th>Values (${esc(spec.unit)})</th><th>Underlying source records</th></tr></thead><tbody>${records.map(r => `<tr><th scope="row">${esc(r.label || r.row_key+' / '+r.column_key)}</th><td>${Object.entries(r.values).map(([k,v]) => esc(k.replaceAll('_',' '))+': '+(v == null ? 'No information' : esc(v))).join('<br>')}</td><td><details><summary>${(r.inputs || []).length} source records</summary><ul>${sourceList(r.inputs)}</ul></details></td></tr>`).join('')}</tbody></table>`;
    panel.querySelector('[data-share-label]').hidden = true;
  }
  async function exportFile(type) {
    try {
      if (type === 'svg') return download(new Blob([xml()],{type:'image/svg+xml;charset=utf-8'}),'svg');
      if (type === 'csv') {
        const quote = value => '"'+String(value ?? '').replace(/^[=+@-]/,"'"+'$&').replace(/"/g,'""')+'"';
        const lines = [['preset','revision','selection','value','availability','unit','values','definition','underlying_source_records'], ...cells().map(r => [spec.id,spec.revision,r.label || r.row_key+' / '+r.column_key,r.value,r.value == null ? 'No information' : 'Available',spec.unit,JSON.stringify(r.values),spec.description,JSON.stringify(r.inputs || [])])];
        return download(new Blob(['\ufeff'+lines.map(r => r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'csv');
      }
      const image = new Image(), url = URL.createObjectURL(new Blob([xml()],{type:'image/svg+xml'}));
      try {
        await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=reject; image.src=url; });
        const canvas = document.createElement('canvas'), box=svg.getAttribute('viewBox').split(/\s+/).map(Number);
        canvas.width=box[2]*2; canvas.height=box[3]*2; canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
        if (!blob) throw new Error('PNG unavailable'); download(blob,'png');
      } finally { URL.revokeObjectURL(url); }
    } catch (_) { panel.querySelector('[data-preset-notice]').textContent='The download could not be created. Try SVG or CSV instead.'; }
  }
  async function share() {
    const url = new URL(payload.page,location.href);
    url.searchParams.set('preset',spec.id); url.searchParams.set('presetRows',[...rows].join(','));
    if (spec.columns.length) url.searchParams.set('presetCols',[...cols].join(','));
    if (title) url.searchParams.set('presetTitle',title);
    url.searchParams.set('presetRevision',spec.revision); url.hash='make-a-chart';
    panel.querySelector('[data-share-label]').hidden=false;
    const input=panel.querySelector('[data-share-url]'); input.value=url.href;
    try { await navigator.clipboard.writeText(url.href); panel.querySelector('[data-preset-notice]').textContent='Share link copied.'; }
    catch (_) { input.focus(); input.select(); panel.querySelector('[data-preset-notice]').textContent='Copy the share link below.'; }
  }
  mode.addEventListener('change', () => activate());
  const wanted = new URLSearchParams(location.search).get('preset');
  if (payload.presets.some(p => p.id === wanted)) { mode.value=wanted; activate(true); }
})();
