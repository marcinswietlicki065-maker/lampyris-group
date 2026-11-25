(function(){
  'use strict';

  /* ---------- nagłówek: przezroczysty nad hero, pełny po przewinięciu ---------- */
  var head=document.getElementById('head');
  var mcta=document.getElementById('mobile-cta');
  var quizEl=document.getElementById('wycena');
  function onScroll(){
    var y=window.scrollY;
    if(head && !head.classList.contains('always-solid')) head.classList.toggle('solid',y>40);
    if(mcta && quizEl){
      var r=quizEl.getBoundingClientRect();
      var quizVisible=r.top<window.innerHeight && r.bottom>0;
      mcta.classList.toggle('show',y>500 && !quizVisible);
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();

  /* ---------- menu mobilne / tablet ---------- */
  var burger=document.getElementById('burger'), drawer=document.getElementById('drawer'), closeBtn=document.getElementById('drawer-close');
  function setMenu(open){
    if(!drawer) return;
    drawer.classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open);
    if(burger) burger.setAttribute('aria-expanded',open);
    if(open && closeBtn) closeBtn.focus(); else if(burger) burger.focus({preventScroll:true});
  }
  if(burger) burger.addEventListener('click',function(){setMenu(true)});
  if(closeBtn) closeBtn.addEventListener('click',function(){setMenu(false)});
  if(drawer) drawer.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&drawer&&drawer.classList.contains('open'))setMenu(false)});
  window.addEventListener('resize',function(){if(window.innerWidth>=1024&&drawer&&drawer.classList.contains('open'))setMenu(false)});

  /* ---------- kopiowanie telefonu / e-maila ---------- */
  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click',function(){
      var el=document.getElementById(b.dataset.copy), t=el.textContent.trim();
      var done=function(){b.textContent='Skopiowano';setTimeout(function(){b.textContent='Kopiuj'},1600)};
      var fallback=function(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Zaznaczono'};
      try{navigator.clipboard.writeText(t).then(done,fallback)}catch(e){fallback()}
    });
  });

  /* ---------- kalkulator wyceny (lejek) ---------- */
  var quiz=quizEl; if(!quiz) return;
  var state={step:1,type:null,size:50,std:1};
  var steps=quiz.querySelectorAll('.q');
  var next=document.getElementById('q-next'), back=document.getElementById('q-back');
  var bar=document.getElementById('q-bar'), stepLbl=document.getElementById('q-step'), secure=document.getElementById('q-secure');
  var size=document.getElementById('q-size'), sizeOut=document.getElementById('q-size-out');
  var sizeLabel=document.getElementById('size-label'), sizeHint=document.getElementById('size-hint');
  var err=document.getElementById('q-err');
  var STD=['Standard','Komfort','Premium'];
  var PHONE='+48 500 000 000';

  // stawki robocizny netto [od, do] dla standardu Standard / Komfort / Premium
  var RATES={
    mieszkanie:{unit:'m²',min:20,max:150,def:50,label:'Ile metrów ma mieszkanie?',hint:'Powierzchnia podłogi, orientacyjnie.',r:[[550,700],[700,900],[900,1200]]},
    lazienka:{unit:'m²',min:2,max:15,def:5,label:'Ile metrów ma łazienka?',hint:'Typowa łazienka w bloku ma 3–5 m².',r:[[3000,3800],[3800,4800],[4800,6200]],floor:12000},
    strych:{unit:'m²',min:10,max:120,def:30,label:'Ile metrów ma strych?',hint:'Powierzchnia podłogi, orientacyjnie.',r:[[400,550],[550,700],[700,900]]},
    klatka:{unit:'pięter',min:1,max:12,def:4,label:'Ile kondygnacji ma klatka?',hint:'Parter liczymy jako pierwszą kondygnację.',r:[[3000,4000],[4000,5000],[5000,6500]]}
  };
  function fmt(n){return n.toLocaleString('pl-PL')+' zł'}
  function round(n){return Math.round(n/500)*500}
  function sizeText(){var c=RATES[state.type];return state.size+' '+(c?c.unit:'m²')}
  function estimate(){
    var c=RATES[state.type], r=c.r[state.std], lo=r[0]*state.size, hi=r[1]*state.size;
    if(c.floor){lo=Math.max(lo,c.floor);hi=Math.max(hi,c.floor*1.25)}
    return [round(lo),round(hi)];
  }
  function track(name,data){ // przekazuje zdarzenia do analityki tylko po zgodzie (patrz cookies.js)
    if(window.swConsent && window.swConsent.has('analytics') && typeof window.gtag==='function') window.gtag('event',name,data||{});
  }
  function render(){
    steps.forEach(function(s){s.hidden=+s.dataset.step!==state.step});
    var shown=Math.min(state.step,4);
    bar.style.width=(state.step>=5?100:shown*25)+'%';
    stepLbl.textContent=state.step>=5?'Gotowe':'Krok '+shown+' z 4';
    back.disabled=state.step===1||state.step===5;
    next.hidden=state.step===5;
    next.disabled=state.step===1&&!state.type;
    next.textContent=state.step===3?'Pokaż wycenę':state.step===4?'Wyślij zgłoszenie':'Dalej';
    secure.hidden=state.step!==4;
    if(state.step===4){
      var e=estimate();
      document.getElementById('q-est').textContent=fmt(e[0])+' – '+fmt(e[1]);
      document.getElementById('q-est-note').textContent=sizeText()+' · '+STD[state.std]+' · netto, bez materiałów';
    }
  }
  function setType(v){
    state.type=v;
    quiz.querySelectorAll('[data-k="type"]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===v))});
    var c=RATES[v]; size.min=c.min; size.max=c.max; size.value=c.def; state.size=c.def;
    sizeLabel.textContent=c.label; sizeHint.textContent=c.hint; sizeOut.textContent=sizeText();
  }
  function setStd(i){
    state.std=i;
    quiz.querySelectorAll('[data-k="std"]').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===i))});
  }
  quiz.addEventListener('click',function(e){
    var t=e.target.closest('.tile'); if(!t) return;
    if(t.dataset.k==='type'){setType(t.dataset.v);state.step=2;track('quiz_type',{type:t.dataset.v})}
    else setStd(+t.dataset.v);
    render();
  });
  size.addEventListener('input',function(){state.size=+size.value;sizeOut.textContent=sizeText()});
  back.addEventListener('click',function(){if(state.step>1){state.step--;err.textContent='';render()}});
  next.addEventListener('click',function(){
    if(state.step<4){state.step++;render();if(state.step===4)track('quiz_estimate');return}
    var name=document.getElementById('q-name'), phone=document.getElementById('q-phone'), rodo=document.getElementById('q-rodo');
    if(!name.value.trim()){err.textContent='Wpisz imię, żebyśmy wiedzieli, jak się do Ciebie zwracać.';name.focus();return}
    if(phone.value.replace(/\D/g,'').length<9){err.textContent='Wpisz numer telefonu (9 cyfr), żebyśmy mogli oddzwonić.';phone.focus();return}
    if(!rodo.checked){err.textContent='Zaznacz zgodę na kontakt, żebyśmy mogli oddzwonić z wyceną.';rodo.focus();return}
    err.textContent='';
    var e=estimate();
    var lead={_subject:'Nowe zapytanie z kalkulatora: '+state.type,imie:name.value.trim(),telefon:phone.value.trim(),rodzaj:state.type,wielkosc:sizeText(),
      standard:STD[state.std],miasto:document.getElementById('q-city').value,termin:document.getElementById('q-when').value,wycena:fmt(e[0])+' – '+fmt(e[1])};
    var ep=quiz.dataset.endpoint;
    if(!ep){err.textContent='Wysyłka zgłoszeń nie jest jeszcze podłączona. Zadzwoń pod '+PHONE+'.';return}
    next.disabled=true; next.textContent='Wysyłanie…';
    fetch(ep,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(lead)})
      .then(function(r){if(!r.ok)throw 0;state.step=5;render();track('generate_lead',{type:state.type})})
      .catch(function(){err.textContent='Nie udało się wysłać. Zadzwoń pod '+PHONE+'.';next.disabled=false;next.textContent='Wyślij zgłoszenie'});
  });
  document.querySelectorAll('[data-pick]').forEach(function(a){
    a.addEventListener('click',function(){
      setType(a.dataset.pick);
      if(a.dataset.std){setStd(+a.dataset.std);state.step=2}else state.step=2;
      render();
    });
  });
  render();
})();
