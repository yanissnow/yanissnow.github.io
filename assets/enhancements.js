(() => {
  'use strict';
  const root=document.body.dataset.root||'';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const readStore=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
  const saveStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const toast=document.querySelector('.site-toast');
  let toastTimer;
  function notify(message){if(!toast)return;toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);}

  function setTheme(theme){document.documentElement.dataset.theme=theme;saveStore('yanis-theme',theme);document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.textContent=theme==='dark'?'☀':'☾';b.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');b.title=theme==='dark'?'Light theme':'Dark theme';});}
  setTheme(document.documentElement.dataset.theme||'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')));

  function snowfall(){
    notify('A little SnowCorp weather. Stay curious. ❄');
    if(reduced.matches)return;
    document.querySelector('.snowfall')?.remove();
    const layer=document.createElement('div');layer.className='snowfall';layer.setAttribute('aria-hidden','true');
    for(let i=0;i<34;i++){const flake=document.createElement('span');flake.textContent=i%3===0?'❄':'·';flake.style.setProperty('--x',(Math.random()*100)+'vw');flake.style.setProperty('--drift',(-65+Math.random()*130)+'px');flake.style.setProperty('--delay',(Math.random()*1.4)+'s');flake.style.setProperty('--duration',(4+Math.random()*2)+'s');flake.style.setProperty('--size',(9+Math.random()*13)+'px');layer.append(flake);}
    document.body.append(layer);setTimeout(()=>layer.remove(),8500);
  }
  document.querySelectorAll('[data-surprise]').forEach(b=>b.addEventListener('click',snowfall));
  let secret='',secretTime=0;

  const palette=document.getElementById('quick-navigation');
  const quickInput=palette?.querySelector('input');
  const quickResults=palette?.querySelector('.quick-results');
  const commands=[
    {label:'Home',hint:'Portfolio',href:root+'index.html'},
    {label:'About Yanis',hint:'About',href:root+'index.html#about'},
    {label:'SnowCorp case study',hint:'Project',href:root+'projects/snowcorp/'},
    {label:'Explore all project evidence',hint:'139 screenshots',href:root+'projects/snowcorp/evidence/'},
    {label:'Watch the lab recordings',hint:'9 videos',href:root+'projects/snowcorp/evidence/?kind=video'},
    {label:'Read the project documents',hint:'Reports & CSV files',href:root+'projects/snowcorp/evidence/?kind=document'},
    ...['Build the virtual machines','Network and ping troubleshooting','Active Directory and DNS','Join the domain','Employees and department groups','Share and NTFS permissions','Password and lockout policies','Security events and PowerShell','Backup and restore','Final report and presentation'].map((label,i)=>({label:`Session ${i+1} · ${label}`,hint:'Walkthrough',href:root+'projects/snowcorp/#session-'+(i+1)}))
  ];
  function renderQuick(){
    if(!quickResults)return;
    const q=quickInput.value.toLowerCase().trim();const matches=commands.filter(c=>(c.label+' '+c.hint).toLowerCase().includes(q)).slice(0,10);quickResults.replaceChildren();
    if(!matches.length){const p=document.createElement('p');p.className='quick-empty';p.textContent='No matching page. Try “permissions”, “videos” or a session number.';quickResults.append(p);return;}
    matches.forEach(c=>{const a=document.createElement('a');a.href=c.href;const label=document.createElement('span');label.textContent=c.label;const hint=document.createElement('small');hint.textContent=c.hint+' ↗';a.append(label,hint);a.addEventListener('click',()=>palette.close());quickResults.append(a);});
  }
  function openQuick(){if(!palette)return;quickInput.value='';renderQuick();if(!palette.open)palette.showModal();quickInput.focus();}
  document.querySelectorAll('[data-open-quick]').forEach(b=>b.addEventListener('click',openQuick));
  if(palette){
    quickInput.addEventListener('input',renderQuick);
    quickInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(['let it snow','snowfall'].includes(quickInput.value.toLowerCase().trim())){palette.close();snowfall();}else quickResults.querySelector('a')?.click();}if(e.key==='ArrowDown'){e.preventDefault();quickResults.querySelector('a')?.focus();}});
    quickResults.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();const links=[...quickResults.querySelectorAll('a')];const i=links.indexOf(document.activeElement);if(e.key==='ArrowUp'&&i<=0){quickInput.focus();return;}links[(i+(e.key==='ArrowDown'?1:-1)+links.length)%links.length]?.focus();});
    palette.querySelector('[data-close-quick]').addEventListener('click',()=>palette.close());
    palette.addEventListener('click',e=>{if(e.target===palette)palette.close();});
  }
  document.addEventListener('keydown',e=>{
    const typing=e.target instanceof Element&&Boolean(e.target.closest('input,textarea,[contenteditable=true]'));
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openQuick();return;}
    if(!typing&&e.key==='/'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();openQuick();return;}
    if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key.length===1){if(Date.now()-secretTime>1800)secret='';secretTime=Date.now();secret=(secret+e.key.toLowerCase()).slice(-4);if(secret==='snow'){secret='';snowfall();}}
  });

  const readButtons=[...document.querySelectorAll('[data-mark-read]')];
  const savedReading=readStore('yanis-snowcorp-reading',[]);
  const readSet=new Set((Array.isArray(savedReading)?savedReading:[]).map(String));
  function renderReading(){
    readButtons.forEach(b=>{const yes=readSet.has(b.dataset.markRead);b.setAttribute('aria-pressed',String(yes));b.textContent=yes?'✓ Read':'Mark as read';});
    const n=[...readSet].filter(x=>/^([1-9]|10)$/.test(x)).length;
    const count=document.getElementById('reading-count');if(count)count.textContent=n+' / 10';
    const bar=document.getElementById('reading-bar');if(bar){bar.style.width=(n*10)+'%';bar.parentElement.setAttribute('aria-valuenow',String(n));}
    document.querySelectorAll('[data-session-target]').forEach(a=>a.classList.toggle('is-read',readSet.has(a.dataset.sessionTarget.replace('session-',''))));
  }
  readButtons.forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.markRead;if(readSet.has(n))readSet.delete(n);else readSet.add(n);saveStore('yanis-snowcorp-reading',[...readSet]);renderReading();if(readSet.size===10)notify('All ten sessions explored. Thanks for following the work.');}));
  document.querySelector('[data-reset-reading]')?.addEventListener('click',()=>{readSet.clear();saveStore('yanis-snowcorp-reading',[]);renderReading();notify('Reading progress reset.');});renderReading();

  const items=[...document.querySelectorAll('[data-archive-item]')];
  const search=document.getElementById('evidence-search');const sessionFilter=document.getElementById('evidence-session');
  const kindButtons=[...document.querySelectorAll('[data-kind-filter]')];
  const params=new URLSearchParams(location.search);
  let kind=['all','image','video','document'].includes(params.get('kind'))?params.get('kind'):'image';
  let shown=18;
  if(sessionFilter&&[...sessionFilter.options].some(o=>o.value===params.get('session')))sessionFilter.value=params.get('session');
  function filterArchive(){
    if(!items.length)return;
    const q=(search?.value||'').toLowerCase().trim();const s=sessionFilter?.value||'all';let count=0,visible=0;
    items.forEach(card=>{const match=(kind==='all'||card.dataset.kind===kind)&&(s==='all'||card.dataset.sessions.split(' ').includes(s)||card.dataset.sessions==='all')&&card.dataset.search.includes(q);card.dataset.matches=String(match);if(match){count++;card.hidden=visible>=shown;visible++;}else card.hidden=true;if(card.hidden)card.querySelector('video')?.pause();});
    kindButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kindFilter===kind)));
    const result=document.getElementById('evidence-count');if(result)result.textContent=`Showing ${Math.min(shown,count)} of ${count} matching files`;
    const more=document.getElementById('load-evidence');if(more){more.hidden=count<=shown;more.textContent=`Show ${Math.min(18,count-shown)} more files ↓`;}
    document.getElementById('evidence-empty')?.toggleAttribute('hidden',count!==0);
  }
  kindButtons.forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kindFilter;shown=18;filterArchive();}));
  search?.addEventListener('input',()=>{shown=18;filterArchive();});sessionFilter?.addEventListener('change',()=>{shown=18;filterArchive();});
  document.getElementById('load-evidence')?.addEventListener('click',()=>{shown+=18;filterArchive();});
  document.querySelector('[data-clear-filters]')?.addEventListener('click',()=>{kind='all';if(search)search.value='';if(sessionFilter)sessionFilter.value='all';shown=18;filterArchive();});filterArchive();

  const dialog=document.getElementById('evidence-dialog');let currentPicture=null;
  function pictures(){return[...document.querySelectorAll('[data-evidence-image]')].filter(b=>b.closest('[data-archive-item]')?.dataset.matches!=='false');}
  function showPicture(button){
    if(!dialog||!button)return;currentPicture=button;
    const image=dialog.querySelector('img');image.src=button.dataset.evidenceImage;image.alt=button.dataset.evidenceAlt||'';
    dialog.querySelector('[data-dialog-title]').textContent=button.dataset.evidenceTitle||'Lab evidence';dialog.querySelector('p').textContent=button.dataset.evidenceCaption||'';
    const list=pictures();const index=list.indexOf(button);const count=dialog.querySelector('[data-dialog-count]');if(count)count.textContent=`${index+1} / ${list.length}`;
    const download=dialog.querySelector('[data-dialog-download]');if(download)download.href=image.getAttribute('src');
    if(!dialog.open)dialog.showModal();
  }
  function movePicture(delta){const list=pictures();const index=list.indexOf(currentPicture);showPicture(list[(index+delta+list.length)%list.length]);}
  if(dialog){
    document.querySelectorAll('[data-evidence-image]').forEach(b=>b.addEventListener('click',()=>showPicture(b)));
    dialog.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-dialog-prev]')?.addEventListener('click',()=>movePicture(-1));dialog.querySelector('[data-dialog-next]')?.addEventListener('click',()=>movePicture(1));
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();movePicture(1);}if(e.key==='ArrowLeft'){e.preventDefault();movePicture(-1);}});
  }

  const progress=document.querySelector('.page-progress span');const topButton=document.querySelector('[data-back-top]');let scrollTick=false;
  function scrollUI(){const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=(max>0?scrollY/max*100:0)+'%';if(topButton)topButton.hidden=scrollY<650;scrollTick=false;}
  addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(scrollUI);}},{passive:true});scrollUI();
  topButton?.addEventListener('click',()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));
  document.querySelectorAll('details.session').forEach(d=>d.addEventListener('toggle',()=>{if(d.open&&!reduced.matches)d.querySelector('.session-body').animate([{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}));
  if('IntersectionObserver'in window&&!reduced.matches){
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target);}}),{threshold:.06});
    document.querySelectorAll('.project-feature,.practice-row,.evidence-card,.video-card,.artifact,.archive-card').forEach(e=>{e.classList.add('reveal');observer.observe(e);});
  }
  const blueprint=document.querySelector('.blueprint');
  if(blueprint&&!reduced.matches&&matchMedia('(hover:hover)').matches){blueprint.addEventListener('pointermove',e=>{const b=blueprint.getBoundingClientRect();blueprint.style.transform=`perspective(900px) rotateX(${-(e.clientY-b.top-b.height/2)/90}deg) rotateY(${(e.clientX-b.left-b.width/2)/90}deg)`;});blueprint.addEventListener('pointerleave',()=>blueprint.style.transform='');}
  document.querySelector('[data-disabled-only]')?.addEventListener('change',e=>{document.querySelectorAll('[data-user-enabled]').forEach(row=>row.hidden=e.target.checked&&row.dataset.userEnabled==='true');});
})();
