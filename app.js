'use strict';
(() => {
  const t = window.NordaI18n.translate;
  const themeToggle = document.querySelector('#theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    const label = t(dark ? 'Açıq rejimə keç' : 'Tünd rejimə keç');
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b1321' : '#0751ed';
  }
  applyTheme(document.documentElement.dataset.theme || 'light');
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('norda-theme', next); } catch {}
  });
  systemTheme.addEventListener?.('change', event => {
    try { if (localStorage.getItem('norda-theme')) return; } catch {}
    applyTheme(event.matches ? 'dark' : 'light');
  });
  const categories = [
    { id: 'computer', label: 'Kompüter və iş yeri', caption: 'Komandanızın gündəlik iş alətləri' },
    { id: 'server', label: 'Server və məlumat saxlama', caption: 'Biznesinizin məlumat infrastrukturu' },
    { id: 'network', label: 'Şəbəkə və rabitə', caption: 'Sistemlərinizi birləşdirən texnologiya' },
    { id: 'office', label: 'Çap və ofis texnikası', caption: 'Gündəlik işinizin texniki ehtiyacları' },
    { id: 'security', label: 'Təhlükəsizlik və görüşlər', caption: 'Müşahidə və əməkdaşlıq texnologiyaları' },
    { id: 'software', label: 'Proqram təminatı', caption: 'İş proseslərinizə uyğun proqramlar' }
  ].map(category => ({ ...category, label: t(category.label), caption: t(category.caption) }));
  const solutions = {
    workplace: { label: 'KORPORATİV TƏCHİZAT', title: 'Bir iş yerindən bütöv komandaya.', description: 'Kompüter, monitor, periferiya, çap və şəbəkə ehtiyaclarını eyni sorğuda toplayın. Say, istifadə ssenarisi və büdcənizə uyğun variantları müzakirə edək.', categories: ['computer', 'office', 'network'], visual: 'KORPORATİV / 01' },
    infrastructure: { label: 'LAYİHƏ ƏSASLI TƏCHİZAT', title: 'Texniki siyahınız, vahid müraciətiniz.', description: 'Hazır avadanlıq siyahısını, sayları və tələb olunan xüsusiyyətləri göndərin. Modellər, mümkün alternativlər və təchizat şərtləri üzrə sorğunuzu birlikdə dəqiqləşdirək.', categories: [], visual: 'LAYİHƏ / 02' },
    procurement: { label: 'BEYNƏLXALQ TƏDARÜK', title: 'Axtardığınız texnologiya üçün daha geniş imkanlar.', description: 'IT avadanlıqlarının xarici bazarlardan sifariş əsasında tədarükü. Model, məhsul kodu və texniki tələblər üzrə imkanları qiymətləndirir, qiymət, təxmini müddət və çatdırılma şərtlərini əvvəlcədən dəqiqləşdiririk.', categories: [], visual: 'BEYNƏLXALQ / 03' }
  };
  for (const solution of Object.values(solutions)) {
    for (const field of ['label', 'title', 'description', 'visual']) solution[field] = t(solution[field]);
  }
  const selected = new Set();
  const dialog = document.querySelector('#quote-dialog');
  const form = document.querySelector('#quote-form');
  const status = document.querySelector('#form-status');
  const choices = document.querySelector('#quote-categories');
  const extraFields = document.createElement('details');
  extraFields.className = 'quote-extra';
  extraFields.innerHTML = `<summary>${t('Əlavə satınalma detalları (istəyə bağlı)')}</summary><div class="form-grid"><label>${t('Part Number / model')}<input name="partnumber" maxlength="160" placeholder="${t('Məhsul kodu və ya model')}"></label><label>${t('Say (ədəd)')}<input name="quantity" type="number" min="1" step="1" inputmode="numeric" placeholder="${t('Məsələn: 10')}"></label><label class="full-width">${t('Tədarük mənbəyi')}<select name="sourcing"><option value="any">${t('Birlikdə dəqiqləşdirək')}</option><option value="local">${t('Yerli bazardan')}</option><option value="international">${t('Xaricdən tədarük')}</option></select></label></div>`;
  form.insertBefore(extraFields, form.querySelector('.form-note'));
  const toast = document.querySelector('.toast');
  let toastTimer;
  let activeSolution = 'workplace';
  let lastTrigger;

  for (const category of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quote-choice';
    button.dataset.choice = category.id;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = category.label;
    button.addEventListener('click', () => toggleCategory(category.id));
    choices.append(button);
  }
  function syncSelection() {
    document.querySelectorAll('[data-add], [data-choice]').forEach(button => {
      const id = button.dataset.add || button.dataset.choice;
      const enabled = selected.has(id);
      button.setAttribute('aria-pressed', String(enabled));
      if (button.dataset.add) {
        button.querySelector('span').textContent = t(enabled ? 'Sorğuya əlavə edildi' : 'Sorğuya əlavə et');
        button.querySelector('use').setAttribute('href', enabled ? '#i-check' : '#i-plus');
        button.closest('.category-card').classList.toggle('selected', enabled);
      }
    });
    document.querySelectorAll('.selection-count').forEach(count => {
      count.hidden = selected.size === 0;
      count.textContent = String(selected.size);
    });
  }
  function toggleCategory(id, announce = false) {
    if (!categories.some(category => category.id === id)) return;
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    syncSelection();
    if (announce) {
      const category = categories.find(category => category.id === id);
      toast.textContent = t(selected.has(id) ? '{category} sorğunuza əlavə edildi.' : '{category} sorğudan çıxarıldı.').replace('{category}', category.label);
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
    }
  }
  function openQuote(trigger) {
    lastTrigger = trigger || document.activeElement;
    status.textContent = '';
    syncSelection();
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  function closeQuote() { dialog.close(); }
  document.querySelectorAll('[data-quote]').forEach(button => button.addEventListener('click', () => openQuote(button)));
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => toggleCategory(button.dataset.add, true)));
  document.querySelector('.close-dialog').addEventListener('click', closeQuote);
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastTrigger?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeQuote(); } });

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('open'); menuButton.setAttribute('aria-label', t('Menyunu aç')); }
  menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', t(open ? 'Menyunu bağla' : 'Menyunu aç')); navigation.classList.toggle('open', open); });
  navigation.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMenu(); }, { passive: true });

  document.querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => {
    const index = categories.findIndex(category => category.id === button.dataset.node);
    if (index < 0) return;
    document.querySelectorAll('[data-node]').forEach(node => { const active = node === button; node.classList.toggle('active', active); node.setAttribute('aria-pressed', String(active)); });
    document.querySelector('#scene-caption').textContent = categories[index].caption;
    document.querySelector('.scene-index').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  }));
  const scene = document.querySelector('.ecosystem');
  if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    scene.addEventListener('pointermove', event => { const rect = scene.getBoundingClientRect(); scene.style.setProperty('--glow-x', `${Math.round((event.clientX - rect.left) / rect.width * 100)}%`); scene.style.setProperty('--glow-y', `${Math.round((event.clientY - rect.top) / rect.height * 100)}%`); });
    scene.addEventListener('pointerleave', () => { scene.style.setProperty('--glow-x', '50%'); scene.style.setProperty('--glow-y', '50%'); });
  }

  const tabs = [...document.querySelectorAll('[data-solution]')];
  function selectSolution(button) {
    activeSolution = button.dataset.solution;
    const solution = solutions[activeSolution];
    tabs.forEach(tab => { const active = tab === button; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    const panel = document.querySelector('#solution-panel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.dataset.scene = activeSolution;
    document.querySelector('#solution-label').textContent = solution.label;
    document.querySelector('#solution-title').textContent = solution.title;
    document.querySelector('#solution-description').textContent = solution.description;
    document.querySelector('.visual-label').textContent = solution.visual;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectSolution(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectSolution(tabs[next]); tabs[next].focus(); }
    });
  });
  selectSolution(tabs[0]);
  document.querySelector('#solution-quote').addEventListener('click', event => { solutions[activeSolution].categories.forEach(id => selected.add(id)); if (activeSolution === 'procurement') form.elements.namedItem('sourcing').value = 'international'; openQuote(event.currentTarget); });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const fields = ['company', 'person', 'contact', 'details'];
    for (const field of fields) {
      const input = form.elements.namedItem(field);
      if (!String(values.get(field) || '').trim()) { input.setCustomValidity(t('Bu sahəni doldurun.')); input.reportValidity(); return; }
    }
    const optionalLines = [];
    if (String(values.get('partnumber') || '').trim()) optionalLines.push(`${t('Məhsul kodu / model:')} ${String(values.get('partnumber')).trim()}`);
    if (values.get('quantity')) optionalLines.push(`${t('Say:')} ${values.get('quantity')}`);
    if (values.get('sourcing') !== 'any') optionalLines.push(`${t('Tədarük mənbəyi:')} ${form.elements.namedItem('sourcing').selectedOptions[0].textContent}`);
    const lines = [
      t('NORDA TECH SUPPLIES — QİYMƏT SORĞUSU'), '',
      `${t('Şirkət:')} ${String(values.get('company')).trim()}`,
      `${t('Əlaqələndirici:')} ${String(values.get('person')).trim()}`,
      `${t('Əlaqə:')} ${String(values.get('contact')).trim()}`,
      `${t('İstiqamətlər:')} ${categories.filter(category => selected.has(category.id)).map(category => category.label).join('; ') || t('Ümumi təchizat sorğusu')}`,
      ...optionalLines,
      '', t('Məhsullar və texniki tələblər:'), String(values.get('details')).trim(), '',
      t('nordatech.az vasitəsilə hazırlanıb.')
    ];
    const text = lines.join('\n');
    const channel = event.submitter?.value || 'whatsapp';
    if (channel === 'email') {
      window.location.href = `mailto:info@nordatech.az?subject=${encodeURIComponent(t('Korporativ təchizat sorğusu — ') + String(values.get('company')).trim())}&body=${encodeURIComponent(text)}`;
      status.textContent = t('Sorğu e-poçt tətbiqiniz üçün hazırlandı. Açılan məktubda göndərməni tamamlayın.');
    } else {
      window.open(`https://wa.me/994777277209?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      status.textContent = t('Sorğu WhatsApp üçün hazırlandı. Açılan pəncərədə göndərməni tamamlayın.');
    }
  });
  form.querySelectorAll('input,textarea').forEach(input => input.addEventListener('input', () => { input.setCustomValidity(''); status.textContent = ''; }));
  const privacy = document.querySelector('#privacy-dialog');
  const themePrivacy = document.createElement('p');
  themePrivacy.textContent = t('Rəng rejimi seçiminiz yalnız bu brauzerdə yadda saxlanılır.');
  privacy.querySelector('.privacy-copy').append(themePrivacy);
  const privacyTrigger = document.querySelector('#privacy-open');
  privacyTrigger.addEventListener('click', () => { privacy.showModal(); document.body.style.overflow = 'hidden'; });
  document.querySelector('.close-privacy').addEventListener('click', () => privacy.close());
  privacy.addEventListener('close', () => { document.body.style.overflow = ''; privacyTrigger.focus(); });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
