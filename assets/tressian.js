/* The Tressian Group prototype — front-end behaviour (no data is sent anywhere) */
(function(){
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>Array.from(c.querySelectorAll(s));

  /* Disclosure dropdowns in main nav */
  const ddBtns=$$('.mainnav [aria-controls]');
  function closeAll(except){ddBtns.forEach(b=>{if(b!==except){b.setAttribute('aria-expanded','false');const p=document.getElementById(b.getAttribute('aria-controls'));if(p)p.hidden=true;}});}
  ddBtns.forEach(b=>{
    b.addEventListener('click',e=>{const open=b.getAttribute('aria-expanded')==='true';closeAll(b);b.setAttribute('aria-expanded',String(!open));document.getElementById(b.getAttribute('aria-controls')).hidden=open;});
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const o=ddBtns.find(b=>b.getAttribute('aria-expanded')==='true');closeAll();if(o)o.focus();closeMenu();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.mainnav'))closeAll();});

  /* Mobile menu */
  const mBtn=$('.burger .mbtn'), menu=$('#mobile-menu');
  function openMenu(){if(!menu)return;menu.hidden=false;mBtn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';const c=$('.close',menu);c&&c.focus();}
  function closeMenu(){if(!menu||menu.hidden)return;menu.hidden=true;mBtn.setAttribute('aria-expanded','false');document.body.style.overflow='';mBtn.focus();}
  mBtn&&mBtn.addEventListener('click',openMenu);
  menu&&$('.close',menu).addEventListener('click',closeMenu);
  $$('.mobile-menu [aria-controls]').forEach(b=>b.addEventListener('click',()=>{const o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));document.getElementById(b.getAttribute('aria-controls')).hidden=o;}));
  if(menu){menu.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=$$('a,button,input',menu).filter(x=>x.offsetParent!==null);const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});}

  /* Knowledge Centre filters */
  const kc=$('#kc-results');
  if(kc){
    const cards=$$('.ncard',kc), form=$('#kc-filters'), count=$('#kc-count'), chips=$('#kc-chips'), empty=$('#kc-empty'), q=$('#kc-q');
    const params=new URLSearchParams(location.search);
    ['_content_type','_category','_business'].forEach(k=>{(params.get(k)||'').split(',').filter(Boolean).forEach(v=>{const i=$(`input[name="${k}"][value="${v}"]`,form);if(i)i.checked=true;});});
    if(params.get('_terms')&&q)q.value=params.get('_terms');
    function apply(push){
      const sel={};$$('input[type=checkbox]',form).forEach(i=>{if(i.checked)(sel[i.name]=sel[i.name]||[]).push(i.value);});
      const term=(q&&q.value||'').trim().toLowerCase();
      let n=0;
      cards.forEach(c=>{
        const ok=Object.entries(sel).every(([k,vals])=>{const have=(c.dataset[k.replace(/^_/,'').replace('content_type','type')]||'').split(' ');return vals.some(v=>have.includes(v));})
          && (!term||c.textContent.toLowerCase().includes(term));
        c.hidden=!ok;if(ok)n++;
      });
      const filtered=Object.keys(sel).length||term; const pager=$('.pager');
      if(!filtered){let k=0;cards.forEach(c=>{if(!c.hidden){k++;if(k>10)c.hidden=true;}});}
      if(pager)pager.closest('nav').hidden=!!filtered;
      // live counts per option given other groups
      $$('input[type=checkbox]',form).forEach(i=>{
        const k=i.name, other=Object.entries(sel).filter(([kk])=>kk!==k);
        const cnt=cards.filter(c=>other.every(([kk,vals])=>{const have=(c.dataset[kk.replace(/^_/,'').replace('content_type','type')]||'').split(' ');return vals.some(v=>have.includes(v));})&&(c.dataset[k.replace(/^_/,'').replace('content_type','type')]||'').split(' ').includes(i.value)).length;
        const lab=i.closest('.check');$('.n',lab).textContent=cnt;lab.classList.toggle('zero',cnt===0&&!i.checked);
      });
      count.textContent=filtered?(n+(n===1?' result':' results')):('Showing 1–'+Math.min(10,n)+' of '+n+' results');
      empty.hidden=n!==0;
      chips.innerHTML='';
      $$('input[type=checkbox]:checked',form).forEach(i=>{const b=document.createElement('button');b.type='button';b.className='chip';b.innerHTML=`${i.dataset.label}<svg aria-hidden="true"><use href="#close"/></svg>`;b.setAttribute('aria-label','Remove filter: '+i.dataset.label);b.onclick=()=>{i.checked=false;apply(true);};chips.appendChild(b);});
      if(push){const p=new URLSearchParams();Object.entries(sel).forEach(([k,v])=>p.set(k,v.join(',')));if(term)p.set('_terms',term);history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));}
    }
    form.addEventListener('change',()=>apply(true));
    q&&q.addEventListener('input',()=>apply(true));
    $('#kc-reset').addEventListener('click',()=>{$$('input[type=checkbox]',form).forEach(i=>i.checked=false);if(q)q.value='';apply(true);count.focus();});
    $$('.more-toggle').forEach(b=>b.addEventListener('click',()=>{const box=document.getElementById(b.getAttribute('aria-controls'));const o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));$$('.extra',box).forEach(x=>x.hidden=o);b.textContent=o?b.dataset.more:'Show fewer';}));
    apply(false);
  }

  /* Site search results (client-side index) */
  const sr=$('#search-results');
  if(sr&&window.TRESSIAN_INDEX){
    const p=new URLSearchParams(location.search), term=(p.get('q')||p.get('_terms')||'').trim();
    const input=$('#sq'); if(input)input.value=term;
    const words=term.toLowerCase().split(/\s+/).filter(Boolean);
    const res=window.TRESSIAN_INDEX.map(d=>{const hay=(d.t+' '+d.x+' '+d.s+' '+(d.k||'')).toLowerCase();let sc=0;words.forEach(w=>{if(d.t.toLowerCase().includes(w))sc+=3;if(hay.includes(w))sc+=1;});return [sc,d];}).filter(([s])=>words.length&&s>0).sort((a,b)=>b[0]-a[0]);
    const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const hl=s=>{let o=esc(s);words.forEach(w=>{o=o.replace(new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');});return o;};
    $('#sr-count').textContent=words.length?`${res.length} result${res.length===1?'':'s'} for “${term}”`:'Enter a search term';
    sr.innerHTML=res.map(([,d])=>`<li><a href="${d.u}"><span class="sec-tag">${esc(d.s)}</span><h2>${hl(d.t)}</h2><p>${hl(d.x)}</p><span class="url">${esc(d.u)}</span></a></li>`).join('');
    $('#sr-empty').hidden=!(words.length&&!res.length);
  }

  /* Forms: accessible client-side validation, no submission (any form[data-validate]) */
  const RULES={
    name:v=>v.trim()?'':'Enter your full name',
    email:v=>!v.trim()?'Enter your email address':(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?'':'Enter an email address in the correct format, like name@example.com'),
    phone:(v,el)=>!v.trim()?(el.required?'Enter your telephone number':''):(/^[0-9 +()-]{10,}$/.test(v.trim())?'':'Enter a telephone number, like 01922 638 282'),
    topic:v=>v?'':'Select what your enquiry is about',
    message:v=>v.trim().length>=10?'':(v.trim()?'Your message must be at least 10 characters':'Enter your message'),
    consent:(v,el)=>el.checked?'':'Confirm you have read the Privacy Notice',
  };
  $$('form[data-validate]').forEach(cf=>{
    const box=cf.closest('.formcard')||cf.parentNode, sum=$('.errsum',box), list=$('ul',sum), ok=$('.success',box);
    const names=Object.keys(RULES).filter(n=>cf.elements[n]);
    function check(n){const el=cf.elements[n];const msg=RULES[n](el.value,el);const f=el.closest('.field');f.classList.toggle('invalid',!!msg);el.setAttribute('aria-invalid',msg?'true':'false');$('.err',f).textContent=msg;return msg;}
    cf.addEventListener('submit',e=>{
      e.preventDefault();
      const errs=names.map(n=>[n,check(n)]).filter(([,m])=>m);
      if(errs.length){list.innerHTML=errs.map(([n,m])=>`<li><a href="#${cf.elements[n].id}">${m}</a></li>`).join('');sum.hidden=false;ok.hidden=true;sum.focus();
        $$('a',list).forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();const t=document.querySelector(a.getAttribute('href'));t.focus();t.scrollIntoView({block:'center'});}));}
      else{sum.hidden=true;cf.hidden=true;ok.hidden=false;ok.focus();}
    });
    names.forEach(n=>{const el=cf.elements[n];['blur','change'].forEach(ev=>el.addEventListener(ev,()=>{if(el.closest('.field').classList.contains('invalid'))check(n);}));});
    if(location.hash==='#demo-errors'){cf.requestSubmit();}
  });
})();
