/* Výzva k nastavení IC jména. Ukládá se do účtu vedení (user_metadata.ic_name). */
function icOf(u){var m=(u&&u.user_metadata)||{};return String(m.ic_name||"").trim()}
function askIC(sb,user,done,force){
  if(!user||(!force&&icOf(user))||document.getElementById("icOv"))return;
  var ov=document.createElement("div");ov.id="icOv";ov.className="icov";
  ov.innerHTML="<div class=\"panel\" role=\"dialog\" aria-modal=\"true\"><h3>IC jméno</h3>"+
    "<p class=\"sub\">"+(force?"Změňte jméno své postavy.":"Než budete pokračovat, nastavte jméno své postavy. Bude se zobrazovat u vašich hlasů a poznámek.")+"</p>"+
    "<div class=\"f\"><label for=\"icIn\">Jméno a příjmení postavy</label><input id=\"icIn\" maxlength=\"40\" autocomplete=\"off\"></div>"+
    "<div class=\"nav\">"+(force?"<button class=\"btn ghost\" id=\"icNo\" type=\"button\"><span>Zrušit</span></button>":"")+"<button class=\"btn\" id=\"icOk\" type=\"button\"><span>Uložit</span></button></div>"+
    "<p class=\"msg\" id=\"icMsg\" role=\"status\"></p></div>";
  document.body.appendChild(ov);
  var inp=ov.querySelector("#icIn"),msg=ov.querySelector("#icMsg"),ok=ov.querySelector("#icOk");
  inp.value=icOf(user);inp.focus();
  var close=function(){ov.remove()};
  if(force)ov.querySelector("#icNo").onclick=close;
  var save=async function(){
    var v=inp.value.trim().replace(/\s+/g," ");
    if(v.length<3){msg.textContent="Zadejte jméno postavy (aspoň 3 znaky).";msg.className="msg err";return}
    ok.disabled=true;msg.textContent="Ukládám…";msg.className="msg";
    var r=await sb.auth.updateUser({data:{ic_name:v}});
    ok.disabled=false;
    if(r.error){msg.textContent="Uložení se nepodařilo: "+r.error.message;msg.className="msg err";return}
    close();if(done)done(r.data.user);
  };
  ok.onclick=save;
  inp.onkeydown=function(e){if(e.key==="Enter")save()};
}
