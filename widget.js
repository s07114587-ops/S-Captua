!function(){"use strict";var e=document.createElement("style");function t(){var e=document.querySelector("form")||document.querySelector("header")||document.querySelector(".dev-header");var t=document.createElement("div");var n=!1;if(e){t.className="scaptcha-auto-wrapper"}else{n=!0;t.className="scaptcha-modal-overlay"}t.innerHTML='<div class="scaptcha" data-sitekey="auto_client_key"><div class="scaptcha-body"><label class="sc-hp" style="display:none!important;"><input type="text" class="scHoneypot" tabindex="-1" autocomplete="off"></label><div class="sc-box" role="checkbox" tabindex="0"><div class="sc-spinner"></div><svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg></div><div class="sc-label"><div class="sc-label-text">I am human</div><div class="sc-sub">S-Captcha</div></div><div class="sc-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>SECURE</span></div></div><div class="scaptcha-footer"><a href="https://www.scaptua.duckdns.org/privacy.html" target="_blank">Privacy</a><a href="https://www.scaptua.duckdns.org/terms.html" target="_blank">Terms</a><a href="https://www.scaptua.duckdns.org/about.html" target="_blank">About</a></div><input type="hidden" name="scaptcha_token" class="scToken" value=""></div>';if(e){e.parentNode.insertBefore(t,e)}else{document.body.appendChild(t)}var c=t.querySelector(".sc-box"),r=t.querySelector(".sc-sub"),a=t.querySelector(".scToken"),i=t.querySelector(".scHoneypot"),o=!1,s=0,u=Date.now();

// রিডাইরেক্ট ফাংশন
function d(){window.location.href="https://www.scaptua.duckdns.org/to-dear-bot-or-hacker.html"}

// চ্যালেঞ্জ শো করার ফাংশন
function showChallenge(){
    var ch=document.createElement("div");
    ch.className="sc-challenge-overlay";
    ch.innerHTML='<div class="sc-challenge-box"><img src="https://i.ibb.co/3s8sC6j/bot-wizard.png" alt="Challenge" style="width:150px; border-radius:10px;"><p>⚠️ Suspicious Activity!</p><span>Prove you are human</span><button class="sc-solve-btn">Solve Challenge 🧙‍♂️</button></div>';
    document.body.appendChild(ch);
    ch.querySelector(".sc-solve-btn").onclick=function(){ch.remove();s=0;};
}

// ফর্ম প্রোটেকশন
var f=e?e:document.querySelector("form");
var btn=f?f.querySelector('button[type="submit"], input[type="submit"]'):null;
if(btn){btn.disabled=!0;btn.style.opacity="0.5"}

if(f){f.addEventListener("submit",(function(event){if(!o){event.preventDefault();d()}}))}

i.addEventListener("input",(function(){d()}));
c.addEventListener("click",(function(){
    if(!o){
        if(i.value!==""){d();return}
        var e=Date.now();
        if(e-u<1000){s++}else{s=1,u=e} // ১ সেকেন্ডের মধ্যে ক্লিক স্পিড চেক
        
        if(s>3){ // ৩ বারের বেশি ক্লিকে চ্যালেঞ্জ আসবে
            showChallenge();
            s=0; // রিসেট
            return;
        }
        
        c.classList.add("loading"),r.textContent="Verifying…",setTimeout((function(){c.classList.remove("loading"),c.classList.add("checked"),r.textContent="Verified",r.className="sc-sub ok",a.value="sc_token_"+Math.random().toString(36).substring(2),o=!0;if(btn){btn.disabled=!false;btn.style.opacity="1"}}),500)
    }
}))}e.innerHTML=".scaptcha-auto-wrapper{display:flex;justify-content:center;align-items:center;padding:10px;z-index:9999;width:100%}.scaptcha-modal-overlay{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(8px)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:999999!important;animation:scFadeIn 0.3s ease}.scaptcha{width:320px;background:rgba(17,28,52,.95);border:1px solid rgba(148,163,184,.3);border-radius:14px;backdrop-filter:blur(14px);box-shadow:0 10px 40px rgba(0,0,0,.6);overflow:hidden;user-select:none;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#f8fafc;margin:auto}.scaptcha-body{display:flex;align-items:center;gap:12px;padding:14px 16px}.sc-box{width:26px;height:26px;flex:0 0 26px;border-radius:7px;border:2px solid #94a3b8;background:rgba(255,255,255,.02);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:all .2s ease}.sc-box:hover{border-color:#10b981}.sc-box.checked{border-color:#10b981;background:#10b981;box-shadow:0 0 14px rgba(16,185,129,.45)}.sc-spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(16,185,129,.25);border-top-color:#10b981;animation:sc-spin .7s linear infinite;display:none}.sc-box.loading .sc-spinner{display:block}.sc-box.loading svg{display:none}.sc-label{flex:1;cursor:pointer}.sc-label-text{font-size:14.5px;font-weight:500}.sc-sub{font-size:11px;color:#94a3b8;margin-top:2px}.sc-sub.ok{color:#10b981}.sc-badge{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;opacity:.85}.sc-badge svg{width:26px;height:26px}.sc-badge span{font-size:8.5px;color:#94a3b8;font-weight:600}.scaptcha-footer{display:flex;justify-content:space-between;padding:8px 16px 12px;border-top:1px solid rgba(148,163,184,.14)}.scaptcha-footer a{font-size:10.5px;color:#94a3b8;text-decoration:none}.sc-challenge-overlay{position:fixed!important;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:9999999}.sc-challenge-box{background:#111c34;padding:20px;border-radius:16px;text-align:center;width:280px;color:white;border:1px solid #10b981}.sc-solve-btn{background:#10b981;color:white;border:none;padding:10px;border-radius:5px;cursor:pointer;margin-top:10px;width:100%}@keyframes sc-spin{to{transform:rotate(360deg)}}@keyframes scFadeIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}",document.head.appendChild(e),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t()}();
