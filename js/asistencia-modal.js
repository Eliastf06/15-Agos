/**
 * Módulo del Modal de Confirmación de Asistencia (js/asistencia-modal.js)
 * Carga asistencia-modal.html, gestiona la apertura con animación card flip
 * y permite cerrar haciendo clic fuera del modal o en la cruz de salida.
 */
(function () {
  let isModalOpen = false;
  let lastFocusedElement = null;

  function setupAsistenciaModal() {
    const overlay = document.getElementById('asistencia-overlay');
    const closeBtn = document.getElementById('asistencia-close-btn');
    const form = document.getElementById('asistencia-form');
    const fullnameInput = document.getElementById('guest-fullname');
    const attendanceSelect = document.getElementById('guest-attendance');
    const errorFullname = document.getElementById('error-fullname');
    const errorAttendance = document.getElementById('error-attendance');

    if (!overlay) return;

    function openModal(triggerEl) {
      if (isModalOpen) return;
      isModalOpen = true;
      lastFocusedElement = triggerEl || document.activeElement;

      overlay.classList.remove('is-closing');
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');

      setTimeout(() => {
        fullnameInput?.focus();
      }, 280);
    }

    function closeModal() {
      if (!isModalOpen) return;
      isModalOpen = false;

      // Cierre suave sin repetir el card flip
      overlay.classList.add('is-closing');
      overlay.setAttribute('aria-hidden', 'true');

      setTimeout(() => {
        overlay.classList.remove('is-open', 'is-closing');
        document.body.classList.remove('no-scroll');
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
        }
      }, 270);
    }

    // Delegación de clic en botones que abren el modal
    document.addEventListener('click', (event) => {
      const openTrigger = event.target.closest('[data-open-asistencia-modal]');
      if (openTrigger) {
        event.preventDefault();
        openModal(openTrigger);
      }
    });

    // Forma de cierre 1: Cruz de salida
    closeBtn?.addEventListener('click', closeModal);

    // Forma de cierre 2: Clic fuera de la tarjeta del modal (en el fondo)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    // Soporte accesible con tecla Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    });

    // Limpiar errores mientras el usuario escribe/selecciona
    fullnameInput?.addEventListener('input', () => {
      fullnameInput.classList.remove('is-invalid');
      if (errorFullname) errorFullname.textContent = '';
    });

    attendanceSelect?.addEventListener('change', () => {
      attendanceSelect.classList.remove('is-invalid');
      if (errorAttendance) errorAttendance.textContent = '';
    });

    // Envío del formulario de dos campos
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      let isValid = true;

      const nameValue = fullnameInput?.value.trim() || '';
      const attendanceValue = attendanceSelect?.value || '';

      if (nameValue.length < 3) {
        isValid = false;
        fullnameInput?.classList.add('is-invalid');
        if (errorFullname) {
          errorFullname.textContent = 'Por favor ingresa tu nombre y apellido.';
        }
      }

      if (!attendanceValue) {
        isValid = false;
        attendanceSelect?.classList.add('is-invalid');
        if (errorAttendance) {
          errorAttendance.textContent = 'Selecciona una opción de asistencia.';
        }
      }

      if (!isValid) return;

      const message =
        attendanceValue === 'no'
          ? `Gracias ${nameValue}, registramos tu respuesta.`
          : `¡Gracias ${nameValue}! Confirmación registrada con éxito.`;

      if (typeof window.showToast === 'function') {
        window.showToast(message, 'fa-check-circle', 4200);
      }

      form.reset();
      closeModal();
    });

    window.AsistenciaModal = {
      open: openModal,
      close: closeModal
    };
  }

  async function loadAsistenciaModal() {
    const slot = document.getElementById('asistencia-modal-slot');
    if (!slot) return;

    const modalUrl = slot.getAttribute('data-modal-src') || 'asistencia-modal.html';

    try {
      const response = await fetch(modalUrl);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${modalUrl} (${response.status})`);
      }
      const htmlContent = await response.text();
      slot.innerHTML = htmlContent;
      setupAsistenciaModal();
    } catch (error) {
      console.warn('Aviso al cargar asistencia-modal.html:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAsistenciaModal);
  } else {
    loadAsistenciaModal();
  }
})();