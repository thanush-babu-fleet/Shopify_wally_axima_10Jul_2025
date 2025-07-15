// Use a persistent cache on window
window.ratingCache = window.ratingCache || {};
const ratingCache = window.ratingCache;

async function fetchReviews(productId, page = 1, limit = 5) {
  const url = `https://kseurtdbzpaizwjbrikulj4gdu0orlgq.lambda-url.us-east-1.on.aws/products/${productId}/ratings?limit=${limit}&pageNumber=${page}`;
  const res = await fetch(url);
  return res.json();
}

function getProductId() {
  // Prefer the widget's data attribute if present
  const widget = document.getElementById('customer-reviews-widget');
  if (widget && widget.dataset.productId) {
    return widget.dataset.productId;
  }
  // Fallback to URL for normal product pages
  const match = window.location.pathname.match(/products\/([^/]+)/);
  return match ? match[1] : null;
}

function renderCustomerReviewStars(rating, max = 5, color = '#FFD600', starClass = 'star-container') {
  color = '#FFD600'; // Force yellow for all stars
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) {
      html += `<span class="${starClass}" aria-hidden="true" style="font-size:1.2em;color:${color};">★</span>`;
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
      html += `<span class="${starClass}" aria-hidden="true" style="font-size:1.2em;color:${color};">⭐️</span>`;
    } else {
      html += `<span class="${starClass}" aria-hidden="true" style="font-size:1.2em;color:${color};">☆</span>`;
    }
  }
  return html;
}

function renderReviewWidget(data) {
  const { avgRating, numRatings, ratingCounts, ratings, totalPages, currentPage } = data;
  const total = numRatings || 0;
  const widget = document.getElementById('customer-reviews-widget');
  if (!widget) return;
  const currentCustomerId = window.customerId;

  let reviewsHtml = ratings.length === 0
    ? '<div style="text-align:center;">No reviews yet.</div>'
    : ratings.map(r => {
          const isOwnReview = currentCustomerId && r.customerId && r.customerId.toString() === currentCustomerId.toString();
        console.log('[Customer Reviews Debug]', {
          reviewId: r.id,
          reviewCustomerId: r.customerId,
          currentCustomerId,
          isOwnReview
        });
          return `
          <div class="border-b flex items-start mb-4">
            <div style="margin-right:1em;">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="48" height="48" fill="#8D99B6" class="yotpo-anonymous-person-icon">
                <title>Abstract user icon</title>
                <defs>
                  <clipPath id="circular-border-0.6988143113805397">
                    <circle cx="300" cy="300" r="250"></circle>
                  </clipPath>
                </defs>
                <circle cx="300" cy="300" r="280" fill="#CCD2E1"></circle>
                <circle cx="300" cy="230" r="100"></circle>
                <circle cx="300" cy="550" r="190" clip-path="url(#circular-border-0.6988143113805397)"></circle>
              </svg>
            </div>
            <div class="flex-1 mb-4">
              <div style="display:flex; align-items:center; gap:0.5em; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:0.5em;">
                  <span style="font-weight:bold;">${r.name}</span>
                  <span style="font-size:0.9em; color:#727471;">Verified Buyer</span>
                </div>
                ${isOwnReview ? `
                  <button class="edit-review-btn" 
                          data-review-id="${r.id || ''}" 
                          data-rating="${r.rating}" 
                          data-name="${r.name}" 
                          data-review="${r.review}"
                          data-variant-id="${r.variantId || ''}"
                          style="background:none; border:none; cursor:pointer; padding:4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.50023C18.8978 2.10297 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10297 21.5 2.50023C21.897 2.89733 22.1211 3.43667 22.1211 3.99923C22.1211 4.56179 21.897 5.10113 21.5 5.49823L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                ` : ''}
              </div>
              <div class="flex">${renderCustomerReviewStars(r.rating)}</div>
              <div style="margin:0.5em 0;">${r.review}</div>
              <div style="font-size:0.85em; color:#727471;">${new Date(r.postedAt).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      }).join('');

  // Pagination controls (match product-list style)
  let paginationHtml = '';
  if (totalPages && totalPages > 1) {
    paginationHtml += `<div class="mt-6 md:mt-12 flex flex-wrap justify-center items-center gap-4" role="navigation" aria-label="Reviews Pagination">`;
    // Previous
    if (currentPage > 1) {
      paginationHtml += `<a href="#" class="review-pagination-link rounded-full bg-graylight w-12 h-12 flex items-center justify-center hover:bg-secondary" data-page="${currentPage - 1}"><span class="sr-only">Go to previous page</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
    } else {
      paginationHtml += `<span class="rounded-full bg-graylight w-12 h-12 flex items-center justify-center opacity-50 pointer-events-none"><span class="sr-only">Go to previous page</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    }
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        paginationHtml += `<span class="rounded-full bg-secondary w-12 h-12 flex items-center justify-center">${i}</span>`;
      } else {
        paginationHtml += `<a href="#" aria-label="page-${i}" class="review-pagination-link rounded-full bg-graylight w-12 h-12 flex items-center justify-center hover:bg-secondary" data-page="${i}">${i}</a>`;
      }
    }
    // Next
    if (currentPage < totalPages) {
      paginationHtml += `<a href="#" class="review-pagination-link rounded-full bg-graylight w-12 h-12 flex items-center justify-center hover:bg-secondary" data-page="${currentPage + 1}"><span class="sr-only">Go to next page</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
    } else {
      paginationHtml += `<span class="rounded-full bg-graylight w-12 h-12 flex items-center justify-center opacity-50 pointer-events-none"><span class="sr-only">Go to next page</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    }
    paginationHtml += `</div>`;
  }

  widget.innerHTML = `
    <div class="mt-8 md:mt-10${window.layoutStyle === 'detached' ? ' container px-4 mx-auto' : ''}">
      <h2 style="text-align:center; font-size:2em; font-weight:bold;">Customer Reviews</h2>
      <div class="flex flex-col md:flex-row justify-between gap-6 md:gap-3 items-center my-6">
        <div class="avg-stars flex-1 text-center">
          <div style="font-size:2.5em; font-weight:bold;">${avgRating.toFixed(1)}</div>
          <div class="flex justify-center">${renderCustomerReviewStars(avgRating)}</div>
          <div style="color:#727471;">Based on ${total} review${total === 1 ? '' : 's'}</div>
        </div>
        <div class="flex flex-col flex-1 items-center text-center md:border-l md:border-r">
          ${[5,4,3,2,1].map(star => `
            <div style="display:flex; align-items:center; justify-content:center;">
              <span style="width:2em; text-align:right;">${star}</span>
              <span class="text-xl" style="color:#FFD600; margin:0 0.5em;">★</span>
              <div style="background:#eee; height:8px; width:120px; border-radius:4px; margin:0 0.5em; position:relative;">
                <div style="background:#000; height:8px; border-radius:4px; width:${(ratingCounts[star]||0)/total*100||0}%;"></div>
              </div>
              <span style="width:2em; text-align:left;">${ratingCounts[star]||0}</span>
            </div>
          `).join('')}
        </div>
        <div style="flex:1; text-align:center;">
          <button class="bg-black text-base py-2 px-4 text-white font-semibold">Write A Review</button>
        </div>
      </div>
      <hr>
      <div style="margin:2em 0;">${reviewsHtml}</div>
      ${paginationHtml}
    </div>
  `;
}

