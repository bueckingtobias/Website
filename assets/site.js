/* ==========================================================================
   Bücking Immobilien – gemeinsames Verhalten (Header, Menü, Animationen)
   Jede Funktion prüft, ob ihre Elemente auf der Seite existieren.
   Nachträglich geladene Module (Startseite) rufen SX.scan() auf.
   ========================================================================== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  var hdr = d.getElementById('sxHdr');
  var ftr = d.getElementById('sxFtr');
  var prog = d.getElementById('sxProg');

  /* ---------- Höhen von Header / Footer als CSS-Variablen ---------- */
  function vars() {
    if (hdr) root.style.setProperty('--header-h', hdr.offsetHeight + 'px');
    if (ftr) root.style.setProperty('--footer-h', ftr.offsetHeight + 'px');
  }
  vars();
  addEventListener('load', vars);
  addEventListener('resize', vars);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(vars);
    if (hdr) ro.observe(hdr);
    if (ftr) ro.observe(ftr);
  } else if (hdr) {
    hdr.addEventListener('transitionend', vars);
  }

  /* ---------- Menü (Handy / iPad hoch) ---------- */
  var burger = d.getElementById('sxBurger');
  var drawer = d.getElementById('sxDrawer');
  var veil = d.getElementById('sxVeil');
  function buzz() { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }
  function setMenu(open) {
    if (!burger || !drawer) return;
    root.classList.toggle('sx-menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    d.body.style.overflow = open ? 'hidden' : '';
    if ('inert' in drawer) drawer.inert = !open;
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) vars();
  }
  if (burger && drawer) {
    setMenu(false);
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
      buzz();
    });
    if (veil) veil.addEventListener('click', function () { setMenu(false); });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
    addEventListener('resize', function () { if (innerWidth >= 900) setMenu(false); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    addEventListener('pageshow', function () { setMenu(false); });
  }

  /* ---------- Scroll: Header-Zustand, Fortschrittsbalken, Parallax, Timeline, Kontakt-Button ---------- */
  var blobs = [], arts = [], evs = [], tl = null, fab = d.getElementById('sxFab'), ticking = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset || 0, vh = innerHeight;
    var max = Math.max(1, d.documentElement.scrollHeight - vh);
    if (hdr) hdr.classList.toggle('s', y > 40);
    if (prog) prog.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
    if (!reduce) {
      root.style.setProperty('--sy', y);
      if (y < vh * 1.6) blobs.forEach(function (b) { b.style.transform = 'translateY(' + (y * (+b.dataset.p || 0)) + 'px)'; });
      arts.forEach(function (a) {
        var r = a.parentNode.getBoundingClientRect();
        if (r.bottom > -100 && r.top < vh + 100) a.style.setProperty('--py', (((r.top + r.height / 2 - vh / 2) / vh) * -40) + 'px');
      });
    }
    if (tl) {
      var r = tl.getBoundingClientRect();
      tl.style.setProperty('--tp', Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height)));
      evs.forEach(function (e) { e.classList.toggle('on', e.getBoundingClientRect().top < vh * 0.62); });
    }
    if (fab) {
      var show = y > 520 && !root.classList.contains('sx-menu-open');
      fab.classList.toggle('show', show);
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);

  /* ---------- Reveal + Zähler (auch für nachgeladene Module) ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function count(el) {
    var to = +el.dataset.count, t0 = null, dur = 1600;
    function f(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { if (!reduce) count(e.target); cio.unobserve(e.target); }
    });
  }, { threshold: 0.8 }) : null;

  /* ---------- Objekt-Karussell (Handy / iPad) + Bildwechsel ---------- */
  var pg = null, pcs = [], dots = [], swipe = null, curCard = 0, ptick = false;
  function carousel() {
    ptick = false;
    if (!pg) return;
    if (pg.scrollWidth <= pg.clientWidth + 4) { pcs.forEach(function (c) { c.classList.add('act'); }); return; }
    var mid = pg.scrollLeft + pg.clientWidth / 2, best = 0, bd = 1e9;
    pcs.forEach(function (c, i) {
      var dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (dd < bd) { bd = dd; best = i; }
    });
    pcs.forEach(function (c, i) { c.classList.toggle('act', i === best); });
    dots.forEach(function (x, i) { x.classList.toggle('on', i === best); });
    if (best !== curCard) { curCard = best; buzz(); }
    if (pg.scrollLeft > 20 && swipe) swipe.classList.add('gone');
  }
  function initCarousel() {
    var el = d.getElementById('pgrid');
    if (!el || el.__sx) return;
    el.__sx = true; pg = el;
    pcs = [].slice.call(pg.children);
    dots = [].slice.call(d.querySelectorAll('#pdots button'));
    swipe = d.getElementById('swipe');
    pg.addEventListener('scroll', function () { if (!ptick) { ptick = true; requestAnimationFrame(carousel); } }, { passive: true });
    addEventListener('resize', carousel);
    dots.forEach(function (x, i) {
      x.addEventListener('click', function () {
        pcs[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      });
    });
    carousel();
  }

  /* Bilder in den Objektkarten blenden automatisch weiter */
  function initSlides() {
    [].slice.call(d.querySelectorAll('.art[data-slides]')).forEach(function (art) {
      if (art.__sx) return; art.__sx = true;
      var imgs = [].slice.call(art.querySelectorAll('img'));
      if (imgs.length < 2 || reduce) return;
      var i = 0, every = +art.dataset.slides || 4500, visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(art);
      }
      setInterval(function () {
        if (!visible || d.hidden) return;
        imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on');
      }, every);
    });
  }

  /* ---------- Kopieren / E-Mail ---------- */
  function selectText(b) {
    var t = b.parentNode.querySelector('b'); if (!t) return;
    var r = d.createRange(); r.selectNodeContents(t);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function initContact() {
    [].slice.call(d.querySelectorAll('[data-copy]')).forEach(function (b) {
      if (b.__sx) return; b.__sx = true;
      b.addEventListener('click', function () {
        var v = b.dataset.copy;
        var done = function () {
          var o = b.textContent; b.textContent = 'Kopiert'; b.classList.add('ok');
          setTimeout(function () { b.textContent = o; b.classList.remove('ok'); }, 1600);
        };
        try { navigator.clipboard.writeText(v).then(done, function () { selectText(b); }); } catch (e) { selectText(b); }
      });
    });
    [].slice.call(d.querySelectorAll('.btn-email')).forEach(function (btn) {
      if (btn.__sx) return; btn.__sx = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var body = ['Guten Tag,', '', 'ich interessiere mich für ...', '', 'Name:', 'Telefon:', ''].join('\r\n');
        location.href = 'mailto:info@buecking-immobilien.de?subject=' + encodeURIComponent('Anfrage über Website') + '&body=' + encodeURIComponent(body);
      });
    });
  }

  /* ---------- Scan: neue Elemente anbinden ---------- */
  function scan(scope) {
    scope = scope || d;
    [].slice.call(scope.querySelectorAll('.rv:not(.in)')).forEach(function (el) {
      if (!io) { el.classList.add('in'); return; }
      if (el.__rv) return; el.__rv = true; io.observe(el);
      setTimeout(function () { el.classList.add('in'); }, 7000);
    });
    [].slice.call(scope.querySelectorAll('[data-count]')).forEach(function (el) {
      if (el.__ct || !cio) return; el.__ct = true; cio.observe(el);
    });
    [].slice.call(scope.querySelectorAll('.card')).forEach(function (c) {
      if (c.__sp) return; c.__sp = true;
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    [].slice.call(scope.querySelectorAll('[data-hero]')).forEach(function (el) {
      requestAnimationFrame(function () { setTimeout(function () { el.classList.add('ready'); }, 80); });
    });
    blobs = [].slice.call(d.querySelectorAll('.blob'));
    arts = [].slice.call(d.querySelectorAll('.ph .art'));
    tl = d.getElementById('tl');
    evs = [].slice.call(d.querySelectorAll('.ev'));
    initCarousel(); initSlides(); initContact();
    req();
  }

  window.SX = { scan: scan, vars: vars, frame: frame };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { scan(); frame(); });
  else { scan(); frame(); }
})();
