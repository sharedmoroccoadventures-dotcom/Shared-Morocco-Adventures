document.addEventListener('DOMContentLoaded', function () {
  var siteHeader = document.querySelector('.site-header');
  var navToggle = siteHeader && siteHeader.querySelector('.nav-toggle');

  function setNavOpen(isOpen) {
    siteHeader.classList.toggle('nav-open', isOpen);
    if (navToggle) navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (siteHeader && navToggle) {
    navToggle.addEventListener('click', function () {
      setNavOpen(!siteHeader.classList.contains('nav-open'));
    });

    siteHeader.querySelectorAll('.main-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        setNavOpen(false);
      });
    });
  }

  // Preselect the requested tour when a visitor arrives from a tour page.
  var tripSelect = document.querySelector('#trip');
  if (tripSelect) {
    var requestedTrip = new URLSearchParams(window.location.search).get('trip');
    if (requestedTrip) {
      var matchingOption = Array.from(tripSelect.options).find(function (option) {
        return option.value === requestedTrip;
      });
      if (matchingOption) tripSelect.value = requestedTrip;
    }
  }

  // Sticky header: solidify once the visitor scrolls past the hero fold
  if (siteHeader) {
    var applyHeaderState = function () {
      siteHeader.classList.toggle('scrolled', window.pageYOffset > 40);
    };
    applyHeaderState();
    window.addEventListener('scroll', applyHeaderState, { passive: true });
  }

  // Subtle scroll-reveal for content blocks (skipped if reduced motion is preferred).
  // The .reveal class is added by JS so no-JS visitors always see content normally.
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var revealSelector = [
      '.section-head', '.card', '.mini-card', '.split > div', '.dest-chip',
      '.step', '.itinerary-day', '.includes-panel', '.testimonial',
      '.price-box', '.contact-panel'
    ].join(', ');
    var revealTargets = document.querySelectorAll(revealSelector);
    if (revealTargets.length) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealTargets.forEach(function (el) {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }
  }
});