async function loadCustomerReviews(page = 1) {
  const productId = getProductId();
  if (!productId) return;

  // Use cache if available
  if (ratingCache[productId + '_page_' + page]) {
    renderReviewWidget(ratingCache[productId + '_page_' + page]);
    return;
  }

  // Prevent duplicate fetches
  if (ratingCache[`${productId}_loading`]) return;
  ratingCache[`${productId}_loading`] = true;

  try {
    const data = await fetchReviews(productId, page);
    ratingCache[productId + '_page_' + page] = data; // Cache it
    renderReviewWidget(data);
  } catch (error) {
    console.error('Error loading customer reviews:', error);
  } finally {
    ratingCache[`${productId}_loading`] = false;
  }
}

document.addEventListener('DOMContentLoaded', () => loadCustomerReviews(1));

// Load ratings for product cards
async function loadProductCardRatings() {
  const productCards = document.querySelectorAll('.product-rating[data-product-id]');
  
  for (const card of productCards) {
    const productId = card.getAttribute('data-product-id');
    if (!productId) continue;
    
    // Use cache if available
    if (ratingCache[productId]) {
      renderRating(card, ratingCache[productId]);
      continue;
    }
    // Prevent duplicate fetches for the same productId
    if (ratingCache[`${productId}_loading`]) continue;
    ratingCache[`${productId}_loading`] = true;

    try {
      const data = await fetchReviews(productId, 1, 1);
      ratingCache[productId] = data; // Cache it
      renderRating(card, data);
    } catch (error) {
      console.error('Failed to load rating for product:', productId, error);
    } finally {
      ratingCache[`${productId}_loading`] = false;
    }
  }
}

