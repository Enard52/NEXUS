if(location.hostname==='enard52.github.io'){
  var p=location.pathname;
  if(p.endsWith('/index.html')) p=p.slice(0,-10);
  else if(p.endsWith('.html')) p=p.slice(0,-5);
  location.replace('https://nexus-smarthome.pages.dev'+p+location.search+location.hash);
}
(function(){
  try{
    var L=location, p=L.pathname, isTrPage=(p==='/tr/'||p.indexOf('/tr/')!==-1);
    var q=new URLSearchParams(L.search).get('lang');
    if(q){
      try{localStorage.setItem('nx-lang',q);localStorage.setItem('nx-lang-manual','1');}catch(e){}
    }
    var manual=false;
    try{manual=localStorage.getItem('nx-lang-manual')==='1';}catch(e){}
    var saved=null;
    try{saved=localStorage.getItem('nx-lang');}catch(e){}

    var COUNTRY_MAP={
      TR:'tr',AZ:'tr',KZ:'tr',UZ:'tr',KG:'tr',TM:'tr',CY:'tr',
      DE:'de',AT:'de',CH:'de',LI:'de',
      FR:'fr',BE:'fr',MC:'fr',
      ES:'es',MX:'es',AR:'es',CO:'es',CL:'es',PE:'es',
      IT:'it',SM:'it',VA:'it',
      PT:'pt-BR',BR:'pt-BR',
      RU:'ru',BY:'ru',UA:'uk',PL:'pl',CZ:'cs',SK:'sk',BG:'bg',
      NL:'nl',SE:'sv',NO:'nb',DK:'da',FI:'fi',
      JP:'ja',KR:'ko',CN:'zh-Hans',TW:'zh-Hant',HK:'zh-Hant',
      SA:'ar',AE:'ar',EG:'ar',
      US:'en',GB:'en',CA:'en',AU:'en',NZ:'en',IE:'en'
    };

    var navLangs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
    var turkic=/^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)$/;
    var home=false;
    for(var i=0;i<navLangs.length;i++){
      var bits=String(navLangs[i]).toLowerCase().replace('_','-').split('-');
      if(turkic.test(bits[0])||bits.slice(1).some(function(b){return /^(tr|az|kz|uz|kg|tm)$/.test(b);})){home=true;break;}
    }
    if(home) document.documentElement.setAttribute('data-home-lang','tr');

    var isProd=(location.hostname==='nexus-smarthome.pages.dev'||location.hostname==='enard52.github.io');

    // IP / Ülke tabanlı dinamik tespit (Cloudflare /cdn-cgi/trace)
    if(isProd && !manual && typeof fetch==='function'){
      fetch('/cdn-cgi/trace', {cache:'no-store'}).then(function(r){return r.text();}).then(function(t){
        var m=t.match(/\bloc=([A-Z]{2})\b/i);
        if(!m||!m[1])return;
        var cc=m[1].toUpperCase();
        var detected=COUNTRY_MAP[cc]||'en';
        var curLang='en';
        var mPath=p.match(/^\/([a-zA-Z-]+)(\/|$)/);
        if(mPath&&mPath[1]) curLang=mPath[1];
        if(detected!==curLang){
          try{localStorage.setItem('nx-lang',detected);}catch(e){}
          var newPath=p;
          if(curLang!=='en') newPath=p.replace(/^\/[a-zA-Z-]+/, '');
          if(!newPath.startsWith('/')) newPath='/'+newPath;
          if(newPath==='/index.html') newPath='/';
          var dest=(detected==='en')?newPath:('/'+detected+(newPath==='/'?'/':newPath));
          L.replace(dest+L.search+L.hash);
        }
      }).catch(function(){});
    }

    var targetLang=home?(saved||'tr'):'en';
    if(isProd && manual){
      if(targetLang==='tr'&&!isTrPage){
        var rel=p;
        while(rel.charAt(0)==='/')rel=rel.slice(1);
        if(rel==='index.html')rel='';
        L.replace('/tr/'+rel+L.search+L.hash);
      }else if(targetLang==='en'&&isTrPage){
        var rel=p.slice(3);
        while(rel.charAt(0)==='/')rel=rel.slice(1);
        if(rel==='index.html')rel='';
        L.replace('/'+rel+L.search+L.hash);
      }
    }
  }catch(e){}
  /* Scroll-reveal etiketi: ilk boyamadan ÖNCE eklenir (parlama olmasın). site.js
     yüklenmezse içerik görünmez kalmasın diye güvenlik ağı: 2.5 sn içinde
     __nxSiteReady işareti gelmezse etiket geri çekilir ve her şey görünür kalır. */
  try{
    var noMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!noMotion&&'IntersectionObserver' in window){
      document.documentElement.classList.add('nx-io');
      setTimeout(function(){
        if(!window.__nxSiteReady) document.documentElement.classList.remove('nx-io');
      },2500);
    }
  }catch(e){}
})();