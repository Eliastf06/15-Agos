/**
 * Módulo de la Puerta de Entrada (js/puerta-modal.js)
 * Carga el archivo HTML externo (puerta-modal.html) dentro de index.html,
 * gestiona la barra de progreso y abre las puertas hacia adentro.
 */
(function () {
  function unlockPageFallback() {
    const pageWrapper = document.getElementById('page-wrapper');
    document.body.classList.remove('no-scroll');
    pageWrapper?.removeAttribute('inert');
    document.dispatchEvent(new CustomEvent('puerta:revelando'));
  }

  function setupDoorAnimation() {
    const entranceOverlay = document.getElementById('entrance-overlay');
    const loadingBarFill = document.getElementById('loading-bar-fill');
    const entranceStatus = document.getElementById('entrance-status');
    const pageWrapper = document.getElementById('page-wrapper');

    if (!entranceOverlay) {
      unlockPageFallback();
      return;
    }

    let doorOpened = false;

    requestAnimationFrame(() => {
      if (loadingBarFill) loadingBarFill.style.width = '80%';
    });

    function openEntranceDoor() {
      if (doorOpened) return;
      doorOpened = true;

      if (loadingBarFill) loadingBarFill.style.width = '100%';
      if (entranceStatus) {
        entranceStatus.innerHTML = '<i class="fas fa-door-open" aria-hidden="true"></i> Bienvenidos';
      }

      setTimeout(() => {
        entranceOverlay.classList.add('is-open');
        entranceOverlay.setAttribute('aria-hidden', 'true');

        // Revela el contenido de la invitación mientras la puerta se abre hacia adentro
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('puerta:revelando'));
        }, 650);

        // Habilita la navegación cuando termina la apertura
        setTimeout(() => {
          document.body.classList.remove('no-scroll');
          pageWrapper?.removeAttribute('inert');
          document.dispatchEvent(new CustomEvent('puerta:abierta'));
        }, 2650);
      }, 380);
    }

    if (document.readyState === 'complete') {
      openEntranceDoor();
    } else {
      window.addEventListener('load', openEntranceDoor, { once: true });
    }

    // Respaldo de seguridad por si algún recurso externo tarda en responder
    setTimeout(() => {
      if (!doorOpened) openEntranceDoor();
    }, 2800);
  }

  async function loadPuertaModal() {
    const slot = document.getElementById('puerta-modal-slot');
    if (!slot) {
      unlockPageFallback();
      return;
    }

    const modalUrl = slot.getAttribute('data-modal-src') || 'puerta-modal.html';

    try {
      const response = await fetch(modalUrl);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${modalUrl} (${response.status})`);
      }
      const htmlContent = await response.text();
      slot.innerHTML = htmlContent;
      setupDoorAnimation();
    } catch (error) {
      console.warn('Aviso al cargar puerta-modal.html (usa un servidor local como Live Server):', error);
      unlockPageFallback();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPuertaModal);
  } else {
    loadPuertaModal();
  }
})();