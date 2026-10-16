/* Shared country context and restrained, progressive interaction feedback. */
(() => {
  'use strict';
  const key='inferenceafrica-country', params=new URLSearchParams(location.search);
  let saved=null, countries=[], bar=null, status=null, feedbackTimer, chosen=false;
  try { saved=JSON.parse(sessionStorage.getItem(key)||'null'); } catch (_) {}
  const requested=params.get('country') || (saved && saved.iso);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reveal(node) {
    if(!node || reduced() || !node.animate)return;
    node.getAnimations().forEach(a=>a.cancel());
    node.animate([{transform:'translateY(6px)',opacity:.6},{transform:'translateY(0)',opacity:1}],{duration:260,easing:'cubic-bezier(.2,0,0,1)'});
  }
  function current(){return saved;}
  function paint(){
    if(!bar)return;
    bar.hidden=!saved;
    if(!saved)return;
    bar.querySelector('[data-journey-name]').textContent=saved.name;
    bar.querySelectorAll('[data-journey-page]').forEach(a=>{
      const url=new URL(a.dataset.journeyPage,location.href);url.searchParams.set('country',saved.iso);
      if(a.dataset.journeyPage==='data-explorer.html'){url.searchParams.set('view','compare');url.searchParams.set('countries',saved.iso);url.hash='make-a-chart';}
      a.href=url.pathname+url.search+url.hash;
    });
    const profile=bar.querySelector('[data-journey-profile]'),row=countries.find(c=>c.iso3===saved.iso);
    profile.href=row ? row.filename : 'countries.html';
  }
  function select(iso,name){
    if(!/^[A-Z]{3}$/.test(iso))return;
    const row=countries.find(c=>c.iso3===iso);if(countries.length&&!row)return;
    saved={iso,name:row?.name||name||iso};
    chosen=true;
    try{sessionStorage.setItem(key,JSON.stringify(saved));}catch(_){}
    if(/^(access|jobs|infrastructure)\.html$/.test(document.body.dataset.page||'')){
      const url=new URL(location.href);url.searchParams.set('country',iso);
      try{history.replaceState(null,'',url.pathname+url.search+url.hash);}catch(_){}
    }
    paint();document.dispatchEvent(new CustomEvent('ia:country',{detail:saved}));
  }
  function notify(text){if(status){clearTimeout(feedbackTimer);status.textContent='';requestAnimationFrame(()=>{status.textContent=text;reveal(status);feedbackTimer=setTimeout(()=>{status.textContent='';},4200);});}}
  const ready=fetch('data/country-navigation.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    countries=data.countries;
    const own=countries.find(c=>c.filename===location.pathname.split('/').pop());
    const initial=own || countries.find(c=>c.iso3===(chosen?saved?.iso:requested));
    saved=initial ? {iso:initial.iso3,name:initial.name} : null;
    if(saved)try{sessionStorage.setItem(key,JSON.stringify(saved));}catch(_){}
    paint();return countries;
  }).catch(()=>{saved=/^[A-Z]{3}$/.test(requested||'') ? saved : null;paint();return [];});
  window.IAExperience={select,current,reveal,notify,ready};
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)document.getAnimations().forEach(animation=>animation.cancel());});
  function start(){
    const main=document.querySelector('main');if(!main)return;
    bar=document.createElement('nav');bar.className='wrap country-journey';bar.setAttribute('aria-label','Continue exploring this country');bar.hidden=true;
    bar.innerHTML='<div class="country-journey__context"><span>Exploring</span> <strong data-journey-name></strong></div><div class="country-journey__links"><a data-journey-profile>Profile</a><a data-journey-page="access.html">Access</a><a data-journey-page="jobs.html">Jobs</a><a data-journey-page="infrastructure.html">Infrastructure</a><a data-journey-page="data-explorer.html">Compare</a><button type="button" data-journey-clear>Clear country</button></div>';
    main.prepend(bar);bar.querySelector('button').onclick=()=>{
      saved=null;try{sessionStorage.removeItem(key);}catch(_){}paint();
      const url=new URL(location.href);url.searchParams.delete('country');
      try{history.replaceState(null,'',url.pathname+url.search+url.hash);}catch(_){}
      notify('Country focus cleared for your next page.');
    };
    status=document.createElement('p');status.className='interaction-feedback';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);paint();
    ready.then(()=>{
      if(!saved)return;
      const input=document.querySelector('[data-access-country],[data-infra-country]');
      if(input && [...input.options].some(o=>o.value===saved.iso)){input.value=saved.iso;input.dispatchEvent(new Event('change',{bubbles:true}));}
      document.dispatchEvent(new CustomEvent('ia:ready',{detail:saved}));
    });
    document.addEventListener('change',event=>{
      const input=event.target;
      if(input.matches('[data-access-country],[data-infra-country],[data-snapshot-country]') && /^[A-Z]{3}$/.test(input.value))select(input.value,input.selectedOptions[0].textContent);
    });
    // Native disclosures retain their keyboard behavior; motion only follows opening.
    document.addEventListener('toggle',event=>{if(event.target.tagName==='DETAILS'&&event.target.open)reveal(event.target);},true);
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[download],.dl a,.download-line a');
      if(link && /\.(csv|svg|png|xlsx)(?:[?#]|$)/i.test(link.getAttribute('href')||''))notify('Opening '+(link.getAttribute('href').split('.').pop().split(/[?#]/)[0].toUpperCase())+' download.');
    });
    // Animate changes only, leaving published figures and exported values intact.
    const sections=document.querySelectorAll('.access-explorer__grid,[data-infra-panel],.country-detail');
    sections.forEach(section=>{
      let queued=false;
      new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(!section.hidden)reveal(section);});}).observe(section,{childList:true,characterData:true,subtree:true});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
