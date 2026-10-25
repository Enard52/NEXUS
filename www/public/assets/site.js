// Tema: sistem tercihi + kullanıcı seçimi
(function(){
  var d='light';
  var t=null;
  try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  if(t==='dark'||t==='light') d=t;
  else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches) d='dark';
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
  var isTr=(p==='/tr/'||p.indexOf('/tr/')===0);
  if(lang==='tr'){
    if(isTr)return;
    var sub=p;
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/tr/'+sub+(sub?'':'?lang=tr')+location.hash;
  }else{
    if(!isTr)return;
    var sub=p.slice(3);
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/'+sub+(sub?'':'?lang=en')+location.hash;
  }
}

// İletişim & Destek Modülü Kontrolleri
function nxOpenContactModal(category){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  if(category){
    var sel=document.getElementById('nxContactCategory');
    if(sel)sel.value=category;
  }
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  document.body.style.overflow='hidden';
}

function nxCloseContactModal(){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    document.body.style.overflow='';
  },250);
}

function nxSubmitContact(e){
  e.preventDefault();
  var form=document.getElementById('nxContactForm');
  var btn=document.getElementById('nxContactSubmitBtn');
  var successEl=document.getElementById('nxContactSuccess');
  if(!form||!btn)return;

  var name=(document.getElementById('nxContactName').value||'').trim();
  var email=(document.getElementById('nxContactEmail').value||'').trim();
  var cat=document.getElementById('nxContactCategory').value;
  var msg=(document.getElementById('nxContactMsg').value||'').trim();

  if(!name||!email||!msg)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=form.getAttribute('data-sending')||'Gönderiliyor…';

  fetch('https://formsubmit.co/ajax/nexus.smarthome.app@gmail.com',{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({
      name:name,
      email:email,
      _replyto:email,
      _subject:'[NEXUS Destek] '+cat+' — '+name,
      category:cat,
      message:msg,
      _template:'box'
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    btn.disabled=false;
    btn.innerHTML=origText;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    var mailto='mailto:nexus.smarthome.app@gmail.com?subject='+encodeURIComponent('[NEXUS Destek] '+cat+' — '+name)+'&body='+encodeURIComponent('İsim: '+name+'\nE-posta: '+email+'\n\nMesaj:\n'+msg);
    location.href=mailto;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  });
}

// Auth & Giriş Kontrolleri
var nxAuthMode='login';

function nxUpdateNavAuth(){
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var btn=document.getElementById('nxNavAuthBtn');
  var label=document.getElementById('nxNavAuthLabel');
  if(!btn||!label)return;
  var isTr=document.documentElement.lang==='tr';
  if(user){
    btn.classList.add('logged-in');
    var short=user.split('@')[0];
    if(short.length>12)short=short.slice(0,10)+'…';
    label.textContent=short;
  }else{
    btn.classList.remove('logged-in');
    label.textContent=isTr?'Giriş Yap':'Sign In';
  }
}

function nxOpenAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var emailEl=document.getElementById('nxProfileEmail');

  if(user){
    if(formView)formView.style.display='none';
    if(profileView)profileView.style.display='block';
    if(emailEl)emailEl.textContent=user;
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
    var alertEl=document.getElementById('nxAuthAlert');
    if(alertEl)alertEl.style.display='none';
  }

  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  document.body.style.overflow='hidden';
}

function nxCloseAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    document.body.style.overflow='';
  },250);
}

