(() => {
 const node=document.querySelector('#home-facts-data'),card=document.querySelector('.home-fact');if(!node||!card)return;
 const facts=JSON.parse(node.textContent),button=card.querySelector('[data-fact-next]');let bag=[],last=-1;
 function next(){
  if(!bag.length){bag=facts.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag[bag.length-1]===last&&bag.length>1){[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}}
  last=bag.pop();const fact=facts[last];card.querySelectorAll('[data-fact]').forEach(el=>el.textContent=fact[el.dataset.fact]);
  const source=card.querySelector('[data-fact-source]');source.textContent=fact.source;source.href=fact.source_url;
  const link=card.querySelector('[data-fact-link]');link.textContent=fact.link+' →';link.href=fact.href;
  card.querySelector('[data-fact-position]').textContent='A finding from the record · '+facts.length+' available';
 }
 button.hidden=false;button.addEventListener('click',next);next();
 try{if(!sessionStorage.getItem('inferenceafrica-evidence-intro')){document.querySelector('.evidence-wordmark')?.classList.add('lens-intro');sessionStorage.setItem('inferenceafrica-evidence-intro','1');}}catch(e){}
})();
