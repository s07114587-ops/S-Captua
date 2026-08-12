/*!
 * S-Captcha Widget v2 — Fixed & Hardened Build
 */
(function () {
  "use strict";

  var SCRIPT_TAG = document.currentScript;
  var CFG = {
    sitekey: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-sitekey")) || "sc_test_default",
    theme: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-theme")) || "dark",
    lang: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-lang")) || "en",
    verifyEndpoint: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-verify-endpoint")) || null,
    banBaseMs: 5000,          
    banMaxMs: 30 * 60 * 1000, 
    assetBase: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-asset-base")) || "https://www.scaptua.duckdns.org"
  };

  var I18N = {
    en: { human: "I am human", verify: "S-Captcha", verified: "Verified", extra: "Extra check needed",
          checkTitle: "Quick visual check", dragHint: "Drag the ball into the hoop to verify you're human.",
          sliderHint: "Slide the piece into place to verify you're human.", swish: "Verified — swish!",
          tryAgain: "Not quite — try again", triesLeft: "tries left", privacy: "Privacy", terms: "Terms", about: "About" }
  };
  function t(key) { var d = I18N[CFG.lang] || I18N.en; return d[key] || I18N.en[key] || key; }

  var css = `
  :root{
    --bg:#0f172a; --bg-soft:#111c34; --panel:rgba(17,28,52,0.92);
    --border:rgba(148,163,184,0.2); --accent:#10b981; --accent-glow:rgba(16,185,129,0.45);
    --text:#f8fafc; --text-dim:#94a3b8; --danger:#f43f5e; --radius:14px;
  }
  .scaptcha-auto-wrapper{ display:flex; justify-content:center; align-items:center; width:100%; margin:15px 0; }
  .scaptcha{
    width:320px; background:var(--panel); border:1px solid var(--border);
    border-radius:var(--radius); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    box-shadow:0 8px 32px rgba(0,0,0,0.35); overflow:hidden; user-select:none;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif; color:var(--text);
  }
  .scaptcha-body{ display:flex; align-items:center; gap:12px; padding:14px 16px; }
  .sc-box{
    width:26px; height:26px; flex:0 0 26px; border-radius:7px; border:2px solid var(--text-dim);
    background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .2s ease; position:relative;
  }
  .sc-box:hover{ border-color:var(--accent); }
  .sc-box.checked{ border-color:var(--accent); background:var(--accent); box-shadow:0 0 14px var(--accent-glow); }
  .sc-box.failed{ border-color:var(--danger); animation:scShake .35s ease; }
  .sc-box svg{ width:16px; height:16px; stroke:#0f172a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; opacity:0; transform:scale(.5); transition:all .15s ease; }
  .sc-box.checked svg{ opacity:1; transform:scale(1); }
  .sc-spinner{ width:18px; height:18px; border-radius:50%; border:2.5px solid rgba(16,185,129,0.25); border-top-color:var(--accent); animation:scSpin .7s linear infinite; display:none; }
  .sc-box.loading .sc-spinner{ display:block; }
  .sc-box.loading svg{ display:none; }
  .sc-label{ flex:1; cursor:pointer; }
  .sc-label-text{ font-size:14.5px; font-weight:500; color:var(--text); line-height:1.2; }
  .sc-sub{ font-size:11px; color:var(--text-dim); margin-top:2px; transition:color .2s ease; }
  .sc-sub.ok{ color:var(--accent); }
  .sc-sub.err{ color:var(--danger); }
  .sc-badge{ flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px; opacity:.85; }
  .sc-badge svg{ width:26px; height:26px; }
  .sc-badge span{ font-size:8.5px; color:var(--text-dim); font-weight:600; }
  .scaptcha-footer{ display:flex; justify-content:space-between; padding:8px 16px 12px; border-top:1px solid var(--border); }
  .scaptcha-footer a{ font-size:10.5px; color:var(--text-dim); text-decoration:none; }
  .sc-hp{ opacity:0!important; position:absolute!important; top:-9999px!important; left:-9999px!important; height:0!important; width:0!important; pointer-events:none; }

  .sc-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.8); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; z-index:999999; padding:20px; }
  .sc-overlay.show{ display:flex; }
  .sc-modal{ width:320px; background:linear-gradient(180deg, rgba(23,35,61,0.98), rgba(15,23,42,0.98)); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,0.6); padding:16px; font-family:'Segoe UI',sans-serif; }
  .sc-modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:#fff; }
  .sc-modal-head h3{ margin:0; font-size:13.5px; }
  .sc-close{ cursor:pointer; color:var(--text-dim); font-size:18px; background:none; border:none; }
  .sc-instructions{ font-size:11.5px; color:var(--text-dim); margin:0 0 10px; }

  .sc-court{ position:relative; height:220px; border-radius:10px; background:radial-gradient(circle at 50% 100%, rgba(16,185,129,0.12), transparent 60%), var(--bg-soft); border:1px dashed var(--border); overflow:hidden; touch-action:none; }
  .sc-hoop{ position:absolute; top:10px; left:50%; transform:translateX(-50%); width:90px; height:90px; display:flex; align-items:center; justify-content:center; font-size: 55px; }
  .sc-ball{ position:absolute; left:20px; bottom:25px; width:55px; height:55px; cursor:grab; touch-action:none; display:flex; align-items:center; justify-content:center; font-size: 45px; z-index:10; }
  .sc-ball.dragging{ cursor:grabbing; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.4)); }

  .sc-slider-track{ position:absolute; left:20px; right:20px; top:50%; transform:translateY(-50%); height:46px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--border); }
  .sc-slider-target{ position:absolute; top:0; bottom:0; width:46px; border-radius:10px; background:rgba(16,185,129,0.15); border:2px dashed rgba(16,185,129,0.5); }
  .sc-slider-piece{ position:absolute; top:-2px; left:0; width:46px; height:46px; border-radius:10px; background:var(--accent); box-shadow:0 4px 14px var(--accent-glow); cursor:grab; touch-action:none; display:flex; align-items:center; justify-content:center; font-size:24px; }

  .sc-court-msg{ position:absolute; bottom:6px; left:0; right:0; text-align:center; font-size:12px; color:var(--danger); font-weight:bold; pointer-events:none; }
  .sc-verified-flash{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; background:rgba(15,23,42,0.92); opacity:0; pointer-events:none; transition:opacity .25s ease; z-index:20; }
  .sc-verified-flash.show{ opacity:1; pointer-events:all; }
  .sc-verified-flash svg{ width:40px; height:40px; stroke:var(--accent); }
  .sc-verified-flash span{ font-size:12.5px; color:var(--accent); font-weight:600; }

  @keyframes scSpin{ to{ transform:rotate(360deg); } }
  @keyframes scShake{ 0%,100%{ transform:translateX(0); } 25%{ transform:translateX(-4px); } 75%{ transform:translateX(4px); } }
  `;

  var styleTag = document.createElement("style");
  styleTag.setAttribute("data-scaptcha", "1");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  function randomNonce(len) {
    var bytes = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function buildToken() {
    var payload = { sitekey: CFG.sitekey, nonce: randomNonce(16), ts: Date.now() };
    return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function initCaptcha(mountEl) {
    var wrapper = document.createElement("div");
    wrapper.className = "scaptcha-auto-wrapper";
    wrapper.innerHTML = `
      <div class="scaptcha" data-sitekey="${CFG.sitekey}">
        <div class="scaptcha-body">
          <label class="sc-hp" aria-hidden="true"><input type="text" id="scHoneypot1" name="website" tabindex="-1" autocomplete="off"></label>
          <label class="sc-hp" aria-hidden="true"><input type="email" id="scHoneypot2" name="email_confirm" tabindex="-1" autocomplete="off"></label>
          <div class="sc-box" id="scBox" role="checkbox" aria-checked="false" tabindex="0">
            <div class="sc-spinner"></div>
            <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>
          </div>
          <div class="sc-label" id="scLabelWrap">
            <div class="sc-label-text">${t('human')}</div>
            <div class="sc-sub" id="scSub">${t('verify')}</div>
          </div>
          <div class="sc-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>SECURE</span>
          </div>
        </div>
        <div class="scaptcha-footer">
          <a href="${CFG.assetBase}/privacy.html" target="_blank">${t('privacy')}</a>
          <a href="${CFG.assetBase}/terms.html" target="_blank">${t('terms')}</a>
          <a href="${CFG.assetBase}/about.html" target="_blank">${t('about')}</a>
        </div>
        <input type="hidden" name="scaptcha_token" id="scToken" value="">
      </div>
      <div class="sc-overlay" id="scOverlay">
        <div class="sc-modal">
          <div class="sc-modal-head">
            <h3>${t('checkTitle')}</h3>
            <button type="button" class="sc-close" id="scClose">&times;</button>
          </div>
          <p class="sc-instructions" id="scInstructions"></p>
          <div class="sc-court" id="scCourt">
            <div id="scChallengeMount"></div>
            <div class="sc-court-msg" id="scCourtMsg"></div>
            <div class="sc-verified-flash" id="scFlash">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
              <span>${t('swish')}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // 🎯 Smart Auto-Mounting Logic
    var host = mountEl || document.querySelector("form") || document.body;
    var submitBtn = host.querySelector('button[type="submit"], input[type="submit"]');

    if (submitBtn) {
      // বাটন থাকলে ঠিক তার ওপরে বক্স বসবে
      submitBtn.parentNode.insertBefore(wrapper, submitBtn);
    } else {
      // নতুবা ফরমের একদম নিচে বসবে
      host.appendChild(wrapper);
    }

    var verified = false, checking = false;
    var scBox = wrapper.querySelector("#scBox"), scSub = wrapper.querySelector("#scSub");
    var scToken = wrapper.querySelector("#scToken"), scOverlay = wrapper.querySelector("#scOverlay");
    var scClose = wrapper.querySelector("#scClose"), scLabelWrap = wrapper.querySelector("#scLabelWrap");
    var scChallengeMount = wrapper.querySelector("#scChallengeMount"), scInstructions = wrapper.querySelector("#scInstructions");
    var scFlash = wrapper.querySelector("#scFlash"), scCourtMsg = wrapper.querySelector("#scCourtMsg");

    function markVerified() {
      verified = true; checking = false;
      scBox.classList.remove("loading", "failed");
      scBox.classList.add("checked");
      scSub.textContent = t("verified");
      scSub.className = "sc-sub ok";
      scToken.value = buildToken();
    }

    function initGameChallenge() {
      var isBasketball = Math.random() > 0.5;
      if (isBasketball) {
        scInstructions.textContent = t('dragHint');
        scChallengeMount.innerHTML = `<div class="sc-hoop" id="scDropZone">🧺</div><div class="sc-ball" id="scDraggable">🏀</div>`;
      } else {
        scInstructions.textContent = t('sliderHint');
        scChallengeMount.innerHTML = `<div class="sc-slider-track"><div class="sc-slider-target" id="scDropZone" style="right:0; left:auto;"></div><div class="sc-slider-piece" id="scDraggable">🧩</div></div>`;
      }

      var dragEl = wrapper.querySelector("#scDraggable");
      var dropZone = wrapper.querySelector("#scDropZone");
      var isDragging = false, startX, startY, initX, initY;

      function onStart(e) {
        e.preventDefault();
        isDragging = true;
        var ev = e.touches ? e.touches[0] : e;
        startX = ev.clientX; startY = ev.clientY;
        initX = dragEl.offsetLeft; initY = dragEl.offsetTop;
        dragEl.classList.add("dragging");
      }

      function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        var ev = e.touches ? e.touches[0] : e;
        var dx = ev.clientX - startX; var dy = ev.clientY - startY;
        dragEl.style.left = (initX + dx) + "px";
        if (isBasketball) dragEl.style.top = (initY + dy) + "px";
      }

      function onEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        dragEl.classList.remove("dragging");

        var rect1 = dragEl.getBoundingClientRect();
        var rect2 = dropZone.getBoundingClientRect();
        var overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

        if (overlap) {
          dragEl.style.display = "none";
          scFlash.classList.add("show");
          setTimeout(function () {
            scOverlay.classList.remove("show");
            scFlash.classList.remove("show");
            markVerified();
          }, 1000);
        } else {
          dragEl.style.left = ""; dragEl.style.top = "";
          scCourtMsg.textContent = t('tryAgain');
          setTimeout(function () { scCourtMsg.textContent = ""; }, 1500);
        }
      }

      dragEl.addEventListener("mousedown", onStart);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      dragEl.addEventListener("touchstart", onStart, { passive: false });
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    }

    function handleCheck() {
      if (verified || checking) return;
      checking = true; 
      scBox.classList.add("loading");

      setTimeout(function () {
        scBox.classList.remove("loading");
        scOverlay.classList.add("show");
        initGameChallenge();
      }, 400);
    }

    scBox.addEventListener("click", handleCheck);
    scLabelWrap.addEventListener("click", handleCheck);
    scClose.addEventListener("click", function() { scOverlay.classList.remove("show"); checking = false; scBox.classList.remove("loading"); });
  }

  // 🚀 Auto Execute on Load
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initCaptcha, 100);
  } else {
    document.addEventListener("DOMContentLoaded", initCaptcha);
  }

  window.SCaptcha = { init: initCaptcha };
})();
