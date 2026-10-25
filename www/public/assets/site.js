// Tema: sistem tercihi + kullanıcı seçimi
(function(){
  var t;
  try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  var d=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',d);
})();

function nxToggleTheme(){
  var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);
  try{localStorage.setItem('nx-site-theme',d)}catch(e){}
}

// Dil değiştirme: seçimi kaydet ve doğru sayfaya git
function nxSetLang(lang){
  try{localStorage.setItem('nx-lang',lang)}catch(e){}
  var p=location.pathname;
  var isTr=/^\\/tr(\\/|$)/.test(p);
  if(lang==='tr'){
    if(isTr)return;
    var sub=p.replace(/^\\/+/,'');
    location.href='/tr/'+sub+location.search+location.hash;
  }else{
    if(!isTr)return;
    var sub=p.replace(/^\\/tr(\\/|$)/,'');
    location.href='/'+sub+location.search+location.hash;
  }
}

// Fiyatlandırma: Aylık / Yıllık geçişi
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM&&btnY){
    btnM.classList.toggle('active',!isYearly);
    btnY.classList.toggle('active',isYearly);
  }
  document.querySelectorAll('[data-price-monthly]').forEach(function(el){
    el.innerHTML=isYearly?el.getAttribute('data-price-yearly'):el.getAttribute('data-price-monthly');
  });
  document.querySelectorAll('[data-period-monthly]').forEach(function(el){
    el.textContent=isYearly?el.getAttribute('data-period-yearly'):el.getAttribute('data-period-monthly');
  });
  document.querySelectorAll('[data-cta-monthly]').forEach(function(el){
    var href=isYearly?el.getAttribute('data-cta-yearly'):el.getAttribute('data-cta-monthly');
    if(href)el.setAttribute('href',href);
  });
}

// Kaydırma giriş animasyonu
(function(){
  var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(function(e){e.classList.add('in')});
    return;
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}
    });
  },{threshold:.12});
  els.forEach(function(e){io.observe(e)});
})();

// SSS tek-açıklık davranışı
document.querySelectorAll('details.faq').forEach(function(d){
  d.addEventListener('toggle',function(){
    if(d.open)document.querySelectorAll('details.faq[open]').forEach(function(o){if(o!==d)o.open=false});
  });
});

// Telefon önizleme kontrolleri
var currentShotIdx = 0;
function nxUpdateShot(idx){
  var slides = document.querySelectorAll('.shot-slide');
  var dots = document.querySelectorAll('.phone-nav-dot');
  if(!slides.length) return;
  currentShotIdx = (idx + slides.length) % slides.length;
  slides.forEach(function(s, i){
    s.classList.toggle('active', i === currentShotIdx);
  });
  dots.forEach(function(d, i){
    d.classList.toggle('active', i === currentShotIdx);
    d.setAttribute('aria-selected', i === currentShotIdx ? 'true' : 'false');
  });
}

function nxNextShot(){
  nxUpdateShot(currentShotIdx + 1);
}

function nxGoToShot(name){
  var slides = document.querySelectorAll('.shot-slide');
  for(var i=0; i<slides.length; i++){
    if(slides[i].getAttribute('data-shot') === name){
      nxUpdateShot(i);
      break;
    }
  }
}
