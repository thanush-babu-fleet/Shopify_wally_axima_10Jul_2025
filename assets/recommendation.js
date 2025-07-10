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

          if (typeof initQuickView === 'function') initQuickView();
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('product-recommendations', ProductRecommendations);

window.initQuickView = function () {
  document.querySelectorAll('.quick-view').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const content = document.getElementById(`quick-view-${id}`);
      const modal = document.getElementById('quick-view-modal');
      if (!content || !modal) return;

      document.body.classList.add("overflow-hidden");
      document.getElementById('quick-view-content').innerHTML = content.innerHTML;
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const slider = modal.querySelector('.product-slide');
      if (slider && !slider.classList.contains('slick-initialized')) {
        $(slider).slick({
          slidesToShow: 1,
          arrows: true,
          dots: false,
          fade: false,
          prevArrow: '<button type="button" class="slick-prev custom-prev button icon-btn" aria-label="Previous slide"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="-0.5" y="0.5" width="39" height="39" rx="19.5" transform="matrix(-1 0 0 1 39 0)" fill="white"/><rect x="-0.5" y="0.5" width="39" height="39" rx="19.5" transform="matrix(-1 0 0 1 39 0)" stroke="#273025"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.5667 13.8798C18.8401 13.6065 19.2833 13.6065 19.5567 13.8798C19.8301 14.1532 19.8301 14.5964 19.5567 14.8698L15.1267 19.2998H26.5617C26.9483 19.2998 27.2617 19.6132 27.2617 19.9998C27.2617 20.3864 26.9483 20.6998 26.5617 20.6998H15.1267L19.5567 25.1298C19.8301 25.4032 19.8301 25.8464 19.5567 26.1198C19.2833 26.3931 18.8401 26.3931 18.5667 26.1198L12.9417 20.4948C12.8746 20.4277 12.824 20.3503 12.7898 20.2678C12.7568 20.188 12.738 20.1008 12.7368 20.0094C12.7366 19.995 12.7368 19.9806 12.7375 19.9662C12.7455 19.7984 12.8136 19.633 12.9417 19.5048L18.5667 13.8798Z" fill="#273025"/></svg></button>',
          nextArrow: '<button type="button" class="slick-next custom-next button icon-btn" aria-label="Next slide"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="39" height="39" rx="19.5" fill="white"/><rect x="0.5" y="0.5" width="39" height="39" rx="19.5" stroke="#273025"/><path d="M20.4434 13.8798C20.7167 13.6065 21.1602 13.6065 21.4336 13.8798L27.0586 19.5048L27.1484 19.6142C27.1654 19.6399 27.1772 19.6681 27.1904 19.6953C27.1962 19.7072 27.2039 19.7182 27.209 19.7304C27.2174 19.7507 27.2221 19.7721 27.2285 19.7929C27.2489 19.8586 27.2637 19.9276 27.2637 19.9999C27.2637 20.0589 27.252 20.1152 27.2383 20.1699C27.2304 20.2013 27.2242 20.2333 27.2119 20.2636C27.2112 20.2654 27.2097 20.2668 27.209 20.2685C27.2063 20.275 27.2021 20.2807 27.1992 20.2871C27.1833 20.3223 27.1656 20.3569 27.1436 20.3896C27.1182 20.4272 27.0905 20.4631 27.0586 20.4951L21.4336 26.1201C21.1603 26.3934 20.7167 26.3932 20.4434 26.1201C20.17 25.8467 20.17 25.4032 20.4434 25.1298L24.873 20.7001H13.4385C13.0519 20.7001 12.7384 20.3865 12.7383 19.9999C12.7383 19.6133 13.0519 19.2998 13.4385 19.2998H24.873L20.4434 14.8701C20.17 14.5967 20.17 14.1532 20.4434 13.8798Z" fill="#273025"/></svg></button>',
          infinite: true,
        });
      }

      const variants = JSON.parse(modal.querySelector(`.variants-${id}`).dataset.variants);
      const hiddenInput = modal.querySelector('input[name="id"]');
      const variantButtons = modal.querySelectorAll('.variant-btn');
      let selectedOptions = [...variants[0].options];

      variantButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          const optionIndex = parseInt(this.dataset.optionIndex);
          const optionValue = this.dataset.optionValue;
          selectedOptions[optionIndex] = optionValue;

          const group = this.closest('.variant-option-group');
          group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('bg-black', 'text-white', 'selected-btn'));
          this.classList.add('bg-black', 'text-white', 'selected-btn');

          const matchedVariant = variants.find(v =>
            v.options.every((opt, idx) => selectedOptions[idx] === opt)
          );

          if (matchedVariant) {
            hiddenInput.value = matchedVariant.id;
            modal.querySelector('.add-to-cart').setAttribute('data-id', matchedVariant.id);
            const paymentInput = modal.querySelector(`.payment-variant-id-${id}`);
            if (paymentInput) {
              paymentInput.value = matchedVariant.id;
            }
          }
        });
      });
    });
  });

  document.addEventListener("click", function (event) {
    const modal = document.getElementById("quick-view-modal");
    const content = event.target.closest(".modal-content");
       const closeBtn = event.target.closest(".close-modal");
    
    if ((modal && !content && event.target.closest(".modalbg")) || closeBtn) {
      document.body.classList.remove("overflow-hidden");
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.getElementById('quick-view-content').innerHTML = '';
    }
  });
};
