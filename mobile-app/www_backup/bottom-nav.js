// Alt menü butonlarını aktif sayfaya göre renklendir
(function() {
  // Aktif sayfanın URL'sini al
  const currentPage = window.location.pathname.split('/').pop();

  // Alt menüdeki tüm butonları seç
  const navButtons = document.querySelectorAll('nav[data-purpose="bottom-nav"] a');

  // Her buton için kontrol yap
  navButtons.forEach(button => {
    // Butonun href özelliğinden sayfa adını al
    const buttonPage = button.getAttribute('href');

    // Eğer butonun sayfası aktif sayfa ile eşleşiyorsa
    if (buttonPage === currentPage) {
      // Butonu aktif hale getir (mavi ve kalın font)
      button.classList.remove('text-slate-400');
      button.classList.add('text-[#4C7DFF]');
      const span = button.querySelector('span');
      if (span) {
        span.classList.remove('font-medium');
        span.classList.add('font-bold');
      }
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.remove('stroke-[1.5]');
        icon.classList.add('stroke-[2]');
      }
    } else {
      // Butonu pasif hale getir (gri ve normal font)
      button.classList.remove('text-[#4C7DFF]');
      button.classList.add('text-slate-400');
      const span = button.querySelector('span');
      if (span) {
        span.classList.remove('font-bold');
        span.classList.add('font-medium');
      }
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.remove('stroke-[2]');
        icon.classList.add('stroke-[1.5]');
      }
    }
  });
})();