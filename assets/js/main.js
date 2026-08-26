/* ==========================================================================
   ELEMENTA — интерактив лендинга
   Без зависимостей. Всё опционально: если элемента нет, блок молча пропускается.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Смещение якорных ссылок под высоту шапки -------------------- */
  /* Высота шапки не захардкожена в CSS: меряем её реально, иначе scroll-padding
     мог разъезжаться с фактической высотой (шапка "проглатывала" заголовок
     секции при переходе по ссылкам вида #catalog).                          */

  var header = document.getElementById('siteHeader');

  if (header) {
    var syncScrollOffset = function () {
      document.documentElement.style.scrollPaddingTop = header.getBoundingClientRect().height + 'px';
    };
    syncScrollOffset();
    window.addEventListener('resize', syncScrollOffset);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncScrollOffset);
  }

  /* ---------- Шапка: смена темы при скролле ------------------------------ */

  var hero = document.querySelector('.hero');

  if (header && hero) {
    // Шапка становится кремовой, как только герой уходит из-под неё.
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:85vh;pointer-events:none';
    hero.appendChild(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
      header.dataset.theme = entries[0].isIntersecting ? 'dark' : 'light';
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ---------- Мобильное меню --------------------------------------------- */

  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Аккордеон категорий ---------------------------------------- */

  document.querySelectorAll('.acc-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var item = trigger.closest('.acc-item');
      var willOpen = !item.classList.contains('is-open');

      // Одновременно открыта одна категория — как в референсе.
      document.querySelectorAll('.acc-item.is-open').forEach(function (open) {
        open.classList.remove('is-open');
        open.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ---------- Бегущая строка в сплит-блоке -------------------------------- */

  var ticker = document.getElementById('ticker');

  if (ticker && !reduceMotion) {
    var words = ['иммунитета', 'энергии', 'сна', 'кожи', 'спорта'];
    var i = 0;

    setInterval(function () {
      i = (i + 1) % words.length;
      ticker.style.opacity = '0';
      setTimeout(function () {
        ticker.textContent = words[i];
        ticker.style.opacity = '1';
      }, 260);
    }, 2200);

    ticker.style.transition = 'opacity .26s ease';
    ticker.style.display = 'inline-block';
  }

  /* ---------- Появление секций при скролле -------------------------------- */

  var revealTargets = document.querySelectorAll(
    '.split__panel, .statement, .featured .card, .story__text, .story__media, ' +
    '.stats, .acc-item, .banner__content, .formula, .post, .newsletter__inner'
  );

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    revealTargets.forEach(function (el, idx) {
      el.classList.add('reveal');
      el.style.transitionDelay = (idx % 3) * 90 + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- Счётчики в блоке статистики --------------------------------- */

  var counters = document.querySelectorAll('[data-count]');

  if (counters.length && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var target = parseInt(el.dataset.count, 10) || 0;
        obs.unobserve(el);

        if (reduceMotion) { el.textContent = target.toLocaleString('ru-RU'); return; }

        var start = performance.now();
        var duration = 1400;

        var tick = function (now) {
          var p = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
          if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    }, { threshold: .5 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- Корзина (демо-счётчик) -------------------------------------- */

  var cartCount = document.querySelector('.cart-count');

  document.querySelectorAll('.js-add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (cartCount) cartCount.textContent = String(Number(cartCount.textContent) + 1);

      var original = btn.textContent;
      btn.textContent = 'Добавлено';
      btn.disabled = true;

      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
      }, 1400);
    });
  });

  /* ---------- Форма подписки (демо, без бэкенда) -------------------------- */

  var form = document.getElementById('subscribeForm');
  var msg = document.getElementById('subscribeMsg');

  if (form && msg) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var input = form.querySelector('input[type="email"]');
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());

      input.setAttribute('aria-invalid', String(!valid));
      msg.classList.toggle('is-ok', valid);
      msg.textContent = valid
        ? 'Готово — проверьте почту'
        : 'Проверьте адрес электронной почты';

      if (valid) form.reset();
    });
  }

})();