function nxToggleAuthMode(){
  var isTr=document.documentElement.lang==='tr';
  var title=document.getElementById('nxAuthTitle');
  var sub=document.getElementById('nxAuthSubtitle');
  var submitBtn=document.getElementById('nxAuthSubmitBtn');
  var prompt=document.getElementById('nxAuthSwitchPrompt');
  var switchBtn=document.getElementById('nxAuthSwitchBtn');
  var alertEl=document.getElementById('nxAuthAlert');
  if(alertEl)alertEl.style.display='none';

  if(nxAuthMode==='login'){
    nxAuthMode='signup';
    if(title)title.textContent=isTr?'Yeni Hesap Oluştur':'Create Account';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için hemen ücretsiz kaydol.':'Sign up free to control your home with zero lock-in.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Kayıt Ol':'Sign Up')+'</span>';
    if(prompt)prompt.textContent=isTr?'Zaten hesabınız var mı?':'Already have an account?';
    if(switchBtn)switchBtn.textContent=isTr?'Giriş Yap':'Sign In';
  }else{
    nxAuthMode='login';
    if(title)title.textContent=isTr?'NEXUS Hesabım':'NEXUS Account';
    if(sub)sub.textContent=isTr?'Cihaz senkronizasyonu ve NEXUS+ aboneliğinizi yönetmek için giriş yapın.':'Sign in to synchronize your setup and manage your NEXUS+ subscription.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Giriş Yap':'Sign In')+'</span>';
    if(prompt)prompt.textContent=isTr?'Hesabınız yok mu?':"Don't have an account?";
    if(switchBtn)switchBtn.textContent=isTr?'Hemen Kayıt Ol':'Sign Up';
  }
}

function nxSubmitAuth(e){
  e.preventDefault();
  var isTr=document.documentElement.lang==='tr';
  var email=(document.getElementById('nxAuthEmail').value||'').trim();
  var pass=document.getElementById('nxAuthPassword').value||'';
  var btn=document.getElementById('nxAuthSubmitBtn');
  var alertEl=document.getElementById('nxAuthAlert');

  if(!email||!pass)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=isTr?'İşleniyor…':'Processing…';
  if(alertEl)alertEl.style.display='none';

  var SUPABASE_URL='https://flbctyolowzcizwwzbke.supabase.co';
  var SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYmN0eW9sb3d6Y2l6d3d6YmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc5MjMsImV4cCI6MjA5MjcyMzkyM30.iucht087oRSDQgpAGJ09-ruLImZDUCizeMsir1oIltg';

  var endpoint=nxAuthMode==='signup'
    ? SUPABASE_URL+'/auth/v1/signup'
    : SUPABASE_URL+'/auth/v1/token?grant_type=password';

  fetch(endpoint,{
    method:'POST',
    headers:{
      'apikey':SUPABASE_KEY,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({email:email,password:pass})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){
        throw new Error(data.error_description||data.msg||data.message||'İşlem başarısız');
      }
      return data;
    });
  })
  .then(function(data){
    btn.disabled=false;
    btn.innerHTML=origText;
    var userEmail=(data.user&&data.user.email)||email;
    try{
      localStorage.setItem('nexusCurrentUser',userEmail);
      if(data.access_token){
        localStorage.setItem('nexus_cloud_session',JSON.stringify({
          accessToken:data.access_token,
          refreshToken:data.refresh_token,
          userId:data.user?data.user.id:null,
          email:userEmail
        }));
      }
    }catch(e){}
    nxUpdateNavAuth();
    nxOpenAuthModal();
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    if(alertEl){
      var msg=err.message||'';
      if(/invalid login credentials/i.test(msg)){
        msg=isTr?'E-posta adresi veya şifre hatalı.':'Invalid email or password.';
      }else if(/already registered/i.test(msg)){
        msg=isTr?'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.':'This email is already registered. Please sign in.';
      }else if(/Password should be at least/i.test(msg)){
        msg=isTr?'Şifre en az 6 karakter olmalıdır.':'Password must be at least 6 characters.';
      }
      alertEl.textContent=msg;
      alertEl.style.display='block';
    }
  });
}

function nxSignOut(){
  try{
    localStorage.removeItem('nexusCurrentUser');
    localStorage.removeItem('nexus_cloud_session');
  }catch(e){}
  nxUpdateNavAuth();
  nxCloseAuthModal();
}

