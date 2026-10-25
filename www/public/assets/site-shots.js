document.querySelectorAll('[data-shot-btn]').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('[data-shot]').forEach(function(img){img.hidden=img.getAttribute('data-shot')!==b.getAttribute('data-shot-btn')});
  document.querySelectorAll('[data-shot-btn]').forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false')});
})});
