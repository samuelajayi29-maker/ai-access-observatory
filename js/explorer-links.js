/* Preserve previously shared chart selections after moving the workspace. */
(() => {
  if(document.body.dataset.page==='data-explorer.html')return;
  const query=new URLSearchParams(location.search);
  if(!query.has('chart')&&!query.has('preset'))return;
  const context=document.querySelector('.explorer-context-link');
  if(!context)return;
  const url=new URL(context.href);
  query.forEach((value,key)=>url.searchParams.set(key,value));
  url.hash='make-a-chart';location.replace(url.href);
})();
