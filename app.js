var CFG={
  SUPABASE_URL:'https://cufbeahjechwpyvldztr.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmJlYWhqZWNod3B5dmxkenRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjYwNjAsImV4cCI6MjEwNzI0MjA2MH0.CdFElIVzjhz6SRF__vypI8v9m3jghjtciWx62YkYCn4',
  TABLE:'nabor',
  WEBHOOK_URL:'',  
  ADMIN_URL:'',    
  PING_ROLE_ID:'',                              
  COOLDOWN_HOURS:0
};
/* ═══════════════════ */
var $=function(id){return document.getElementById(id)};
var step=0,FORM;
var DEF_FORM={steps:[
{t:'Kdo jste',f:[{id:'name',l:'Jméno a příjmení',type:'text',req:1,max:60,half:1},{id:'age',l:'Věk',type:'number',req:1,min:18,max:90,half:1},{id:'phone',l:'Telefonní číslo',type:'text',req:1,max:20,half:1},{id:'origin',l:'Odkud pocházíte',type:'text',req:1,max:80,half:1},{id:'discord',l:'Kontakt na Discordu',h:'Napíšeme vám tam, pokud o vás projevíme zájem.',type:'text',req:1,max:40}]},
{t:'Vaše cesta',f:[{id:'past',l:'Vaše minulost',h:'Kdo jste, čím jste se živil(a), co vás přivedlo do města.',type:'textarea',req:1,max:900},{id:'why',l:'Proč právě my',h:'Co hledáte a co od nás čekáte.',type:'textarea',req:1,max:700}]},
{t:'Co nabídnete',f:[{id:'skills',l:'Co umíte a co nabídnete',h:'Dovednosti, kontakty, vybavení, zkušenosti.',type:'textarea',req:1,max:700},{id:'ref',l:'Kdo vás doporučil',type:'text',max:80},{id:'prev',l:'Dřívější skupina',h:'Pokud jste v nějaké byl(a), v jaké a proč jste odešel(a).',type:'textarea',max:500}]}]};
FORM=DEF_FORM;
var DC={hook:'',role:''},LAYOUT={order:[],hidden:[],custom:{}},BUILT=['uvod','kodex','cesta','prihlaska'],ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
/* texty webu: výchozí jsou v HTML, úpravy vedení se načtou z databáze (klíče txt_<id>) */
document.querySelectorAll('[data-t]').forEach(function(el){el.dataset.d=el.textContent});
var TXT_READY=fetch(CFG.SUPABASE_URL+'/rest/v1/'+CFG.TABLE+'?select=key,value&key=like.txt_*',{headers:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY}})
  .then(function(r){return r.ok?r.json():[]}).then(function(rows){
    rows.forEach(function(x){
      if(x.key==='txt_discord'){try{var d=JSON.parse(x.value);DC={hook:d.hook||'',role:d.role||''};if(DC.hook)CFG.WEBHOOK_URL=DC.hook;CFG.PING_ROLE_ID=DC.role}catch(e){}return}
      if(x.key==='txt_form'){try{var fm=JSON.parse(x.value);if(fm&&fm.steps&&fm.steps.length)FORM=fm}catch(e){}return}
      if(x.key==='txt_layout'){try{var l=JSON.parse(x.value);LAYOUT={order:l.order||[],hidden:l.hidden||[],custom:l.custom||{}}}catch(e){}return}
      var el=document.querySelector('[data-t="'+x.key.slice(4)+'"]');if(el&&typeof x.value==='string'&&x.value.trim())el.textContent=x.value});
    buildForm();applyLayout(LAYOUT);
  }).catch(function(){});
/* ?upravit = režim úprav textů pro vedení */
if(/[?&]upravit/.test(location.search)){
  var s1=document.createElement('script');
  s1.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  s1.onload=function(){var s0=document.createElement('script');s0.src='ic.js';s0.onload=function(){var s2=document.createElement('script');s2.src='edit.js';document.body.appendChild(s2)};document.body.appendChild(s0)};
  document.body.appendChild(s1);
}
function say(id,t,c){var e=$(id);e.textContent=t||'';e.className='msg'+(c?' '+c:'')}
function val(id){return $(id).value.trim()}
function cut(s,n){s=(s||'').trim();return s?(s.length>n?s.slice(0,n-1)+'…':s):'—'}

