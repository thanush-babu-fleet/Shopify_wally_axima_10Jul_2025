class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      this.loadRecommendations(productId);
    }, { rootMargin: '0px 0px 400px 0px' });
    this.observer.observe(this);
  }

  loadRecommendations(productId) {
    fetch(`${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div');
        html.innerHTML = text;

        const recommendations = html.querySelector('product-recommendations');
        const modals = html.querySelectorAll('[id^="quick-view-"]');

        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;

          // Append modals to .modalbg or body
          const modalWrapper = document.querySelector('.modalbg') || document.body;
          modals.forEach(modal => {
            if (!document.getElementById(modal.id)) {
              modalWrapper.appendChild(modal);
            }
          });

          // Re-initialize quick view functionality for new elements
          if (typeof initQuickView === 'function') initQuickView();
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('product-recommendations', ProductRecommendations);

// Keep the initQuickView function for backward compatibility but make it minimal
window.initQuickView = function () {
  // This function is now handled by the quick-view.liquid snippet
  // Just ensure modals are properly appended to the DOM
  const modals = document.querySelectorAll('[id^="quick-view-"]');
  const modalWrapper = document.querySelector('.modalbg') || document.body;
  modals.forEach(modal => {
    if (!modalWrapper.contains(modal)) {
      modalWrapper.appendChild(modal);
    }
  });
  
  // Trigger quick view button initialization if the function exists
  if (typeof window.initQuickViewButtons === 'function') {
    window.initQuickViewButtons();
  }
};
