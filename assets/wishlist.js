const API_URL = "https://kseurtdbzpaizwjbrikulj4gdu0orlgq.lambda-url.us-east-1.on.aws"; // Replace with your real API

async function addToWishlist(customerId, productId, variantId) {
  await fetch(`${API_URL}/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, productId, variantId }),
  });
}

async function getWishlist(customerId) {
    const response = await fetch(`${API_URL}/wishlist?customerId=${customerId}`);
    return response.json();
}

async function removeFromWishlist(customerId, productId, variantId) {
  try {
    const res = await fetch(`${API_URL}/wishlist/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, productId, variantId }),
    });
  } catch (err) {
    console.error("Error while removing from wishlist:", err);
  }
}

async function updateWishlistCount() {
  const wishlist = await getWishlist(window.customerId);
  const count = wishlist?.wishlist?.length || 0;

  const headerCount = document.getElementById('wishlist-header-count');
  const pageCount = document.getElementById('wishlist-page-count');

  if (headerCount) {
    headerCount.textContent = count;

    if (count > 0) {
      headerCount.classList.remove('hidden');
      headerCount.classList.add('block');
    } else {
      headerCount.classList.add('hidden');
      headerCount.classList.remove('block');
    }
  }

  if (pageCount) {
    pageCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
}

async function fetchProductByHandle(handle) {
  try {
    const res = await fetch(`/products/${handle}.js`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch product ${handle}`, err);
    return null;
  }
}

async function renderWishlistPage() {
  const container = document.getElementById('wishlist-container');
  const customerId = window.customerId;

  if (!customerId) {
    container.innerHTML = `<p>Please <a href="/account/login" class="underline text-blue-600 hover:text-blue-800">log in</a> to view your wishlist.</p>`;
    return;
  }

  const response = await getWishlist(customerId);
  const wishlistHandles = response.wishlist;
  console.log("wishlistHandles:",wishlistHandles)

  if (!Array.isArray(wishlistHandles) || wishlistHandles.length === 0) {
    container.innerHTML = "<p>Your wishlist is empty.</p>";
    return;
  }

  const productDataArray = await Promise.all(
    wishlistHandles.map(async (handle) => {
      const productData = await fetchProductByHandle(handle.productId);
      return {
        ...productData,
        selectedVariantId: handle.variantId
      };
    })
  );
  
  const products = productDataArray.filter(product => product);
  if (products.length === 0) {
    container.innerHTML = "<p>None of the products could be loaded.</p>";
    return;
  }

const itemsHTML = products.map(product => {
    const {
      id,
      handle,
      title,
      images = [],
      media = [],
      price,
      compare_at_price,
      variants = [],
      options = [],
      selectedVariantId,
    } = product;

    console.log("selectedVariantId:",selectedVariantId)
    console.log("product:",product)
    console.log("variants:",variants)
    
    // Choose the first available image from the media array, or use a fallback
    const imageSrc = media.length > 0 ? media[0].src : 'https://via.placeholder.com/600x800?text=No+Image';
    const badgeType = window.shopSettings?.badge_type;
    const firstVariant = variants[0];
    const variantId = product.selectedVariantId;
    const matchedVariant = variants.find(v => v.id === Number(variantId));
    const defaultVariant = matchedVariant;
    // const defaultVariant = variants[0];
    const firstVariantId = defaultVariant?.id || '';
    const isSoldOut = !firstVariant?.available;
    const compareAtPrice = firstVariant?.compare_at_price || 0;
  
    const discount = compareAtPrice - price;
    const discountPercentage = compareAtPrice > 0 ? Math.round((discount * 100) / compareAtPrice) : 0;
      
    let badgeHTML = '';
  
    if (isSoldOut) {
      badgeHTML = `
        <span class="w-max text-xs font-semibold px-3 py-1 rounded z-10"
          style="border-radius: var(--badge-radius); background: var(--sold-out-background-color); color: var(--badge-text-color);">
          Sold Out
        </span>
      `;
    } else if (price < compareAtPrice) {
      let label = 'Sale';
  
      if (badgeType === 'save_amount') {
        label = `Save $${(discount / 100).toFixed(2)}`;
      } else if (badgeType === 'save_percentage') {
        label = `Save ${discountPercentage}%`;
      }
  
      badgeHTML = `
        <span class="w-max bg-black text-white text-xs font-semibold px-3 py-1 rounded z-10"
          style="border-radius: var(--badge-radius); background: var(--sale-background-color); color: var(--badge-text-color:);">
          ${label}
        </span>
      `;
    }

    const variantOptions = options.map((option, optionIndex) => {
      if (variants.length === 1 && variants[0].title === "Default Title") {
        return '';
      }
      const optionValues = [
        ...new Set(variants.map(variant => variant.options[optionIndex]))
      ];

      const buttons = optionValues.map(value => {
        const isAvailable = variants.some(v =>
          v.options[optionIndex] === value && v.available
        );

        const isSelected = defaultVariant?.options[optionIndex] === value;
        const disabledClass = isAvailable
          ? ''
          : 'hidden';

        const selectedClass = isSelected
          ? 'bg-black text-white selected-btn 1'
          : '';

        const btnClass = option.name === 'Color'
          ? `variant-btn color-btn rounded-full p-0.5 ${disabledClass} ${selectedClass}`
          : `variant-btn border border-black px-2.5 py-1 rounded ${disabledClass} ${selectedClass}`;

        const labelContent = option.name === 'Color'
          ? `<span class="w-5 h-5 block rounded-full border border-gray-50" style="background-color: ${value.toLowerCase()};"></span>`
          : value.charAt(0).toUpperCase() + value.slice(1);

        return `
          <button
            class="${btnClass.trim()}"
            type="button"
            aria-label="${value}"
            data-option-index="${optionIndex}"
            data-option-value="${value}">
            ${labelContent}
          </button>
        `;
      }).join("");

      return `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4">
          <label class="block font-semibold" style="color: #273025;">${option.name}</label>
          <div class="flex gap-2 flex-wrap variant-option-group" data-option-index="${optionIndex}">
            ${buttons}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div id="wishlistitem-${id}" class="wishlist-item modal-content flex flex-col border overflow-hidden w-full bg-white" data-product-id="${product.handle }"  data-variant-id='${variantId}' data-variants='${JSON.stringify(variants)}'>
        <div class="product-slide relative w-full" role="region" aria-label="carousel">
          <a href="/products/${handle}" class="product-slide relative w-full h-full block" role="region" aria-label="carousel">
            <img src="${imageSrc}" alt="${title}" class="w-full h-full object-cover" />
          </a>
        </div>
        <div class="p-6 w-full h-full flex flex-col justify-between">
        <div>
        <div class="flex justify-between items-center">
           <a href="/products/${handle}" role="region" aria-label="carousel">
            <p class="text-xl font-bold capitalize !leading-normal">
              ${title}
            </p>
          </a>
          <div class="badge-wrapper">
            ${badgeHTML}
          </div>
        </div>
        <p class="text-primary font-semibold tracking-wider">
          $${(price / 100).toFixed(2)}
          ${compare_at_price ? `<span style="color: #8E9689;" class="font-bold pl-2 line-through text-base">$${(compare_at_price / 100).toFixed(2)}</span>` : ''}
        </p>

        ${options.length > 0 ? variantOptions : ''}

        <input type="hidden" class="selected-variant-id-${id}" name="id" value="${firstVariantId}">

        <div class="mt-4 flex gap-4 items-center">
        <p class="font-bold" style="color: #273025;">Quantity</p>
        <div class="cart-quantity-control flex flex-row justify-between mt-2">
          <div class="font-bold justify-between flex flex-row border border-black py-2 px-4 w-24">
            <button id="decreaseQuantity" class="border-none bg-transparent decreaseQuantity" aria-label="Decrease Quantity">
              <span class="svg-wrapper">
                <svg width="12" height="12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-minus" viewBox="0 0 10 2"><path fill="currentColor" fill-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clip-rule="evenodd"/></svg>
              </span>
            </button>
            <div id="selectedQuantity-${firstVariantId}" class="selectedQuantity" data-quantity="1">1</div>
            <button id="increaseQuantity" class="increaseQuantity border-none bg-transparent" aria-label="Increase Quantity">
              <span class="svg-wrapper">
                <svg width="12" height="12" aria-hidden="true" tabindex="-1" xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-plus" viewBox="0 0 10 10"><path fill="currentColor" fill-rule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clip-rule="evenodd"/></svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="product-description mt-4">
        ${ product.description?.replace(/<[^>]*>/g, '').slice(0, 50) }${ product.description?.length > 50 ? '...' : '' }
      </div> 
      </div>
      ${firstVariant.available ? `
        <div class="flex gap-3 items-center mt-4">
          <button class="add-to-cart text-black font-medium py-1 pl-4 pr-6 secondary-btn flex items-center" data-id="${variantId}">
            <div class="svg-wrapper p-3">
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.37644 17.9688H4.69581C4.024 17.9687 3.37438 17.7282 2.86452 17.2907C2.35466 16.8533 2.01824 16.2478 1.91612 15.5837L0.73956 7.94125C0.698468 7.67405 0.715643 7.40112 0.789909 7.14117C0.864174 6.88123 0.993774 6.64042 1.16982 6.43525C1.34587 6.23009 1.5642 6.06542 1.80985 5.95253C2.0555 5.83965 2.32265 5.78122 2.593 5.78125H13.2233C13.4937 5.78122 13.7608 5.83965 14.0065 5.95253C14.2521 6.06542 14.4704 6.23009 14.6465 6.43525C14.8225 6.64042 14.9521 6.88123 15.0264 7.14117C15.1007 7.40112 15.1178 7.67405 15.0767 7.94125L14.8302 9.5425M11.6577 16.0938H17.2827M14.4702 13.2812V18.9062M5.09519 8.59375V3.90625C5.09519 3.16033 5.3915 2.44496 5.91895 1.91751C6.44639 1.39007 7.16176 1.09375 7.90769 1.09375C8.65361 1.09375 9.36898 1.39007 9.89642 1.91751C10.4239 2.44496 10.7202 3.16033 10.7202 3.90625V8.59375" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            Add to bag
          </button>
          <button class="remove-btn p-2" aria-label="Remove Button">
            <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.47864 2.53511C8.53362 2.48014 8.60818 2.44925 8.68593 2.44925H13.3147C13.3924 2.44925 13.467 2.48014 13.522 2.53511C13.5769 2.59009 13.6078 2.66465 13.6078 2.7424V5.34977H8.39278V2.7424C8.39278 2.66466 8.42367 2.59009 8.47864 2.53511ZM7.51242 7.07783C7.51785 7.07793 7.5233 7.07798 7.52875 7.07798C7.5342 7.07798 7.53965 7.07793 7.54508 7.07783H14.4555C14.461 7.07793 14.4664 7.07798 14.4718 7.07798C14.4773 7.07798 14.4827 7.07793 14.4882 7.07783H18.1614L17.0822 20.0283C17.0802 20.0522 17.0792 20.0761 17.0792 20.1001C17.0792 20.4847 16.9264 20.8536 16.6544 21.1256C16.3824 21.3976 16.0135 21.5504 15.6289 21.5504H6.37142C5.98677 21.5504 5.61787 21.3976 5.34588 21.1256C5.07389 20.8536 4.92108 20.4847 4.92108 20.1001C4.92108 20.0761 4.92009 20.0522 4.9181 20.0283L3.83889 7.07783H7.51242ZM6.66472 5.34977V2.7424C6.66472 2.20635 6.87767 1.69224 7.25672 1.31319C7.63577 0.93414 8.14987 0.721191 8.68593 0.721191H13.3147C13.8507 0.721191 14.3648 0.93414 14.7439 1.31319C15.1229 1.69224 15.3359 2.20635 15.3359 2.7424V5.34977H19.0995H20.2579C20.7351 5.34977 21.1219 5.73661 21.1219 6.2138C21.1219 6.69099 20.7351 7.07783 20.2579 7.07783H19.8955L18.807 20.1388C18.7969 20.9678 18.4633 21.7606 17.8764 22.3475C17.2803 22.9436 16.4719 23.2784 15.6289 23.2784H6.37142C5.52846 23.2784 4.72002 22.9436 4.12396 22.3475C3.53703 21.7606 3.20336 20.9678 3.19326 20.1388L2.10484 7.07783H1.74294C1.26575 7.07783 0.878906 6.69099 0.878906 6.2138C0.878906 5.73661 1.26575 5.34977 1.74294 5.34977H2.90084H6.66472ZM8.68564 9.9787C9.16283 9.9787 9.54967 10.3655 9.54967 10.8427V17.7858C9.54967 18.263 9.16283 18.6499 8.68564 18.6499C8.20845 18.6499 7.82161 18.263 7.82161 17.7858V10.8427C7.82161 10.3655 8.20845 9.9787 8.68564 9.9787ZM14.1786 10.8427C14.1786 10.3655 13.7918 9.9787 13.3146 9.9787C12.8374 9.9787 12.4505 10.3655 12.4505 10.8427V17.7858C12.4505 18.263 12.8374 18.6499 13.3146 18.6499C13.7918 18.6499 14.1786 18.263 14.1786 17.7858V10.8427Z" fill="#273025"/>
            </svg>
          </button>
        </div>
       `
        : `
          <button class="sold-out border p-4 w-full mt-6" disabled>
            Sold Out
          </button>
        `
      }
      </div>
      </div>
    `;
  }).join("");

  container.innerHTML = itemsHTML;

  container.querySelectorAll(".remove-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const productId = button.closest('.wishlist-item').dataset.productId;
      const variantId = button.closest('.wishlist-item').dataset.variantId;
      console.log(button.closest('.wishlist-item').dataset);
      await removeFromWishlist(customerId, productId, variantId);
      // await removeFromWishlist(customerId, productId);
      updateWishlistCount();
      renderWishlistPage(); 
    });
  });

  document.querySelectorAll('.wishlist-item').forEach(item => {
    const decreaseBtn = item.querySelector('.decreaseQuantity');
    const increaseBtn = item.querySelector('.increaseQuantity');
    const quantityDisplay = item.querySelector(`.selectedQuantity`);

    if (decreaseBtn && increaseBtn && quantityDisplay) {
      decreaseBtn.addEventListener('click', () => {
        let qty = parseInt(quantityDisplay.dataset.quantity, 10);
        if (qty > 1) qty--;
        quantityDisplay.dataset.quantity = qty;
        quantityDisplay.textContent = qty;
      });

      increaseBtn.addEventListener('click', () => {
        let qty = parseInt(quantityDisplay.dataset.quantity, 10);
        qty++;
        quantityDisplay.dataset.quantity = qty;
        quantityDisplay.textContent = qty;
      });
    }
  });

 document.querySelectorAll('.wishlist-item').forEach((modal) => {
    const variantButtons = modal.querySelectorAll('.variant-btn');
    const hiddenInput = modal.querySelector('input[name="id"]');
    const productIdMatch = hiddenInput?.className.match(/selected-variant-id-(\d+)/);
    const productId = productIdMatch ? productIdMatch[1] : null;
    if (!productId || !hiddenInput) return;

    const variantsData = modal.dataset.variants;
    if (!variantsData) return;

    const variants = JSON.parse(variantsData);
    let selectedOptions = [];

     const variantId = 45508080337126;
    const matchedVariant = variants.find(v => v.id === variantId);
    const defaultVariant = matchedVariant;
    // const defaultVariant = variants[0];
    selectedOptions = [...defaultVariant?.options];

    // defaultVariant.options.forEach((opt, idx) => {
    //   const group = modal.querySelector(`.variant-option-group[data-option-index="${idx}"]`);
    //   if (group) {
    //     const btn = Array.from(group.querySelectorAll('.variant-btn')).find(b => b.dataset.optionValue === opt);
    //     if (btn) {
    //       btn.classList.add('bg-black', 'text-white', 'selected-btn');
    //     }
    //   }
    // });

    variantButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const optionIndex = parseInt(this.dataset.optionIndex);
        const optionValue = this.dataset.optionValue;

        selectedOptions[optionIndex] = optionValue;

        const group = this.closest('.variant-option-group');
        group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('bg-black', 'text-white', 'selected-btn'));
        this.classList.add('bg-black', 'text-white', 'selected-btn 1');

        const matchedVariant = variants.find(v => {
          return v.options.every((opt, idx) => selectedOptions[idx] === opt);
        });

        if (matchedVariant) {
          hiddenInput.value = matchedVariant.id;

          const cartBtn = modal.querySelector('.add-to-cart.button');
          if (cartBtn) {
            cartBtn.setAttribute('data-id', matchedVariant.id);
          }

          const quantityWrapper = modal.querySelector('.cartQuantity');
          const oldQty = quantityWrapper.querySelector('.selectedQuantity');
          if (oldQty) {
            oldQty.id = `selectedQuantity-${matchedVariant.id}`;
          }
        }
      });
    });
  }); 
}

document.addEventListener("DOMContentLoaded", () => {
  renderWishlistPage();
});

document.addEventListener("DOMContentLoaded", async () => {
  updateWishlistCount();

  const customerId = window.customerId;
  const wishlist = customerId ? await getWishlist(customerId) : null;
  const wishlistItems = wishlist?.wishlist || [];

  document.querySelectorAll('.wishlist-btn').forEach(button => {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    const svgPath = button.querySelector('svg path');

    const isInitiallyWishlisted = wishlistItems.some(
      item => item.productId === productId && item.variantId === variantId
    );

    console.log(isInitiallyWishlisted)

    // Highlight icon if already wishlisted
    if (isInitiallyWishlisted && svgPath) {
      svgPath.setAttribute('fill', '#000000');
    }

    button.addEventListener('click', async () => {
      const customerId = window.customerId;

      if (!customerId) {
        window.location.href = "/account/login";
        return;
      }

      const currentVariantId = button.dataset.variantId;
      const isWishlisted = wishlistItems.some(
        item => item.productId === productId && item.variantId === currentVariantId
      );

      if (isWishlisted) {
        await removeFromWishlist(customerId, productId, currentVariantId);
        if (svgPath) svgPath.setAttribute('fill', '#ffffff');

        const index = wishlistItems.findIndex(
          item => item.productId === productId && item.variantId === currentVariantId
        );
        if (index !== -1) wishlistItems.splice(index, 1);
      } else {
        await addToWishlist(customerId, productId, currentVariantId);
        if (svgPath) svgPath.setAttribute('fill', '#000000');
        wishlistItems.push({ productId, variantId: currentVariantId });

        const modal = document.getElementById('wishlist-modal');
        const content = document.getElementById('wishlist-content');

        if (modal && content) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          document.body.classList.add('overflow-hidden');
        }
      }

      updateWishlistCount();
    });
  });
});
