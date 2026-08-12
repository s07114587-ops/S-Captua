!function(){"use strict";var e=document.createElement("style");function t(){var e=document.querySelector(".input-area")||document.querySelector("form");if(e){var t=document.createElement("div");t.className="scaptcha-auto-wrapper",t.innerHTML=`
      <div class="scaptcha" data-sitekey="auto_client_key">
        <div class="scaptcha-body">
          <label class="sc-hp" aria-hidden="true"><input type="text" class="scHoneypot" tabindex="-1"></label>
          <div class="sc-box" role="checkbox" tabindex="0">
            <div class="sc-spinner"></div>
            <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>
          </div>
          <div class="sc-label">
            <div class="sc-label-text">I am human</div>
            <div class="sc-sub">S-Captcha</div>
          </div>
          <div class="sc-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8">
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>
              <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>SECURE</span>
          </div>
        </div>
        <div class="scaptcha-footer">
          <a href="https://www.scaptua.duckdns.org/privacy.html" target="_blank">Privacy</a>
          <a href="https://www.scaptua.duckdns.org/terms.html" target="_blank">Terms</a>
          <a href="https://www.scaptua.duckdns.org/about.html" target="_blank">About</a>
        </div>
        <input type="hidden" name="scaptcha_token" class="scToken" value="">
      </div>
    `,e.parentNode.insertBefore(t,e);var a=t.querySelector(".sc-box"),s=t.querySelector(".sc-sub"),o=t.querySelector(".scToken"),i=!1;a.addEventListener("click",function(){i||(a.classList.add("loading"),s.textContent="Verifying…",setTimeout(function(){a.classList.remove("loading"),a.classList.add("checked"),s.textContent="Verified",s.className="sc-sub ok",o.value="sc_token_"+Math.random().toString(36).substring(2),i=!0},500))});var r=document.getElementById("send-btn")||document.querySelector('button[type="submit"]');r&&r.addEventListener("click",function(e){o.value||(e.preventDefault(),e.stopPropagation(),alert("Please complete the S-Captcha verification before sending a message! \uD83E\uDD16\uD83D\uDEAB"))},!0)}}e.innerHTML=`
    .scaptcha-auto-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      z-index: 9999;
      width: 100%;
    }
    .scaptcha {
      width: 320px;
      background: rgba(17,28,52,0.92);
      border: 1px solid rgba(148,163,184,0.2);
      border-radius: 14px;
      backdrop-filter: blur(14px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      overflow: hidden;
      user-select: none;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #f8fafc;
    }
    .scaptcha-body { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
    .sc-box {
      width: 26px; height: 26px; flex: 0 0 26px; border-radius: 7px;
      border: 2px solid #94a3b8; background: rgba(255,255,255,0.02);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      position: relative; transition: all 0.2s ease;
    }
    .sc-box:hover { border-color: #10b981; }
    .sc-box.checked { border-color: #10b981; background: #10b981; box-shadow: 0 0 14px rgba(16,185,129,0.45); }
    .sc-box.failed { border-color: #f43f5e; }
    .sc-box svg { width: 16px; height: 16px; stroke: #0f172a; stroke-width: 3; fill: none; opacity: 0; transform: scale(.5); transition: all .15s ease; }
    .sc-box.checked svg { opacity: 1; transform: scale(1); }
    .sc-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid rgba(16,185,129,0.25); border-top-color: #10b981; animation: sc-spin .7s linear infinite; display: none; }
    .sc-box.loading .sc-spinner { display: block; }
    .sc-box.loading svg { display: none; }
    .sc-label { flex: 1; cursor: pointer; }
    .sc-label-text { font-size: 14.5px; font-weight: 500; }
    .sc-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .sc-sub.ok { color: #10b981; }
    .sc-sub.err { color: #f43f5e; }
    .sc-badge { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 2px; opacity: .85; }
    .sc-badge svg { width: 26px; height: 26px; }
    .sc-badge span { font-size: 8.5px; color: #94a3b8; font-weight: 600; }
    .scaptcha-footer { display: flex; justify-content: space-between; padding: 8px 16px 12px; border-top: 1px solid rgba(148,163,184,0.14); }
    .scaptcha-footer a { font-size: 10.5px; color: #94a3b8; text-decoration: none; }
    .sc-hp { opacity: 0 !important; position: absolute !important; top: -9999px !important; pointer-events: none; }
    @keyframes sc-spin { to { transform: rotate(360deg); } }
  `,document.head.appendChild(e),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t()}();
