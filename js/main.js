/* ============================================================
   KiddyTech — main.js
   Shared JS: nav, scroll animations, dismissal board, counters, form
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Navigation ─────────────────────────────────────────── */
  function initNav() {
    const nav      = qs('#main-nav');
    const toggle   = qs('#nav-toggle');
    const drawer   = qs('#nav-drawer');
    const dropdown = qs('.nav__dropdown');
    const dropMenu = qs('.nav__dropdown-menu');

    if (!nav) return;

    // Scroll: transparent → solid
    let scrolled = false;
    function onScroll() {
      const past = window.scrollY > 60;
      if (past !== scrolled) {
        scrolled = past;
        nav.classList.toggle('nav--scrolled', past);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mark active link
    const currentPath = window.location.pathname.replace(/\/$/, '');
    qsa('.nav__link, .footer__link').forEach(a => {
      const href = a.getAttribute('href') || '';
      const linkPath = href.replace(/\/$/, '').replace(/\.html$/, '');
      const curNorm  = currentPath.replace(/\.html$/, '');
      if (linkPath && curNorm.endsWith(linkPath) && linkPath !== '') {
        a.classList.add('nav__link--active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // Mobile hamburger
    if (toggle && drawer) {
      toggle.addEventListener('click', () => {
        const open = toggle.classList.toggle('nav__toggle--open');
        drawer.classList.toggle('nav__drawer--open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });

      // Close drawer on outside click
      document.addEventListener('click', e => {
        if (!nav.contains(e.target) && !drawer.contains(e.target)) {
          toggle.classList.remove('nav__toggle--open');
          drawer.classList.remove('nav__drawer--open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }

    // Desktop dropdown
    if (dropdown && dropMenu) {
      let closeTimer;

      dropdown.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        dropMenu.classList.add('nav__dropdown-menu--open');
      });
      dropdown.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => {
          dropMenu.classList.remove('nav__dropdown-menu--open');
        }, 120);
      });

      // Keyboard support
      const dropTrigger = qs('.nav__link--dropdown', dropdown);
      if (dropTrigger) {
        dropTrigger.addEventListener('click', e => {
          e.preventDefault();
          const open = dropMenu.classList.toggle('nav__dropdown-menu--open');
          dropTrigger.setAttribute('aria-expanded', String(open));
        });
        dropTrigger.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            dropMenu.classList.remove('nav__dropdown-menu--open');
            dropTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }
  }

  /* ── 2. Scroll Animations (Intersection Observer) ──────────── */
  function initScrollAnimations() {
    if (prefersReducedMotion()) {
      // Make everything visible immediately
      qsa('[data-animate], .fade-up, .fade-down, .fade-left, .fade-right, .fade-in, .scale-up, .stagger > *')
        .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    const observerOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOpts);

    // Observe all animation targets
    qsa('[data-animate], .fade-up, .fade-down, .fade-left, .fade-right, .fade-in, .scale-up, .scale-down, .rotate-in')
      .forEach(el => observer.observe(el));

    // Stagger containers: observe each child individually
    qsa('.stagger').forEach(container => {
      qsa('*', container).forEach(child => observer.observe(child));
    });
  }

  /* ── 3. Live Dismissal Board ───────────────────────────────── */
  function initDismissalBoard() {
    const board = qs('#dismissal-board');
    if (!board) return;

    const clockEl = qs('#dismissal-clock');
    const rowsEl  = qs('#dismissal-rows');

    // Live clock
    function updateClock() {
      if (!clockEl) return;
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    }
    updateClock();
    setInterval(updateClock, 1000);

    if (!rowsEl || prefersReducedMotion()) {
      // Static fallback
      if (rowsEl) rowsEl.innerHTML = staticBoardHTML();
      return;
    }

    // Children pool
    const children = [
      { name: 'Omar Al-Said',   cls: 'Sunflower',  color: '#F5A623' },
      { name: 'Sara Khalil',    cls: 'Rainbow',    color: '#E85D75' },
      { name: 'Layla Hassan',   cls: 'Butterfly',  color: '#4AADA0' },
      { name: 'Ahmed Nour',     cls: 'Stars',      color: '#7B7BAF' },
      { name: 'Nour Ibrahim',   cls: 'Garden',     color: '#5BB85D' },
      { name: 'Reem Salah',     cls: 'Clouds',     color: '#4A90D9' },
    ];

    let rows = [];        // active row objects
    let childIndex = 0;
    let animFrame;

    function getChild() {
      const c = children[childIndex % children.length];
      childIndex++;
      return c;
    }

    function makeRowEl(child, countdown) {
      const el = document.createElement('div');
      el.className = 'db-row db-row--enter';
      el.innerHTML = `
        <div class="db-row__name">${child.name}</div>
        <div class="db-row__class">
          <span class="db-row__dot" style="background:${child.color}"></span>
          ${child.cls}
        </div>
        <div class="db-row__status">
          <span class="db-badge db-badge--timer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span class="db-row__countdown">${formatTime(countdown)}</span>
          </span>
        </div>`;
      return el;
    }

    function formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    function setRowStatus(rowEl, status) {
      const statusEl = qs('.db-row__status', rowEl);
      if (!statusEl) return;
      if (status === 'arrived') {
        statusEl.innerHTML = `<span class="db-badge db-badge--arrived">
          <span class="db-badge__pulse"></span> ARRIVED
        </span>`;
      } else if (status === 'ready') {
        statusEl.innerHTML = `<span class="db-badge db-badge--ready">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          READY
        </span>`;
      }
    }

    function removeRow(rowEl) {
      rowEl.classList.add('db-row--exit');
      setTimeout(() => rowEl.remove(), 500);
    }

    // Countdown tick across all timer rows
    function tickCountdowns() {
      rows.forEach(r => {
        if (r.status !== 'timer') return;
        r.countdown = Math.max(0, r.countdown - 1);
        const cdEl = qs('.db-row__countdown', r.el);
        if (cdEl) cdEl.textContent = formatTime(r.countdown);
      });
    }

    // Main animation sequence
    function runSequence() {
      // Clear
      rows.forEach(r => r.el && r.el.remove());
      rows = [];
      rowsEl.innerHTML = '';

      // Start with 2 children
      const c1 = getChild(), c2 = getChild();
      const r1 = { el: makeRowEl(c1, 47), status: 'timer', countdown: 47, child: c1 };
      const r2 = { el: makeRowEl(c2, 23), status: 'timer', countdown: 23, child: c2 };
      rows.push(r1, r2);
      rowsEl.appendChild(r1.el);
      rowsEl.appendChild(r2.el);
      // Trigger enter animation
      requestAnimationFrame(() => {
        r1.el.classList.remove('db-row--enter');
        r2.el.classList.remove('db-row--enter');
      });

      // Countdown tick every second
      const ticker = setInterval(tickCountdowns, 1000);

      // Step 2: new row appears
      const t1 = setTimeout(() => {
        const c3 = getChild();
        const r3 = { el: makeRowEl(c3, 12), status: 'timer', countdown: 12, child: c3 };
        rows.push(r3);
        rowsEl.appendChild(r3.el);
        requestAnimationFrame(() => r3.el.classList.remove('db-row--enter'));
      }, 2000);

      // Step 3: top row → ARRIVED
      const t2 = setTimeout(() => {
        r1.status = 'arrived';
        setRowStatus(r1.el, 'arrived');
        r1.el.classList.add('db-row--arrived');
      }, 4000);

      // Step 4: ARRIVED → READY
      const t3 = setTimeout(() => {
        r1.status = 'ready';
        setRowStatus(r1.el, 'ready');
        r1.el.classList.remove('db-row--arrived');
        r1.el.classList.add('db-row--ready');
      }, 6500);

      // Step 5: row fades out (delivered)
      const t4 = setTimeout(() => {
        rows = rows.filter(r => r !== r1);
        removeRow(r1.el);
      }, 8500);

      // Step 6: loop restart
      const t5 = setTimeout(() => {
        clearInterval(ticker);
        clearTimeout(t1); clearTimeout(t2);
        clearTimeout(t3); clearTimeout(t4);
        runSequence();
      }, 11000);
    }

    runSequence();
  }

  function staticBoardHTML() {
    return `
      <div class="db-row">
        <div class="db-row__name">Omar Al-Said</div>
        <div class="db-row__class"><span class="db-row__dot" style="background:#F5A623"></span>Sunflower</div>
        <div class="db-row__status"><span class="db-badge db-badge--timer">⏱ 00:47</span></div>
      </div>
      <div class="db-row">
        <div class="db-row__name">Sara Khalil</div>
        <div class="db-row__class"><span class="db-row__dot" style="background:#E85D75"></span>Rainbow</div>
        <div class="db-row__status"><span class="db-badge db-badge--arrived"><span class="db-badge__pulse"></span>ARRIVED</span></div>
      </div>
      <div class="db-row">
        <div class="db-row__name">Layla Hassan</div>
        <div class="db-row__class"><span class="db-row__dot" style="background:#4AADA0"></span>Butterfly</div>
        <div class="db-row__status"><span class="db-badge db-badge--ready">✓ READY</span></div>
      </div>`;
  }

  /* ── 4. Stats Counter ─────────────────────────────────────── */
  function initCounters() {
    const counters = qsa('[data-count]');
    if (!counters.length) return;

    function animateCounter(el) {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = parseFloat(el.dataset.duration || '0.8') * 1000;
      const isZero   = target === 0;

      if (prefersReducedMotion() || isZero) {
        el.textContent = target + suffix;
        return;
      }

      const startTime = performance.now();
      function tick(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
  }

  /* ── 5. Hero Load Animation ───────────────────────────────── */
  function initHeroAnimation() {
    if (prefersReducedMotion()) return;
    const items = qsa('[data-hero-anim]');
    items.forEach((el, i) => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(20px)';
      el.style.transition = `opacity 0.55s ease-out, transform 0.55s ease-out`;
      const delay = parseInt(el.dataset.heroAnim || String(i * 120));
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }, 120 + delay);
    });
  }

  /* ── 6. Contact Form ──────────────────────────────────────── */
  function initContactForm() {
    const form    = qs('#contact-form');
    const success = qs('#form-success');
    if (!form) return;

    function showError(field, msg) {
      field.classList.add('field--error');
      let err = field.parentElement.querySelector('.field-error');
      if (!err) {
        err = document.createElement('p');
        err.className = 'field-error';
        field.parentElement.appendChild(err);
      }
      err.textContent = msg;
    }

    function clearError(field) {
      field.classList.remove('field--error');
      const err = field.parentElement.querySelector('.field-error');
      if (err) err.remove();
    }

    function validateEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    // Live validation on blur
    qsa('input, select, textarea', form).forEach(field => {
      field.addEventListener('blur', () => {
        if (field.required && !field.value.trim()) {
          showError(field, `${field.labels?.[0]?.textContent || 'This field'} is required.`);
        } else if (field.type === 'email' && field.value && !validateEmail(field.value)) {
          showError(field, 'Please enter a valid email address.');
        } else {
          clearError(field);
        }
      });
      field.addEventListener('input', () => clearError(field));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      qsa('[required]', form).forEach(field => {
        if (!field.value.trim()) {
          showError(field, `${field.labels?.[0]?.textContent || 'This field'} is required.`);
          valid = false;
        }
      });

      const emailField = qs('input[type="email"]', form);
      if (emailField && emailField.value && !validateEmail(emailField.value)) {
        showError(emailField, 'Please enter a valid email address.');
        valid = false;
      }

      if (!valid) return;

      // Build mailto body
      const data = new FormData(form);
      const lines = [];
      data.forEach((v, k) => { if (v) lines.push(`${k}: ${v}`); });
      const mailto = `mailto:info@kiddytech.io?subject=KiddyTech Website Enquiry&body=${encodeURIComponent(lines.join('\n'))}`;
      window.location.href = mailto;

      // Show success
      if (success) {
        form.style.display = 'none';
        success.hidden = false;
        success.style.opacity = '0';
        success.style.transform = 'translateY(16px)';
        success.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        requestAnimationFrame(() => {
          success.style.opacity   = '1';
          success.style.transform = 'translateY(0)';
        });
      }
    });
  }

  /* ── 7. Smooth scroll for anchor links ───────────────────── */
  function initSmoothScroll() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  /* ── 8. SDS Interface scroll spy ─────────────────────────── */
  function initScrollSpy() {
    const spy     = qs('#interface-spy');
    const sections = qsa('[data-interface]');
    if (!spy || !sections.length) return;

    const dots = qsa('.spy__dot', spy);

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.interface) - 1;
          dots.forEach((d, i) => d.classList.toggle('spy__dot--active', i === idx));
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => obs.observe(s));
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    initNav();
    initScrollAnimations();
    initHeroAnimation();
    initDismissalBoard();
    initCounters();
    initContactForm();
    initSmoothScroll();
    initScrollSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
