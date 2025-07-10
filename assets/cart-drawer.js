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

  function updateCartItemQuantity(itemKey, newQuantity) {
    fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: itemKey, quantity: newQuantity }),
    })
      .then(() => {
        refreshCartDrawer(); // update drawer items

        // ✅ fetch latest cart data and update badge
        return fetch("/cart.js");
      })
      .then((res) => res.json())
      .then((cart) => {
        updateCartBadgeFromData(cart); // ✅ update badge count
      })
      .catch((err) => console.error("Cart update failed", err));
  }

  function updateCartBadgeFromData(cart) {
    const badge = document.getElementById("cartItemCount");
    if (!badge) return;

    if (cart.item_count > 0) {
      badge.classList.remove("hidden");
      badge.textContent = cart.item_count;
    } else {
      badge.classList.add("hidden");
    }
  }

  function refreshCartDrawer() {
    fetch("/?sections=cart-drawer")
      .then((res) => res.json())
      .then((data) => {
        const parser = new DOMParser();
        const html = parser.parseFromString(data["cart-drawer"], "text/html");
        const updatedItems = html.querySelector("#cartDrawerItems");
        document.querySelector("#cartDrawerItems").innerHTML =
          updatedItems.innerHTML;
        attachCartItemListeners();
      });
  }

  function attachCartItemListeners() {
    document.querySelectorAll(".cart-item").forEach((item) => {
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

  attachCartItemListeners();
});
