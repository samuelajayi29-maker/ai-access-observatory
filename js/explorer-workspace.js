/* Load one workspace at a time; old chart and country links remain valid. */
(async () => {
  const host=document.querySelector('[data-workspace]');if(!host)return;
  const status=document.querySelector('[data-workspace-status]'),p=new URLSearchParams(location.search);
  const measureAliases={'evidence-egypt-production-history':'evidence-egypt-mobile-device-production','evidence-kenya-smartphone-history':'evidence-kenya-mobile-connections'};
  const retired=measureAliases[p.get('chart')];if(retired){p.set('chart',retired);p.set('view','charts');history.replaceState(null,'','?'+p.toString()+location.hash);}
  const aliases={records:'charts',history:'compare'};
  let view=aliases[p.get('view')]||p.get('view');
  if(!view)view=p.has('preset')?'charts':p.has('measures')||/-history$/.test(p.get('chart')||'')?'compare':p.has('chart')?'charts':location.hash==='#data-centres'?'facilities':location.hash==='#country-snapshot'?'countries':location.hash==='#explore-projects'?'projects':'compare';
  const allowed=['charts','compare','countries','facilities','projects','downloads'];if(!allowed.includes(view))view='compare';
  document.body.dataset.workspace=view;
  document.querySelectorAll('[data-workspace-tab]').forEach(a=>{if(a.dataset.workspaceTab===view)a.setAttribute('aria-current','page');});
  status.textContent='Loading '+view+'…';
  try {
    const response=await fetch('data/explorer-views/'+view+'.json');if(!response.ok)throw Error('Workspace unavailable');
    host.innerHTML=(await response.json()).html;
    let scopeNotice='';
    if(view==='compare' && p.has('chart')){const node=host.querySelector('#chart-builder-data'),selected=node&&JSON.parse(node.textContent).datasets.find(s=>s.id===p.get('chart'));if(selected && selected.comparison_eligible===false && !(p.get('display')==='line' && selected.history_verified)){const alternative=await fetch('data/explorer-views/charts.json');if(!alternative.ok)throw Error('Chart view unavailable');host.innerHTML=(await alternative.json()).html;view='charts';document.body.dataset.workspace=view;p.set('view',view);history.replaceState(null,'','?'+p.toString()+location.hash);scopeNotice='This measure is shown as individual records because its scope does not support a country comparison.';document.querySelectorAll('[data-workspace-tab]').forEach(a=>{a.removeAttribute('aria-current');if(a.dataset.workspaceTab===view)a.setAttribute('aria-current','page');});}}

    // The shell owns the legacy anchor, not a duplicate fragment heading.
    host.querySelectorAll('#make-a-chart').forEach(e=>e.removeAttribute('id'));
    host.querySelectorAll('.explorer-mode').forEach(e=>e.remove());
    const sources=[];host.querySelectorAll('script[src]').forEach(s=>{sources.push(s.getAttribute('src'));s.remove();});
    if(view==='charts')sources.push('js/chart-builder.js','js/published-presets.js');
    for(const src of [...new Set(sources)])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
    status.textContent=retired?'This saved measure has been consolidated. Its dated observations are shown under the original measure.':scopeNotice;
    if(location.hash && location.hash!=='#make-a-chart')document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch(e) {status.textContent='This view could not load. Please reload, or use the downloads below.';const a=document.createElement('a');a.href='data/chart-catalog.json';a.textContent='Download chart data';host.replaceChildren(a);}
})();
