document.addEventListener('DOMContentLoaded', () => {
  const toastContainer = document.getElementById('toast-container');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  /* ==========================================================================
     1. SISTEMA DE NOTIFICACIONES TOAST
     ========================================================================== */
  function showToast(message, iconClass = 'fa-sparkles', duration = 3800) {
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
  }

  /* ==========================================================================
     2. SMOOTH REVEAL AL HACER SCROLL Y SINCRONIZACIÓN CON LA PUERTA
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

  document.addEventListener('puerta:abierta', () => {
    showToast('Bienvenidos a los 15 años de Agostina', 'fa-crown');
  });
});