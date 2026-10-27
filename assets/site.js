const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');
if(menuButton&&nav){
  const closeMenu=()=>{nav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');};
  menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
}
const sessionLinks=[...document.querySelectorAll('[data-session-target]')];
function selectSession(id,scroll=false){
  const target=document.getElementById(id);
  if(!target)return;
  target.open=true;
  sessionLinks.forEach(a=>{const selected=a.dataset.sessionTarget===id;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  if(scroll)requestAnimationFrame(()=>target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
}
sessionLinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const id=a.dataset.sessionTarget;history.replaceState(null,'','#'+id);selectSession(id,true);}));
if(location.hash.startsWith('#session-'))selectSession(location.hash.slice(1));
const expandButton=document.getElementById('expand-sessions');
if(expandButton){expandButton.addEventListener('click',()=>{const sessions=[...document.querySelectorAll('details.session')];const open=sessions.some(d=>!d.open);sessions.forEach(d=>d.open=open);expandButton.textContent=open?'Collapse all −':'Expand all +';expandButton.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});}));
