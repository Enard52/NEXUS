// Tema: sistem tercihi + kullanıcı seçimi (localStorage)
(function(){var t;try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  var d=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',d);})();
function nxToggleTheme(){var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);try{localStorage.setItem('nx-site-theme',d)}catch(e){}}

// Kaydırma giriş animasyonu
(function(){var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});
  els.forEach(function(e){io.observe(e)});})();

// SSS tek-açıklık davranışı
document.querySelectorAll('details.faq').forEach(function(d){d.addEventListener('toggle',function(){
  if(d.open)document.querySelectorAll('details.faq[open]').forEach(function(o){if(o!==d)o.open=false})})});