function renderRating(card, data) {
  const starsContainer = card.querySelector('.stars-container');
  const ratingCount = card.querySelector('.rating-count');
  if (starsContainer && data.avgRating) {
    starsContainer.innerHTML = renderCustomerReviewStars(data.avgRating, 5, '#000', 'product-card-star');
  }
  if (ratingCount && data.numRatings) {
    ratingCount.textContent = `(${data.numRatings})`;
  }
}

// Load ratings when DOM is ready
let customerReviewsLoaded = false;
document.addEventListener('DOMContentLoaded', () => {
  if (!customerReviewsLoaded) {
    loadCustomerReviews();
    customerReviewsLoaded = true;
  }
  loadProductCardRatings();
});

// Load ratings for dynamically loaded content (like sliders)
function loadRatingsForDynamicContent() {
  setTimeout(loadProductCardRatings, 100);
}

// Export for use in other scripts
window.loadProductCardRatings = loadProductCardRatings;
window.loadRatingsForDynamicContent = loadRatingsForDynamicContent;

// --- Modal HTML injection (if not present) ---
function injectReviewModal() {
  if (document.getElementById('customer-review-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'customer-review-modal';
  modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 hidden items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white max-w-md w-full p-6 relative flex flex-col" style="margin:auto;">
      <button id="close-review-modal" class="absolute top-3 right-3 text-2xl text-gray-500 hover:text-black" aria-label="Close">&times;</button>
      <h3 class="text-xl font-bold mb-4">Write a Review</h3>
      <form id="customer-review-form" class="space-y-4">
        <input type="hidden" id="review-variant-id" />
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input type="text" id="reviewer-name" required class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Rating</label>
          <div id="star-rating" class="flex gap-1 text-2xl"></div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Review</label>
          <textarea id="review-text" required class="w-full border rounded px-3 py-2"></textarea>
        </div>
        <button type="submit" class="w-full bg-black text-white rounded py-2 font-semibold">Submit</button>
      </form>
      <div id="review-success" class="hidden text-green-600 mt-4">Thank you for your review!</div>
      <div id="review-error" class="hidden text-red-600 mt-4">Something went wrong. Please try again.</div>
    </div>
  `;
  document.body.appendChild(modal);
  // Set variant ID after modal is added to DOM
  const variantInput = modal.querySelector('#review-variant-id');
  if (variantInput) {
    variantInput.value = window.selectedVariantId || getProductId() || '';
  }
}

// --- Edit Modal HTML injection (if not present) ---
function injectEditReviewModal() {
  if (document.getElementById('edit-review-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'edit-review-modal';
  modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 hidden items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white max-w-md w-full p-6 relative flex flex-col" style="margin:auto;">
      <button id="close-edit-review-modal" class="absolute top-3 right-3 text-2xl text-gray-500 hover:text-black" aria-label="Close">&times;</button>
      <h3 class="text-xl font-bold mb-4">Edit Review</h3>
      <form id="edit-review-form" class="space-y-4">
        <input type="hidden" id="edit-review-id" />
        <input type="hidden" id="edit-variant-id" />
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input type="text" id="edit-reviewer-name" required class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Rating</label>
          <div id="edit-star-rating" class="flex gap-1 text-2xl"></div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Review</label>
          <textarea id="edit-review-text" required class="w-full border rounded px-3 py-2"></textarea>
        </div>
        <button type="submit" class="w-full bg-black text-white rounded py-2 font-semibold">Update Review</button>
      </form>
      <div id="edit-review-success" class="hidden text-green-600 mt-4">Review updated successfully!</div>
      <div id="edit-review-error" class="hidden text-red-600 mt-4">Something went wrong. Please try again.</div>
    </div>
  `;
  document.body.appendChild(modal);
}

// --- Modal logic ---
function showReviewModal() {
  injectReviewModal();
  const modal = document.getElementById('customer-review-modal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  document.body.classList.add('overflow-hidden');
  setStarRating(0);
}

function showEditReviewModal(reviewData) {
  injectEditReviewModal();
  const modal = document.getElementById('edit-review-modal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  document.body.classList.add('overflow-hidden');
  
  // Populate form with existing data
  document.getElementById('edit-review-id').value = reviewData.reviewId || '';
  document.getElementById('edit-variant-id').value = reviewData.variantId || '';
  document.getElementById('edit-reviewer-name').value = reviewData.name || '';
  document.getElementById('edit-review-text').value = reviewData.review || '';
  setEditStarRating(reviewData.rating || 0);
}

function hideReviewModal() {
  const modal = document.getElementById('customer-review-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
  document.body.classList.remove('overflow-hidden');
  const form = document.getElementById('customer-review-form');
  if (form) form.reset();
  const success = document.getElementById('review-success');
  const error = document.getElementById('review-error');
  if (success) success.classList.add('hidden');
  if (error) error.classList.add('hidden');
  setStarRating(0);
}

function hideEditReviewModal() {
  const modal = document.getElementById('edit-review-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
  document.body.classList.remove('overflow-hidden');
  const form = document.getElementById('edit-review-form');
  if (form) form.reset();
  const success = document.getElementById('edit-review-success');
  const error = document.getElementById('edit-review-error');
  if (success) success.classList.add('hidden');
  if (error) error.classList.add('hidden');
  setEditStarRating(0);
}

// Star rating UI
let currentRating = 0;
let currentEditRating = 0;

function setStarRating(rating) {
  currentRating = rating;
  const starContainer = document.getElementById('star-rating');
  if (!starContainer) return;
  starContainer.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = i <= rating ? '★' : '☆';
    star.style.color = '#FFD600';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2em';
    star.onclick = () => setStarRating(i);
    starContainer.appendChild(star);
  }
}

function setEditStarRating(rating) {
  currentEditRating = rating;
  const starContainer = document.getElementById('edit-star-rating');
  if (!starContainer) return;
  starContainer.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = i <= rating ? '★' : '☆';
    star.style.color = '#FFD600';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2em';
    star.onclick = () => setEditStarRating(i);
    starContainer.appendChild(star);
  }
}

// Event delegation for opening/closing modal
// and form submission

document.addEventListener('click', function(e) {
  // Open write review modal
  if (e.target && e.target.textContent && e.target.textContent.trim() === 'Write A Review') {
    e.preventDefault();
    showReviewModal();
  }
  // Close write review modal
  if (e.target && e.target.id === 'close-review-modal') {
    e.preventDefault();
    hideReviewModal();
  }
  // Close edit review modal
  if (e.target && e.target.id === 'close-edit-review-modal') {
    e.preventDefault();
    hideEditReviewModal();
  }
  // Click outside modal content closes modal
  if (e.target && e.target.id === 'customer-review-modal') {
    hideReviewModal();
  }
  if (e.target && e.target.id === 'edit-review-modal') {
    hideEditReviewModal();
  }
  // Edit review button
  if (e.target && e.target.closest('.edit-review-btn')) {
    e.preventDefault();
    const btn = e.target.closest('.edit-review-btn');
    const reviewData = {
      reviewId: btn.dataset.reviewId,
      variantId: btn.dataset.variantId,
      name: btn.dataset.name,
      review: btn.dataset.review,
      rating: parseInt(btn.dataset.rating)
    };
    showEditReviewModal(reviewData);
  }
  // Pagination click (new selector)
  if (e.target && (e.target.classList.contains('review-pagination-link') || e.target.closest('.review-pagination-link'))) {
    e.preventDefault();
    const btn = e.target.closest('.review-pagination-link');
    const page = parseInt(btn.getAttribute('data-page'));
    if (!isNaN(page)) {
      loadCustomerReviews(page);
      // Optionally scroll to the reviews section
      const widget = document.getElementById('customer-reviews-widget');
      if (widget) widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// Attach form submit handler (delegated, since modal is injected)
document.addEventListener('submit', async function(e) {
  // Write review form
  if (e.target && e.target.id === 'customer-review-form') {
    e.preventDefault();
    const name = document.getElementById('reviewer-name').value.trim();
    const review = document.getElementById('review-text').value.trim();
    const rating = currentRating;
    const productId = getProductId();
    const customerId = window.customerId || null;
    
    // Debug customer ID
    console.log('Customer ID:', customerId);
    console.log('Window customer ID:', window.customerId);
    
    // Always set variantId, use productId if not found
    let variantId = '';
    const variantInput = document.getElementById('review-variant-id');
    if (variantInput) {
      variantId = variantInput.value;
    }
    if (!variantId) {
      variantId = productId;
    }
    
    // Validate required fields
    if (!name || !review || !rating || !productId) {
      document.getElementById('review-error').classList.remove('hidden');
      document.getElementById('review-error').textContent = 'Please fill in all required fields and select a rating.';
      return;
    }
    
    // Validate rating range
    if (!rating || rating < 1 || rating > 5) {
      document.getElementById('review-error').classList.remove('hidden');
      document.getElementById('review-error').textContent = 'Please select a rating between 1 and 5 stars.';
      return;
    }
    
    // Check if customer is logged in
    if (!customerId) {
      document.getElementById('review-error').classList.remove('hidden');
      document.getElementById('review-error').textContent = 'Please log in to submit a review.';
      return;
    }
    
    // Validate product ID
    if (!productId) {
      document.getElementById('review-error').classList.remove('hidden');
      document.getElementById('review-error').textContent = 'Product ID not found. Please refresh the page and try again.';
      return;
    }
    
    // Ensure variant ID is set
    if (!variantId) {
      variantId = productId; // Fallback to product ID if no variant ID
    }
    const payload = { name, review, rating, productId, customerId, variantId };
    
    // Debug logging
    console.log('Review submission payload:', payload);
    
    // Disable submit button and show loader
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="loader" style="display:inline-block;width:18px;height:18px;border:2px solid #fff;border-top:2px solid #000;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;"></span>Submitting...';
    }
    try {
      const res = await fetch('https://kseurtdbzpaizwjbrikulj4gdu0orlgq.lambda-url.us-east-1.on.aws/products/rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        document.getElementById('review-success').classList.remove('hidden');
        document.getElementById('review-error').classList.add('hidden');
        hideReviewModal();
        // Clear all cache for this product so it will refetch
        Object.keys(ratingCache).forEach(key => { if (key.startsWith(productId + '_page_')) delete ratingCache[key]; });
        loadCustomerReviews(1);
      } else {
        let errorMsg = await res.text();
        if (res.status === 409) {
          errorMsg = 'You have already submitted a review for this product.';
        } else if (res.status === 400) {
          try {
            const errorData = JSON.parse(errorMsg);
            errorMsg = errorData.message || 'Invalid data provided. Please check your input.';
          } catch (e) {
            errorMsg = 'Invalid data provided. Please check your input.';
          }
        }
        document.getElementById('review-success').classList.add('hidden');
        document.getElementById('review-error').classList.remove('hidden');
        document.getElementById('review-error').textContent = errorMsg || 'Something went wrong. Please try again.';
      }
    } catch (err) {
      document.getElementById('review-success').classList.add('hidden');
      document.getElementById('review-error').classList.remove('hidden');
      document.getElementById('review-error').textContent = err?.message || 'Something went wrong. Please try again.';
    } finally {
      // Re-enable submit button and remove loader
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
      }
    }
  }
  
  // Edit review form
  if (e.target && e.target.id === 'edit-review-form') {
    e.preventDefault();
    const name = document.getElementById('edit-reviewer-name').value.trim();
    const review = document.getElementById('edit-review-text').value.trim();
    const rating = currentEditRating;
    const productId = getProductId();
    const customerId = window.customerId || null;
    // Always set variantId, use productId if not found
    let variantId = '';
    const variantInput = document.getElementById('edit-variant-id');
    if (variantInput) {
      variantId = variantInput.value;
    }
    if (!variantId) {
      variantId = productId;
    }
    if (!name || !review || !rating || !productId || !customerId) return;
    const payload = { 
      name, 
      review, 
      rating, 
      productId, 
      customerId,
      variantId
    };
    // Disable submit button and show loader
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="loader" style="display:inline-block;width:18px;height:18px;border:2px solid #fff;border-top:2px solid #000;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;"></span>Updating...';
    }
    try {
      const res = await fetch('https://kseurtdbzpaizwjbrikulj4gdu0orlgq.lambda-url.us-east-1.on.aws/products/rate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        document.getElementById('edit-review-success').classList.remove('hidden');
        document.getElementById('edit-review-error').classList.add('hidden');
        hideEditReviewModal();
        // Clear all cache for this product so it will refetch
        Object.keys(ratingCache).forEach(key => { if (key.startsWith(productId + '_page_')) delete ratingCache[key]; });
        loadCustomerReviews(1);
      } else {
        const errorMsg = await res.text();
        document.getElementById('edit-review-success').classList.add('hidden');
        document.getElementById('edit-review-error').classList.remove('hidden');
        document.getElementById('edit-review-error').textContent = errorMsg || 'Something went wrong. Please try again.';
      }
    } catch (err) {
      document.getElementById('edit-review-success').classList.add('hidden');
      document.getElementById('edit-review-error').classList.remove('hidden');
      document.getElementById('edit-review-error').textContent = err?.message || 'Something went wrong. Please try again.';
    } finally {
      // Re-enable submit button and remove loader
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Update Review';
      }
    }
  }
}); 

function forceYellowStars() {
  document.querySelectorAll('svg.star-container path').forEach(path => {
    path.setAttribute('fill', '#FFD600');
    path.setAttribute('stroke', '#FFD600');
    path.style.fill = '#FFD600';
    path.style.stroke = '#FFD600';
  });
} 

/* Add loader animation CSS */
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style); 
