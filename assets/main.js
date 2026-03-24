(() => {
  const root = document.documentElement;
  const body = document.body;
  const nav = document.querySelector('[data-nav]');
  const navMenu = document.querySelector('[data-nav-menu]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navCloseTargets = document.querySelectorAll('[data-nav-close]');
  const navOverlay = document.querySelector('.nav-overlay');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const themeStorageKey = 'medsys-theme';
  const mobileNavBreakpoint = 860;
  const navPortalHost = navMenu?.parentNode || null;
  const navPortalAnchor = document.createComment('nav-portal-anchor');
  const promoCycleMs = 7 * 24 * 60 * 60 * 1000;
  const promoCycleOrigin = new Date('2026-03-24T00:00:00').getTime();

  if (navPortalHost) {
    navPortalHost.appendChild(navPortalAnchor);
  }

  const syncMobileMenuLayer = () => {
    if (!navMenu || !navOverlay || !navPortalHost) {
      return;
    }

    if (window.innerWidth <= mobileNavBreakpoint) {
      if (navOverlay.parentNode !== body) {
        body.appendChild(navOverlay);
      }
      if (navMenu.parentNode !== body) {
        body.appendChild(navMenu);
      }
      return;
    }

    if (navMenu.parentNode === body) {
      navPortalHost.insertBefore(navMenu, navPortalAnchor);
    }
    if (navOverlay.parentNode === body) {
      navPortalHost.insertBefore(navOverlay, navPortalAnchor);
    }
  };

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const readStoredTheme = () => {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch (_) {
      return null;
    }
  };

  const writeStoredTheme = (theme) => {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (_) {
      // Ignore storage restrictions.
    }
  };

  const updateThemeToggleUI = (theme) => {
    const isDark = theme === 'dark';
    themeToggleButtons.forEach((button) => {
      button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    });
  };

  const applyTheme = (theme, persist = false) => {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = resolvedTheme;
    updateThemeToggleUI(resolvedTheme);
    if (persist) {
      writeStoredTheme(resolvedTheme);
    }
  };

  const initialTheme = (() => {
    const current = root.dataset.theme;
    if (current === 'light' || current === 'dark') {
      return current;
    }

    const stored = readStoredTheme();
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  })();

  applyTheme(initialTheme);

  themeToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
    });
  });

  const closeMenu = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
    body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    root.classList.add('menu-open');
    body.classList.add('menu-open');
  };

  if (nav && navToggle) {
    syncMobileMenuLayer();

    navToggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navCloseTargets.forEach((target) => {
      target.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      const isDesktop = window.innerWidth > mobileNavBreakpoint;
      if (isDesktop) {
        closeMenu();
      }
      syncMobileMenuLayer();
    });
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0] || 'index.html';
    if (href === currentPath) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const createPromoCountdown = () => {
    if (!nav || document.querySelector('[data-promo-countdown]')) {
      return null;
    }

    const promo = document.createElement('section');
    promo.className = 'promo-countdown';
    promo.setAttribute('data-promo-countdown', '');
    promo.innerHTML = `
      <div class="container promo-countdown__inner">
        <p class="promo-countdown__text">¡No te pierdas las ofertas por tiempo limitado!</p>
        <div class="promo-countdown__timer" data-promo-timer aria-label="Tiempo restante de la promoción">
          <span class="promo-countdown__item"><strong data-promo-days>00</strong><span>d</span></span>
          <span class="promo-countdown__item"><strong data-promo-hours>00</strong><span>h</span></span>
          <span class="promo-countdown__item"><strong data-promo-minutes>00</strong><span>m</span></span>
          <span class="promo-countdown__item"><strong data-promo-seconds>00</strong><span>s</span></span>
        </div>
        <a class="promo-countdown__link" href="precios.html">Explorar</a>
      </div>
    `;

    nav.parentNode?.insertBefore(promo, nav);
    return promo;
  };

  const promoElement = createPromoCountdown();

  const syncHeaderOffsets = () => {
    const promoHeight = promoElement ? Math.round(promoElement.getBoundingClientRect().height) : 0;
    const navHeight = nav ? Math.round(nav.getBoundingClientRect().height) : 94;
    root.style.setProperty('--promo-offset', `${promoHeight}px`);
    root.style.setProperty('--nav-height', `${navHeight}px`);
  };

  const updatePromoCountdown = () => {
    if (!promoElement) {
      return;
    }

    const elapsed = Math.max(0, Date.now() - promoCycleOrigin);
    const remainder = elapsed % promoCycleMs;
    const remaining = remainder === 0 && elapsed > 0 ? promoCycleMs : promoCycleMs - remainder;
    const totalSeconds = Math.floor(remaining / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, '0');

    promoElement.querySelector('[data-promo-days]')?.replaceChildren(document.createTextNode(pad(days)));
    promoElement.querySelector('[data-promo-hours]')?.replaceChildren(document.createTextNode(pad(hours)));
    promoElement.querySelector('[data-promo-minutes]')?.replaceChildren(document.createTextNode(pad(minutes)));
    promoElement.querySelector('[data-promo-seconds]')?.replaceChildren(document.createTextNode(pad(seconds)));

    const timer = promoElement.querySelector('[data-promo-timer]');
    timer?.setAttribute(
      'aria-label',
      `Tiempo restante de la promoción: ${pad(days)} días, ${pad(hours)} horas, ${pad(minutes)} minutos y ${pad(seconds)} segundos`
    );
  };

  if (promoElement) {
    updatePromoCountdown();
    window.setInterval(updatePromoCountdown, 1000);
  }

  syncHeaderOffsets();
  window.addEventListener('resize', syncHeaderOffsets);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(syncHeaderOffsets);
    if (promoElement) {
      resizeObserver.observe(promoElement);
    }
    if (nav) {
      resizeObserver.observe(nav);
    }
  }

  const markPageReady = () => {
    body.classList.add('page-ready');
  };

  if (reduceMotion) {
    markPageReady();
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(markPageReady);
    });
  }

  window.addEventListener('pageshow', () => {
    syncHeaderOffsets();
    body.classList.add('page-ready');
    body.classList.remove('is-leaving');
  });

  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (reduceMotion) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const orbs = Array.from(document.querySelectorAll('[data-orb]'));
  if (orbs.length > 0 && !reduceMotion) {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      orbs.forEach((orb, index) => {
        const speed = index === 0 ? 0.05 : 0.085;
        orb.style.transform = `translate3d(0, ${Math.round(scrollY * speed)}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateParallax();
  }

  const smoothScrollToAnchor = (hash) => {
    if (!hash || !hash.startsWith('#')) {
      return false;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return false;
    }

    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', hash);
    }
    return true;
  };

  const resolveSamePageAnchor = (link) => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      return null;
    }

    const resolved = new URL(rawHref, window.location.href);
    const current = new URL(window.location.href);
    if (resolved.origin !== current.origin || resolved.pathname !== current.pathname || !resolved.hash) {
      return null;
    }

    return resolved.hash;
  };

  const isInternalHtmlLink = (link) => {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) {
      return false;
    }

    const rawHref = link.getAttribute('href');
    if (!rawHref) {
      return false;
    }

    if (
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('https://wa.me') ||
      rawHref.startsWith('http://wa.me') ||
      rawHref.startsWith('#')
    ) {
      return false;
    }

    const resolved = new URL(rawHref, window.location.href);
    return resolved.origin === window.location.origin && /\.html$/i.test(resolved.pathname);
  };

  const isMenuLink = (link) => Boolean(navMenu && link && navMenu.contains(link));

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link) {
      return;
    }

    const openedFromMenu = nav.classList.contains('is-open') && isMenuLink(link);

    const samePageHash = resolveSamePageAnchor(link);
    if (samePageHash) {
      event.preventDefault();
      closeMenu();
      window.requestAnimationFrame(() => {
        smoothScrollToAnchor(samePageHash);
      });
      return;
    }

    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      event.preventDefault();
      closeMenu();
      window.requestAnimationFrame(() => {
        smoothScrollToAnchor(href);
      });
      return;
    }

    if (!isInternalHtmlLink(link)) {
      if (openedFromMenu) {
        closeMenu();
      }
      return;
    }

    const destination = new URL(href, window.location.href);
    if (destination.href === window.location.href) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    closeMenu();

    const navigate = () => {
      if (reduceMotion || body.classList.contains('is-leaving')) {
        window.location.href = destination.href;
        return;
      }

      body.classList.add('is-leaving');
      window.setTimeout(() => {
        window.location.href = destination.href;
      }, 320);
    };

    if (openedFromMenu) {
      window.requestAnimationFrame(navigate);
    } else {
      navigate();
    }
  });
})();
