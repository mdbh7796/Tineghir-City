// 8. Active nav link is set by js/drawer.js from location.pathname
// (the old anchor scrollspy has no sections to observe on split pages).

// 9. Android back button: drawer -> page history -> exit.
// Native only (the event fires solely in the Capacitor app); in a desktop
// browser the default back behavior is untouched.
function initBackButton() {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App || typeof App.addListener !== 'function') return;

  App.addListener('backButton', () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && !lightbox.classList.contains('hidden')) {
      document.getElementById('lightbox-close').click();
      return;
    }
    const drawerApi = window.__drawer;
    if (drawerApi && drawerApi.isDrawerOpen()) {
      drawerApi.closeDrawer(true);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (typeof App.exitApp === 'function') App.exitApp();
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initLightbox();
  initMap();
  initShareButtons();
  initSaveButtons();
  initNavigateButtons();
  initSortControl();
  initBackButton();
});
