/**
 * OFFSHIFT Mobile Nav
 * Auto-injects hamburger toggle on screens < 900px.
 * Requires: A <nav> with .nav-links inside it.
 */
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-toggle {
      display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px;
      z-index: 1001; background: none; border: none;
    }
    .mobile-toggle span {
      width: 22px; height: 1.5px; background: #f5f5f5; transition: all 0.3s;
      display: block;
    }
    .mobile-toggle.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
    .mobile-toggle.open span:nth-child(2) { opacity: 0; }
    .mobile-toggle.open span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }

    @media (max-width: 900px) {
      .mobile-toggle { display: flex; }
      nav .nav-links {
        position: fixed !important;
        top: 0; right: -100%;
        width: 100%; height: 100vh;
        background: #0a0a0a;
        flex-direction: column !important;
        justify-content: center;
        align-items: center;
        gap: 32px;
        transition: right 0.4s cubic-bezier(0.77, 0, 0.175, 1);
        z-index: 999;
      }
      nav .nav-links.mobile-open { right: 0; }
      nav .nav-links a { font-size: 1.1rem !important; }
      nav .nav-user { order: 10; }
      nav { padding: 0 20px !important; }

      /* Sub-navs */
      .sub-nav { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; scrollbar-width: none; }
      .sub-nav::-webkit-scrollbar { display: none; }
      .dash-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; scrollbar-width: none; flex-wrap: nowrap; }
      .dash-tabs::-webkit-scrollbar { display: none; }
    }
  `;
  document.head.appendChild(style);

  // Don't add if browse.html already has its own toggle
  if (document.getElementById('navToggle')) return;

  const nav = document.querySelector('nav');
  const links = nav ? nav.querySelector('.nav-links') : null;
  if (!nav || !links) return;

  const toggle = document.createElement('button');
  toggle.className = 'mobile-toggle';
  toggle.innerHTML = '<span></span><span></span><span></span>';
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('mobile-open');
    document.body.style.overflow = links.classList.contains('mobile-open') ? 'hidden' : '';
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('mobile-open');
      document.body.style.overflow = '';
    });
  });

  nav.appendChild(toggle);
})();
