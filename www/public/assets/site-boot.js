if(location.hostname==='enard52.github.io'){location.replace('https://nexus-smarthome.pages.dev'+location.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'')+location.search+location.hash)}
(function(){
  try{
    var L=location, p=L.pathname, isTrPage=/^\\/tr(\\/|$)/.test(p);
    var q=new URLSearchParams(L.search).get('lang');
    var saved=null;
    try{saved=localStorage.getItem('nx-lang')}catch(e){}
    if(q==='tr'||q==='en'){
      saved=q;
      try{localStorage.setItem('nx-lang',q)}catch(e){}
    }
    var targetLang=saved;
    if(!targetLang){
      var navLangs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
      var isTr=false;
      for(var i=0;i<navLangs.length;i++){
        if(/^tr/i.test(String(navLangs[i]).split(/[-_]/)[0])){isTr=true;break;}
      }
      targetLang=isTr?'tr':'en';
    }
    if(targetLang==='tr'&&!isTrPage){
      var rel=p.replace(/^\\/+/,'');if(rel==='index.html')rel='';
      L.replace('/tr/'+rel+L.search+L.hash);
    }else if(targetLang==='en'&&isTrPage){
      var rel=p.replace(/^\\/tr(\\/|$)/,'');if(rel==='index.html')rel='';
      L.replace('/'+rel+L.search+L.hash);
    }
  }catch(e){}
})();
