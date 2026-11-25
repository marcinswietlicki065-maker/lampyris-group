/* Zgoda na pliki cookies (RODO / Prawo komunikacji elektronicznej).
   Kategorie: niezbędne (zawsze), analityczne, marketingowe.
   Wybór zapisywany w localStorage pod kluczem "sw_consent" na 12 miesięcy.
   Narzędzia analityczne/marketingowe ładują się dopiero po zgodzie — dodaj je w LOADERS. */
(function(){
  'use strict';
  var KEY='sw_consent', VERSION=1, MAX_AGE=365*24*3600*1000;

  // Tu podłączysz narzędzia, gdy będą potrzebne. Uruchomią się wyłącznie po zgodzie.
  var LOADERS={
    analytics:function(){
      // Google Analytics 4 — wpisz identyfikator i odkomentuj:
      // var id='G-XXXXXXXXXX'; var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+id; document.head.appendChild(s);
      // window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; gtag('js',new Date()); gtag('config',id,{anonymize_ip:true});
    },
    marketing:function(){
      // Meta Pixel — wpisz identyfikator piksela i wklej kod z Menedżera zdarzeń Meta.
    }
  };

  function read(){
    try{
      var v=JSON.parse(localStorage.getItem(KEY)||'null');
      if(v && v.v===VERSION && Date.now()-v.ts<MAX_AGE) return v;
    }catch(e){}
    return null;
  }
  function save(c){
    c.v=VERSION; c.ts=Date.now(); c.necessary=true;
    try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}
    current=c; apply();
  }
  var current=read(), loaded={};
  function apply(){
    if(!current) return;
    ['analytics','marketing'].forEach(function(k){if(current[k]&&!loaded[k]){loaded[k]=true;try{LOADERS[k]()}catch(e){}}});
  }
  window.swConsent={has:function(k){return k==='necessary'||!!(current&&current[k])},open:function(){show(true)}};

  var el;
  function build(){
    el=document.createElement('div');
    el.className='cookie'; el.setAttribute('role','dialog'); el.setAttribute('aria-labelledby','ck-title'); el.setAttribute('aria-describedby','ck-desc');
    el.innerHTML=
      '<h2 id="ck-title">Pliki cookies</h2>'+
      '<p id="ck-desc">Używamy niezbędnych plików cookies i pamięci przeglądarki, żeby strona działała. Za Twoją zgodą możemy też używać cookies analitycznych i marketingowych, żeby mierzyć ruch i docierać z ofertą. Szczegóły znajdziesz w <a href="polityka-prywatnosci.html#cookies">polityce prywatności</a>.</p>'+
      '<div class="cookie-opts" id="ck-opts" hidden>'+
        opt('ck-nec','Niezbędne','Działanie strony i zapamiętanie Twojego wyboru. Nie można ich wyłączyć.',true,true)+
        opt('ck-ana','Analityczne','Anonimowe statystyki odwiedzin, które pomagają ulepszać stronę.',false,false)+
        opt('ck-mkt','Marketingowe','Dopasowanie reklam w serwisach społecznościowych i wyszukiwarce.',false,false)+
      '</div>'+
      '<div class="cookie-actions">'+
        '<button type="button" class="btn btn-line" id="ck-reject">Odrzuć</button>'+
        '<button type="button" class="btn btn-line" id="ck-custom">Ustawienia</button>'+
        '<button type="button" class="btn btn-dark" id="ck-all">Akceptuję wszystkie</button>'+
      '</div>';
    document.body.appendChild(el);
    var opts=el.querySelector('#ck-opts'), custom=el.querySelector('#ck-custom');
    el.querySelector('#ck-reject').addEventListener('click',function(){save({analytics:false,marketing:false});hide()});
    el.querySelector('#ck-all').addEventListener('click',function(){save({analytics:true,marketing:true});hide()});
    custom.addEventListener('click',function(){
      if(opts.hidden){opts.hidden=false;custom.textContent='Zapisz wybór';return}
      save({analytics:el.querySelector('#ck-ana').checked,marketing:el.querySelector('#ck-mkt').checked});hide();
    });
  }
  function opt(id,title,desc,checked,disabled){
    return '<div class="opt"><b>'+title+'</b><small>'+desc+'</small><span class="switch"><input type="checkbox" role="switch" id="'+id+'" aria-label="'+title+'"'+(checked?' checked':'')+(disabled?' disabled':'')+'><span></span></span></div>';
  }
  function show(withOptions){
    if(!el) build();
    el.hidden=false; document.body.classList.add('cookie-open');
    if(withOptions){
      el.querySelector('#ck-opts').hidden=false; el.querySelector('#ck-custom').textContent='Zapisz wybór';
      el.querySelector('#ck-ana').checked=!!(current&&current.analytics);
      el.querySelector('#ck-mkt').checked=!!(current&&current.marketing);
    }
    var first=el.querySelector('#ck-all'); if(first) first.focus({preventScroll:true});
  }
  function hide(){if(el){el.hidden=true;document.body.classList.remove('cookie-open')}}

  function init(){
    apply();
    if(!current) show(false);
    document.querySelectorAll('[data-cookie-settings]').forEach(function(b){b.addEventListener('click',function(){show(true)})});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
