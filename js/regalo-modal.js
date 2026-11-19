document.addEventListener('DOMContentLoaded', () => {
  const modalSlot = document.getElementById('regalo-modal-slot');
  if (!modalSlot) return;

  const SUPABASE_REST_URL = 'https://mnjjjasofqnxutqyktqg.supabase.co/rest/v1/regalos';
  const SUPABASE_ANON_KEY = 'sb_publishable_wWsWKD_VUB5QSGv9342t5Q_ITQ0ru_0';

  const FALLBACK_MODAL_HTML = `
    <div
      id="regalo-overlay"
      class="regalo-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regalo-modal-titulo"
      aria-hidden="true"
    >
      <div class="regalo-card">
        <button
          type="button"
          id="regalo-close-btn"
          class="regalo-close-btn"
          aria-label="Cerrar ventana para agregar regalo"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>

        <div class="regalo-card__header">
          <div class="regalo-badge-icon" aria-hidden="true">
            <i class="fas fa-gift"></i>
          </div>
          <span class="regalo-eyebrow">Mesa de Presentes · Agostina</span>
          <h2 id="regalo-modal-titulo" class="regalo-title">Registrar Regalo</h2>
        </div>

        <div class="regalo-notice" role="note">
          <i class="fas fa-info-circle regalo-notice__icon" aria-hidden="true"></i>
          <p class="regalo-notice__text">
            Antes de ingresar el regalo, verifica en la tabla que no esté ya registrado por otro invitado.
          </p>
        </div>

        <form id="regalo-form" class="regalo-form" novalidate>
          <div class="form-group">
            <label for="regalo-nombre" class="form-label">
              <i class="fas fa-sparkles" aria-hidden="true"></i>
              <span>¿Qué regalo le darás?</span>
            </label>
            <input
              type="text"
              id="regalo-nombre"
              name="regalo"
              class="form-control"
              placeholder="Ej. Juego de toallas, Cafetera, Set de copas..."
              autocomplete="off"
              maxlength="120"
              required
            >
            <div
              id="regalo-live-feedback"
              class="regalo-live-feedback"
              aria-live="polite"
              aria-atomic="true"
            ></div>
          </div>

          <button type="submit" id="regalo-submit-btn" class="btn-primary btn-submit">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>Guardar regalo</span>
          </button>
        </form>
      </div>
    </div>
  `;

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  function capitalizeInitial(value) {
    const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  async function mountRegaloModal() {
    const src = modalSlot.getAttribute('data-modal-src') || 'regalo-modal.html';
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error('No se pudo cargar regalo-modal.html');
      modalSlot.innerHTML = await response.text();
    } catch {
      modalSlot.innerHTML = FALLBACK_MODAL_HTML;
    }

    initRegaloModalLogic();
  }

  function initRegaloModalLogic() {
    const overlay = document.getElementById('regalo-overlay');
    const closeBtn = document.getElementById('regalo-close-btn');
    const form = document.getElementById('regalo-form');
    const regaloInput = document.getElementById('regalo-nombre');
    const liveFeedback = document.getElementById('regalo-live-feedback');
    const submitBtn = document.getElementById('regalo-submit-btn');

    if (!overlay || !form || !regaloInput || !submitBtn) return;

    let lastFocusedElement = null;
    let closeTimeoutId = null;
    let isSubmitting = false;

    function isDuplicateGift(rawValue) {
      const normalizedInput = normalizeText(rawValue);
      if (!normalizedInput) return false;

      const existingGifts = Array.isArray(window.RegalosStore?.items)
        ? window.RegalosStore.items
        : [];

      return existingGifts.some((item) => normalizeText(item) === normalizedInput);
    }

    function setLiveFeedback(type, message) {
      if (!liveFeedback) return;

      liveFeedback.className = 'regalo-live-feedback';
      if (!message) {
        liveFeedback.innerHTML = '';
        return;
      }

      if (type === 'error') {
        liveFeedback.classList.add('regalo-live-feedback--error');
        liveFeedback.innerHTML = `<i class="fas fa-exclamation-triangle" aria-hidden="true"></i><span>${message}</span>`;
      } else if (type === 'ok') {
        liveFeedback.classList.add('regalo-live-feedback--ok');
        liveFeedback.innerHTML = `<i class="fas fa-check-circle" aria-hidden="true"></i><span>${message}</span>`;
      }
    }

    function validateGiftInRealTime(showEmptyError = false) {
      const rawValue = regaloInput.value;
      const trimmed = rawValue.trim();

      regaloInput.classList.remove('is-invalid', 'is-valid');

      if (!trimmed) {
        submitBtn.disabled = false;
        if (showEmptyError) {
          regaloInput.classList.add('is-invalid');
          setLiveFeedback('error', 'Por favor, escribe el regalo que deseas obsequiar.');
        } else {
          setLiveFeedback('', '');
        }
        return false;
      }

      if (isDuplicateGift(trimmed)) {
        regaloInput.classList.add('is-invalid');
        submitBtn.disabled = true;
        setLiveFeedback(
          'error',
          'Este regalo ya está ingresado en la lista. Por favor, elige otro.'
        );
        return false;
      }

      regaloInput.classList.add('is-valid');
      submitBtn.disabled = isSubmitting;
      setLiveFeedback('ok', 'Disponible: este regalo aún no figura en la lista.');
      return true;
    }

    function openModal(triggerButton) {
      if (closeTimeoutId) {
        clearTimeout(closeTimeoutId);
        closeTimeoutId = null;
      }

      lastFocusedElement = triggerButton || document.activeElement;
      form.reset();
      regaloInput.classList.remove('is-invalid', 'is-valid');
      submitBtn.disabled = false;
      setLiveFeedback('', '');

      overlay.classList.remove('is-closing');
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');

      setTimeout(() => {
        regaloInput.focus();
      }, 120);
    }

    function closeModal() {
      if (!overlay.classList.contains('is-open')) return;

      overlay.classList.add('is-closing');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');

      closeTimeoutId = setTimeout(() => {
        overlay.classList.remove('is-open', 'is-closing');
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
        }
      }, 260);
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open-regalo-modal]');
      if (trigger) {
        openModal(trigger);
      }
    });

    closeBtn?.addEventListener('click', closeModal);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Verificación en tiempo real mientras escribe
    regaloInput.addEventListener('input', () => {
      validateGiftInRealTime(false);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      const isValid = validateGiftInRealTime(true);
      if (!isValid) {
        regaloInput.focus();
        return;
      }

      const formattedGift = capitalizeInitial(regaloInput.value);

      isSubmitting = true;
      submitBtn.disabled = true;
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Guardando...</span>';

      try {
        // Sincronización previa con Supabase para evitar duplicados concurrentes
        if (typeof window.fetchGiftsFromSupabase === 'function') {
          await window.fetchGiftsFromSupabase({ silent: true });
          if (isDuplicateGift(formattedGift)) {
            isSubmitting = false;
            submitBtn.innerHTML = originalBtnHtml;
            validateGiftInRealTime(true);
            regaloInput.focus();
            return;
          }
        }

        const response = await fetch(SUPABASE_REST_URL, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ regalo: formattedGift }),
        });

        if (!response.ok) {
          throw new Error(`Error al guardar en Supabase (${response.status})`);
        }

        if (typeof window.fetchGiftsFromSupabase === 'function') {
          await window.fetchGiftsFromSupabase({ silent: true });
        }

        if (typeof window.showToast === 'function') {
          window.showToast(
            `¡Gracias! "${formattedGift}" se agregó a la lista.`,
            'fa-check-circle'
          );
        }

        form.reset();
        regaloInput.classList.remove('is-invalid', 'is-valid');
        setLiveFeedback('', '');
        closeModal();
      } catch {
        setLiveFeedback(
          'error',
          'No se pudo guardar el regalo. Verifica tu conexión e inténtalo nuevamente.'
        );
        if (typeof window.showToast === 'function') {
          window.showToast('Error al registrar el regalo. Intenta nuevamente.', 'fa-exclamation-circle');
        }
      } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  mountRegaloModal();
});