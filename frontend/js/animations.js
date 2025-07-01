document.addEventListener('DOMContentLoaded', () => {
  // Animate tab content appearance
  const observer = new MutationObserver(() => {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      anime({
        targets: activeTab,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Animate tab and CTA buttons on hover
  document.querySelectorAll('.tab-button, .cta-button').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      anime({
        targets: btn,
        scale: 1.05,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
    btn.addEventListener('mouseleave', () => {
      anime({
        targets: btn,
        scale: 1.0,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
  });

  // Animate grocery items on add
  const groceryList = document.getElementById('grocery-list');
  if (groceryList) {
    const listObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            anime({
              targets: node,
              opacity: [0, 1],
              scale: [0.8, 1],
              duration: 400,
              easing: 'easeOutBack'
            });
          }
        });
      });
    });
    listObserver.observe(groceryList, { childList: true });
  }

  // Animate grocery items on remove (override default removeBtn behavior)
  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const li = e.target.closest('li');
      anime({
        targets: li,
        opacity: [1, 0],
        scale: [1, 0.6],
        duration: 300,
        easing: 'easeInBack',
        complete: () => li.remove()
      });
    }
  });

  // Animate theme switch toggle
  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
      anime({
        targets: 'body',
        opacity: [0.7, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
  }

  // Animate YouTube iframe on load
  const videoContainer = document.getElementById('video-container');
  if (videoContainer) {
    const observerYT = new MutationObserver(() => {
      const iframe = videoContainer.querySelector('iframe');
      if (iframe) {
        anime({
          targets: iframe,
          opacity: [0, 1],
          scale: [0.95, 1],
          duration: 600,
          easing: 'easeOutExpo'
        });
      }
    });
    observerYT.observe(videoContainer, { childList: true });
  }
});
