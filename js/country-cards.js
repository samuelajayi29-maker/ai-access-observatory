(() => {
  const node=document.getElementById('country-snapshot-data');if(!node)return;
  const payload=JSON.parse(node.textContent);let cards=payload.cards;
  const select=document.querySelector('[data-snapshot-country]'),preview=document.querySelector('[data-snapshot-preview]'),status=document.querySelector('[data-snapshot-status]');
  let current=cards.find(c=>c.iso3===select.value)||cards[0];
  const shortcut=document.querySelector('.resource-shortcut');if(shortcut){const link=document.createElement('a');link.href='#country-snapshot';link.textContent='Download a country snapshot ↓';link.style.marginInlineStart='1.5rem';shortcut.appendChild(link);}
  async function update(){if(payload.url && !cards.some(c=>c.iso3===select.value)){status.textContent='Loading country snapshot…';try{const response=await fetch(payload.url);if(!response.ok)throw Error();cards=(await response.json()).cards;}catch(_){status.textContent='Could not load this country. Reload to try again.';return;}}current=cards.find(c=>c.iso3===select.value);preview.innerHTML=current.svg;for(const ext of ['svg','csv'])document.querySelector('[data-snapshot-'+ext+']').href='charts/countries/'+current.stem+'.'+ext;document.querySelector('[data-snapshot-profile]').href=current.filename;status.textContent='';}
  select.addEventListener('change',update);
  document.querySelector('[data-snapshot-png]').addEventListener('click',async event=>{
    const button=event.currentTarget,card=current;button.disabled=true;select.disabled=true;status.textContent='Preparing image…';let url;
    try{
      url=URL.createObjectURL(new Blob([card.svg],{type:'image/svg+xml;charset=utf-8'}));
      const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Image could not be prepared.'));img.src=url;});
      const canvas=document.createElement('canvas');canvas.width=2160;canvas.height=2700;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PNG is unavailable in this browser.');ctx.drawImage(img,0,0,2160,2700);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG could not be created.');
      const download=URL.createObjectURL(blob),a=document.createElement('a');a.href=download;a.download=card.stem+'-inferenceafrica-snapshot.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(download),10000);
      status.textContent=card.name+' image prepared. Sources and dates are included.';
    }catch(error){status.textContent=error.message+' You can still download the SVG.';}
    finally{if(url)URL.revokeObjectURL(url);button.disabled=false;select.disabled=false;}
  });
})();
