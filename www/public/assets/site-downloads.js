(function(){var TR=(document.documentElement.lang||'en').slice(0,2)==='tr';
  var FILES={windows:[["NEXUS-Setup.exe",".exe"]],linux:[["NEXUS-linux.AppImage",".AppImage"],["NEXUS-linux.deb",".deb"]],android:[["NEXUS-Android.apk",".apk"]]};
  function mb(n){return n>=1048576?(Math.round(n/104857.6)/10).toLocaleString(TR?'tr-TR':'en-US')+' MB':Math.round(n/1024)+' KB'}
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest',{headers:{Accept:'application/vnd.github+json'}})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var v=String(d.tag_name).replace(/^v/,'');
      document.querySelectorAll('[data-nexus-ver]').forEach(function(e){e.textContent=v});
      var sizes={};(d.assets||[]).forEach(function(a){sizes[a.name]=a.size});
      Object.keys(FILES).forEach(function(p){
        var card=document.querySelector('.dl-card[data-platform="'+p+'"]');if(!card)return;
        var row=card.querySelector('.dl-meta');if(!row)return;
        FILES[p].forEach(function(f){var s=sizes[f[0]];
          var sp=document.createElement('span');
          sp.textContent=f[0].replace('NEXUS-','')+(s?' · '+mb(s):'');
          row.appendChild(sp);});
      });
    }).catch(function(){});
})();
