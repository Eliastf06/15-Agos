/**
 * Módulo de la Puerta de Entrada (js/puerta-modal.js)
 * Carga puerta-modal.html, renderiza guirnaldas delicadas de rosas azules y celestes
 * por los bordes de la pantalla y abre las puertas hacia adentro.
 */
(function () {
  let uidCounter = 0;

  function createSvgDefs() {
    uidCounter += 1;
    const id = uidCounter;
    return {
      id,
      markup: `
        <defs>
          <radialGradient id="ro-${id}" cx="45%" cy="40%" r="58%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="60%" stop-color="#1d4ed8"/>
            <stop offset="100%" stop-color="#0f2557"/>
          </radialGradient>
          <radialGradient id="ri-${id}" cx="40%" cy="35%" r="58%">
            <stop offset="0%" stop-color="#bfdbfe"/>
            <stop offset="50%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#1e40af"/>
          </radialGradient>
          <radialGradient id="co-${id}" cx="45%" cy="40%" r="58%">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="60%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </radialGradient>
          <radialGradient id="ci-${id}" cx="40%" cy="35%" r="58%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="52%" stop-color="#e0f2fe"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </radialGradient>
          <linearGradient id="lf-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.88"/>
            <stop offset="50%" stop-color="#0f3460"/>
            <stop offset="100%" stop-color="#071936"/>
          </linearGradient>
        </defs>
      `
    };
  }

  function leafSvg(x, y, rot, scale, id) {
    return `
      <g transform="translate(${x}, ${y}) rotate(${rot}) scale(${scale})">
        <path d="M0,0 C12,-13 32,-13 46,0 C32,13 12,13 0,0 Z" fill="url(#lf-${id})" stroke="#7dd3fc" stroke-width="0.65" stroke-opacity="0.6"/>
        <path d="M2,0 L40,0" stroke="#bae6fd" stroke-width="0.6" stroke-opacity="0.65"/>
      </g>
    `;
  }

  function budSvg(x, y, rot, scale, id) {
    return `
      <g transform="translate(${x}, ${y}) rotate(${rot}) scale(${scale})">
        <path d="M-9,3 C-11,-9 0,-20 0,-20 C0,-20 11,-9 9,3 C7,11 -7,11 -9,3 Z" fill="url(#ci-${id})" stroke="#e0f2fe" stroke-width="0.75"/>
        <path d="M-10,4 C-5,11 5,11 10,4 C5,14 -5,14 -10,4 Z" fill="url(#lf-${id})"/>
      </g>
    `;
  }

  function roseSvg(x, y, scale, variant, id) {
    const outer = variant === 'royal' ? `url(#ro-${id})` : `url(#co-${id})`;
    const inner = variant === 'royal' ? `url(#ri-${id})` : `url(#ci-${id})`;
    const strokeOuter = variant === 'royal' ? '#60a5fa' : '#e0f2fe';
    const strokeInner = variant === 'royal' ? '#bfdbfe' : '#ffffff';
    const centerFill = variant === 'royal' ? '#dbeafe' : '#ffffff';

    return `
      <g transform="translate(${x}, ${y}) scale(${scale})">
        <circle cx="0" cy="0" r="32" fill="${outer}"/>
        <path d="M-27,-10 C-34,-27 -10,-36 4,-25 C17,-36 36,-21 27,-4 C36,13 21,34 2,27 C-15,36 -34,21 -27,-10 Z" fill="${outer}" stroke="${strokeOuter}" stroke-width="0.85"/>
        <path d="M-19,-5 C-23,-21 -4,-27 5,-17 C17,-25 27,-10 17,4 C23,17 7,25 -4,17 C-17,23 -25,10 -19,-5 Z" fill="${inner}" stroke="${strokeInner}" stroke-width="0.8"/>
        <path d="M-11,-3 C-13,-14 0,-17 7,-10 C14,-13 17,0 10,7 C11,14 -2,17 -10,10 C-15,11 -15,2 -11,-3 Z" fill="${outer}" stroke="${strokeInner}" stroke-width="0.85"/>
        <path d="M-5,-2 C-5,-9 4,-10 6,-4 C10,1 4,7 -1,6 C-6,6 -9,1 -5,-2 Z" fill="${inner}"/>
        <circle cx="0" cy="0" r="2.6" fill="${centerFill}"/>
      </g>
    `;
  }

  /* Ramillete fino y estilizado para los bordes (no invasivo) */
  function clusterSvg(x, y, scale, rot, id) {
    return `
      <g transform="translate(${x}, ${y}) rotate(${rot}) scale(${scale})">
        ${leafSvg(-26, 6, 162, 0.9, id)}
        ${leafSvg(26, 6, 18, 0.9, id)}
        ${leafSvg(-8, -18, -110, 0.82, id)}
        ${leafSvg(10, -18, -70, 0.82, id)}
        ${roseSvg(-20, 4, 0.72, 'royal', id)}
        ${roseSvg(20, 4, 0.7, 'celeste', id)}
        ${roseSvg(0, -14, 0.62, 'royal', id)}
        ${roseSvg(0, 3, 0.84, 'celeste', id)}
        <circle cx="-34" cy="-8" r="2" fill="#e0f2fe" opacity="0.8"/>
        <circle cx="34" cy="-8" r="2" fill="#7dd3fc" opacity="0.8"/>
      </g>
    `;
  }

  /* Ramillete elegante para las esquinas */
  function cornerBouquetSvg(x, y, rot, id) {
    return `
      <g transform="translate(${x}, ${y}) rotate(${rot})">
        ${leafSvg(-32, 16, 152, 1.0, id)}
        ${leafSvg(32, 16, 28, 1.0, id)}
        ${leafSvg(-20, -28, -125, 0.95, id)}
        ${leafSvg(20, -28, -55, 0.95, id)}
        ${budSvg(44, -8, 55, 0.85, id)}
        ${budSvg(-8, 44, 145, 0.85, id)}
        ${roseSvg(-22, -12, 0.84, 'royal', id)}
        ${roseSvg(22, -14, 0.82, 'celeste', id)}
        ${roseSvg(-18, 18, 0.8, 'celeste', id)}
        ${roseSvg(18, 16, 0.78, 'royal', id)}
        ${roseSvg(0, 0, 0.96, 'celeste', id)}
      </g>
    `;
  }

  function renderAllRoseGarlands(rootEl) {
    const slots = rootEl.querySelectorAll('[data-rose-garland]');
    slots.forEach((slot) => {
      const type = slot.getAttribute('data-rose-garland');
      const { id, markup: defs } = createSvgDefs();

      if (type === 'top') {
        slot.innerHTML = `
          <svg viewBox="0 0 1440 150" preserveAspectRatio="xMidYMin slice">
            ${defs}
            <path d="M60,26 Q400,66 720,36 Q1040,66 1380,26" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.45"/>
            ${clusterSvg(220, 38, 0.92, -8, id)}
            ${clusterSvg(390, 46, 0.85, 10, id)}
            ${clusterSvg(555, 40, 0.84, -6, id)}
            ${clusterSvg(720, 34, 0.96, 0, id)}
            ${clusterSvg(885, 40, 0.84, 6, id)}
            ${clusterSvg(1050, 46, 0.85, -10, id)}
            ${clusterSvg(1220, 38, 0.92, 8, id)}
          </svg>
        `;
      } else if (type === 'bottom') {
        slot.innerHTML = `
          <svg viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice">
            ${defs}
            <path d="M60,124 Q400,84 720,114 Q1040,84 1380,124" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.45"/>
            ${clusterSvg(220, 112, 0.92, 8, id)}
            ${clusterSvg(390, 104, 0.85, -10, id)}
            ${clusterSvg(555, 110, 0.84, 6, id)}
            ${clusterSvg(720, 116, 0.96, 180, id)}
            ${clusterSvg(885, 110, 0.84, -6, id)}
            ${clusterSvg(1050, 104, 0.85, 10, id)}
            ${clusterSvg(1220, 112, 0.92, -8, id)}
          </svg>
        `;
      } else if (type === 'left') {
        slot.innerHTML = `
          <svg viewBox="0 0 160 900" preserveAspectRatio="xMinYMid slice">
            ${defs}
            <path d="M32,60 Q62,260 28,450 Q62,640 32,840" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.45"/>
            ${clusterSvg(38, 195, 0.86, 14, id)}
            ${clusterSvg(34, 345, 0.82, -12, id)}
            ${clusterSvg(40, 450, 0.9, 10, id)}
            ${clusterSvg(34, 555, 0.82, -10, id)}
            ${clusterSvg(38, 705, 0.86, 14, id)}
          </svg>
        `;
      } else if (type === 'right') {
        slot.innerHTML = `
          <svg viewBox="0 0 160 900" preserveAspectRatio="xMaxYMid slice">
            ${defs}
            <path d="M128,60 Q98,260 132,450 Q98,640 128,840" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.45"/>
            ${clusterSvg(122, 195, 0.86, -14, id)}
            ${clusterSvg(126, 345, 0.82, 12, id)}
            ${clusterSvg(120, 450, 0.9, -10, id)}
            ${clusterSvg(126, 555, 0.82, 10, id)}
            ${clusterSvg(122, 705, 0.86, -14, id)}
          </svg>
        `;
      } else if (type === 'corner-tl') {
        slot.innerHTML = `
          <svg viewBox="0 0 240 240" preserveAspectRatio="xMinYMin meet">
            ${defs}
            ${cornerBouquetSvg(58, 58, -10, id)}
            ${clusterSvg(138, 42, 0.72, 12, id)}
            ${clusterSvg(42, 138, 0.72, -14, id)}
          </svg>
        `;
      } else if (type === 'corner-tr') {
        slot.innerHTML = `
          <svg viewBox="0 0 240 240" preserveAspectRatio="xMaxYMin meet">
            ${defs}
            ${cornerBouquetSvg(182, 58, 80, id)}
            ${clusterSvg(102, 42, 0.72, -12, id)}
            ${clusterSvg(198, 138, 0.72, 14, id)}
          </svg>
        `;
      } else if (type === 'corner-bl') {
        slot.innerHTML = `
          <svg viewBox="0 0 240 240" preserveAspectRatio="xMinYMax meet">
            ${defs}
            ${cornerBouquetSvg(58, 182, -100, id)}
            ${clusterSvg(138, 198, 0.72, -12, id)}
            ${clusterSvg(42, 102, 0.72, 14, id)}
          </svg>
        `;
      } else if (type === 'corner-br') {
        slot.innerHTML = `
          <svg viewBox="0 0 240 240" preserveAspectRatio="xMaxYMax meet">
            ${defs}
            ${cornerBouquetSvg(182, 182, 170, id)}
            ${clusterSvg(102, 198, 0.72, 12, id)}
            ${clusterSvg(198, 102, 0.72, -14, id)}
          </svg>
        `;
      } else if (type === 'crest-top') {
        slot.innerHTML = `
          <svg viewBox="0 0 260 80">
            ${defs}
            ${leafSvg(78, 42, 165, 0.75, id)}
            ${leafSvg(182, 42, 15, 0.75, id)}
            ${roseSvg(96, 38, 0.5, 'royal', id)}
            ${roseSvg(164, 38, 0.5, 'royal', id)}
            ${roseSvg(130, 30, 0.62, 'celeste', id)}
          </svg>
        `;
      } else if (type === 'crest-bottom') {
        slot.innerHTML = `
          <svg viewBox="0 0 260 72">
            ${defs}
            ${leafSvg(84, 32, -165, 0.68, id)}
            ${leafSvg(176, 32, -15, 0.68, id)}
            ${roseSvg(102, 32, 0.44, 'celeste', id)}
            ${roseSvg(158, 32, 0.44, 'celeste', id)}
            ${roseSvg(130, 38, 0.52, 'royal', id)}
          </svg>
        `;
      }
    });
  }

  function revealInvitationContent() {
    const pageWrapper = document.getElementById('page-wrapper');
    pageWrapper?.classList.add('is-revealed');
    document.dispatchEvent(new CustomEvent('puerta:revelando'));
  }

  function unlockPageFallback() {
    const pageWrapper = document.getElementById('page-wrapper');
    document.body.classList.remove('no-scroll');
    pageWrapper?.removeAttribute('inert');
    revealInvitationContent();
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

    renderAllRoseGarlands(entranceOverlay);

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

        // El contenido de la invitación emerge del fondo recién cuando las puertas están terminando de abrirse
        setTimeout(() => {
          revealInvitationContent();
        }, 2350);

        // Habilita el scroll y la interacción al completarse la apertura
        setTimeout(() => {
          document.body.classList.remove('no-scroll');
          pageWrapper?.removeAttribute('inert');
          document.dispatchEvent(new CustomEvent('puerta:abierta'));
        }, 3150);
      }, 420);
    }

    if (document.readyState === 'complete') {
      openEntranceDoor();
    } else {
      window.addEventListener('load', openEntranceDoor, { once: true });
    }

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