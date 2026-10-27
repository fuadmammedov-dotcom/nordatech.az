'use strict';
(() => {
  const data = JSON.parse(document.querySelector('#site-data').textContent);
  const u = data.ui;
  if(document.body.dataset.page==='home'&&['#about','#contact','#techizat'].includes(location.hash)){const legacy={about:'about',contact:'contact',techizat:'catalog'}[location.hash.slice(1)];location.replace(legacy+(data.language==='az'?'':'.'+data.language)+'.html');}
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
  const themeButton = $('#theme-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme:dark)');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-label',dark ? u.light : u.dark);
    themeButton.title = dark ? u.light : u.dark;
    themeButton.setAttribute('aria-pressed',String(dark));
    themeButton.querySelector('use').setAttribute('href',dark ? '#i-sun' : '#i-moon');
    $('meta[name="theme-color"]').content = dark ? '#0b1322' : '#0751ed';
  }
  applyTheme(document.documentElement.dataset.theme || 'light');
  themeButton.addEventListener('click',() => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next); write('norda-theme',next); });
  systemTheme.addEventListener?.('change',e => { if (!read('norda-theme')) applyTheme(e.matches ? 'dark' : 'light'); });

  const menuButton = $('.menu-toggle'), navigation = $('#main-navigation');
  function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label',u.menuOpen); }
  menuButton.addEventListener('click',() => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; navigation.classList.toggle('open',open); menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open ? u.menuClose : u.menuOpen); });
  navigation.addEventListener('click',e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('pointerdown',e => { if (!navigation.contains(e.target) && !menuButton.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown',e => { if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
  window.addEventListener('resize',() => { if (innerWidth > 1050) closeMenu(); },{passive:true});

  const itemMap = new Map();
  for (const c of data.catalog) {
    itemMap.set(`cat|${c.id}`,{key:`cat|${c.id}`,category:c.id,name:c.name,categoryName:c.name});
    c.products.forEach((name,index) => itemMap.set(`item|${c.id}|${index}`,{key:`item|${c.id}|${index}`,category:c.id,name,categoryName:c.name}));
  }
  const selectionKey = 'norda-selection-v2';
  function loadSelection() {
    try {
      const raw = JSON.parse(read(selectionKey) || '[]');
      if (!Array.isArray(raw)) return [];
      const valid = new Map();
      for (const item of raw.slice(0,120)) if (item && itemMap.has(item.key)) valid.set(item.key,{key:item.key,quantity:Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99999 ? item.quantity : 1});
      return [...valid.values()];
    } catch { return []; }
  }
  let selected = loadSelection(), toastTimer, quoteTrigger, privacyTrigger;
  const dialog = $('#quote-dialog'), form = $('#quote-form'), status = $('#form-status');
  const toast = $('.toast');
  function saveSelection() { write(selectionKey,JSON.stringify(selected)); }
  function announce(message) { toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; },2800); }
  function syncSelection() {
    document.querySelectorAll('[data-add]').forEach(button => {
      const enabled = selected.some(item => item.key === button.dataset.add);
      button.setAttribute('aria-pressed',String(enabled));
      button.querySelector('span').textContent = enabled ? u.added : u.add;
      button.querySelector('use').setAttribute('href',enabled ? '#i-check' : '#i-plus');
      button.setAttribute('aria-label',`${enabled ? u.remove : u.add}: ${itemMap.get(button.dataset.add)?.name || ''}`);
    });
    document.querySelectorAll('.selection-count').forEach(el => { el.hidden = selected.length === 0; el.textContent = String(selected.length); });
    if (selected.length) form.elements.details.setCustomValidity('');
  }
  function renderSelection() {
    if ($('#draft-preview-panel')) $('#draft-preview-panel').hidden=true;
    $('.selection-total').textContent = selected.length ? String(selected.length) : '';
    $('.quote-items').innerHTML = selected.length ? selected.map(item => {
      const info = itemMap.get(item.key);
      return `<div class="quote-row" data-row="${item.key}"><div><strong>${escape(info.name)}</strong>${info.name !== info.categoryName ? `<small>${escape(info.categoryName)}</small>` : ''}</div><label class="quantity-label"><span>${escape(u.quantity)}</span><input type="number" inputmode="numeric" min="1" max="99999" step="1" required data-quantity="${item.key}" value="${item.quantity}" aria-label="${escape(u.quantityFor.replace('{name}',info.name))}"></label><button class="icon-button remove-item" type="button" data-remove="${item.key}" aria-label="${escape(u.remove+': '+info.name)}">${icon('close')}</button></div>`;
    }).join('') : `<div class="empty-selection"><p>${escape(u.emptySelection)}</p><a href="${escape(data.catalogHref)}">${escape(u.explore)} →</a></div>`;
  }
  function toggleItem(key) {
    if (!itemMap.has(key)) return;
    const exists = selected.some(item => item.key === key), info = itemMap.get(key);
    if (exists) selected = selected.filter(item => item.key !== key);
    else {
      if (key.startsWith('item|')) selected = selected.filter(item => item.key !== `cat|${info.category}`);
      else selected = selected.filter(item => itemMap.get(item.key).category !== info.category);
      selected.push({key,quantity:1});
    }
    saveSelection(); syncSelection(); if (document.body.dataset.page === 'request') renderSelection();
    announce((exists ? u.toastRemoved : u.toastAdded).replace('{name}',info.name));
  }
  function openQuote(trigger) {
    quoteTrigger = trigger;
    const category = trigger?.dataset.category;
    if (category && itemMap.has(`cat|${category}`) && !selected.some(item => itemMap.get(item.key).category === category)) { selected.push({key:`cat|${category}`,quantity:1}); saveSelection(); }
    if (trigger?.dataset.source === 'international') form.elements.source.value = 'international';
    status.textContent = ''; renderSelection(); syncSelection(); closeMenu();
    if (!dialog) { $('#quote-title').scrollIntoView({behavior:'smooth',block:'start'}); $('#quote-title').focus({preventScroll:true}); return; }
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }
  document.addEventListener('click',e => {
    const add = e.target.closest('[data-add]'); if (add) { toggleItem(add.dataset.add); return; }
    const quote = e.target.closest('[data-quote]'); if (quote) openQuote(quote);
  });
  $('.close-quote')?.addEventListener('click',() => dialog.close());
  dialog?.addEventListener('close',() => { document.body.classList.remove('modal-open'); quoteTrigger?.focus(); });
  dialog?.addEventListener('click',e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); });
  $('.quote-items').addEventListener('click',e => { const button = e.target.closest('[data-remove]'); if (!button) return; const index = selected.findIndex(item => item.key === button.dataset.remove); selected = selected.filter(item => item.key !== button.dataset.remove); saveSelection(); syncSelection(); renderSelection(); const next = $('.quote-items').querySelectorAll('.remove-item'); (next[Math.min(index,next.length-1)] || $('#quote-title')).focus(); });
  $('.quote-items').addEventListener('input',e => { if (!e.target.matches('[data-quantity]')) return; const input = e.target; if (!input.validity.valid) return; const item = selected.find(item => item.key === input.dataset.quantity); if (item) { item.quantity = Number(input.value); saveSelection(); } });
  form.addEventListener('input',e => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); form.elements.details.setCustomValidity(''); status.textContent = ''; if ($('#draft-preview-panel')) $('#draft-preview-panel').hidden=true; });
  function validRequest() {
    for (const name of ['company','person','contact']) {
      const field = form.elements[name]; field.setCustomValidity(field.value.trim() ? '' : u.required);
    }
    const contact = form.elements.contact.value.trim();
    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !(/^[+()\d\s-]+$/.test(contact) && contact.replace(/\D/g,'').length >= 7)) form.elements.contact.setCustomValidity(u.invalidContact);
    if (!selected.length && !form.elements.details.value.trim() && !form.elements.partnumber.value.trim()) form.elements.details.setCustomValidity(u.missingRequest);
    return form.reportValidity();
  }
  function draft() {
    const source = form.elements.source.selectedOptions[0].textContent;
    return [u.draftTitle,'',`${u.company}: ${form.elements.company.value.trim()}`,`${u.person}: ${form.elements.person.value.trim()}`,`${u.contactField}: ${form.elements.contact.value.trim()}`,'',u.draftCategory,...selected.map((item,index) => `${index+1}. ${item.quantity} × ${itemMap.get(item.key).name}`),...(form.elements.partnumber.value.trim() ? [`${u.partnumber}: ${form.elements.partnumber.value.trim()}`] : []),'',`${u.draftSource}: ${source}`,'',u.draftNotes,form.elements.details.value.trim(),'',u.draftOrigin].join('\n');
  }
  form.addEventListener('submit',e => {
    e.preventDefault(); if (!validRequest()) return;
    const text = draft(), channel = e.submitter?.value || 'whatsapp';
    if (channel === 'preview') {
      $('#draft-preview-panel').hidden=false; $('#draft-preview').textContent=text; $('#draft-preview-panel').scrollIntoView({behavior:'smooth',block:'nearest'}); return;
    } else if (channel === 'download') {
      const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
      const a = document.createElement('a'); a.href = url; a.download = 'norda-supply-request.txt'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),10000); status.textContent = u.downloaded;
    } else if (channel === 'email') {
      location.href = `mailto:${data.company.email}?subject=${encodeURIComponent(u.draftTitle+' — '+form.elements.company.value.trim())}&body=${encodeURIComponent(text)}`; status.textContent = u.preparedEmail;
    } else {
      window.open(`${data.company.whatsapp}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer'); status.textContent = u.preparedWhatsapp;
    }
  });
  window.addEventListener('storage',e => { if (e.key === selectionKey) { selected = loadSelection(); syncSelection(); if (dialog?.open || document.body.dataset.page === 'request') renderSelection(); } });
  syncSelection();
  if (document.body.dataset.page === 'request') { renderSelection(); const params = new URLSearchParams(location.search); if (params.get('source') === 'international') form.elements.source.value = 'international'; $('.quote-extra').open = true; }

  const search = $('#catalog-search');
  if (search) {
    const normalise = text => String(text).toLocaleLowerCase(data.language).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ı/g,'i');
    let group = new URLSearchParams(location.search).get('group') || 'all'; if (!['all','workplace','infrastructure','security','collaboration','software'].includes(group)) group = 'all'; document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===group)));
    function filter() {
      const query = normalise(search.value.trim()); let count = 0;
      document.querySelectorAll('.searchable-grid [data-category]').forEach(card => { const item = data.catalog.find(c => c.id === card.dataset.category); const show = (group === 'all' || item.group === group) && normalise(item.search).includes(query); card.hidden = !show; if (show) count++; });
      $('.search-count').textContent = u.resultCount.replace('{count}',count);
      $('.empty-search').hidden = count > 0;
    }
    search.addEventListener('input',filter);
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => { group = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b === button))); filter(); }));
    $('#reset-search').addEventListener('click',() => { group = 'all'; search.value = ''; document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.filter === 'all'))); filter(); search.focus(); });
    search.value = new URLSearchParams(location.search).get('q') || ''; filter();
  }
  const privacy = $('#privacy-dialog');
  $('.privacy-open').addEventListener('click',e => { privacyTrigger = e.currentTarget; privacy.showModal(); document.body.classList.add('modal-open'); });
  $('.close-privacy').addEventListener('click',() => privacy.close());
  privacy.addEventListener('close',() => { document.body.classList.remove('modal-open'); privacyTrigger?.focus(); });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  const mega=$('#product-menu'),megaToggle=$('.nav-products'),companyMenu=$('.nav-company');
  function closeMega(){mega.hidden=true;megaToggle.setAttribute('aria-expanded','false');}
  megaToggle.addEventListener('click',e=>{const open=mega.hidden;mega.hidden=!open;megaToggle.setAttribute('aria-expanded',String(open));companyMenu.open=false;if(open&&e.detail===0)mega.querySelector('a').focus();});
  $('.mega-close').addEventListener('click',()=>{closeMega();megaToggle.focus();});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.site-header')){closeMega();companyMenu.open=false;}});
  companyMenu.addEventListener('toggle',()=>{if(companyMenu.open)closeMega();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const wasOpen=!mega.hidden,companyWasOpen=companyMenu.open;closeMega();companyMenu.open=false;if(wasOpen)(innerWidth<1180?menuButton:megaToggle).focus();else if(companyWasOpen)(innerWidth<1180&&menuButton.getAttribute('aria-expanded')==='false'?menuButton:companyMenu.querySelector('summary')).focus();}});
  navigation.addEventListener('click',e=>{if(e.target.closest('a')){closeMega();companyMenu.open=false;}});
  menuButton.addEventListener('click',()=>{if(menuButton.getAttribute('aria-expanded')==='false')closeMega();document.body.classList.toggle('nav-open',menuButton.getAttribute('aria-expanded')==='true');});
  new MutationObserver(()=>{if(menuButton.getAttribute('aria-expanded')==='false')document.body.classList.remove('nav-open');}).observe(menuButton,{attributes:true,attributeFilter:['aria-expanded']});

  const normalise=v=>String(v).toLocaleLowerCase(data.language).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ı/g,'i');
  const siteSearch=$('#search-dialog'),siteSearchInput=$('#site-search-input'),searchResults=$('#site-search-results'),quickMarkup=searchResults.innerHTML;
  let searchTrigger;
  function openSearch(trigger){searchTrigger=trigger;closeMega();closeMenu();siteSearch.showModal();document.body.classList.add('modal-open');siteSearchInput.focus();}
  $('.search-toggle').addEventListener('click',e=>openSearch(e.currentTarget));
  $('.close-search').addEventListener('click',()=>siteSearch.close());
  siteSearch.addEventListener('close',()=>{document.body.classList.remove('modal-open');searchTrigger?.focus();});
  siteSearch.addEventListener('click',e=>{if(e.target!==siteSearch)return;const r=siteSearch.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)siteSearch.close();});
  siteSearchInput.addEventListener('input',()=>{const q=normalise(siteSearchInput.value.trim());if(!q){searchResults.innerHTML=quickMarkup;return;}const found=data.searchItems.filter(r=>normalise(r.title+' '+r.terms).includes(q)).slice(0,9),brands=data.brands.filter(n=>normalise(n).includes(q)).slice(0,4).map(n=>({title:n,href:data.brandHref+'?q='+encodeURIComponent(n)}));const rows=[...found,...brands];searchResults.innerHTML=rows.length?rows.map(r=>`<a href="${escape(r.href)}">${escape(r.title)}${icon('arrow')}</a>`).join(''):`<p class="search-empty">${escape(u.noResults)}</p><a href="${escape(data.requestHref)}">${escape(data.experience.requestHelper)}${icon('arrow')}</a>`;});
  siteSearchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){const link=searchResults.querySelector('a');if(link){e.preventDefault();link.click();}}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!document.querySelector('dialog[open]')){e.preventDefault();openSearch($('.search-toggle'));}});

  const brandSearch=$('#brand-search');
  if(brandSearch){let group='all';const brandFilter=()=>{const q=normalise(brandSearch.value.trim()),found=new Set();document.querySelectorAll('[data-brand-group]').forEach(section=>{let count=0;section.querySelectorAll('[data-brand]').forEach(row=>{const show=(group==='all'||section.dataset.brandGroup===group)&&normalise(row.dataset.brand).includes(q);row.hidden=!show;if(show){count++;found.add(row.dataset.brand);}});section.hidden=!count;});$('.brand-result-count').textContent=data.experience.brandCount.replace('{count}',found.size);$('.brand-empty').hidden=found.size>0;};brandSearch.value=new URLSearchParams(location.search).get('q')||'';brandSearch.addEventListener('input',brandFilter);document.querySelectorAll('[data-brand-filter]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.brandFilter;document.querySelectorAll('[data-brand-filter]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));brandFilter();}));brandFilter();}

  document.documentElement.classList.add('motion-ready');
  const countUp=el=>{const end=Number(el.dataset.count),start=performance.now();function frame(now){const p=Math.min(1,(now-start)/1100);el.textContent=String(Math.round(end*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);};
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');entry.target.querySelectorAll('[data-count]').forEach(countUp);if(entry.target.matches('[data-count]'))countUp(entry.target);observer.unobserve(entry.target);});},{threshold:.08,rootMargin:'0px 0px -25px 0px'});document.querySelectorAll('.section-heading,.catalog-card,.workflow-grid article,.why-grid article,.stats-grid,.guide-card,.global-grid>div,.scope-grid article,.international-steps article,.sector-grid article,.product-card,.category-help,.brand-grid article,.contact-primary,.channel-grid>a,.about-layout>div,.prose>section,.request-card').forEach((el,i)=>{el.classList.add('reveal');el.style.setProperty('--delay',(i%4)*65+'ms');observer.observe(el);});}

  const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  let queued=false;const hero=$('.hero'),stage=$('.hero-stage'),workflow=$('.workflow-section');
  function onScroll(){const range=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${range>0?Math.min(1,scrollY/range):0})`;$('.site-header').classList.toggle('is-scrolled',scrollY>20);if(hero&&stage){const r=hero.getBoundingClientRect(),p=Math.min(1,Math.max(0,-r.top/r.height));stage.style.setProperty('--scroll-shift',p*-65+'px');}if(workflow){const r=workflow.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height*.3)));workflow.style.setProperty('--process-progress',p);}queued=false;}
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(onScroll);}},{passive:true});window.addEventListener('resize',onScroll,{passive:true});onScroll();
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){document.querySelectorAll('[data-tilt],.hero-stage').forEach(el=>{let id=0,x=0,y=0;el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;if(!id)id=requestAnimationFrame(()=>{el.style.setProperty('--tilt-x',(-y*5)+'deg');el.style.setProperty('--tilt-y',(x*5)+'deg');el.style.setProperty('--spot-x',(x+.5)*100+'%');el.style.setProperty('--spot-y',(y+.5)*100+'%');id=0;});},{passive:true});el.addEventListener('pointerleave',()=>{cancelAnimationFrame(id);id=0;el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});});}

  if(stage){const buttons=[...stage.querySelectorAll('[data-scene]')];let current=0,timer=0,inView=true,interacting=false;function scene(i){current=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));stage.dataset.active=String(i);stage.querySelector('[data-scene-title]').textContent=buttons[i].dataset.title;stage.querySelector('.stage-category').href=buttons[i].dataset.link;stage.querySelector('[data-scene-number]').textContent=String(i+1).padStart(2,'0');stage.querySelectorAll('[data-satellite]').forEach((el,j)=>el.classList.toggle('active',i===j));}function schedule(){clearTimeout(timer);if(!document.hidden&&inView&&!interacting)timer=setTimeout(()=>{scene((current+1)%buttons.length);schedule();},4800);}buttons.forEach((b,i)=>b.addEventListener('click',()=>{scene(i);schedule();}));stage.addEventListener('pointerenter',()=>{interacting=true;clearTimeout(timer);});stage.addEventListener('pointerleave',()=>{interacting=false;schedule();});stage.addEventListener('focusin',()=>{interacting=true;clearTimeout(timer);});stage.addEventListener('focusout',e=>{if(!stage.contains(e.relatedTarget)){interacting=false;schedule();}});document.addEventListener('visibilitychange',schedule);if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();}).observe(stage);scene(0);schedule();}

  if(hero){const canvas=document.createElement('canvas');canvas.className='tech-field';canvas.setAttribute('aria-hidden','true');hero.prepend(canvas);const ctx=canvas.getContext('2d');if(ctx){let width=0,height=0,frame=0,last=0,inView=true,nodes=[];function resize(){const r=hero.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);nodes=Array.from({length:width<760?23:60},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.7,r:Math.random()*1.4+1}));}function paint(now){frame=0;if(document.hidden||!inView)return;frame=requestAnimationFrame(paint);if(now-last<32)return;const d=Math.min((now-last)/33,2)||1;last=now;ctx.clearRect(0,0,width,height);const limit=width<760?100:165;for(let i=0;i<nodes.length;i++){const a=nodes[i];a.x+=a.vx*d;a.y+=a.vy*d;if(a.x<0)a.x=width;if(a.x>width)a.x=0;if(a.y<0)a.y=height;if(a.y>height)a.y=0;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fillStyle='rgba(111,180,255,.65)';ctx.fill();for(let j=i+1;j<nodes.length;j++){const b=nodes[j],dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist<limit){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(86,159,255,${(1-dist/limit)*.28})`;ctx.lineWidth=.7;ctx.stroke();}}}}function resume(){cancelAnimationFrame(frame);frame=0;if(!document.hidden&&inView){last=0;frame=requestAnimationFrame(paint);}}resize();resume();window.addEventListener('resize',()=>{resize();resume();},{passive:true});document.addEventListener('visibilitychange',resume);if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;resume();}).observe(hero);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});}}
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('motion-suspended',document.hidden));
})();
