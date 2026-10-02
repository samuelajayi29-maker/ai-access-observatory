/* One comparable series per chart. Export the displayed SVG and the exact rows. */
(function () {
  'use strict';
  var host = document.querySelector('[data-chart-builder]');
  var dataNode = document.getElementById('chart-builder-data');
  if (!host || !dataNode) return;
  var payload;
  try { payload = JSON.parse(dataNode.textContent); } catch (_) { host.textContent = 'Chart data could not be read. Please use the register downloads.'; return; }
  var series = payload.datasets;
  if (!series.length) { host.textContent = 'No comparable numerical series are available for this page yet.'; return; }
  var LIMIT = 20;
  var ns = 'http://www.w3.org/2000/svg';
  var params = new URLSearchParams(location.search);
  var SPARSE_THRESHOLD = 0.25;
  function hasValue(row) { return typeof row.value === 'number' && Number.isFinite(row.value); }
  function coverageOf(dataset) {
    var known=dataset.rows.filter(hasValue).length, total=dataset.rows.length;
    return {known:known, missingRate:total ? (total-known)/total : 1};
  }
  function openingSeries() {
    var aggregate=series.find(function(s) { return s.id==='infra-capacity-by-status'; });
    if (['index.html','infrastructure.html','countries.html'].includes(payload.page) && aggregate && coverageOf(aggregate).known) return aggregate;
    var first=series[0];
    if (coverageOf(first).missingRate<=SPARSE_THRESHOLD || coverageOf(first).known>=Math.min(3,first.rows.length) && coverageOf(first).known>0) return first;
    // Prefer a sufficiently populated measure within this page's actual datasets.
    var populated=series.filter(function(s) { return coverageOf(s).known>0; });
    var dense=populated.filter(function(s) { return coverageOf(s).missingRate<=SPARSE_THRESHOLD; });
    return dense[0] || populated[0] || first;
  }
  var initial = series.find(function (s) { return s.id === params.get('chart'); }) || openingSeries();
  var current = initial;
  var selected = new Set();
  var svg;
  var selectionNotice = '';
  var format = new Intl.NumberFormat('en', { maximumSignificantDigits: 6 });
  var style = getComputedStyle(document.documentElement);
  var theme = {paper: style.getPropertyValue('--paper').trim(), ink: style.getPropertyValue('--ink').trim(),
    rule: style.getPropertyValue('--rule').trim(), note: style.getPropertyValue('--ink-note').trim(), accent: style.getPropertyValue('--action').trim()};
  host.innerHTML = '<div class="chart-controls">' +
    '<label>Pillar<select data-cb-pillar><option value="">All pillars</option><option value="jobs">Jobs</option><option value="access">Access</option><option value="infrastructure">Infrastructure</option><option value="signals">Signals</option></select></label>' +
    '<label>Country focus<select data-cb-country><option value="">Compare across countries / all records</option></select></label>' +
    '<label>Measure<select data-cb-series></select></label>' +
    '<label>Observation period<select data-cb-period><option value="">All available periods</option></select></label>' +
    '<label>Chart title<input data-cb-title maxlength="100"></label>' +
    '<label>Display<select data-cb-type><option value="bars">Horizontal bars</option><option value="dots">Dot plot</option></select></label>' +
    '<label>Order<select data-cb-order><option value="value">Highest value first</option><option value="name">Name A–Z</option></select></label></div>' +
    '<p data-cb-definition></p><p class="coverage-note" data-cb-coverage></p><p class="explorer-selection-summary" data-cb-summary role="status"></p>' +
    '<div class="chart-workspace"><fieldset class="chart-picker"><legend>Select records (up to 20)</legend>' +
    '<label>Find a country, model or project<input type="search" data-cb-search></label>' +
    '<div class="chart-actions"><button type="button" data-cb-visible>Select visible</button><button type="button" data-cb-clear>Clear selection</button></div>' +
    '<p data-cb-count aria-live="polite"></p><div class="chart-record-list" data-cb-rows></div></fieldset>' +
    '<div class="chart-result"><div data-cb-preview class="chart-preview"></div></div></div>' +
    '<div class="chart-actions"><button type="button" data-cb-export="png">Download PNG</button><button type="button" data-cb-export="svg">Download SVG</button>' +
    '<button type="button" data-cb-export="csv">Download selected CSV</button><button type="button" data-cb-share>Copy link to this chart</button></div>' +
    '<p role="status" data-cb-message></p><label class="chart-share-fallback" hidden>Share link<input data-cb-link readonly></label>' +
    '<details class="resource-details"><summary>Inspect selected values and sources</summary><div class="tablewrap"><table class="register" data-cb-table></table></div></details>' +
    '<p class="coverage-note">Images include the unit, dates, source links and caveats. CSV contains the unrounded values. Shared links reopen the selection using the current register; download a file to preserve this version.</p>';
  var get = function (s) { return host.querySelector(s); };
  var select = get('[data-cb-series]'), title = get('[data-cb-title]'), type = get('[data-cb-type]'), order = get('[data-cb-order]');
  var search = get('[data-cb-search]'), list = get('[data-cb-rows]'), preview = get('[data-cb-preview]');
  var message = get('[data-cb-message]');
  var pillarFilter=get('[data-cb-pillar]'), countryFilter=get('[data-cb-country]'), periodFilter=get('[data-cb-period]');
  (payload.countries || []).slice().sort(function(a,b){return a.name.localeCompare(b.name);}).forEach(function(c){var option=document.createElement('option');option.value=c.iso3;option.textContent=c.name;countryFilter.appendChild(option);});
  pillarFilter.value=params.get('pillar') || (params.has('chart') ? initial.pillar : '');
  countryFilter.value=params.get('country') || '';
  var groups = {};
  series.forEach(function (s) {
    if (!groups[s.pillar]) {
      var group = document.createElement('optgroup'); group.label = s.pillar.charAt(0).toUpperCase() + s.pillar.slice(1);
      select.appendChild(group); groups[s.pillar] = group;
    }
    var option = document.createElement('option'); option.value = s.id; option.textContent = s.title; groups[s.pillar].appendChild(option);
  });
  function valueLabel(r) {
    if (r.value === null) return 'No information';
    var prefix = r.relation === 'approximately' ? '≈ ' : r.relation && r.relation !== '=' ? r.relation + ' ' : '';
    return prefix + format.format(r.value);
  }
  function sortedRows() {
    return current.rows.slice().sort(function (a,b) {
      if (order.value === 'name') return a.label.localeCompare(b.label);
      if (a.value === null && b.value !== null) return 1;
      if (b.value === null && a.value !== null) return -1;
      return (b.value || 0) - (a.value || 0) || a.label.localeCompare(b.label);
    });
  }
  function visibleRows() {
    var q = search.value.toLocaleLowerCase().trim();
    return sortedRows().filter(function (r) { return (!countryFilter.value || r.country===countryFilter.value) && (!periodFilter.value || r.period===periodFilter.value) && (!q || (r.label+' '+r.country).toLocaleLowerCase().includes(q)); });
  }
  function chosenRows() { return sortedRows().filter(function (r) { return selected.has(r.id); }); }
  function drawPicker() {
    list.replaceChildren();
    visibleRows().forEach(function (r) {
      var label = document.createElement('label'); label.className = 'chart-record';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = r.id; cb.checked = selected.has(r.id);
      cb.addEventListener('change', function () {
        if (cb.checked && selected.size >= LIMIT) { cb.checked = false; message.textContent = 'Select at most 20 records for a readable chart.'; return; }
        if (cb.checked) selected.add(r.id); else selected.delete(r.id);
        message.textContent = ''; render();
      });
      var span = document.createElement('span'); span.textContent = r.label;
      var small = document.createElement('small'); small.textContent = valueLabel(r)+' · '+r.period;
      span.appendChild(small); label.append(cb,span); list.appendChild(label);
    });
    if (!list.childElementCount) list.textContent = 'No matching records.';
    get('[data-cb-count]').textContent = selected.size+' selected · '+visibleRows().length+' visible of '+current.rows.length+'. '+selectionNotice;
  }
  function svgElement(name, attributes, text) {
    var e = document.createElementNS(ns,name);
    Object.keys(attributes || {}).forEach(function (k) { e.setAttribute(k,attributes[k]); });
    if (text != null) e.textContent = String(text);
    return e;
  }
  function wrap(text, width) {
    var words = String(text || '').split(/\s+/), lines = [], line = '';
    words.forEach(function (word) {
      while (word.length > width) {
        if (line) { lines.push(line); line=''; }
        lines.push(word.slice(0,width)); word=word.slice(width);
      }
      if ((line+' '+word).trim().length > width) { lines.push(line); line=word; }
      else line=(line+' '+word).trim();
    });
    if (line) lines.push(line);
    return lines;
  }
  function lines(text,x,y,width,size,color) {
    wrap(text,width).forEach(function (line) {
      svg.appendChild(svgElement('text',{x:x,y:y,'font-size':size,fill:color || theme.ink},line)); y+=size*1.4;
    });
    return y;
  }
  function statusKey(text) {
    text=String(text).toLowerCase();
    if(/modelled/.test(text)) return 'modelled';
    if(/derived/.test(text)) return 'derived';
    if(/forecast|projection/.test(text)) return 'forecast';
    if(/proposal/.test(text)) return 'proposal';
    if(/announced|construction|approved|exploring|appeal|funding|policy_target/.test(text)) return 'announced';
    if(/measured|operational/.test(text)) return 'measured';
    return null;
  }
  function statusMark(shape, attrs, row) {
    var key=statusKey(row.status);
    var color=getComputedStyle(document.documentElement).getPropertyValue('--'+(key || 'ink-secondary')).trim();
    attrs.stroke=color;attrs['stroke-width']=1.5;attrs['data-status']=key || 'unspecified';
    attrs.fill=(key==='measured' || key==='derived') ? color : theme.paper;
    if(key==='forecast') attrs['stroke-dasharray']='4 3';
    if(key==='proposal') attrs.fill='url(#cb-proposal)';
    var mark=svgElement(shape,attrs);mark.appendChild(svgElement('title',{},row.status));svg.appendChild(mark);
    if(key==='derived' || key==='modelled') {
      svg.appendChild(svgElement('text',{x:shape==='circle'?attrs.cx:attrs.x+4,
        y:shape==='circle'?attrs.cy+3:attrs.y+14,'font-size':10,
        'text-anchor':shape==='circle'?'middle':'start',fill:key==='derived'?theme.paper:color},key==='derived'?'ƒ':'∿'));
    }
  }
  function drawChart(rows) {
    var currentStyle = getComputedStyle(document.documentElement);
    Object.keys(theme).forEach(function (name) {
      var tokens = {paper: "--paper", ink: "--ink", rule: "--rule", note: "--ink-note", accent: "--action"};
      theme[name] = currentStyle.getPropertyValue(tokens[name]).trim();
    });
    preview.replaceChildren();
    if (!rows.length) { svg=null; preview.textContent='Select at least one record to make a chart.'; return; }
    svg=svgElement('svg',{xmlns:ns,width:1100,role:'img','aria-labelledby':'custom-chart-title custom-chart-desc','font-family':'IBM Plex Sans, Arial, sans-serif','style':'font-variant-numeric:tabular-nums lining-nums'});
    var defs=svgElement('defs',{}), pattern=svgElement('pattern',{id:'cb-proposal',width:6,height:6,patternUnits:'userSpaceOnUse'});
    pattern.appendChild(svgElement('path',{d:'M0 6L6 0',stroke:getComputedStyle(document.documentElement).getPropertyValue('--proposal').trim(),'stroke-width':1}));
    defs.appendChild(pattern);svg.appendChild(defs);
    var chartTitle = title.value.trim() || current.title;
    svg.appendChild(svgElement('title',{id:'custom-chart-title'},chartTitle));
    svg.appendChild(svgElement('desc',{id:'custom-chart-desc'},current.description+' '+rows.map(function (r) {return r.label+': '+valueLabel(r)+' '+current.unit+'; '+r.period+'; '+r.status;}).join('. ')));
    var background=svgElement('rect',{width:1100,height:1,fill:theme.paper}); svg.appendChild(background);
    svg.appendChild(svgElement('metadata',{},JSON.stringify({dataset:current.id,title:chartTitle,unit:current.unit,definition:current.description,compiled:payload.generated_at,revision:current.revision,rows:rows})));
    var y=lines('ASTROLABE AFRICA · AI ACCESS OBSERVATORY',34,34,120,12,theme.note);
    y=lines(chartTitle,34,y+22,66,25)+8;
    y=lines(current.title+' | Unit: '+current.unit,34,y,112,13)+6;
    y=lines(current.description,34,y,128,12,theme.note)+10;
    var missing=rows.filter(function(r){return r.value===null;}).length;
    y=lines(rows.length+' selected records · '+missing+' with no information · '+current.coverage.known+'/'+current.coverage.total+' records have values in this series',34,y,128,12,theme.note)+18;
    var numeric=rows.filter(function(r){return r.value!==null;}).map(function(r){return r.value;});
    var max=current.domain ? current.domain[1] : Math.max.apply(null,[1].concat(numeric));
    var min=current.domain ? current.domain[0] : Math.min.apply(null,[0].concat(numeric));
    if (max===min) max=min+1;
    var left=430, right=930, plot=right-left;
    var position=function(v){return left+(v-min)/(max-min)*plot;};
    for(var i=0;i<=4;i++) {
      var tick=min+(max-min)*i/4;
      svg.appendChild(svgElement('text',{x:position(tick),y:y,'text-anchor':'middle','font-size':11,fill:theme.note},format.format(tick)));
    }
    y+=22;
    var sources=[];
    rows.forEach(function(r){ if(!sources.some(function(s){return s.url===r.source_url;})) sources.push({url:r.source_url,name:r.source}); });
    rows.forEach(function(r) {
      var idx=sources.findIndex(function(s){return s.url===r.source_url;})+1;
      var labelY=lines(r.label+' ['+idx+']',34,y,44,14);
      svg.appendChild(svgElement('line',{x1:left,x2:right,y1:y-5,y2:y-5,stroke:theme.rule}));
      if(r.value!==null) {
        var x=position(r.value), zero=position(0);
        if(type.value==='dots') statusMark('circle',{cx:x,cy:y-5,r:7},r);
        else statusMark('rect',{x:Math.min(x,zero),y:y-15,width:Math.max(0,Math.abs(x-zero)),height:20},r);
      }
      svg.appendChild(svgElement('text',{x:1065,y:y,'text-anchor':'end','font-size':13,'font-family':'IBM Plex Mono, Consolas, monospace',fill:theme.ink},valueLabel(r)));
      y=Math.max(labelY,y+18);
      y=lines(r.period+' · '+r.status,34,y,127,11,theme.note)+20;
    });
    y+=10;
    y=lines('Sources and qualifications',34,y,120,14)+8;
    sources.forEach(function(s,i){y=lines('['+(i+1)+'] '+s.name+' — '+s.url,34,y,132,11,theme.note)+5;});
    var notes=[];
    rows.forEach(function(r){if(r.note && !notes.includes(r.note)) notes.push(r.note);});
    notes.forEach(function(n){y=lines(n,34,y+4,132,11,theme.note);});
    y=lines('Register: '+BASE_URL()+current.register+' · Compiled '+payload.generated_at,34,y+18,132,11,theme.note);
    y=lines('Observatory compilation: CC BY 4.0. Underlying sources retain their terms. Chart values are rounded for display; CSV preserves precision.',34,y+4,132,11,theme.note)+24;
    svg.setAttribute('height',Math.ceil(y)); svg.setAttribute('viewBox','0 0 1100 '+Math.ceil(y)); background.setAttribute('height',Math.ceil(y));
    preview.appendChild(svg);
  }
  function BASE_URL() { return 'https://samuelajayi29-maker.github.io/ai-access-observatory/'; }
  function drawTable(rows) {
    var table=get('[data-cb-table]'); table.replaceChildren();
    var thead=document.createElement('thead'), tr=document.createElement('tr');
    ['Record','Value','Unit','Period','Status','Source','Notes'].forEach(function(t){var th=document.createElement('th');th.scope='col';th.textContent=t;tr.appendChild(th);});
    thead.appendChild(tr); table.appendChild(thead);
    var tbody=document.createElement('tbody');
    rows.forEach(function(r){
      var row=document.createElement('tr');
      [r.label,valueLabel(r),current.unit,r.period,r.status,r.source,r.note].forEach(function(t,i){
        var cell=document.createElement('td');
        if(i===5 && /^https?:\/\//i.test(r.source_url)) {var link=document.createElement('a');link.href=r.source_url;link.textContent=t;link.rel='noopener';cell.appendChild(link);}
        else cell.textContent=t;
        row.appendChild(cell);
      }); tbody.appendChild(row);
    }); table.appendChild(tbody);
  }
  function render() {
    var rows=chosenRows(); drawChart(rows); drawTable(rows);
    var values=rows.filter(hasValue).map(function(r){return r.value;}).sort(function(a,b){return a-b;});
    var periods=new Set(rows.filter(hasValue).map(function(r){return r.period;}));
    var summary=values.length+' selected values; '+(rows.length-values.length)+' missing.';
    if(values.length){var middle=Math.floor(values.length/2),median=values.length%2 ? values[middle] : (values[middle-1]+values[middle])/2;summary+=' Range: '+format.format(values[0])+'–'+format.format(values[values.length-1])+' '+current.unit+'. Median: '+format.format(median)+' '+current.unit+'.';}
    if(periods.size>1)summary+=' Multiple observation periods selected. This is not a like-for-like time comparison.';
    get('[data-cb-summary]').textContent=summary;
    get('[data-cb-count]').textContent=selected.size+' selected · '+visibleRows().length+' visible of '+current.rows.length+'. '+selectionNotice;
    host.querySelectorAll('[data-cb-export], [data-cb-share]').forEach(function(b){b.disabled=!rows.length;});
    get('.chart-share-fallback').hidden=true;
  }
  function activate(s,restore) {
    current=s; selected.clear(); select.value=s.id; search.value=''; selectionNotice='';
    periodFilter.replaceChildren();var allPeriod=document.createElement('option');allPeriod.value='';allPeriod.textContent='All available periods';periodFilter.appendChild(allPeriod);
    Array.from(new Set(s.rows.filter(function(r){return !countryFilter.value || r.country===countryFilter.value;}).map(function(r){return r.period;}))).sort().forEach(function(period){var option=document.createElement('option');option.value=period;option.textContent=period;periodFilter.appendChild(option);});
    if(restore && params.get('period'))periodFilter.value=params.get('period');
    title.value=restore && params.get('chartTitle') ? params.get('chartTitle').slice(0,100) : s.title.slice(0,100);
    if(restore && ['bars','dots'].includes(params.get('chartStyle'))) type.value=params.get('chartStyle');
    if(restore && ['value','name'].includes(params.get('chartOrder'))) order.value=params.get('chartOrder');
    if(restore && params.has('records')) {
      var ids=params.get('records').split(',').slice(0,LIMIT), valid=new Set(s.rows.map(function(r){return r.id;}));
      ids.forEach(function(id){if(valid.has(id)) selected.add(id);});
      if(selected.size<ids.length) selectionNotice='Some shared records are no longer in the current register.';
      if(params.get('chartVersion') && params.get('chartVersion')!==s.revision) selectionNotice+=' Data has changed since this link was created.';
    } else {
      var coverage=coverageOf(s);
      visibleRows().filter(hasValue).slice(0,8).forEach(function(r){selected.add(r.id);});
      if (!coverage.known) selectionNotice='This measure has no published values. Records remain selectable below.';
      else if (coverage.missingRate>SPARSE_THRESHOLD) selectionNotice='Starting with published values. Records with no information remain selectable below.';
    }
    get('[data-cb-definition]').textContent=s.description;
    get('[data-cb-coverage]').textContent=s.coverage.known+' of '+s.coverage.total+' records have a value. '+(s.coverage.total-s.coverage.known)+' have no information in this series.';
    message.textContent='';drawPicker();render();
  }
  function filename(extension) {return 'astrolabe-'+current.id+'.'+extension;}
  function download(blob,name) {
    var url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},30000);
  }
  function csvCell(v) {
    var s=v==null?'':String(v);
    // Prevent spreadsheet formula interpretation of untrusted text fields.
    if(typeof v!=='number' && /^[=+\-@\t\r]/.test(s)) s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  async function exportChart(kind) {
    var rows=chosenRows();if(!rows.length || !svg) return;
    try {
      if(kind==='csv') {
        var fields=['dataset','measure','label','value','value_relation','unit','period','status','source','source_url','country','note','definition','compiled','revision'];
        var records=rows.map(function(r){return [current.id,current.title,r.label,r.value,r.relation,current.unit,r.period,r.status,r.source,r.source_url,r.country,r.note,current.description,payload.generated_at,current.revision];});
        download(new Blob(['\uFEFF'+[fields].concat(records).map(function(r){return r.map(csvCell).join(',');}).join('\r\n')],{type:'text/csv;charset=utf-8'}),filename('csv'));
      } else {
        var xml=new XMLSerializer().serializeToString(svg), blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
        if(kind==='svg') download(blob,filename('svg'));
        else {
          var url=URL.createObjectURL(blob);
          try {
            var image=new Image();
            await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error('The chart image could not be created. SVG and CSV are still available.'));};image.src=url;});
            var canvas=document.createElement('canvas');canvas.width=1100*2;canvas.height=Number(svg.getAttribute('height'))*2;
            var context=canvas.getContext('2d');if(!context) throw new Error('PNG export is unavailable in this browser. Use SVG.');
            context.drawImage(image,0,0,canvas.width,canvas.height);
            var png=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});
            if(!png) throw new Error('PNG export failed. Try fewer records or use SVG.');
            download(png,filename('png'));
          } finally {URL.revokeObjectURL(url);}
        }
      }
      message.textContent=kind.toUpperCase()+' download prepared with '+rows.length+' selected records.';
    } catch(error) {message.textContent=error.message || 'Export failed. Please try SVG or CSV.';}
  }
  select.addEventListener('change',function(){activate(series.find(function(s){return s.id===select.value;}),false);});
  function eligibleSeries(){return series.filter(function(s){return (!pillarFilter.value || s.pillar===pillarFilter.value) && (!countryFilter.value || s.rows.some(function(r){return r.country===countryFilter.value;}));});}
  function filterMeasures(restore){
    var available=eligibleSeries(),notice='';
    // Some pillars contain only continent-wide records. Make the empty combination explicit.
    if(!available.length){countryFilter.value='';available=eligibleSeries();notice='This pillar has no country-level measures; country focus was cleared to show all records.';}
    Array.from(select.options).forEach(function(option){option.hidden=!available.some(function(s){return s.id===option.value;});option.disabled=option.hidden;});
    var wanted=available.find(function(s){return s.id===current.id;}) || available[0];
    if(wanted)activate(wanted,restore);
    if(notice)message.textContent=notice;
  }
  pillarFilter.addEventListener('change',function(){filterMeasures(false);});countryFilter.addEventListener('change',function(){filterMeasures(false);});
  periodFilter.addEventListener('change',function(){selected.clear();visibleRows().filter(hasValue).slice(0,8).forEach(function(r){selected.add(r.id);});drawPicker();render();});
  search.addEventListener('input',drawPicker);
  title.addEventListener('input',render);type.addEventListener('change',render);
  order.addEventListener('change',function(){drawPicker();render();});
  get('[data-cb-clear]').addEventListener('click',function(){selected.clear();drawPicker();render();});
  get('[data-cb-visible]').addEventListener('click',function(){var available=visibleRows();available.forEach(function(r){if(selected.size<LIMIT) selected.add(r.id);});drawPicker();render();message.textContent=available.some(function(r){return !selected.has(r.id);})?'The 20-record limit was reached. Clear some records to add others.':'';});
  host.querySelectorAll('[data-cb-export]').forEach(function(b){b.addEventListener('click',function(){exportChart(b.getAttribute('data-cb-export'));});});
  get('[data-cb-share]').addEventListener('click',async function(){
    var url=new URL(payload.page,BASE_URL());url.hash='make-a-chart';
    url.searchParams.set('chart',current.id);url.searchParams.set('records',Array.from(selected).join(','));
    url.searchParams.set('chartTitle',title.value);url.searchParams.set('chartStyle',type.value);url.searchParams.set('chartOrder',order.value);url.searchParams.set('chartVersion',current.revision);
    if(pillarFilter.value)url.searchParams.set('pillar',pillarFilter.value);if(countryFilter.value)url.searchParams.set('country',countryFilter.value);if(periodFilter.value)url.searchParams.set('period',periodFilter.value);
    try {if(!navigator.clipboard) throw new Error();await navigator.clipboard.writeText(url.href);message.textContent='Chart link copied. It reopens this selection using the current published register.';}
    catch(_){get('.chart-share-fallback').hidden=false;get('[data-cb-link]').value=url.href;get('[data-cb-link]').select();message.textContent='Copy the link below.';}
  });
  document.addEventListener("observatory-theme-change", render);
  filterMeasures(params.has('chart'));
})();
