document.addEventListener('click', function (event) {
  const closeBtn = event.target.closest('.close-modal');
  const continueBtn = event.target.closest('#continue-shopping-btn');
  const modal = document.getElementById('wishlist-modal');
  const bg = event.target.classList.contains('modalbg');

  if ((closeBtn || continueBtn || (modal && bg)) && modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
});
