document.addEventListener('DOMContentLoaded', () => {
  const MUSIC_STORAGE_KEY = 'agostina_bg_music_state';

  const pageWrapper = document.getElementById('page-wrapper');
  const toastContainer = document.getElementById('toast-container');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');

  let userManuallyPaused = false;

  /* ==========================================================================
     1. ORDEN ALEATORIO DE LA GALERÍA EN CADA RECARGA (IMG2 A IMG10)
     ========================================================================== */
  function shuffleGalleryItems() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    const items = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
    if (items.length <= 1) return;

    for (let i = items.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [items[i], items[randomIndex]] = [items[randomIndex], items[i]];
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.appendChild(item));
    galleryGrid.appendChild(fragment);
  }

  shuffleGalleryItems();

  /* ==========================================================================
     2. MÚSICA DE FONDO CONTINUA Y SINCRONIZADA ENTRE PÁGINAS
     ========================================================================== */
  function readSavedMusicState() {
    try {
      const raw = sessionStorage.getItem(MUSIC_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function persistMusicState() {
    if (!bgMusic) return;
    try {
      sessionStorage.setItem(
        MUSIC_STORAGE_KEY,
        JSON.stringify({
          currentTime: Number.isFinite(bgMusic.currentTime) ? bgMusic.currentTime : 0,
          isPlaying: !bgMusic.paused,
          userPaused: userManuallyPaused,
        })
      );
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }

  function updateMusicButtonState(isPlaying) {
    if (!musicToggle) return;
    const icon = musicToggle.querySelector('i');

    musicToggle.classList.toggle('is-playing', isPlaying);
    musicToggle.setAttribute('aria-pressed', String(isPlaying));
    musicToggle.setAttribute(
      'aria-label',
      isPlaying ? 'Pausar música de fondo' : 'Activar música de fondo'
    );

    if (icon) {
      icon.className = isPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
  }

  function removeInteractionUnlockers() {
    document.removeEventListener('pointerdown', handleFirstUserInteraction);
    document.removeEventListener('touchstart', handleFirstUserInteraction);
    document.removeEventListener('keydown', handleFirstUserInteraction);
  }

  function tryStartBackgroundMusic() {
    if (!bgMusic || userManuallyPaused || !bgMusic.paused) return;

    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          updateMusicButtonState(true);
          persistMusicState();
          removeInteractionUnlockers();
        })
        .catch(() => {
          updateMusicButtonState(false);
        });
    }
  }

  function handleFirstUserInteraction() {
    if (!userManuallyPaused) {
      tryStartBackgroundMusic();
    }
  }

  if (bgMusic) {
    bgMusic.volume = 0.65;
    const savedState = readSavedMusicState();

    if (savedState) {
      userManuallyPaused = Boolean(savedState.userPaused);

      const applySavedTime = () => {
        if (typeof savedState.currentTime === 'number' && savedState.currentTime > 0) {
          const maxTime = Number.isFinite(bgMusic.duration)
            ? Math.max(0, bgMusic.duration - 0.25)
            : savedState.currentTime;
          bgMusic.currentTime = Math.min(savedState.currentTime, maxTime);
        }
      };

      if (bgMusic.readyState >= 1) {
        applySavedTime();
      } else {
        bgMusic.addEventListener('loadedmetadata', applySavedTime, { once: true });
      }
    }

    if (!userManuallyPaused) {
      tryStartBackgroundMusic();
      window.addEventListener('load', tryStartBackgroundMusic, { once: true });
      document.addEventListener('pointerdown', handleFirstUserInteraction, { passive: true });
      document.addEventListener('touchstart', handleFirstUserInteraction, { passive: true });
      document.addEventListener('keydown', handleFirstUserInteraction);
    } else {
      updateMusicButtonState(false);
    }

    bgMusic.addEventListener('play', () => {
      updateMusicButtonState(true);
      persistMusicState();
    });

    bgMusic.addEventListener('pause', () => {
      updateMusicButtonState(false);
      persistMusicState();
    });

    bgMusic.addEventListener('timeupdate', persistMusicState);
    window.addEventListener('pagehide', persistMusicState);
  }

  musicToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!bgMusic) return;

    if (bgMusic.paused) {
      userManuallyPaused = false;
      bgMusic
        .play()
        .then(() => {
          updateMusicButtonState(true);
          persistMusicState();
        })
        .catch(() => {});
    } else {
      userManuallyPaused = true;
      bgMusic.pause();
      updateMusicButtonState(false);
      persistMusicState();
    }
  });

  // Guardar posición del audio y aplicar microtransición al ir a regalos.html
  document.querySelectorAll('a[href="regalos.html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      persistMusicState();

      if (pageWrapper) {
        pageWrapper.classList.add('is-leaving');
      }

      setTimeout(() => {
        window.location.href = 'regalos.html';
      }, 260);
    });
  });

  /* ==========================================================================
     3. VISOR LIGHTBOX ACCESIBLE PARA LAS FOTOGRAFÍAS
     ========================================================================== */
  function initPhotoLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close-btn');

    if (!lightbox || !lightboxImg) return;

    let lastTrigger = null;

    function openLightbox(src, alt, trigger) {
      lastTrigger = trigger || document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || 'Fotografía de Agostina';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      closeBtn?.focus();
    }

    function closeLightbox() {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-lightbox-src]');
      if (trigger) {
        const src = trigger.getAttribute('data-lightbox-src');
        const alt = trigger.getAttribute('data-lightbox-alt');
        if (src) openLightbox(src, alt, trigger);
      }
    });

    closeBtn?.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  initPhotoLightbox();

  /* ==========================================================================
     4. CUENTA REGRESIVA (2 DE ENERO · 21:00 HS)
     ========================================================================== */
  function initCountdown() {
    const countdownGrid = document.getElementById('countdown-grid');
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');

    if (!countdownGrid || !daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const now = new Date();
    let targetYear = now.getFullYear();
    let targetDate = new Date(`${targetYear}-01-02T21:00:00-03:00`);

    if (now >= targetDate) {
      targetYear += 1;
      targetDate = new Date(`${targetYear}-01-02T21:00:00-03:00`);
    }

    const padZero = (num) => String(num).padStart(2, '0');

    function updateCountdown() {
      const current = new Date();
      const diff = targetDate.getTime() - current.getTime();

      if (diff <= 0) {
        countdownGrid.innerHTML =
          '<p class="countdown-finished">¡Llegó la gran noche de los 15 años de Agostina!</p>';
        clearInterval(timerId);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      daysEl.textContent = padZero(days);
      hoursEl.textContent = padZero(hours);
      minutesEl.textContent = padZero(minutes);
      secondsEl.textContent = padZero(seconds);
    }

    updateCountdown();
    const timerId = setInterval(updateCountdown, 1000);
  }

  initCountdown();

  /* ==========================================================================
     5. SISTEMA DE NOTIFICACIONES TOAST
     ========================================================================== */
  window.showToast = function showToast(message, iconClass = 'fa-info-circle', duration = 3800) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');

    toast.innerHTML = `
      <i class="fas ${iconClass} toast__icon" aria-hidden="true"></i>
      <span>${message}</span>
      <button type="button" class="toast__close" aria-label="Cerrar aviso">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    const closeToast = () => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 350);
    };

    toast.querySelector('.toast__close')?.addEventListener('click', closeToast);
    setTimeout(closeToast, duration);
  };

  /* ==========================================================================
     6. SMOOTH REVEAL AL HACER SCROLL Y SINCRONIZACIÓN CON LA PUERTA
     ========================================================================== */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  function triggerRevealElements() {
    revealElements.forEach((el) => revealObserver.observe(el));
  }

  document.addEventListener('puerta:revelando', () => {
    triggerRevealElements();
  });

  if (!document.getElementById('puerta-modal-slot')) {
    triggerRevealElements();
  }
});