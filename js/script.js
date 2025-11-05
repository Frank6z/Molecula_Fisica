// =====================================================
// App UI script (P1/P2 tabs, literales P2, zoom modal,
// fade-in images, collapsible sidebar, download-bar)
// =====================================================
(() => {
  // ---------- Helpers ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- Tabs P1 / P2 ----------
  const tabs     = $$('.tab-btn');
  const panels   = $$('.tab-panel');
  const sidebarP1= $('#sidebar-p1');
  const sidebarP2= $('#sidebar-p2');

  function activateTab(id){
    // activar botón
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    // activar panel
    panels.forEach(p => p.classList.toggle('active', p.id === id));
    // sidebars visibles según tab
    if(id === 'tab-p1'){
      if(sidebarP1) sidebarP1.style.display = '';
      if(sidebarP2) sidebarP2.style.display = 'none';
    }else{
      if(sidebarP1) sidebarP1.style.display = 'none';
      if(sidebarP2) sidebarP2.style.display = '';
    }
    // foco accesible
    const firstH = $(`#${id} h2, #${id} h3`);
    if(firstH){ firstH.setAttribute('tabindex','-1'); firstH.focus({preventScroll:true}); }
    // si entramos a P2 y hay hash de literal, mostrarlo
    if(id === 'tab-p2' && location.hash && /^#literal-\d+/.test(location.hash)){
      showLiteral(location.hash);
    }
  }

  tabs.forEach(btn=>{
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // inicial por si el html no viene con active bien seteado
  const defaultTab = (document.querySelector('.tab-btn.active')?.dataset.tab) || 'tab-p1';
  activateTab(defaultTab);

  // ---------- P2: navegación de literales ----------
  const literalLinks = $$('[data-literal-link], a.menu-item[href^="#literal-"]');
  const allLiteralSections = $$('#tab-p2 [data-literal]');

  function showLiteral(hash){
    const id = (hash || '#literal-1').replace('#','');
    allLiteralSections.forEach(sec => {
      sec.hidden = sec.id !== id;
    });
    // marcar activo el link
    literalLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+id));
    // scroll suave dentro de P2
    const sec = document.getElementById(id);
    if(sec){
      sec.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }

  // click en menú P2
  literalLinks.forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const href = a.getAttribute('href') || '#literal-1';
      // activar P2 si no está activo
      const p2Btn = $('.tab-btn[data-tab="tab-p2"]');
      const p2Panel = $('#tab-p2');
      if(p2Btn && p2Panel && !p2Panel.classList.contains('active')) p2Btn.click();
      showLiteral(href);
      history.replaceState(null, '', href);
    });
  });

  // si hay hash y ya estamos en P2, aplicarlo; si no, literal-1 por defecto
  if(location.hash && $('#tab-p2')?.classList.contains('active')){
    showLiteral(location.hash);
  } else {
    showLiteral('#literal-1');
  }

  // ---------- P2: colapso del sidebar ----------
  const collapseBtn = $('#collapseBtn');
  if(collapseBtn && sidebarP2){
    collapseBtn.addEventListener('click', ()=>{
      sidebarP2.classList.toggle('collapsed');
      // Girar flecha si quieres (opcional)
      const open = !sidebarP2.classList.contains('collapsed');
      collapseBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- Modal zoom compartido ----------
  const modal         = $('#img-modal');
  const modalImg      = $('#modal-img');
  const modalCaption  = $('#modal-caption');
  const modalClose    = $('.modal-close');

  function openModal(src, alt){
    if(!modal) return;
    modalImg.src = src;
    modalCaption.textContent = alt || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modalImg.src = '';
    modalCaption.textContent = '';
  }

  // soporte tanto .img-fit como .zoomable
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(t.tagName === 'IMG' && (t.classList.contains('img-fit') || t.classList.contains('zoomable'))){
      openModal(t.getAttribute('src'), t.getAttribute('alt'));
    }
    if(t === modal || t === modalClose){
      closeModal();
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
    // accesibilidad: Enter abre modal cuando la imagen tiene foco
    const t = e.target;
    if(e.key === 'Enter' && t?.tagName === 'IMG' && (t.classList.contains('img-fit') || t.classList.contains('zoomable'))){
      openModal(t.getAttribute('src'), t.getAttribute('alt'));
    }
  });

  // ---------- Fade-in para imágenes ----------
  const images = $$('img.img-fit, img.zoomable');
  images.forEach(img => img.classList.add('fade-in'));
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold: 0.1});
    images.forEach(img => io.observe(img));
  } else {
    images.forEach(img => img.classList.add('in'));
  }

  // ---------- Download-bar (botones con data-download="ruta/al/archivo.xlsx") ----------
  async function triggerDownload(url) {
    try {
      // Intento validar/obtener blob (si CORS/host permite)
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      const fname = (url.split('/').pop() || 'archivo.bin');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    } catch (err) {
      // Fallback: abrir el recurso directo (deja que el navegador gestione la descarga)
      try {
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download','');
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch(_) {
        alert(`No se pudo descargar:\n${url}\nDetalle: ${err.message}`);
      }
    }
  }

  function bindDownloadBar() {
    $$('[data-download]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.getAttribute('data-download');
        if (url) triggerDownload(url);
      });
      // accesibilidad
      btn.setAttribute('role','button');
      btn.setAttribute('tabindex','0');
      btn.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          const url = btn.getAttribute('data-download');
          if (url) triggerDownload(url);
        }
      });
    });
  }
  bindDownloadBar();

})();
