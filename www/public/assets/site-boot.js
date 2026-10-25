if(location.hostname==='enard52.github.io'){
  var p=location.pathname;
  if(p.endsWith('/index.html')) p=p.slice(0,-10);
  else if(p.endsWith('.html')) p=p.slice(0,-5);
  location.replace('https://nexus-smarthome.pages.dev'+p+location.search+location.hash);
}
(function(){
  try{
    var L=location, p=L.pathname, isTrPage=(p==='/tr/'||p.indexOf('/tr/')===0);
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
        var code=String(navLangs[i]).toLowerCase().split('-')[0].split('_')[0];
        if(code==='tr'){isTr=true;break;}
      }
      targetLang=isTr?'tr':'en';
    }
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
  }catch(e){}
})();