/* menu: zvýraznění kapitoly */
var links=document.querySelectorAll('.rail nav a');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)document.querySelectorAll('.rail nav a').forEach(function(a){a.classList.toggle('on',a.dataset.s===e.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.ch').forEach(function(s){io.observe(s)});

/* rozvržení: pořadí, skrytí a vlastní sekce (uloženo jako řádek txt_layout) */
function layoutIds(L){
  var ids=(L.order||[]).filter(function(i){return BUILT.indexOf(i)>-1||L.custom[i]});
  BUILT.concat(Object.keys(L.custom)).forEach(function(i){if(ids.indexOf(i)<0)ids.push(i)});
  return ids;
}
function applyLayout(L){
  var main=document.querySelector('main'),foot=main.querySelector('footer'),nav=document.querySelector('.rail nav'),n=0;
  document.querySelectorAll('.custom').forEach(function(x){x.remove()});
  layoutIds(L).forEach(function(id){
    var s=document.getElementById(id),a=nav.querySelector('[data-s="'+id+'"]'),c=L.custom[id];
    if(c){
      s=document.createElement('section');s.id=id;s.className='ch custom';
      var h=document.createElement('h2');h.textContent=c.t||'';s.appendChild(h);
      String(c.b||'').split(/\n\s*\n/).forEach(function(t){if(t.trim()){var p=document.createElement('p');p.style.whiteSpace='pre-line';p.textContent=t.trim();s.appendChild(p)}});
      a=document.createElement('a');a.href='#'+id;a.dataset.s=id;a.className='custom';a.innerHTML='<i></i><span></span>';a.lastChild.textContent=c.t||'';
    }
    if(!s||!a)return;
    var hid=(L.hidden||[]).indexOf(id)>-1&&id!=='prihlaska';
    s.classList.toggle('hide',hid);a.classList.toggle('hide',hid);
    main.insertBefore(s,foot);nav.appendChild(a);
    if(!hid)a.querySelector('i').textContent=ROM[n++]||n;
    io.observe(s);
  });
}

/* čistá adresa: odkazy na kapitoly jen posunou stránku, #hash se v adrese neukazuje */
document.addEventListener('click',function(e){
  var a=e.target.closest('a[href^="#"]');if(!a)return;
  var t=document.getElementById(a.getAttribute('href').slice(1));if(!t)return;
  e.preventDefault();t.scrollIntoView();
  if(location.hash)history.replaceState(null,'',location.pathname+location.search);
});
if(location.hash&&!/admin/.test(location.pathname))history.replaceState(null,'',location.pathname+location.search);

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
/* formulář se skládá z definice FORM (upravuje se v režimu ?upravit) */
function buildForm(){
  var P=$('prog'),S=$('steps');P.innerHTML='';S.innerHTML='';
  FORM.steps.forEach(function(s,i){
    var li=document.createElement('li');li.textContent=s.t;P.appendChild(li);
    var fs=document.createElement('fieldset'),h='',pair=0;fs.className='step';fs.dataset.i=i;
    s.f.forEach(function(f,j){
      var id='f_'+f.id,nx=s.f[j+1],c;
      if(f.type==='textarea')c='<textarea id="'+id+'"'+(f.max?' maxlength="'+f.max+'"':'')+'></textarea>';
      else if(f.type==='select')c='<select id="'+id+'"><option value=""></option>'+String(f.opts||'').split(',').filter(function(o){return o.trim()}).map(function(o){return'<option>'+esc(o.trim())+'</option>'}).join('')+'</select>';
      else if(f.type==='number')c='<input id="'+id+'" type="number"'+(f.min!=null?' min="'+f.min+'"':'')+(f.max!=null?' max="'+f.max+'"':'')+'>';
      else c='<input id="'+id+'"'+(f.max?' maxlength="'+f.max+'"':'')+'>';
      var b='<div class="f"><label for="'+id+'">'+esc(f.l)+(f.req?'':' <em>(nepovinné)</em>')+'</label>'+(f.h?'<small>'+esc(f.h)+'</small>':'')+c+'</div>';
      if(pair){h+=b+'</div>';pair=0}else if(f.half&&nx&&nx.half){h+='<div class="row2">'+b;pair=1}else h+=b;
    });
    fs.innerHTML=h;S.appendChild(fs);
  });
  showStep(0);
}
/* kroky */
function showStep(n){
  step=n;
  document.querySelectorAll('.step').forEach(function(s){s.classList.toggle('on',+s.dataset.i===n)});
  document.querySelectorAll('#prog li').forEach(function(li,i){li.classList.toggle('on',i===n);li.classList.toggle('done',i<n)});
  $('btnBack').style.visibility=n===0?'hidden':'visible';
  $('btnNext').classList.toggle('hide',n===FORM.steps.length-1);
  $('btnSend').classList.toggle('hide',n!==FORM.steps.length-1);
  say('formMsg','');
}
function valid(n){
  var first=null,m='Vyplňte všechna povinná pole.';
  FORM.steps[n].f.forEach(function(f){
    var el=$('f_'+f.id),v=el.value.trim(),bad=!!f.req&&!v;
    if(f.type==='number'&&v){var a=parseFloat(v);if(isNaN(a)||(f.min!=null&&a<f.min)||(f.max!=null&&a>f.max)){bad=true;if(!first)m='Pole „'+f.l+'“: povolená hodnota je '+(f.min!=null?f.min:'…')+' až '+(f.max!=null?f.max:'…')+'.'}}
    el.classList.toggle('bad',bad);if(bad&&!first)first=el;
  });
  if(first){first.focus();say('formMsg',m,'err')}
  return !first;
}
$('btnNext').addEventListener('click',function(){if(valid(step))showStep(step+1)});
$('btnBack').addEventListener('click',function(){showStep(step-1)});
$('appForm').addEventListener('input',function(e){e.target.classList.remove('bad')});
buildForm();

/* odeslání: uložení do Supabase (bez přihlášení) + upozornění na Discord */
$('appForm').addEventListener('submit',async function(ev){
  ev.preventDefault();
  if($('hp').value)return;
  for(var i=0;i<FORM.steps.length;i++){if(!valid(i)){showStep(i);return}}
  var last=0;try{last=parseInt(localStorage.getItem('nabor_last')||'0',10)}catch(e){}
  if(Date.now()-last<CFG.COOLDOWN_HOURS*3600*1000){say('formMsg','Přihláška už byla z tohoto zařízení odeslána. Počkejte na odpověď.','err');return}

  var id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  var d={at:new Date().toISOString(),fields:[]};
  FORM.steps.forEach(function(s){s.f.forEach(function(f){var v=val('f_'+f.id);d.fields.push({id:f.id,l:f.l,v:v});d[f.id]=v})});
  if(d.age)d.age=parseInt(d.age,10)||d.age;
  var btn=$('btnSend');btn.disabled=true;say('formMsg','Odesílám…');
  var okDb=false;
  try{
    var r=await fetch(CFG.SUPABASE_URL+'/rest/v1/'+CFG.TABLE,{method:'POST',
      headers:{'Content-Type':'application/json',apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY,Prefer:'return=minimal'},
      body:JSON.stringify({key:'app_'+id,value:JSON.stringify(d),updated_at:d.at})});
    okDb=r.ok;if(!r.ok)console.warn('Supabase',r.status,await r.text());
  }catch(e){console.warn('Supabase',e)}

  if(okDb&&CFG.WEBHOOK_URL.indexOf('https://')===0){
    var F=function(n,v,i){return v?{name:n,value:cut(v,1000),inline:!!i}:null};
    var emb={
      title:'Nová přihláška: '+cut(d.name,60),
      description:'**'+cut(d.name,60)+'**'+(d.age?', '+d.age+' let':'')+(d.origin?', '+cut(d.origin,80):''),
      color:0xC49A14,
      fields:d.fields.filter(function(f){return f.v&&f.id!=='name'}).slice(0,24).map(function(f){return{name:cut(f.l,250),value:cut(f.v,1000),inline:f.v.length<30}}),
      footer:{text:'Přihláška '+id},
      timestamp:d.at
    };
    emb.url=(CFG.ADMIN_URL||new URL('admin.html',location.href).href)+'#'+id;
    var role=/^\d{15,25}$/.test(CFG.PING_ROLE_ID)?CFG.PING_ROLE_ID:'';
    try{await fetch(CFG.WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      username:'Nábor',
      content:role?'<@&'+role+'> přišla nová přihláška':'',
      allowed_mentions:role?{roles:[role]}:{parse:[]},
      embeds:[emb]})})}catch(e){}
  }
  if(okDb){
    try{localStorage.setItem('nabor_last',String(Date.now()))}catch(e){}
    this.reset();showStep(0);say('formMsg','');
    $('appForm').classList.add('hide');$('doneView').classList.remove('hide');
  }else say('formMsg','Odeslání se nepodařilo. Zkuste to za chvíli znovu.','err');
  btn.disabled=false;
});
