/* Country outlook review: no external data calls, scores, or inferred values. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const params=new URLSearchParams(location.search);let data,country,measure;
 const displayed=()=>measure.points.filter(p=>$('outlook-period').value==='all'||p[2].status==='reported');
 const option=(select,value,label)=>{const o=node('option',label);o.value=value;select.append(o);};
 function updateURL(){const p=new URLSearchParams({country:country.iso3,measure:measure.id,period:$('outlook-period').value});history.replaceState(null,'','?'+p);}
 function svg(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
 function chart(){
  const host=$('outlook-chart');host.replaceChildren();const points=displayed(),known=points.filter(p=>p[1]!==null);
  $('chart-caption').textContent=measure.title+' · '+measure.unit;
  $('chart-source').replaceChildren(node('span',measure.source+' · '));const a=node('a','Source');a.href=measure.source_url;$('chart-source').append(a);
  const scope=measure.metadata;
  $('fiscal-scope').textContent=measure.definition+' '+measure.note+' Government coverage: '+(scope.FISCAL_SECTOR_GENERAL_GOVERNMENT_COMPOSITION||'See individual source coverage')+'. Reporting year: '+(scope.START_END_MONTHS_OF_REPORTING_YEAR||'Annual source observation')+'.';
  const tbody=$('fiscal-values');tbody.replaceChildren();points.forEach(p=>{const tr=node('tr');[p[0],p[1]===null?'No information':fmt(p[1])+' '+measure.unit,p[2].status].forEach(t=>tr.append(node('td',t)));tbody.append(tr);});
  if(!known.length){host.append(node('p','No information for this selection.'));return;}
  const W=960,H=330,L=72,R=28,T=25,B=60,minYear=2015,maxYear=$('outlook-period').value==='all'?2031:2025;
  let low=Math.min(0,...known.map(p=>p[1])),high=Math.max(0,...known.map(p=>p[1]));if(high===low)high=low+1;const pad=(high-low)*.08;low-=pad;high+=pad;
  const x=y=>L+(y-minYear)/(maxYear-minYear)*(W-L-R),y=v=>H-B-(v-low)/(high-low)*(H-T-B);
  const root=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':'fiscal-svg-title fiscal-svg-desc'});
  root.append(svg('title',{id:'fiscal-svg-title'},country.name+' — '+measure.title),svg('desc',{id:'fiscal-svg-desc'},'Annual values; source status and exact values are in the table below. Missing years are not connected.'));
  for(let i=0;i<=4;i++){const v=low+(high-low)*i/4;root.append(svg('line',{x1:L,x2:W-R,y1:y(v),y2:y(v),stroke:'var(--rule)'}),svg('text',{x:L-10,y:y(v)+4,'text-anchor':'end','font-size':13},fmt(v)));}
  for(let year=minYear;year<=maxYear;year+=2)root.append(svg('text',{x:x(year),y:H-B+25,'text-anchor':'middle','font-size':13},year));
  const style=status=>status==='reported'?['var(--measured)','']:status==='IMF estimate'?['var(--action)','6 4']:['var(--ink-secondary)','2 5'];
  let previous=null;
  for(const p of points){if(p[1]===null){previous=null;continue;}const [color,dash]=style(p[2].status);
   if(previous&&p[0]===previous[0]+1)root.append(svg('line',{x1:x(previous[0]),y1:y(previous[1]),x2:x(p[0]),y2:y(p[1]),stroke:color,'stroke-width':3,'stroke-dasharray':dash}));
   const dot=svg('circle',{cx:x(p[0]),cy:y(p[1]),r:4,fill:color});dot.append(svg('title',{},p[0]+': '+fmt(p[1])+' '+measure.unit+' · '+p[2].status));root.append(dot);previous=p;
  }
  host.append(root);const legend=node('p',undefined,'outlook-note');legend.textContent=$('outlook-period').value==='all'?'Solid: reported · Dashed: estimate · Dotted: projection':'Reported values · Gaps left blank';host.append(legend);
 }
 function render(){
  country=data.countries.find(c=>c.iso3===$('outlook-country').value);measure=country.metrics.find(m=>m.id===$('outlook-measure').value)||country.metrics[0];
  $('country-name').textContent=country.name;$('profile-link').href=country.filename;$('collection-status').textContent='Latest reported values';
  const cards=$('outlook-metrics');cards.replaceChildren();country.metrics.forEach(m=>{const card=node('article',undefined,'outlook-metric');const labels={'Government revenue':'Revenue','Government expenditure':'Spending','Overall fiscal balance':'Budget balance','Primary fiscal balance':'Primary balance','Gross government debt':'Government debt'};const heading=node('h3');const pick=node('button',labels[m.title]||m.title);pick.type='button';pick.setAttribute('aria-label','View '+m.title+' trend');pick.setAttribute('aria-pressed',m.id===measure.id);pick.addEventListener('click',()=>{$('outlook-measure').value=m.id;render();});heading.append(pick);card.append(heading);if(m.latest){card.append(node('p',fmt(m.latest[1]),'outlook-number'),node('small',m.unit+' · '+m.latest[0]),node('small',2026-m.latest[0]>=3?'Older data':''));}else card.append(node('p','No information','outlook-missing'));cards.append(card);});
  $('outlook-questions').replaceChildren(...['AI budgets and spending','Ongoing operating costs','Evidence of use and results'].map(q=>node('li',q)));
  chart();updateURL();$('outlook-announcement').textContent='';
 }
 function download(){const fields=['country','measure','year','value','unit','status','government_coverage','reporting_year','source_url'];const rows=displayed().map(p=>[country.iso3,measure.title,p[0],p[1]===null?'':p[1],measure.unit,p[2].status,p[2].government_coverage,p[2].reporting_year,measure.source_url]);const csv=[fields,...rows].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download=country.iso3+'-'+measure.id+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 fetch('data/country-outlooks.json').then(r=>{if(!r.ok)throw Error('Data could not be loaded');return r.json();}).then(d=>{
  data=d;data.countries.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>option($('outlook-country'),c.iso3,c.name));data.countries[0].metrics.forEach(m=>option($('outlook-measure'),m.id,m.title+' · '+m.unit));
  $('outlook-country').value=data.countries.some(c=>c.iso3===params.get('country'))?params.get('country'):'NGA';$('outlook-measure').value=data.countries[0].metrics.some(m=>m.id===params.get('measure'))?params.get('measure'):'fiscal-GGXWDG_NGDP';$('outlook-period').value=params.get('period')==='all'?'all':'reported';
  $('outlook-coverage').textContent='54 countries · Six fiscal measures. Missing values stay blank.';
  $('pending-measures').replaceChildren(...data.pending_measures.map(m=>node('li',m)));$('outlook-view').hidden=false;
  ['outlook-country','outlook-measure','outlook-period'].forEach(id=>$(id).addEventListener('change',render));$('download-fiscal').addEventListener('click',download);
  $('outlook-share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('outlook-announcement').textContent='Link copied.';}catch{$('outlook-announcement').textContent='Copy the browser address to save this view.';}});render();
 }).catch(e=>{$('outlook-announcement').textContent='Unable to load the preview data. Open this page through the local preview server. '+e.message;});
})();
