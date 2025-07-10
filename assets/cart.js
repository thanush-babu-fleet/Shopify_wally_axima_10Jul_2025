document.addEventListener("DOMContentLoaded", function () {
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const openCartBtn = document.getElementById("openCartDrawer");
  const closeCartBtn = document.getElementById("closeCartDrawer");

  function openCartDrawer() {
    cartDrawer.classList.remove("hidden");
    cartOverlay.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function closeCartDrawer() {
    cartDrawer.classList.add("hidden");
    cartOverlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  openCartBtn?.addEventListener("click", openCartDrawer);
  closeCartBtn?.addEventListener("click", closeCartDrawer);

  document.addEventListener("click", function (e) {
    const isClickInsideDrawer = cartDrawer.contains(e.target);
    const isClickOnOpenButton = openCartBtn?.contains(e.target);
    const isOverlayVisible = !cartOverlay.classList.contains("hidden");

    if (!isClickInsideDrawer && !isClickOnOpenButton && isOverlayVisible) {
      closeCartDrawer();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !cartDrawer.classList.contains("hidden")) {
      closeCartDrawer();
    }
  });

  document.addEventListener("click", function (event) {
    const button = event.target.closest(".add-to-cart");
    if (!button) return;

    const productId = button.getAttribute("data-id");
    const quantityElement = document.getElementById(`quantity_${productId}`);
    const selectedQuantity =
      document.getElementById("selectedQuantity")?.dataset?.quantity;
    const wishlistselectedQuantity = document.getElementById(
      `selectedQuantity-${productId}`
    )?.dataset?.quantity;

     const originalSvg = button.querySelector('svg');
    if (originalSvg) {
      const loaderSvg = `
        <svg class="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
      `;
      originalSvg.outerHTML = loaderSvg;
    }
    button.disabled = true;

    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: productId,
        quantity: selectedQuantity || wishlistselectedQuantity || 1,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        updateProductCartCount();
        refreshCartDrawer();
        refreshCartPage();
        updateCartBadge();
        updatewishlistquantity(productId);
        const loaderSvg = button.querySelector('svg');
        if (loaderSvg && originalSvg) {
          loaderSvg.outerHTML = originalSvg.outerHTML;
        }
        button.disabled = false;
      })
      .catch((error) => {
        console.error("Add to cart failed:", error);
        const loaderSvg = button.querySelector('svg');
        if (loaderSvg && originalSvg) {
          loaderSvg.outerHTML = originalSvg.outerHTML;
        }
        button.disabled = false;
      });
  });

  function syncProductQuantitiesWithCart(cart) {
    const allBubbles = document.querySelectorAll(".quantity");
    allBubbles.forEach((el) => {
      el.textContent = "";
      el.classList.add("opacity-0");
    });
    const productQuantities = {};

    cart.items.forEach((item) => {
      const productId = item.product_id;
      if (!productQuantities[productId]) {
        productQuantities[productId] = 0;
      }
      productQuantities[productId] += item.quantity;
    });
    Object.entries(productQuantities).forEach(([productId, totalQty]) => {
      // Update regular product-card quantity badges
      const quantityElement = document.getElementById(`quantity_${productId}`);
      if (quantityElement) {
        quantityElement.textContent = totalQty;
        quantityElement.classList.remove("opacity-0");
        quantityElement.classList.remove("bump");
        void quantityElement.offsetWidth;
        quantityElement.classList.add("bump");
      }
      
      // Update testimonial quantity badges
      const testimonialQuantityElement = document.getElementById(`testimonial_quantity_${productId}`);
      if (testimonialQuantityElement) {
        testimonialQuantityElement.textContent = totalQty;
        testimonialQuantityElement.classList.remove("opacity-0");
        testimonialQuantityElement.classList.remove("bump");
        void testimonialQuantityElement.offsetWidth;
        testimonialQuantityElement.classList.add("bump");
      }
    });
    document.body.classList.remove("overflow-hidden");
  }

  function updateProductCartCount() {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        syncProductQuantitiesWithCart(cart);
        document.getElementById("quick-view-modal")?.classList.add("hidden");
      })
      .catch((err) => console.error("Error updating product quantity", err));
  }

  function refreshCartPage() {
    fetch("/?sections=cart-page")
      .then((res) => res.json())
      .then((data) => {
        const parser = new DOMParser();
        const html = parser.parseFromString(data["cart-page"], "text/html");

        const newPage = html.querySelector(".cartPage");
        const cartPage = document.querySelector(".cartPage");

        if (newPage && cartPage) {
          cartPage.innerHTML = newPage.innerHTML;
          attachCartItemListeners();
          document.dispatchEvent(new Event("cart:updated"));
        }
      })
      .catch((err) => console.error("Failed to refresh cart-page items", err));
  }

  function refreshCartDrawer() {
    fetch("/?sections=cart-drawer")
      .then((res) => res.json())
      .then((data) => {
        const parser = new DOMParser();
        const html = parser.parseFromString(data["cart-drawer"], "text/html");

        const newItems = html.querySelector("#cartDrawerItems");
        const newEmptyUi = html.querySelector("#emptyCartUi");
        const newCartActions = html.querySelector("#cartActions");
        const newNote = html.querySelector("#cart-drawer-note-wrapper");
        const newTerms = html.querySelector("#termsCheckboxWrapper");

        const cartDrawerItems = document.querySelector("#cartDrawerItems");
        const emptyCartUi = document.querySelector("#emptyCartUi");
        const cartActions = document.querySelector("#cartActions");
        const oldNote = document.querySelector("#cart-drawer-note-wrapper");
        const oldTerms = document.querySelector("#termsCheckboxWrapper");

        if (newNote && oldNote) {
          oldNote.innerHTML = newNote.innerHTML;
        }
        if (newTerms && oldTerms) {
          oldTerms.innerHTML = newTerms.innerHTML;
        }
        if (newItems && cartDrawerItems) {
          cartDrawerItems.innerHTML = newItems.innerHTML;
        }
        if (newEmptyUi && emptyCartUi) {
          emptyCartUi.innerHTML = newEmptyUi.innerHTML;
        }
        if (newCartActions && cartActions) {
          cartActions.innerHTML = newCartActions.innerHTML;
        }

        const hasItems =
          newItems && newItems.querySelectorAll(".cart-item").length > 0;

        if (hasItems) {
          cartDrawerItems?.classList.remove("hidden");
          cartActions?.classList.remove("hidden");
          emptyCartUi?.classList.add("hidden");
          oldNote?.classList.remove("hidden");
          oldTerms?.classList.remove("hidden");
        } else {
          cartDrawerItems?.classList.add("hidden");
          cartActions?.classList.add("hidden");
          emptyCartUi?.classList.remove("hidden");
          oldNote?.classList.add("hidden");
          oldTerms?.classList.add("hidden");
        }

        attachCartItemListeners();
        fetch("/cart.js")
          .then((res) => res.json())
          .then((cart) => {
            updateCartBadgeFromData(cart);
            syncProductQuantitiesWithCart(cart);
          });
      });
  }

  function updateCartBadge() {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => updateCartBadgeFromData(cart))
      .catch((err) => console.error("Cart badge update failed", err));
  }

  function updateCartBadgeFromData(cart) {
    const badge = document.getElementById("cartItemCount");
    if (!badge) return;

    if (cart.item_count > 0) {
      badge.classList.remove("hidden");
      badge.textContent = cart.item_count;
      document.getElementById("selectedQuantity").dataset.quantity = "1";
      document.getElementById("selectedQuantity").textContent = "1";
      document.getElementById("quantityInput").value = "1";
    } else {
      badge.classList.add("hidden");
    }
  }

  function attachCartItemListeners() {
    const allItems = document.querySelectorAll(".cart-item");
    allItems.forEach((item) => {
      const itemKey = item.getAttribute("data-key");
      const qtyDisplay = item.querySelector(".quantityAmount");
      const plusBtn = item.querySelector(".increaseQuantity");
      const minusBtn = item.querySelector(".decreaseQuantity");
      const removeBtn = item.querySelector(".cart-remove-button");

      plusBtn?.addEventListener("click", () => {
        const currentQty = parseInt(qtyDisplay.textContent, 10);
        updateCartItemQuantity(itemKey, currentQty + 1);
      });

      minusBtn?.addEventListener("click", () => {
        const currentQty = parseInt(qtyDisplay.textContent, 10);
        updateCartItemQuantity(itemKey, currentQty > 1 ? currentQty - 1 : 0);
      });

      removeBtn?.addEventListener("click", () => {
        updateCartItemQuantity(itemKey, 0);
      });
    });
  }

  function updatewishlistquantity(id) {
    document.getElementById(`selectedQuantity-${id}`).dataset.quantity = "1";
    document.getElementById(`selectedQuantity-${id}`).textContent = "1";
    document.getElementById("quantityDisplay").value = "1";
  }

  function showEmptyCartUI() {
    fetch("/?sections=cart-page")
      .then((res) => res.json())
      .then((data) => {
        const parser = new DOMParser();
        const html = parser.parseFromString(data["cart-page"], "text/html");

        const newContent = html.querySelector(".cartPage")?.innerHTML;
        const cartPage = document.querySelector(".cartPage");

        if (newContent && cartPage) {
          cartPage.innerHTML = newContent;
        }

        updateCartBadge();
      })
      .catch((err) => console.error("Failed to refresh empty cart UI", err));
  }

  function updateCartSummary(cart) {
    const itemCountText = document.getElementById("cartItemCountText");
    const totalPriceTexts = document.querySelectorAll("#cartTotalPriceMobile, #cartTotalPriceDesktop");

    if (itemCountText) {
      itemCountText.textContent = `${cart.item_count} items added`;
    }

    totalPriceTexts.forEach(el => {
      el.textContent = `$${(cart.total_price / 100).toFixed(2)}`;
    });
  }

  function updateCartItemQuantity(itemKey, newQuantity) {
    const qtyWrappers = document.querySelectorAll(
      `[data-key="${itemKey}"] .quantityAmount`
    );
    qtyWrappers.forEach((wrapper) => {
      const qtyText = wrapper.querySelector(".quantityText");
      const loader = wrapper.querySelector(".quantityLoader");
      if (qtyText && loader) {
        qtyText.classList.add("hidden");
        loader.classList.remove("hidden");
      }
    });

    fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemKey, quantity: newQuantity }),
    })
      .then(() => fetch("/cart.js"))
      .then((res) => res.json())
      .then((cart) => {
        if (cart.item_count === 0) {
          refreshCartDrawer();
          showEmptyCartUI();
        } else {
          refreshCartDrawer();
          refreshCartPage();
          updateCartSummary(cart);
        }
        updateCartBadgeFromData(cart);
        syncProductQuantitiesWithCart(cart);
      })
      .finally(() => {
        setTimeout(() => {
          fetch("/cart.js")
            .then((res) => res.json())
            .then((cart) => {
              cart.items.forEach((item) => {
                if (item.key === itemKey) {
                  const updatedQtyWrappers = document.querySelectorAll(
                    `[data-key="${itemKey}"] .quantityAmount`
                  );
                  updatedQtyWrappers.forEach((wrapper) => {
                    const qtyText = wrapper.querySelector(".quantityText");
                    const loader = wrapper.querySelector(".quantityLoader");
                    if (qtyText && loader) {
                      qtyText.textContent = item.quantity;
                      loader.classList.add("hidden");
                      qtyText.classList.remove("hidden");
                    }
                  });
                }
              });
            });
        }, 100);
      })
      .catch((err) => console.error("Cart update failed", err));
  }

  attachCartItemListeners();
});
