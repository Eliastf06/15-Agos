document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_REST_URL = 'https://mnjjjasofqnxutqyktqg.supabase.co/rest/v1/regalos';
  const SUPABASE_ANON_KEY = 'sb_publishable_wWsWKD_VUB5QSGv9342t5Q_ITQ0ru_0';
  const MUSIC_STORAGE_KEY = 'agostina_bg_music_state';

  const pageWrapper = document.getElementById('regalos-page-wrapper');
  const progressBar = document.getElementById('scroll-progress-bar');
  const toastContainer = document.getElementById('toast-container');
  const revealItems = document.querySelectorAll('.reveal-item');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');

  const searchInput = document.getElementById('gift-search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  let userManuallyPaused = false;

  // Almacén compartido para que regalo-modal.js valide duplicados en tiempo real
  window.RegalosStore = {
    items: [],
  };

  /* ==========================================================================
     1. CONTINUIDAD DE LA MÚSICA DE FONDO ENTRE PÁGINAS
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
    document.removeEventListener('pointerdown', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
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

  function handleFirstInteraction() {
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
      document.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
      document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
      document.addEventListener('keydown', handleFirstInteraction);
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

  /* ==========================================================================
     2. MICROTRANSICIÓN DE SALIDA AL VOLVER A LA INVITACIÓN
     ========================================================================== */
  document.querySelectorAll('[data-page-transition]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || event.metaKey || event.ctrlKey) return;

      event.preventDefault();
      persistMusicState();

      if (pageWrapper) {
        pageWrapper.classList.add('is-leaving');
      }

      setTimeout(() => {
        window.location.href = href;
      }, 260);
    });
  });

  /* ==========================================================================
     3. INDICADOR SUPERIOR DE PROGRESO DE LECTURA
     ========================================================================== */
  function updateScrollProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percentage =
      docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 100;
    progressBar.style.width = `${percentage}%`;
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ==========================================================================
     4. CONSULTA, FILTRADO (SIN MAYÚSCULAS/ACENTOS) Y RENDERIZADO DE LA TABLA
     ========================================================================== */
  function normalizeForSearch(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  function capitalizeGiftInitial(text) {
    const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderGiftsTable(gifts, rawSearchQuery = '') {
    const tableBody = document.getElementById('gifts-table-body');
    const countBadge = document.getElementById('gifts-count-badge');
    if (!tableBody) return;

    const totalItems = window.RegalosStore.items.length;
    const hasSearch = rawSearchQuery.trim().length > 0;

    if (countBadge) {
      if (hasSearch) {
        countBadge.textContent = `${gifts.length} de ${totalItems} regalos`;
      } else {
        countBadge.textContent =
          totalItems === 1 ? '1 regalo registrado' : `${totalItems} regalos registrados`;
      }
    }

    if (gifts.length === 0) {
      if (hasSearch) {
        tableBody.innerHTML = `
          <tr class="empty-row">
            <td class="empty-state-cell">
              <i class="fas fa-search" aria-hidden="true"></i>
              <span>No encontramos regalos que coincidan con "<strong>${escapeHtml(
                rawSearchQuery.trim()
              )}</strong>".</span>
              <span class="empty-state-hint">¡Está disponible para que lo registres!</span>
              <button type="button" id="empty-clear-search-btn" class="btn-clear-search">
                <i class="fas fa-times" aria-hidden="true"></i>
                <span>Limpiar búsqueda</span>
              </button>
            </td>
          </tr>
        `;

        document
          .getElementById('empty-clear-search-btn')
          ?.addEventListener('click', resetSearchFilter);
        return;
      }

      tableBody.innerHTML = `
        <tr class="empty-row">
          <td class="empty-state-cell">
            <i class="fas fa-gift" aria-hidden="true"></i>
            <span>Aún no hay regalos cargados en la lista. ¡Sé el primero en registrar uno!</span>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = gifts
      .map(
        (gift) => `
          <tr>
            <td>
              <div class="gift-item-row">
                <span class="gift-item-row__bullet" aria-hidden="true">
                  <i class="fas fa-gem"></i>
                </span>
                <span>${escapeHtml(gift)}</span>
              </div>
            </td>
          </tr>
        `
      )
      .join('');
  }

  function applySearchFilter() {
    const rawQuery = searchInput ? searchInput.value : '';
    const normalizedQuery = normalizeForSearch(rawQuery);

    if (clearSearchBtn) {
      clearSearchBtn.hidden = rawQuery.length === 0;
    }

    if (!normalizedQuery) {
      renderGiftsTable(window.RegalosStore.items, '');
      updateScrollProgress();
      return;
    }

    const filtered = window.RegalosStore.items.filter((gift) =>
      normalizeForSearch(gift).includes(normalizedQuery)
    );

    renderGiftsTable(filtered, rawQuery);
    updateScrollProgress();
  }

  function resetSearchFilter() {
    if (!searchInput) return;
    searchInput.value = '';
    applySearchFilter();
    searchInput.focus();
  }

  searchInput?.addEventListener('input', applySearchFilter);

  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchInput.value.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      resetSearchFilter();
    }
  });

  clearSearchBtn?.addEventListener('click', resetSearchFilter);

  function renderGiftsError() {
    const tableBody = document.getElementById('gifts-table-body');
    const countBadge = document.getElementById('gifts-count-badge');
    if (!tableBody) return;

    if (countBadge) {
      countBadge.textContent = 'Error de conexión';
    }

    tableBody.innerHTML = `
      <tr class="empty-row">
        <td class="empty-state-cell">
          <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
          <span>No pudimos obtener los regalos en este momento.</span>
          <br>
          <button type="button" id="retry-fetch-gifts" class="btn-retry-fetch">
            <i class="fas fa-redo" aria-hidden="true"></i>
            <span>Reintentar</span>
          </button>
        </td>
      </tr>
    `;

    document.getElementById('retry-fetch-gifts')?.addEventListener('click', () => {
      window.fetchGiftsFromSupabase();
    });
  }

  window.fetchGiftsFromSupabase = async function fetchGiftsFromSupabase({ silent = false } = {}) {
    const tableBody = document.getElementById('gifts-table-body');
    if (!tableBody) return;

    if (!silent) {
      tableBody.innerHTML = `
        <tr class="skeleton-row" aria-hidden="true">
          <td><span class="skeleton-line"></span></td>
        </tr>
        <tr class="skeleton-row" aria-hidden="true">
          <td><span class="skeleton-line skeleton-line--short"></span></td>
        </tr>
        <tr class="skeleton-row" aria-hidden="true">
          <td><span class="skeleton-line skeleton-line--medium"></span></td>
        </tr>
      `;
    }

    try {
      // Consulta únicamente la columna "regalo" (sin IDs)
      const response = await fetch(`${SUPABASE_REST_URL}?select=regalo&order=regalo.asc`, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al consultar Supabase (${response.status})`);
      }

      const rows = await response.json();

      // Inicial en mayúscula y orden alfabético en español
      const sortedGifts = (Array.isArray(rows) ? rows : [])
        .map((row) => capitalizeGiftInitial(row?.regalo))
        .filter((item) => item.length > 0)
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

      window.RegalosStore.items = sortedGifts;
      applySearchFilter();
    } catch {
      if (!silent) {
        renderGiftsError();
      }
    }
  };

  window.fetchGiftsFromSupabase();

  /* ==========================================================================
     5. COPIAR ALIAS BANCARIO CON FEEDBACK VISUAL Y TOAST
     ========================================================================== */
  const copyAliasBtn = document.getElementById('copy-alias-btn');
  copyAliasBtn?.addEventListener('click', () => {
    const targetId = copyAliasBtn.getAttribute('data-copy-target');
    const aliasText = document.getElementById(targetId)?.textContent.trim();

    if (!aliasText || !navigator.clipboard) return;

    navigator.clipboard.writeText(aliasText).then(() => {
      const icon = copyAliasBtn.querySelector('i');
      const label = copyAliasBtn.querySelector('span');

      copyAliasBtn.classList.add('is-copied');
      if (icon) icon.className = 'fas fa-check';
      if (label) label.textContent = 'Alias copiado';

      window.showToast('Alias bancario copiado al portapapeles', 'fa-check-circle');

      setTimeout(() => {
        copyAliasBtn.classList.remove('is-copied');
        if (icon) icon.className = 'fas fa-copy';
        if (label) label.textContent = 'Copiar alias';
      }, 2500);
    });
  });

  /* ==========================================================================
     6. SISTEMA DE NOTIFICACIONES TOAST ACCESIBLES
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
     7. APARICIÓN SUAVE AL HACER SCROLL (SMOOTH REVEAL)
     ========================================================================== */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealItems.forEach((item) => observer.observe(item));
});