// Fiyatlandırma: Aylık / Yıllık geçişi
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM)btnM.classList.toggle('active',!isYearly);
  if(btnY)btnY.classList.toggle('active',isYearly);

  var isTr=document.documentElement.lang==='tr';
  var priceVal=document.getElementById('planPriceVal');
  var periodVal=document.getElementById('planPeriodVal');
  var priceNote=document.getElementById('planPriceNote');
  var cta=document.getElementById('nexusPlusCta');

  if(isYearly){
    if(priceVal)priceVal.textContent=isTr?'₺333,33':'$7.50';
    if(periodVal)periodVal.textContent=isTr?'/ay, yıllık':'/mo, billed yearly';
    if(priceNote)priceNote.textContent=isTr?'Yıllık ₺3.999,99 olarak faturalandırılır (%33 tasarruf)':'Billed as $89.99/yr (Save 33%)';
    if(cta&&cta.dataset.yearlyHref)cta.href=cta.dataset.yearlyHref;
  }else{
    if(priceVal)priceVal.textContent=isTr?'₺499,99':'$11.99';
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta&&cta.dataset.monthlyHref)cta.href=cta.dataset.monthlyHref;
  }
}

// SSS tek-açıklık davranışı
function nxToggleFaq(btn){
  var item=btn.closest('.faq-item');
  var isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(el){el.classList.remove('open')});
  if(!isOpen)item.classList.add('open');
}

// Gerçekçi Akıllı Telefon Ön İzleme Kontrolleri
var nxCurrentShot=0;
var nxShotTimer=null;
var nxShotsData=[];

function nxShowShot(idx){
  var slides=document.querySelectorAll('.shot-slide');
  var dots=document.querySelectorAll('.phone-dot');
  if(!slides.length)return;
  if(idx<0)idx=slides.length-1;
  if(idx>=slides.length)idx=0;
  nxCurrentShot=idx;

  slides.forEach(function(s,i){
    s.classList.toggle('active',i===idx);
  });
  dots.forEach(function(d,i){
    d.classList.toggle('active',i===idx);
  });
  var tabs=document.querySelectorAll('.phone-tab');
  tabs.forEach(function(t,i){
    t.classList.toggle('active',i===idx);
  });

  var titleEl=document.getElementById('phoneSlideTitle');
  var numEl=document.getElementById('phoneSlideNum');
  if(nxShotsData[idx]){
    if(titleEl)titleEl.textContent=nxShotsData[idx].label;
    if(numEl)numEl.textContent=(idx+1)+'/'+slides.length;
  }
}

function nxNextShot(){
  nxShowShot(nxCurrentShot+1);
  nxResetShotTimer();
}

function nxPrevShot(){
  nxShowShot(nxCurrentShot-1);
  nxResetShotTimer();
}

function nxResetShotTimer(){
  if(nxShotTimer)clearInterval(nxShotTimer);
  nxShotTimer=setInterval(function(){
    nxShowShot(nxCurrentShot+1);
  },4500);
}

// Telefon dokunma, sürükleme ve tıklama yönetimi
document.addEventListener('DOMContentLoaded',function(){
  var mockup=document.getElementById('phoneMockup');
  if(mockup){
    nxResetShotTimer();

    mockup.addEventListener('mouseenter',function(){if(nxShotTimer)clearInterval(nxShotTimer);});
    mockup.addEventListener('mouseleave',function(){nxResetShotTimer();});

    mockup.addEventListener('click',function(e){
      var rect=mockup.getBoundingClientRect();
      var x=e.clientX-rect.left;
      if(x<rect.width*0.35){
        nxPrevShot();
      }else{
        nxNextShot();
      }
    });

    var touchStartX=0;
    var touchEndX=0;
    mockup.addEventListener('touchstart',function(e){
      touchStartX=e.changedTouches[0].screenX;
      if(nxShotTimer)clearInterval(nxShotTimer);
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
      touchEndX=e.changedTouches[0].screenX;
      var diff=touchEndX-touchStartX;
      if(diff>40) nxPrevShot();
      else if(diff<-40) nxNextShot();
      nxResetShotTimer();
    },{passive:true});
  }

  // Giriş Durumu Güncelleme
  nxUpdateNavAuth();

  // GitHub Sürüm Etiketi Çekimi (nexus-releases deposu)
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest')
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var tag=String(d.tag_name);
      var v=tag.indexOf('v')===0?tag.slice(1):tag;
      document.querySelectorAll('[data-nexus-ver]').forEach(function(el){
        el.textContent='v'+v;
      });
    })
    .catch(function(){});
});