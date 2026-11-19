document.addEventListener('DOMContentLoaded', () => {
  const modalSlot = document.getElementById('regalo-modal-slot');
  if (!modalSlot) return;

  const SUPABASE_REST_URL = 'https://mnjjjasofqnxutqyktqg.supabase.co/rest/v1/regalos';
  const SUPABASE_ANON_KEY = 'sb_publishable_wWsWKD_VUB5QSGv9342t5Q_ITQ0ru_0';

  // Expresión regular con sinónimos de ropa y prendas habituales (sin acentos y en minúsculas)
  const CLOTHING_TERMS_REGEX = new RegExp(
    '\\b(?:' +
      [
        // Sinónimos generales de ropa
        'ropa', 'ropas', 'ropita', 'indumentaria', 'vestimenta', 'vestuario',
        'prenda', 'prendas', 'atuendo', 'atuendos', 'outfit', 'outfits',
        'pilcha', 'pilchas', 'tenida', 'moda', 'conjunto', 'conjuntos',
        // Parte superior
        'remera', 'remeras', 'remeron', 'remerones', 'camiseta', 'camisetas',
        'camisa', 'camisas', 'camisola', 'camisolas', 'blusa', 'blusas',
        'top', 'tops', 'musculosa', 'musculosas', 'chomba', 'chombas',
        'polo', 'polos', 'body', 'bodys', 'bodie', 'bodies',
        'corset', 'corsets', 'corse', 'bustier',
        // Abrigos y tejidos
        'buzo', 'buzos', 'canguro', 'hoodie', 'hoodies', 'campera', 'camperas',
        'chaqueta', 'chaquetas', 'abrigo', 'abrigos', 'tapado', 'tapados',
        'tapadito', 'saco', 'sacos', 'blazer', 'blazers', 'sweater', 'sweaters',
        'sueter', 'sueteres', 'pullover', 'pulover', 'cardigan', 'cardigans',
        'chaleco', 'chalecos', 'poncho', 'ponchos', 'ruana', 'ruanas',
        'piloto', 'pilotos', 'parka', 'parkas', 'rompeviento', 'rompevientos',
        'gabardina', 'gabardinas', 'sobretodo', 'sobretodos',
        // Parte inferior
        'pantalon', 'pantalones', 'jean', 'jeans', 'vaquero', 'vaqueros',
        'denim', 'jogging', 'joggings', 'jogger', 'joggers', 'babucha', 'babuchas',
        'calza', 'calzas', 'legging', 'leggings', 'biker', 'bikers',
        'short', 'shorts', 'bermuda', 'bermudas', 'pollera', 'polleras',
        'falda', 'faldas', 'minifalda', 'minifaldas', 'palazzo', 'palazzos',
        'oxford', 'cargo',
        // Vestidos y enterizos
        'vestido', 'vestidos', 'solero', 'soleros', 'mono', 'monos',
        'enterito', 'enteritos', 'enterizo', 'enterizos', 'jardinero', 'jardineros',
        'overol', 'overoles', 'tunica', 'tunicas', 'traje', 'trajes',
        // Ropa interior, pijama y traje de baño
        'pijama', 'pijamas', 'piyama', 'piyamas', 'camison', 'camisones',
        'bata', 'batas', 'lenceria', 'ropa interior', 'bombacha', 'bombachas',
        'corpino', 'corpinos', 'bralette', 'bralettes', 'medias', 'soquetes',
        'cancan', 'cancanes', 'pantimedia', 'pantimedias', 'malla', 'mallas',
        'bikini', 'bikinis', 'trikini', 'trikinis', 'traje de bano', 'trajes de bano',
        'pareo', 'pareos',
        // Accesorios textiles de vestir
        'bufanda', 'bufandas', 'chalina', 'chalinas', 'gorra', 'gorras',
        'gorro', 'gorros', 'guantes'
      ].join('|') +
    ')\\b',
    'i'
  );

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
            Puedes consultar la lista antes de ingresar tu obsequio. Si otro invitado ya eligió el mismo regalo, te avisaremos (excepto en ropa), aunque igual podrás registrarlo.
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

  function normalizeSingular(word) {
    if (word.length <= 3) return word;
    if (word.endsWith('ces') && word.length > 4) {
      return `${word.slice(0, -3)}z`;
    }
    if (word.endsWith('es') && word.length > 4) {
      const stem = word.slice(0, -2);
      if (/[lnrdjs]$/.test(stem)) return stem;
    }
    if (word.endsWith('s') && !word.endsWith('ss')) {
      return word.slice(0, -1);
    }
    return word;
  }

  function normalizePhraseForComparison(value) {
    return normalizeText(value)
      .split(' ')
      .map(normalizeSingular)
      .join(' ');
  }

  function isClothingGift(rawValue) {
    const normalized = normalizeText(rawValue);
    if (!normalized) return false;
    return CLOTHING_TERMS_REGEX.test(normalized);
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

    function findMatchingGift(rawValue) {
      const normalizedInput = normalizeText(rawValue);
      if (!normalizedInput) return null;

      const singularInput = normalizePhraseForComparison(rawValue);
      const existingGifts = Array.isArray(window.RegalosStore?.items)
        ? window.RegalosStore.items
        : [];

      return (
        existingGifts.find(
          (item) =>
            normalizeText(item) === normalizedInput ||
            normalizePhraseForComparison(item) === singularInput
        ) || null
      );
    }

    function setLiveFeedback(type, message) {
      if (!liveFeedback) return;

      liveFeedback.className = 'regalo-live-feedback';
      liveFeedback.textContent = '';

      if (!message) return;

      const icon = document.createElement('i');
      icon.setAttribute('aria-hidden', 'true');

      if (type === 'error') {
        liveFeedback.classList.add('regalo-live-feedback--error');
        icon.className = 'fas fa-exclamation-circle';
      } else if (type === 'warning') {
        liveFeedback.classList.add('regalo-live-feedback--warning');
        icon.className = 'fas fa-exclamation-triangle';
      } else if (type === 'ok') {
        liveFeedback.classList.add('regalo-live-feedback--ok');
        icon.className = 'fas fa-check-circle';
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = message;

      liveFeedback.appendChild(icon);
      liveFeedback.appendChild(textSpan);
    }

    function validateGiftInRealTime(showEmptyError = false) {
      const trimmed = regaloInput.value.trim();

      regaloInput.classList.remove('is-invalid', 'is-warning', 'is-valid');
      submitBtn.disabled = isSubmitting;

      if (!trimmed) {
        if (showEmptyError) {
          regaloInput.classList.add('is-invalid');
          setLiveFeedback('error', 'Por favor, escribe el regalo que deseas obsequiar.');
        } else {
          setLiveFeedback('', '');
        }
        return false;
      }

      // Si es ropa o cualquier sinónimo/prenda, no se muestra ningún aviso de coincidencia
      if (isClothingGift(trimmed)) {
        regaloInput.classList.add('is-valid');
        setLiveFeedback('ok', 'Listo para registrar en la lista.');
        return true;
      }

      const matchedGift = findMatchingGift(trimmed);
      if (matchedGift) {
        regaloInput.classList.add('is-warning');
        setLiveFeedback(
          'warning',
          `Aviso: ya le están dando "${matchedGift}", pero igual puedes registrarlo si deseas.`
        );
        return true;
      }

      regaloInput.classList.add('is-valid');
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
      regaloInput.classList.remove('is-invalid', 'is-warning', 'is-valid');
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
      const isClothing = isClothingGift(formattedGift);

      isSubmitting = true;
      submitBtn.disabled = true;
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Guardando...</span>';

      try {
        // Sincronizar con Supabase antes de guardar para detectar coincidencias recientes
        if (typeof window.fetchGiftsFromSupabase === 'function') {
          await window.fetchGiftsFromSupabase({ silent: true });
        }

        const matchedBeforeSave = isClothing ? null : findMatchingGift(formattedGift);

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
          if (matchedBeforeSave) {
            window.showToast(
              `Se agregó "${formattedGift}" a la lista (ya le estaban dando "${matchedBeforeSave}").`,
              'fa-exclamation-triangle',
              4800
            );
          } else {
            window.showToast(
              `¡Gracias! "${formattedGift}" se agregó a la lista.`,
              'fa-check-circle'
            );
          }
        }

        form.reset();
        regaloInput.classList.remove('is-invalid', 'is-warning', 'is-valid');
        setLiveFeedback('', '');
        closeModal();
      } catch {
        setLiveFeedback(
          'error',
          'No se pudo guardar el regalo. Verifica tu conexión e inténtalo nuevamente.'
        );
        if (typeof window.showToast === 'function') {
          window.showToast(
            'Error al registrar el regalo. Intenta nuevamente.',
            'fa-exclamation-circle'
          );
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