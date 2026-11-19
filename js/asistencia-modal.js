document.addEventListener('DOMContentLoaded', () => {
  const modalSlot = document.getElementById('asistencia-modal-slot');
  if (!modalSlot) return;

  const WHATSAPP_NUMBER = '5492646772201';

  const FALLBACK_MODAL_HTML = `
    <div
      id="asistencia-overlay"
      class="asistencia-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asistencia-modal-titulo"
      aria-hidden="true"
    >
      <div class="asistencia-card">
        <button
          type="button"
          id="asistencia-close-btn"
          class="asistencia-close-btn"
          aria-label="Cerrar ventana de confirmación"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>

        <div class="asistencia-card__header">
          <div class="asistencia-badge-icon" aria-hidden="true">
            <i class="fas fa-crown"></i>
          </div>
          <span class="asistencia-eyebrow">Mis 15 Años · Agostina</span>
          <h2 id="asistencia-modal-titulo" class="asistencia-title">Confirmar Asistencia</h2>
          <p class="asistencia-subtitle">
            Completa tus datos y te llevaremos a WhatsApp con tu mensaje listo para enviar.
          </p>
        </div>

        <form id="asistencia-form" class="asistencia-form" novalidate>
          <div class="form-group">
            <label for="invitado-nombre" class="form-label">
              <i class="fas fa-user" aria-hidden="true"></i>
              <span>Nombre y Apellido o Familia</span>
            </label>
            <input
              type="text"
              id="invitado-nombre"
              name="nombre"
              class="form-control"
              placeholder="Ej. Familia Pérez o Sofía Gómez"
              autocomplete="name"
              required
            >
            <span id="error-nombre" class="form-error" aria-live="polite"></span>
          </div>

          <div class="form-group">
            <label id="label-integrantes" for="custom-select-trigger" class="form-label">
              <i class="fas fa-users" aria-hidden="true"></i>
              <span>Cantidad de integrantes de familia</span>
            </label>

            <div class="custom-select" id="custom-integrantes-select">
              <input type="hidden" id="invitado-integrantes" name="integrantes" value="" required>

              <button
                type="button"
                id="custom-select-trigger"
                class="custom-select__trigger"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-labelledby="label-integrantes custom-select-value"
                aria-controls="custom-select-listbox"
              >
                <span class="custom-select__left">
                  <i class="fas fa-user-friends custom-select__icon" aria-hidden="true"></i>
                  <span id="custom-select-value" class="custom-select__placeholder">
                    Selecciona cantidad (1 a 9)
                  </span>
                </span>
                <i class="fas fa-chevron-down custom-select__arrow" aria-hidden="true"></i>
              </button>

              <ul
                id="custom-select-listbox"
                class="custom-select__menu"
                role="listbox"
                aria-labelledby="label-integrantes"
                tabindex="-1"
              >
                ${Array.from({ length: 9 }, (_, idx) => {
                  const n = idx + 1;
                  const label = n === 1 ? '1 persona (Solo yo)' : `${n} integrantes`;
                  return `
                    <li class="custom-select__option" role="option" data-value="${n}" aria-selected="false">
                      <span class="option-badge">${n}</span>
                      <span class="option-text">${label}</span>
                      <i class="fas fa-check option-check" aria-hidden="true"></i>
                    </li>
                  `;
                }).join('')}
              </ul>
            </div>

            <span id="error-integrantes" class="form-error" aria-live="polite"></span>
          </div>

          <button type="submit" class="btn-primary btn-submit">
            <i class="fab fa-whatsapp" aria-hidden="true"></i>
            <span>Enviar confirmación</span>
          </button>
        </form>
      </div>
    </div>
  `;

  async function mountAsistenciaModal() {
    const src = modalSlot.getAttribute('data-modal-src') || 'asistencia-modal.html';
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error('No se pudo cargar asistencia-modal.html');
      modalSlot.innerHTML = await response.text();
    } catch {
      modalSlot.innerHTML = FALLBACK_MODAL_HTML;
    }

    initAsistenciaModalLogic();
  }

  function initAsistenciaModalLogic() {
    const overlay = document.getElementById('asistencia-overlay');
    const closeBtn = document.getElementById('asistencia-close-btn');
    const form = document.getElementById('asistencia-form');
    const nombreInput = document.getElementById('invitado-nombre');
    const integrantesHidden = document.getElementById('invitado-integrantes');
    const errorNombre = document.getElementById('error-nombre');
    const errorIntegrantes = document.getElementById('error-integrantes');

    // Elementos del menú de selección personalizado
    const customSelect = document.getElementById('custom-integrantes-select');
    const selectTrigger = document.getElementById('custom-select-trigger');
    const selectValueDisplay = document.getElementById('custom-select-value');
    const selectMenu = document.getElementById('custom-select-listbox');
    const selectOptions = Array.from(
      customSelect ? customSelect.querySelectorAll('.custom-select__option') : []
    );

    if (!overlay || !form) return;

    let lastFocusedElement = null;
    let closeTimeoutId = null;
    let focusedOptionIndex = -1;

    function openSelectMenu() {
      if (!customSelect || !selectTrigger) return;
      customSelect.classList.add('is-open');
      selectTrigger.setAttribute('aria-expanded', 'true');

      const selectedIndex = selectOptions.findIndex(
        (opt) => opt.getAttribute('aria-selected') === 'true'
      );
      focusedOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
      highlightOption(focusedOptionIndex);
    }

    function closeSelectMenu() {
      if (!customSelect || !selectTrigger) return;
      customSelect.classList.remove('is-open');
      selectTrigger.setAttribute('aria-expanded', 'false');
      selectOptions.forEach((opt) => opt.classList.remove('is-focused'));
    }

    function highlightOption(index) {
      selectOptions.forEach((opt, idx) => {
        const isCurrent = idx === index;
        opt.classList.toggle('is-focused', isCurrent);
        if (isCurrent) {
          opt.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function chooseOption(optionEl) {
      if (!optionEl || !integrantesHidden || !selectValueDisplay) return;

      const value = optionEl.getAttribute('data-value') || '';
      const text = optionEl.querySelector('.option-text')?.textContent.trim() || value;

      integrantesHidden.value = value;
      selectValueDisplay.textContent = text;
      selectValueDisplay.classList.add('has-value');

      selectOptions.forEach((opt) => {
        opt.setAttribute('aria-selected', String(opt === optionEl));
      });

      customSelect?.classList.remove('is-invalid');
      if (errorIntegrantes) errorIntegrantes.textContent = '';

      closeSelectMenu();
      selectTrigger?.focus();
    }

    function resetCustomSelect() {
      if (!integrantesHidden || !selectValueDisplay) return;
      integrantesHidden.value = '';
      selectValueDisplay.textContent = 'Selecciona cantidad (1 a 9)';
      selectValueDisplay.classList.remove('has-value');
      selectOptions.forEach((opt) => opt.setAttribute('aria-selected', 'false'));
      closeSelectMenu();
    }

    selectTrigger?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (customSelect?.classList.contains('is-open')) {
        closeSelectMenu();
      } else {
        openSelectMenu();
      }
    });

    selectOptions.forEach((optionEl, idx) => {
      optionEl.addEventListener('click', (event) => {
        event.stopPropagation();
        chooseOption(optionEl);
      });

      optionEl.addEventListener('mouseenter', () => {
        focusedOptionIndex = idx;
        highlightOption(focusedOptionIndex);
      });
    });

    selectTrigger?.addEventListener('keydown', (event) => {
      const isOpen = customSelect?.classList.contains('is-open');

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) {
          openSelectMenu();
        } else {
          focusedOptionIndex = (focusedOptionIndex + 1) % selectOptions.length;
          highlightOption(focusedOptionIndex);
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen) {
          openSelectMenu();
        } else {
          focusedOptionIndex =
            (focusedOptionIndex - 1 + selectOptions.length) % selectOptions.length;
          highlightOption(focusedOptionIndex);
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (isOpen && focusedOptionIndex >= 0) {
          event.preventDefault();
          chooseOption(selectOptions[focusedOptionIndex]);
        }
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        closeSelectMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (customSelect && !customSelect.contains(event.target)) {
        closeSelectMenu();
      }
    });

    function clearValidation() {
      nombreInput?.classList.remove('is-invalid');
      customSelect?.classList.remove('is-invalid');
      if (errorNombre) errorNombre.textContent = '';
      if (errorIntegrantes) errorIntegrantes.textContent = '';
    }

    function openModal(triggerButton) {
      if (closeTimeoutId) {
        clearTimeout(closeTimeoutId);
        closeTimeoutId = null;
      }

      lastFocusedElement = triggerButton || document.activeElement;
      clearValidation();
      closeSelectMenu();

      overlay.classList.remove('is-closing');
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');

      setTimeout(() => {
        nombreInput?.focus();
      }, 120);
    }

    function closeModal() {
      if (!overlay.classList.contains('is-open')) return;

      closeSelectMenu();
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
      const trigger = event.target.closest('[data-open-asistencia-modal]');
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
        if (customSelect?.classList.contains('is-open')) {
          closeSelectMenu();
        } else {
          closeModal();
        }
      }
    });

    nombreInput?.addEventListener('input', () => {
      if (nombreInput.value.trim().length > 0) {
        nombreInput.classList.remove('is-invalid');
        if (errorNombre) errorNombre.textContent = '';
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearValidation();

      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const integrantes = integrantesHidden ? integrantesHidden.value : '';
      let isValid = true;

      if (!nombre) {
        isValid = false;
        nombreInput?.classList.add('is-invalid');
        if (errorNombre) {
          errorNombre.textContent = 'Por favor, ingresa tu nombre o el de tu familia.';
        }
      }

      if (!integrantes) {
        isValid = false;
        customSelect?.classList.add('is-invalid');
        if (errorIntegrantes) {
          errorIntegrantes.textContent = 'Selecciona cuántos integrantes asistirán (1 a 9).';
        }
      }

      if (!isValid) {
        if (!nombre) {
          nombreInput?.focus();
        } else {
          selectTrigger?.focus();
          openSelectMenu();
        }
        return;
      }

      const cantidadNum = Number(integrantes);
      const cantidadTexto = cantidadNum === 1 ? '1 persona' : `${cantidadNum} integrantes`;
      const mensajeWhatsApp =
        `Hola! Quiero confirmar asistencia a los 15 años de Agostina.\n` +
        `Nombre / Familia: ${nombre}\n` +
        `Cantidad de integrantes: ${cantidadTexto}`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensajeWhatsApp
      )}`;

      if (typeof window.showToast === 'function') {
        window.showToast('Abriendo WhatsApp con tu confirmación lista...', 'fa-check-circle');
      }

      form.reset();
      resetCustomSelect();
      closeModal();

      const openedWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!openedWindow) {
        window.location.href = whatsappUrl;
      }
    });
  }

  mountAsistenciaModal();
});
