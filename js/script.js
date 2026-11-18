document.addEventListener('DOMContentLoaded', () => {
  const toastContainer = document.getElementById('toast-container');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');

  let userManuallyPaused = false;

  /* ==========================================================================
     1. MÚSICA DE FONDO AUTOMÁTICA Y CONTROL FLOTANTE
     ========================================================================== */
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

  function tryStartBackgroundMusic() {
    if (!bgMusic || userManuallyPaused || !bgMusic.paused) return;

    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          updateMusicButtonState(true);
          removeInteractionUnlockers();
        })
        .catch(() => {
          // El navegador requiere interacción previa; queda listo para iniciar al primer toque/clic
          updateMusicButtonState(false);
        });
    }
  }

  function handleFirstUserInteraction() {
    if (!userManuallyPaused) {
      tryStartBackgroundMusic();
    }
  }

  function removeInteractionUnlockers() {
    document.removeEventListener('pointerdown', handleFirstUserInteraction);
    document.removeEventListener('touchstart', handleFirstUserInteraction);
    document.removeEventListener('keydown', handleFirstUserInteraction);
  }

  if (bgMusic) {
    bgMusic.volume = 0.65;

    // Intento inmediato al entrar a la página
    tryStartBackgroundMusic();
    window.addEventListener('load', tryStartBackgroundMusic, { once: true });

    // Respaldo automático ante la primera interacción si el navegador bloqueó el autoplay
    document.addEventListener('pointerdown', handleFirstUserInteraction, { passive: true });
    document.addEventListener('touchstart', handleFirstUserInteraction, { passive: true });
    document.addEventListener('keydown', handleFirstUserInteraction);

    bgMusic.addEventListener('play', () => updateMusicButtonState(true));
    bgMusic.addEventListener('pause', () => updateMusicButtonState(false));
  }

  musicToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!bgMusic) return;

    if (bgMusic.paused) {
      userManuallyPaused = false;
      bgMusic.play().then(() => updateMusicButtonState(true)).catch(() => {});
    } else {
      userManuallyPaused = true;
      bgMusic.pause();
      updateMusicButtonState(false);
    }
  });

  /* ==========================================================================
     2. SISTEMA DE NOTIFICACIONES TOAST (Disponible para próximas secciones)
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
     3. SMOOTH REVEAL AL HACER SCROLL Y SINCRONIZACIÓN CON LA PUERTA
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
});