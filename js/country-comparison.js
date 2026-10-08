/* Country comparison: independent units, union coverage, explicit dated points.
   Pure data helpers are exported for the export/selection contract checks. */
(async function (global) {
  'use strict';
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  function eligible(s) {
    const countries=s.rows.filter(r=>r.country).map(r=>r.country);
    return s.comparison_eligible!==false && countries.length>1 && countries.length===s.rows.length && new Set(countries).size===countries.length;
  }
  function point(s,iso,p,name) {
    const extra=p[2] || {};
    return Object.assign({country:iso,label:name,value:p[1],time:p[0],period:String(p[0]),status:s.status,source:s.source,source_url:s.source_url,source_tier:s.source_tier,
      snapshot:s.snapshot || '',snapshot_sha256:s.snapshot_sha256 || '',retrieved_at:s.retrieved_at,relation:'=',note:s.definition+' '+s.revision_note},extra);
  }
  function observations(s,h,countries,mode,year,from,to) {
    const result=[];
    countries.forEach(c=>{
      if(mode==='line' && h) {
        const values=new Map((h.points[c.iso3] || []).map(p=>[p[0],p]));
        for(let y=from;y<to+1;y+=h.frequency || 1)result.push(point(h,c.iso3,values.get(y) || [y,null],c.name));
      } else {
        let r;
        if(year && h && h.frequency && h.frequency!==1)r=s.rows.find(r=>r.country===c.iso3 && r.period.includes(year));
        else if(year && h) {const p=(h.points[c.iso3] || []).find(p=>String(p[0])===year);r=point(h,c.iso3,p || [Number(year),null],c.name);}
        else r=s.rows.find(r=>r.country===c.iso3 && (!year || String(r.period).match(/\d{4}/)?.[0]===year));
        result.push(Object.assign({country:c.iso3,label:c.name,value:null,period:year || 'No observation',status:'no information',source:'',source_url:'',note:'No information in this measure. Missing does not mean zero.',relation:'='},r,{label:c.name}));
      }
    });
    return result;
  }
  function compatible(sets) {
    if(sets.length<2 || !sets[0].s.group_key)return false;
    if(!sets.every(d=>d.s.group_key===sets[0].s.group_key && d.s.unit===sets[0].s.unit))return false;
    const dates={};
    for(const d of sets) for(const r of d.rows) if(finite(r.value)) {if(dates[r.country] && dates[r.country]!==r.period)return false;dates[r.country]=r.period;}
    return true;
  }
  function segments(rows) {
    const lines=[];let current=[];
    for(const r of rows) {if(finite(r.value))current.push(r);else if(current.length){lines.push(current);current=[];}}
    if(current.length)lines.push(current);
    return lines;
  }
  function records(sets) {
    return sets.flatMap(d=>d.rows.map(r=>Object.assign({dataset:d.s.id,measure:d.s.title,unit:d.s.unit,category:d.s.category,definition:d.s.description,revision:d.s.revision},r)));
  }
  function csv(sets) {
    const rows=records(sets), fields=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));
    const cell=v=>{let s=v==null?'':String(v);if(typeof v!=='number' && /^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    return '\uFEFF'+[fields,...rows.map(r=>fields.map(f=>r[f]))].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  global.CountryComparison={eligible,point,observations,compatible,segments,records,csv};
  if(typeof document==='undefined')return;
  const host=document.querySelector('[data-country-comparison]'),node=document.getElementById('chart-builder-data');
  if(!host || !node)return;
  const data=JSON.parse(node.textContent), history=JSON.parse(document.getElementById('context-history-data').textContent);
  const params=new URLSearchParams(location.search), explicit=(params.get('measures')||params.get('chart')||'').split(',');
  const singleHistory=params.get('display')==='line'?data.datasets.find(s=>explicit.includes(s.id)&&s.history_verified&&s.scope==='single-country'):null;
  const all=data.datasets.filter(s=>eligible(s)||s===singleHistory), hist=Object.fromEntries(history.series.map(s=>[s.id,s]));
  async function loadHistory(){if(history.series.length)return;const response=await fetch('data/context-history.json');if(!response.ok)throw Error('History could not load. Try again.');const loaded=await response.json();history.series=loaded.series;loaded.series.forEach(s=>{hist[s.id]=s;(s.aliases||[]).forEach(id=>hist[id]=s);});}
  if(params.get('display')==='line' || /-history$/.test(params.get('chart')||''))try{await loadHistory();}catch(_){}
  const requested=(params.get('measures') || params.get('chart') || 'jobs-tasks').split(',').map(id=>all.some(s=>s.id===id)?id:id.replace(/-history$/,''));
  // Old record/preset links retain the record explorer. Explicit history links route here.
  const active=document.body.dataset.workspace==='compare' || params.get('view')==='compare' || params.has('measures') || /-history$/.test(params.get('chart') || '') || (!params.has('view') && !params.has('chart'));
  if(!active)return;
  host.hidden=false;document.querySelector('[data-chart-builder]').hidden=true;
  const countries=data.countries.slice().sort((a,b)=>a.name.localeCompare(b.name));
  let measures=Array.from(new Set(requested.filter(id=>all.some(s=>s.id===id)))).slice(0,3);if(!measures.length)measures=['jobs-tasks'];
  let selected=new Set((params.get('countries') || params.get('country') || 'NGA,ZAF,KEN,EGY,GHA,RWA').split(',').filter(iso=>countries.some(c=>c.iso3===iso)));
  if(singleHistory){measures=[singleHistory.id];selected=new Set(singleHistory.rows.filter(r=>finite(r.value)).map(r=>r.country));}
  const ns='http://www.w3.org/2000/svg', format=new Intl.NumberFormat('en',{maximumSignificantDigits:5});
  const valueLabel=r=>!finite(r.value)?'No information':(r.relation==='approximately'?'≈ ':r.relation && r.relation!=='='?r.relation+' ':'')+format.format(r.value);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  let svg,sets=[],first=true,observer,drawVersion=0,tablePage=0;
  host.innerHTML=`<p class="comparison-intro">Compare up to three measures. Each measure has its own unit and scale. Exposure is not job loss; economic indicators do not establish AI causation.</p>
    <label>Start with a question<select data-cc-recommend><option value="">Choose a suggested comparison</option></select></label><div class="comparison-controls"><fieldset><legend>1. Choose measures (up to 3)</legend><label>Find a measure<input type="search" data-cc-find placeholder="Unemployment, electricity, exposure…"></label><label>Measure family<select data-cc-family><option value="">All families</option></select></label><label>Provider or model<select data-cc-provider><option value="">All providers and models</option></select></label><label>Category<select data-cc-category><option value="">All categories</option><option>AI-specific</option><option>Context indicators</option><option>Supporting evidence</option></select></label><div class="comparison-measures" data-cc-measures></div><div data-cc-selected></div></fieldset>
    <fieldset><legend>2. Choose countries</legend><label>Find a country<input type="search" data-cc-country-search></label><div class="chart-actions"><button type="button" data-cc-all>Select all 54</button><button type="button" data-cc-clear>Clear countries</button></div><div class="comparison-countries" data-cc-countries></div></fieldset></div>
    <div class="chart-controls"><label>Display<select data-cc-display><option value="vertical">Compare · aligned measure lanes</option><option value="grouped">Grouped bars · compatible measures</option><option value="line">Over time · separate panels</option></select></label><label>Observation year<select data-cc-year><option value="">Latest available (years may differ)</option></select></label><label data-cc-range hidden>From year<input data-cc-from type="number" step="1"></label><label data-cc-range hidden>To year<input data-cc-to type="number" step="1"></label><label>Country order<select data-cc-order><option value="name">Country name A–Z</option><option value="value">First measure, highest value</option><option value="measure-1">Second measure, highest value</option><option value="measure-2">Third measure, highest value</option></select></label><label>Chart title<input data-cc-title maxlength="100" value="Countries in context"></label></div>
    <p data-cc-explanation></p><p role="status" data-cc-summary></p><p class="coverage-note">On smaller screens, swipe or scroll sideways across the chart to keep country labels readable.</p><div class="comparison-preview" data-cc-preview tabindex="0" role="region" aria-label="Country comparison chart; scroll horizontally for large selections"></div>
    <div class="chart-actions"><button type="button" data-cc-export="png">Download PNG</button><button type="button" data-cc-export="svg">Download SVG</button><button type="button" data-cc-export="csv">Download selected CSV</button><button type="button" data-cc-share>Copy link to comparison</button></div><p role="status" data-cc-message></p><label data-cc-link-label hidden>Share link<input data-cc-link readonly></label>
    <details class="resource-details"><summary>Inspect selected values, dates and sources</summary><div class="chart-actions"><button type="button" data-cc-prev>Previous values</button><span data-cc-page></span><button type="button" data-cc-next>Next values</button></div><div class="tablewrap"><table class="register" data-cc-table></table></div></details><p class="coverage-note">Downloads preserve all selected measures and countries. “No information” is never zero. Links reopen the current data; save SVG or CSV to preserve this version. <a href="method.html#context-method">Definitions and history audit</a>.</p>`;
  const get=q=>host.querySelector(q),display=get('[data-cc-display]'),year=get('[data-cc-year]'),from=get('[data-cc-from]'),to=get('[data-cc-to]'),order=get('[data-cc-order]'),title=get('[data-cc-title]'),preview=get('[data-cc-preview]'),message=get('[data-cc-message]');
  function el(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs || {}).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!=null)e.textContent=text;return e;}
  function html(tag,text){const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;}
  function family(s){if(s.id.startsWith('jobs-'))return 'AI task exposure';if(s.id.startsWith('cost-'))return 'Connectivity cost';if(/device|handset/.test(s.id))return 'Device cost';if(/gni|subscription/.test(s.id))return 'Cost vs income';if(s.id.startsWith('economy-'))return 'Context: economy';if(/EG\.ELC|generation|eskom|OUTG/.test(s.id))return 'Context: electricity';return 'Supporting evidence';}
  function provider(s){return /subscription|access-gni/.test(s.id)?s.title.split(' / ')[0].split(' — ')[0]:'';}
  [...new Set(all.map(family))].sort().forEach(f=>get('[data-cc-family]').add(new Option(f,f)));
  function providers(){const select=get('[data-cc-provider]'),old=select.value,f=get('[data-cc-family]').value;select.replaceChildren(new Option('All providers and models',''));[...new Set(all.filter(s=>!f||family(s)===f).map(provider).filter(Boolean))].sort().forEach(p=>select.add(new Option(p,p)));select.value=[...select.options].some(o=>o.value===old)?old:'';}
  const recommendations=[['Exposure vs unemployment','jobs-tasks','economy-SL.UEM.TOTL.ZS'],['Exposure and labour participation','jobs-tasks','economy-SL.TLF.CACT.ZS'],['Youth unemployment and growth','economy-SL.UEM.1524.ZS','economy-NY.GDP.MKTP.KD.ZG'],['Mobile costs and income','cost-mobile-usd-2025','economy-NY.GDP.PCAP.CD'],['Mobile vs fixed connectivity costs','cost-mobile-gni-2025','cost-fixed-gni-2025'],['Internet use and electricity access','context-IT.NET.USER.ZS','context-EG.ELC.ACCS.ZS'],['AI adoption and internet use','adoption-estimate-h2-2025','context-IT.NET.USER.ZS'],['Listed facilities and electricity access','data-centres-listed','context-EG.ELC.ACCS.ZS'],['Productivity and manufacturing','economy-SL.GDP.PCAP.EM.KD','economy-NV.IND.MANF.ZS']];
  recommendations.forEach((r,i)=>get('[data-cc-recommend]').add(new Option(r[0],String(i))));
  get('[data-cc-recommend]').addEventListener('change',()=>{if(get('[data-cc-recommend]').value==='')return;const r=recommendations[Number(get('[data-cc-recommend]').value)];measures=r.slice(1).filter(id=>all.some(s=>s.id===id));title.value=r[0];display.value='vertical';year.value='';options();configure();render();});
  get('[data-cc-family]').addEventListener('change',()=>{providers();options();});get('[data-cc-provider]').addEventListener('change',options);providers();
  function options() {
    const list=get('[data-cc-measures]'),query=get('[data-cc-find]').value.toLowerCase(),category=get('[data-cc-category]').value;list.replaceChildren();
    all.filter(s=>eligible(s) && (!get('[data-cc-family]').value || family(s)===get('[data-cc-family]').value) && (!get('[data-cc-provider]').value || provider(s)===get('[data-cc-provider]').value) && (!category || s.category===category) && (s.title+' '+s.pillar+' '+s.unit).toLowerCase().includes(query)).forEach(s=>{
      const label=html('label'),input=html('input'),text=html('span',s.title);input.type='checkbox';input.checked=measures.includes(s.id);input.disabled=!input.checked && measures.length===3;
      const sub=html('small',s.category+' · '+s.unit+' · '+s.coverage.known+'/'+s.coverage.total+' have values'+(s.history_verified?' · history available':' · snapshot'));
      input.addEventListener('change',()=>{measures=input.checked?[...measures,s.id]:measures.filter(id=>id!==s.id);options();configure();render();});text.appendChild(sub);label.append(input,text);list.appendChild(label);
    });
    if(!list.children.length)list.textContent='No measures match this search.';
    const chosen=get('[data-cc-selected]');chosen.replaceChildren();measures.forEach(id=>{const b=html('button','× '+all.find(s=>s.id===id).title);b.type='button';b.addEventListener('click',()=>{measures=measures.filter(s=>s!==id);options();configure();render();});chosen.appendChild(b);});
  }
  function countryPicker(){
    const list=get('[data-cc-countries]'),query=get('[data-cc-country-search]').value.toLowerCase();list.replaceChildren();
    countries.filter(c=>(c.name+' '+c.iso3).toLowerCase().includes(query)).forEach(c=>{const label=html('label'),input=html('input');input.type='checkbox';input.checked=selected.has(c.iso3);input.addEventListener('change',()=>{if(input.checked)selected.add(c.iso3);else selected.delete(c.iso3);render();});label.append(input,html('span',c.name));list.appendChild(label);});
  }
  function bounds(){const years=measures.flatMap(id=>hist[id]?Object.values(hist[id].points).flat().filter(p=>p[1]!==null).map(p=>p[0]):all.find(s=>s.id===id).rows.map(r=>Number(String(r.period).match(/\d{4}/)?.[0])).filter(Number.isFinite));return years.length?[Math.floor(Math.min(...years)),Math.floor(Math.max(...years))]:[Number(data.generated_at.slice(0,4)),Number(data.generated_at.slice(0,4))];}
  function configure(){
    const old=year.value,[low,high]=bounds();year.replaceChildren(new Option('Latest available (years may differ)',''));for(let y=high;y>=low;y--)year.add(new Option(String(y),String(y)));year.value=old;
    [from,to].forEach(e=>{e.min=low;e.max=high;});from.value=Math.max(low,Math.min(high,Number(from.value)||Math.max(low,high-15)));to.value=Math.max(Number(from.value),Math.min(high,Number(to.value)||high));
    const hasHistory=measures.length>0 && measures.every(id=>all.find(s=>s.id===id).history_verified);display.querySelector('[value="line"]').disabled=!hasHistory;
    if(display.value==='line' && !hasHistory)display.value='vertical';
    const sample=measures.map(id=>({s:all.find(s=>s.id===id),rows:all.find(s=>s.id===id).rows}));display.querySelector('[value="grouped"]').disabled=!compatible(sample);
    if(display.value==='grouped' && !compatible(sample))display.value='vertical';
  }
  function selectedData(){
    const picked=countries.filter(c=>selected.has(c.iso3));let output=measures.map(id=>{const s=all.find(s=>s.id===id);return {s,rows:observations(s,hist[id],picked,display.value,year.value,Number(from.value),Number(to.value))};});
    if(order.value!=='name' && display.value!=='line' && output.length){const values=new Map(output[Math.min(output.length-1,Number(order.value.replace('measure-',''))||0)].rows.map(r=>[r.country,r.value]));picked.sort((a,b)=>{const av=values.get(a.iso3),bv=values.get(b.iso3);return (finite(bv)?bv:-Infinity)-(finite(av)?av:-Infinity)||a.name.localeCompare(b.name);});output.forEach(d=>d.rows.sort((a,b)=>picked.findIndex(c=>c.iso3===a.country)-picked.findIndex(c=>c.iso3===b.country)));}
    return {picked,output};
  }
  function render(){
    const [low,high]=bounds();from.value=Math.max(low,Math.min(high,Number(from.value)||low));to.value=Math.max(Number(from.value),Math.min(high,Number(to.value)||high));
    const result=selectedData();sets=result.output;const picked=result.picked;
    if(display.value==='grouped' && !compatible(sets)){display.value='vertical';sets=selectedData().output;}
    const isLine=display.value==='line';year.disabled=isLine;order.disabled=isLine;host.querySelectorAll('[data-cc-range]').forEach(e=>e.hidden=!isLine);
    get('[data-cc-explanation]').textContent=isLine?'One line per country. Missing years break the line. A single known point is shown as a point, never a flat trend. Each source uses its current historical vintage.':display.value==='grouped'?'Grouped because these measures share a reviewed definition family, unit and observation period. Each series retains its evidence status.':'One row per country, with a separate scale for each measure. Different coverage remains visible. Snapshot-only measures have no Over time option.';
    get('[data-cc-summary]').textContent=picked.length+' countries · '+sets.length+' measures. '+sets.map(d=>d.s.title+': '+d.rows.filter(r=>finite(r.value)).length+'/'+d.rows.length+' selected observations have values.').join(' ')+(picked.length>15?' Large selection: scroll across the chart; use fewer countries to inspect individual lines.':'');
    host.querySelectorAll('[data-cc-export],[data-cc-share]').forEach(b=>b.disabled=!picked.length || !sets.length);
    if(!picked.length || !sets.length){svg=null;preview.textContent='Select at least one measure and one country.';get('[data-cc-table]').replaceChildren();get('[data-cc-page]').textContent='No selected values';message.textContent='';return;}
    svg=draw(picked,sets);transition(svg);tablePage=0;table();
  }
  function draw(picked,datasets){
    if(display.value==='vertical')return drawLanes(picked,datasets);
    const style=getComputedStyle(document.documentElement),ink=style.getPropertyValue('--ink').trim()||'#222',paper=style.getPropertyValue('--paper').trim()||'#fff',rule=style.getPropertyValue('--rule').trim()||'#bbb';
    const palette=['#007f86','#b66021','#8253a0','#526b23','#a93466','#2667b0','#795044','#16866a','#af442c'];
    const width=display.value==='line'?1200:Math.max(1100,90+picked.length*48),left=85,right=width-35,plot=right-left;
    const root=el('svg',{xmlns:ns,width,role:'img','aria-label':title.value||'Country comparison','font-family':'Arial, sans-serif',style:'font-variant-numeric:tabular-nums',fill:ink});
    const bg=el('rect',{width,height:1,fill:paper});root.appendChild(bg);
    root.appendChild(el('metadata',{},JSON.stringify({title:title.value,compiled:data.generated_at,display:display.value,measures:datasets.map(d=>({id:d.s.id,revision:d.s.revision,unit:d.s.unit,definition:d.s.description})),rows:records(datasets)})));
    root.appendChild(el('title',{},title.value || 'Country comparison'));
    root.appendChild(el('desc',{},'Country comparisons with separate measures, sources and observation dates. No information is not zero. Full values and provenance are embedded in SVG metadata and the accompanying table and CSV.'));
    const defs=el('defs');root.appendChild(defs);
    const pattern=el('pattern',{id:'cc-missing',width:6,height:6,patternUnits:'userSpaceOnUse'});pattern.appendChild(el('path',{d:'M0 6L6 0',stroke:rule,'stroke-width':1}));defs.appendChild(pattern);
    let y=35;
    function text(t,x,yy,size=13,parent=root,attrs={}){parent.appendChild(el('text',Object.assign({x,y:yy,'font-size':size},attrs),t));}
    function lines(t,x,yy,size=12,parent=root){const limit=Math.floor((width-x-35)/(size*.55));let line='';for(const word of String(t).split(/\s+/)){if((line+' '+word).length>limit){text(line,x,yy,size,parent);yy+=size*1.45;line=word;}else line+=(line?' ':'')+word;}text(line,x,yy,size,parent);return yy+size*1.45;}
    text('INFERENCEAFRICA · COUNTRY COMPARISON',35,y,12);y=lines(title.value||'Countries in context',35,y+33,26)+10;
    y=lines('Exposure is not job loss. Context indicators do not establish AI causation. Each panel retains its own scale. No information is never zero.',35,y)+15;
    const panels=display.value==='grouped'?[datasets]:datasets.map(d=>[d]);
    panels.forEach((group,panelIndex)=>{
      const panel=el('g',{'data-comparison-panel':panelIndex});root.appendChild(panel);const panelTop=y;
      for(const [j,d] of group.entries()) {
        y=lines(d.s.title.replace(' — latest available','')+' · '+d.s.category,35,y,18,panel);
        y=lines('Unit: '+d.s.unit+' · '+d.rows.filter(r=>finite(r.value)).length+'/'+d.rows.length+' selected observations with values · '+(hist[d.s.id]?'Retrieved '+hist[d.s.id].retrieved_at:'Compiled '+data.generated_at),35,y+3,12,panel);
        y=lines(d.s.description,35,y+3,12,panel)+7;
        if(group.length>1){text('Series '+(j+1),35,y,12,panel,{fill:palette[j]});y+=20;}
      }
      const vals=group.flatMap(d=>d.rows.filter(r=>finite(r.value)).map(r=>r.value)),domain=group.length===1?group[0].s.domain:null;
      let min=domain?Math.min(0,domain[0],...vals):Math.min(0,...vals),max=domain?Math.max(domain[1],...vals):Math.max(0,...vals);if(min===max)max=min+1;
      if(!domain){const raw=(max-min)/4,base=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,2.5,5,10].find(n=>n*base>=raw)*base;min=Math.floor(min/step)*step;max=Math.ceil(max/step)*step;}
      const top=y+30,bottom=top+280,pos=v=>bottom-(v-min)/(max-min)*280,zero=pos(0);
      for(let k=0;k<=4;k++){const v=min+(max-min)*k/4,yy=pos(v);panel.appendChild(el('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:rule,'stroke-width':.7}));text(format.format(v),left-10,yy+4,11,panel,{'text-anchor':'end'});}
      panel.appendChild(el('line',{x1:left,x2:right,y1:zero,y2:zero,stroke:ink}));
      if(display.value==='line'){
        const d=group[0],frequency=hist[d.s.id].frequency||1,start=Number(from.value),end=Number(to.value)+1-frequency,x=year=>left+(year-start)/Math.max(frequency,end-start)*plot;
        const step=end-start<=2?frequency:Math.max(1,Math.ceil((end-start)/10));for(let yr=start;yr<=end;yr+=step)text(step<1?Math.floor(yr)+' '+(frequency===.5?'H'+(1+Math.round((yr%1)*2)):'Q'+(1+Math.round((yr%1)*4))):yr,x(yr),bottom+22,11,panel,{'text-anchor':'middle'});
        picked.forEach((c,i)=>{
          const rows=d.rows.filter(r=>r.country===c.iso3),colour=palette[i%palette.length],dash=['','7 4','2 3','10 3 2 3','1 3','12 6'][Math.floor(i/palette.length)%6];
          for(const segment of segments(rows)){
            const path=segment.map((r,k)=>(k?'L':'M')+x(r.time)+','+pos(r.value)).join(' ');
            if(segment.length>1)panel.appendChild(el('path',{d:path,fill:'none',stroke:colour,'stroke-width':1.8,'stroke-dasharray':dash,'data-line-series':c.iso3}));
            segment.forEach(r=>{const dot=el('circle',{cx:x(r.time),cy:pos(r.value),r:2.5,fill:r.status.includes('modelled')?paper:colour,stroke:colour});dot.appendChild(el('title',{},c.name+': '+format.format(r.value)+' '+d.s.unit+' · '+r.period+' · '+r.status));panel.appendChild(dot);});
          }
        });
        // Reveal by clipping, so source gaps and country dash patterns never change.
        const clip=el('clipPath',{id:'cc-line-clip-'+panelIndex});clip.appendChild(el('rect',{x:left,y:top-5,width:plot,height:290,'data-line-reveal':'true'}));defs.appendChild(clip);
        panel.querySelectorAll('[data-line-series]').forEach(p=>p.setAttribute('clip-path','url(#cc-line-clip-'+panelIndex+')'));
        y=bottom+50;picked.forEach((c,i)=>{const xx=35+(i%4)*(width-70)/4,yy=y+Math.floor(i/4)*23;panel.appendChild(el('line',{x1:xx,x2:xx+25,y1:yy-4,y2:yy-4,stroke:palette[i%palette.length],'stroke-width':2,'stroke-dasharray':['','7 4','2 3','10 3 2 3','1 3','12 6'][Math.floor(i/palette.length)%6]}));text(c.name,xx+32,yy,11,panel);});y+=Math.ceil(picked.length/4)*23+12;
      } else {
        const band=plot/picked.length,barWidth=Math.min(44,band*.66/group.length);
        picked.forEach((c,i)=>{
          const centre=left+band*(i+.5);
          group.forEach((d,j)=>{
            const r=d.rows.find(r=>r.country===c.iso3),x=centre+(j-(group.length-1)/2)*barWidth,colour=palette[j];
            if(finite(r.value)){
              const status=r.status.toLowerCase(),solid=['measured','derived','operational'].includes(status),attrs={x:x-barWidth*.44,y:Math.min(pos(r.value),zero),width:barWidth*.88,height:Math.max(0.7,Math.abs(pos(r.value)-zero)),fill:solid?colour:status.includes('proposal')?'url(#cc-missing)':paper,stroke:colour,'stroke-width':1.4};
              if(/forecast|projection/.test(status))attrs['stroke-dasharray']='5 3';
              const bar=el('rect',Object.assign(attrs,{'data-bar-reveal':panelIndex,'data-zero':zero}));bar.appendChild(el('title',{},c.name+': '+format.format(r.value)+' '+d.s.unit+' · '+r.period+' · '+r.status));panel.appendChild(bar);
              text((/modelled/.test(status)?'∿ ': /derived/.test(status)?'ƒ ':'')+valueLabel(r),x,r.value<0?pos(r.value)+17:pos(r.value)-8,10,panel,{'text-anchor':'middle',transform:picked.length>20?'rotate(-65 '+x+' '+(r.value<0?pos(r.value)+17:pos(r.value)-8)+')':''});
            } else {panel.appendChild(el('rect',{x:x-barWidth*.44,y:zero-4,width:barWidth*.88,height:8,fill:'url(#cc-missing)',stroke:rule}));text('N/I',x,zero-10,9,panel,{'text-anchor':'middle'});}
          });
          const x=centre+2,yy=bottom+20;text(c.name,x,yy,11,panel,{transform:'rotate(55 '+x+' '+yy+')','text-anchor':'start'});
          group.forEach((d,j)=>{const r=d.rows.find(r=>r.country===c.iso3);text((group.length>1?(j+1)+': ':'')+((r.period || '').match(/^\d{4}/) || ['No date'])[0],centre,bottom+185+j*15,9,panel,{'text-anchor':'middle'});});
        });y=bottom+210+group.length*15;
      }
      y=lines('Evidence: solid = measured / derived / operational; outline = reported / modelled / announced; ∿ = modelled; ƒ = derived; dashed = forecast; hatch = proposal or N/I (no information).',35,y,11,panel)+5;
      for(const d of group){
        const unique=new Map();d.rows.forEach(r=>{if(r.source_url)unique.set(r.source_url,r.source);});
        y=lines(d.s.title.replace(' — latest available','')+' — sources, dates and status:',35,y,12,panel);
        const statuses=Array.from(new Set(d.rows.filter(r=>finite(r.value)).map(r=>r.status))),dates=Array.from(new Set(d.rows.filter(r=>finite(r.value)).map(r=>r.period))).sort();
        y=lines('Status: '+statuses.join(', ')+' · Observations: '+(display.value==='line'?from.value+'–'+to.value:dates.join(', '))+' · Revision '+d.s.revision,35,y,11,panel);
        for(const [url,name] of unique)y=lines(name+' — '+url,35,y,11,panel);
        // Row qualifications cannot be silently dropped from an exported image.
        const notes=Array.from(new Set(d.rows.map(r=>r.note).filter(n=>n && n!==d.s.description)));
        for(const note of notes)y=lines(note,35,y,11,panel);
        y+=12;
      }
      panel.setAttribute('data-panel-top',panelTop);y+=24;
    });
    y=lines('InferenceAfrica · https://inferenceafrica.com/ · Compiled '+data.generated_at+' · Compilation CC BY 4.0; underlying sources retain their terms. CSV preserves unrounded values and per-point provenance.',35,y,12)+20;
    root.setAttribute('height',Math.ceil(y));root.setAttribute('viewBox','0 0 '+width+' '+Math.ceil(y));bg.setAttribute('height',Math.ceil(y));return root;
  }
  function drawLanes(picked,datasets){
    const style=getComputedStyle(document.documentElement),ink=style.getPropertyValue('--ink').trim()||'#222',paper=style.getPropertyValue('--paper').trim()||'#fff',rule=style.getPropertyValue('--rule').trim()||'#aaa';
    const width=1200,labelWidth=220,laneWidth=(width-labelWidth-40)/datasets.length,palette=['#16818a','#b66021','#8253a0'];
    const root=el('svg',{xmlns:ns,width,role:'img','aria-label':title.value||'Country comparison','font-family':'Arial, sans-serif',fill:ink});
    const bg=el('rect',{width,height:1,fill:paper});root.append(bg,el('title',{},title.value||'Countries in context'),el('desc',{},'One row per country. Each measure uses its own scale and unit. A dash means no information, never zero.'),el('metadata',{},JSON.stringify({compiled:data.generated_at,rows:records(datasets)})));
    function text(t,x,y,size=13,attrs={}){root.appendChild(el('text',Object.assign({x,y,'font-size':size},attrs),t));}
    function wrap(t,x,y,max,size=13){let line='';for(const word of String(t).split(/\s+/).flatMap(w=>w.match(new RegExp('.{1,'+max+'}','g'))||[])){if((line+' '+word).length>max && line){text(line,x,y,size);y+=size*1.4;line=word;}else line+=(line?' ':'')+word;}text(line,x,y,size);return y+size*1.4;}
    text('INFERENCEAFRICA · COUNTRY COMPARISON',30,30,12);let y=wrap(title.value||'Countries in context',30,68,76,25)+10;
    y=wrap('Independent scales · filled = measured / derived; outline = reported / modelled; dashed = forecast; – = no information.',30,y,140,12)+8;
    const head=y,top=head+135,rowHeight=52;
    datasets.forEach((d,j)=>{
      const x=labelWidth+j*laneWidth,w=laneWidth-36,values=d.rows.filter(r=>finite(r.value)).map(r=>r.value);
      const lo=Math.min(0,...values,...(d.s.domain||[])),hi=Math.max(0,...values,...(d.s.domain||[])),span=hi-lo||1,pos=v=>x+(v-lo)/span*w;
      wrap(d.s.title.replace(' — latest available',''),x,head,Math.floor(w/8),14);text(d.s.unit,x,head+58,12);
      root.appendChild(el('line',{x1:x,x2:x+w,y1:top-18,y2:top-18,stroke:rule}));text(format.format(lo),x,top-24,11);text(format.format(hi),x+w,top-24,11,{'text-anchor':'end'});
      const reference=(year.value&&hist[d.s.id]?observations(d.s,hist[d.s.id],countries,'vertical',year.value,0,0):d.s.rows).filter(r=>finite(r.value)&&(!year.value || String(r.period).match(/\d{4}/)?.[0]===year.value)),periods=new Set(reference.map(r=>r.period));
      if(reference.length>1 && periods.size===1){const sorted=reference.map(r=>r.value).sort((a,b)=>a-b),n=sorted.length,median=(sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2;if(median>=lo&&median<=hi)root.appendChild(el('line',{x1:pos(median),x2:pos(median),y1:top-8,y2:top+picked.length*rowHeight-10,stroke:rule,'stroke-dasharray':'3 4'}));text('Sample median '+format.format(median)+' · n='+n,x,head+78,11);text([...periods][0],x,head+94,11);}
      else text('No same-period sample median',x,head+78,11);
      picked.forEach((c,i)=>{const r=d.rows.find(r=>r.country===c.iso3),yy=top+i*rowHeight;
        if(j===0){text(c.name,30,yy+16,13);root.appendChild(el('line',{x1:30,x2:width-30,y1:yy+43,y2:yy+43,stroke:rule,'stroke-opacity':.4}));}
        if(!finite(r.value)){text('– No information',x,yy+17,12);return;}
        const status=String(r.status).toLowerCase(),solid=/measured|observed|derived|operational/.test(status),bar=el('rect',{x:Math.min(pos(0),pos(r.value)),y:yy+3,width:Math.max(1,Math.abs(pos(r.value)-pos(0))),height:13,fill:solid?palette[j]:paper,stroke:palette[j],'stroke-dasharray':/forecast|projection/.test(status)?'4 3':''});
        bar.appendChild(el('title',{},c.name+': '+valueLabel(r)+' '+d.s.unit+' · '+r.period+' · '+r.status));root.appendChild(bar);text(valueLabel(r)+' · '+r.period,x,yy+34,11);bar.appendChild(el('desc',{},r.status));
      });
    });
    y=top+picked.length*rowHeight+20;
    y=wrap('Exposure is not job loss. Economic context does not establish AI causation. Dates differ where shown. Selected values and full row-level provenance are in the CSV, inspection table and SVG metadata.',30,y,140,12)+12;
    datasets.forEach((d,j)=>{y=wrap((j+1)+'. '+d.s.title+' — '+d.s.description,30,y,140,12);const sources=new Map();d.rows.filter(r=>finite(r.value)&&r.source_url).forEach(r=>sources.set(r.source_url,r.source));for(const [url,name] of sources)y=wrap(name+' — '+url,30,y,145,11);y+=12;});
    y=wrap('InferenceAfrica · inferenceafrica.com · Compiled '+data.generated_at+' · Compilation CC BY 4.0; underlying source terms apply.',30,y,145,11)+20;
    root.setAttribute('height',Math.ceil(y));root.setAttribute('viewBox','0 0 '+width+' '+Math.ceil(y));bg.setAttribute('height',Math.ceil(y));return root;
  }
  function transition(next){
    const old=preview.lastElementChild,version=++drawVersion;
    Array.from(preview.children).forEach(child=>{if(child!==old)child.remove();});
    if(first){preview.replaceChildren(next);first=false;if(!reduced() && global.IntersectionObserver){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();if(version!==drawVersion)return;next.querySelectorAll('[data-comparison-panel]').forEach((p,i)=>p.animate([{opacity:0},{opacity:1}],{duration:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-draw'))||900,delay:i*90,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-standard').trim()||'cubic-bezier(.2,0,0,1)'}));next.querySelectorAll('[data-bar-reveal]').forEach(b=>b.animate([{height:'0px',y:b.getAttribute('data-zero')+'px'},{height:b.getAttribute('height')+'px',y:b.getAttribute('y')+'px'}],{duration:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-draw'))||900,delay:Number(b.getAttribute('data-bar-reveal'))*90,easing:'cubic-bezier(.2,0,0,1)'}));next.querySelectorAll('[data-line-reveal]').forEach(r=>r.animate([{width:'0px'},{width:r.getAttribute('width')+'px'}],{duration:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-draw'))||900,easing:'cubic-bezier(.2,0,0,1)'}));}},{threshold:.1});observer.observe(preview);}return;}
    if(observer)observer.disconnect();
    if(old && old.tagName.toLowerCase()==='svg' && !reduced() && old.animate){old.setAttribute('aria-hidden','true');preview.appendChild(next);old.style.position='absolute';old.style.left='0';old.style.top='0';old.style.pointerEvents='none';const duration=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-value'))||400;old.animate([{opacity:1},{opacity:0}],{duration}).finished.then(()=>old.remove(),()=>old.remove());next.animate([{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.2,0,0,1)'});}else preview.replaceChildren(next);
  }
  function table(){
    const table=get('[data-cc-table]');table.replaceChildren();const head=html('thead'),header=html('tr');['Measure','Country','Value','Unit','Year','Status','Source','Notes'].forEach(t=>header.appendChild(html('th',t)));head.appendChild(header);table.appendChild(head);const body=html('tbody');
    const values=records(sets);get('[data-cc-page]').textContent='Values '+(tablePage*200+1)+'–'+Math.min(values.length,(tablePage+1)*200)+' of '+values.length;get('[data-cc-prev]').disabled=tablePage===0;get('[data-cc-next]').disabled=(tablePage+1)*200>=values.length;
    values.slice(tablePage*200,(tablePage+1)*200).forEach(r=>{const tr=html('tr');[r.measure,r.label,valueLabel(r),r.unit,r.period,r.status,r.source,r.note].forEach((v,i)=>{const td=html('td');if(i===6 && /^https:\/\//.test(r.source_url)){const a=html('a',v);a.href=r.source_url;td.appendChild(a);}else td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});table.appendChild(body);
  }
  function download(blob,ext){const url=URL.createObjectURL(blob),a=html('a');a.href=url;a.download='inferenceafrica-country-comparison.'+ext;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function exportChart(kind){
    if(!svg)return;try{
      if(kind==='csv')download(new Blob([csv(sets)],{type:'text/csv;charset=utf-8'}),'csv');
      else {const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});if(kind==='svg')download(blob,'svg');else {const url=URL.createObjectURL(blob);try {const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});const canvas=document.createElement('canvas'),w=Number(svg.getAttribute('width')),h=Number(svg.getAttribute('height')),scale=Math.min(2,16000/Math.max(w,h),Math.sqrt(24000000/(w*h)));canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PNG is unavailable; use SVG or CSV.');ctx.drawImage(image,0,0,canvas.width,canvas.height);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw new Error('PNG export failed; SVG and CSV remain available.');download(png,'png');}finally{URL.revokeObjectURL(url);}}}
      message.textContent=kind.toUpperCase()+' prepared with all '+sets.length+' measures and '+selected.size+' countries.';
    }catch(e){message.textContent=e.message || 'Image export failed. Use SVG or CSV.';}
  }
  get('[data-cc-prev]').addEventListener('click',()=>{tablePage=Math.max(0,tablePage-1);table();});get('[data-cc-next]').addEventListener('click',()=>{tablePage++;table();});
  get('[data-cc-find]').addEventListener('input',options);get('[data-cc-category]').addEventListener('change',options);get('[data-cc-country-search]').addEventListener('input',countryPicker);
  get('[data-cc-all]').addEventListener('click',()=>{selected=new Set(countries.map(c=>c.iso3));countryPicker();render();});get('[data-cc-clear]').addEventListener('click',()=>{selected.clear();countryPicker();render();});
  [year,from,to,order,title].forEach(e=>e.addEventListener('change',render));display.addEventListener('change',async()=>{if(display.value==='line'){message.textContent='Loading history…';try{await loadHistory();configure();display.value='line';message.textContent='';}catch(e){display.value='vertical';message.textContent=e.message;}}render();});host.querySelectorAll('[data-cc-export]').forEach(b=>b.addEventListener('click',()=>exportChart(b.dataset.ccExport)));
  get('[data-cc-share]').addEventListener('click',async()=>{const url=new URL('https://inferenceafrica.com/data-explorer.html');Object.entries({view:'compare',measures:measures.join(','),countries:Array.from(selected).join(','),display:display.value,year:year.value,from:from.value,to:to.value,order:order.value,title:title.value,versions:sets.map(d=>d.s.revision).join(',')}).forEach(([k,v])=>url.searchParams.set(k,v));url.hash='make-a-chart';try{await navigator.clipboard.writeText(url.href);message.textContent='Comparison link copied.';}catch(_){get('[data-cc-link-label]').hidden=false;get('[data-cc-link]').value=url.href;get('[data-cc-link]').select();message.textContent='Copy the selected link.';}});
  configure();if(params.has('year'))year.value=params.get('year');if(params.has('from'))from.value=params.get('from');if(params.has('to'))to.value=params.get('to');if(['value','measure-1','measure-2'].includes(params.get('order')))order.value=params.get('order');if(params.has('title'))title.value=params.get('title').slice(0,100);
  const desired=params.get('display') || (/-history$/.test(params.get('chart') || '')?'line':'vertical');if(['vertical','grouped','line'].includes(desired) && !display.querySelector('[value="'+desired+'"]').disabled)display.value=desired;
  options();countryPicker();render();if(params.has('versions') && params.get('versions')!==sets.map(d=>d.s.revision).join(','))message.textContent='Data has changed since this link was created. The current version is shown.';
  document.addEventListener('observatory-theme-change',render);
})(typeof globalThis!=='undefined'?globalThis:this);

