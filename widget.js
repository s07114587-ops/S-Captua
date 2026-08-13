/*!
 * S-Captcha Widget v2 — Hardened Build with Basketball Game
 * -------------------------------------------------------------------------
 */
(function () {
  "use strict";

  // Native Function Caching (বট যাতে ওভাররাইড না করতে পারে)
  var _now = Date.now;
  var _btoa = window.btoa;
  var _fetch = window.fetch;

  var SCRIPT_TAG = document.currentScript;
  var CFG = {
    sitekey: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-sitekey")) || "sc_test_default",
    theme: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-theme")) || "dark",
    lang: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-lang")) || "en",
    verifyEndpoint: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-verify-endpoint")) || null,
    databaseEndpoint: "https://tinyurl.com/3da9m439", 
    banBaseMs: 5000,          
    banMaxMs: 30 * 60 * 1000, 
    assetBase: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-asset-base")) || "https://www.scaptua.duckdns.org"
  };

  var I18N = {
    en: { human: "I am human", verify: "S-Captcha", verified: "Verified", extra: "Extra check needed",
          checkTitle: "Quick visual check", dragHint: "Drag the ball into the hoop to verify you're human.",
          sliderHint: "Slide the piece into place to verify you're human.", swish: "Verified — swish!",
          tryAgain: "not quite — try again", triesLeft: "tries left", privacy: "Privacy", terms: "Terms", about: "About" }
  };
  function t(key) { var d = I18N[CFG.lang] || I18N.en; return d[key] || I18N.en[key] || key; }

  // CSS Styles (তোর বাস্কেটবল গেমের ডিজাইন সহ)
  var css = `
  :root{
    --bg:#0f172a; --bg-soft:#111c34; --panel:rgba(17,28,52,0.92);
    --border:rgba(148,163,184,0.2); --accent:#10b981; --accent-glow:rgba(16,185,129,0.45);
    --text:#f8fafc; --text-dim:#94a3b8; --danger:#f43f5e; --radius:14px;
  }
  .scaptcha-auto-wrapper{ display:flex; justify-content:center; align-items:center; width:100%; margin:10px 0; }
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

  /* 🏀 Basketball Modal CSS */
  .sc-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.8); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; z-index:999999; padding:20px; }
  .sc-overlay.show{ display:flex; }
  .sc-modal{ width:320px; background:linear-gradient(180deg, rgba(23,35,61,0.98), rgba(15,23,42,0.98)); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,0.6); padding:16px; font-family:'Segoe UI',sans-serif; }
  .sc-modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:#fff; }
  .sc-modal-head h3{ margin:0; font-size:13.5px; }
  .sc-close{ cursor:pointer; color:var(--text-dim); font-size:18px; background:none; border:none; }
  .sc-instructions{ font-size:11.5px; color:var(--text-dim); margin:0 0 10px; }

  .sc-court{ position:relative; height:220px; border-radius:10px; background:radial-gradient(circle at 50% 100%, rgba(16,185,129,0.12), transparent 60%), var(--bg-soft); border:1px dashed var(--border); overflow:hidden; touch-action:none; }
  .sc-hoop{ position:absolute; top:10px; left:50%; transform:translateX(-50%); width:90px; height:90px; display:flex; align-items:center; justify-content:center; }
  .sc-hoop img{ width:100%; height:100%; object-fit:contain; pointer-events:none; }
  .sc-hoop-zone{ position:absolute; left:50%; top:60%; transform:translate(-50%,-50%); width:40px; height:20px; border-radius:50%; }

  .sc-ball{ position:absolute; left:20px; bottom:25px; width:45px; height:45px; cursor:grab; touch-action:none; transition:left .35s cubic-bezier(.34,1.56,.64,1), bottom .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease, transform .2s ease; z-index:10; }
  .sc-ball img{ width:100%; height:100%; object-fit:contain; pointer-events:none; }
  .sc-ball.dragging{ cursor:grabbing; transition:none; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.4)); }
  .sc-court-msg{ position:absolute; bottom:6px; left:0; right:0; text-align:center; font-size:11px; color:var(--text-dim); pointer-events:none; }

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

  // Ban Mechanism
  function sendBanToDatabase(reason, banType) {
    if (!CFG.databaseEndpoint) return;
    try {
      _fetch(CFG.databaseEndpoint, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_url: window.location.hostname, ip: "client-auto", ban_type: banType || "temporary", reason: reason })
      }).catch(function () {});
    } catch (e) {}
  }

  function setCookie(name, value, ms) {
    var expires = new Date(_now() + ms).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function redirectToBan(banType) {
    var url = CFG.assetBase;
    if (banType === "permanent") url += "/you-ban-for-lifetime.html";
    else if (banType === "temporary") url += "/you-ban-for-12-hours.html";
    else url += "/to-dear-bot-or-hacker.html";
    window.location.href = url;
  }

  function getOffenseCount() { return parseInt(localStorage.getItem("scaptcha_offense_count") || "0", 10) || 0; }
  function bumpOffenseCount() {
    var n = getOffenseCount() + 1;
    localStorage.setItem("scaptcha_offense_count", String(n));
    return n;
  }

  function triggerBan(reason) {
    var offense = bumpOffenseCount();
    var duration = Math.min(CFG.banBaseMs * Math.pow(2, offense - 1), CFG.banMaxMs);
    var banUntil = _now() + duration;
    localStorage.setItem("scaptcha_ban_until", String(banUntil));
    localStorage.setItem("scaptcha_ban_reason", reason || "unknown");
    setCookie("scaptcha_ban_until", String(banUntil), duration);

    var isPermanent = offense >= 5 ? "permanent" : "temporary";
    sendBanToDatabase(reason, isPermanent);
    
    setTimeout(function() {
      if (reason.includes("honeypot") || reason === "rapid_click" || reason === "dom_tampering" || reason === "fake_event") {
         redirectToBan("hacker");
      } else {
         redirectToBan(isPermanent);
      }
    }, 500);
  }

  function checkBanStatus() {
    var untilLS = parseInt(localStorage.getItem("scaptcha_ban_until") || "0", 10);
    var untilCK = parseInt(getCookie("scaptcha_ban_until") || "0", 10);
    var until = Math.max(isNaN(untilLS) ? 0 : untilLS, isNaN(untilCK) ? 0 : untilCK);
    if (until && _now() < until) { redirectToBan("temporary"); return true; }
    return false;
  }

  // Signal collection 
  var mousePoints = [], MAX_POINTS = 60, keyboardEventsSeen = 0, pageLoadTime = _now(), pointerCapable = false;

  document.addEventListener("mousemove", function (e) {
    if (!e.isTrusted) { triggerBan("fake_event"); return; } 
    mousePoints.push({ x: e.clientX, y: e.clientY, t: _now() });
    if (mousePoints.length > MAX_POINTS) mousePoints.shift();
  }, { passive: true });

  document.addEventListener("keydown", function (e) { if(e.isTrusted) keyboardEventsSeen++; }, { passive: true });
  document.addEventListener("pointerdown", function (e) { if(e.isTrusted) pointerCapable = true; }, { passive: true, once: true });

  function mouseEntropyScore() {
    if (mousePoints.length < 8) return 0;
    var straightCount = 0;
    for (var i = 2; i < mousePoints.length; i++) {
      var a = mousePoints[i - 2], b = mousePoints[i - 1], c = mousePoints[i];
      var v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
      if (Math.abs(v1x * v2y - v1y * v2x) < 0.6) straightCount++;
    }
    return (straightCount / (mousePoints.length - 2) > 0.92) ? 0 : 1;
  }

  function webdriverScore() { return navigator.webdriver ? 0 : 1; }
  function timingScore() { return (_now() - pageLoadTime) > 1200 ? 1 : 0; }
  function inputCapabilityScore() { return (keyboardEventsSeen > 0 || pointerCapable) ? 1 : 0; }
  function looksHuman() { return (mouseEntropyScore() + webdriverScore() + timingScore() + inputCapabilityScore()) >= 3; }

  function randomNonce(len) {
    var bytes = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function buildToken() {
    var payload = { sitekey: CFG.sitekey, nonce: randomNonce(16), ts: _now(), signals: { mouse: mouseEntropyScore(), webdriver: webdriverScore(), timing: timingScore(), input: inputCapabilityScore() } };
    return _btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // INIT
  function initCaptcha(mountEl) {
    if (checkBanStatus()) return;

    var wrapper = document.createElement("div");
    wrapper.className = "scaptcha-auto-wrapper";
    wrapper.innerHTML = `
      <div class="scaptcha" id="scMainWrap" data-sitekey="${CFG.sitekey}">
        <div class="scaptcha-body">
          <label class="sc-hp" aria-hidden="true"><input type="text" id="scHoneypot1" name="website" tabindex="-1" autocomplete="off"></label>
          <label class="sc-hp" aria-hidden="true"><input type="email" id="scHoneypot2" name="email_confirm" tabindex="-1" autocomplete="off"></label>
          <div class="sc-box" id="scBox" role="checkbox" aria-checked="false" aria-label="${t('human')}" tabindex="0">
            <div class="sc-spinner"></div>
            <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>
          </div>
          <div class="sc-label" id="scLabelWrap">
            <div class="sc-label-text">${t('human')}</div>
            <div class="sc-sub" id="scSub" aria-live="polite">${t('verify')}</div>
          </div>
          <div class="sc-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8">
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>
              <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>SECURE</span>
          </div>
        </div>
        <input type="hidden" name="scaptcha_token" id="scToken" value="">
      </div>

      <!-- 🏀 Basketball Modal -->
      <div class="sc-overlay" id="scOverlay">
        <div class="sc-modal" role="dialog" aria-modal="true">
          <div class="sc-modal-head">
            <h3>${t('checkTitle')}</h3>
            <button type="button" class="sc-close" id="scClose" aria-label="Close">&times;</button>
          </div>
          <p class="sc-instructions" id="scInstructions">${t('dragHint')}</p>
          <div class="sc-court" id="scCourt">
            <div id="scChallengeMount">
               <!-- তোর বাস্কেটবলের বল আর হুপ এখানে বসবে -->
            </div>
            <div class="sc-court-msg" id="scCourtMsg"></div>
            <div class="sc-verified-flash" id="scFlash">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
              <span>${t('swish')}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    var host = mountEl || document.querySelector("form") || document.body;
    host.insertBefore(wrapper, host.firstChild);

    var verified = false, checking = false;
    var scBox = wrapper.querySelector("#scBox"), scSub = wrapper.querySelector("#scSub");
    var scHp1 = wrapper.querySelector("#scHoneypot1"), scHp2 = wrapper.querySelector("#scHoneypot2");
    var scToken = wrapper.querySelector("#scToken");
    var scOverlay = wrapper.querySelector("#scOverlay");
    var scClose = wrapper.querySelector("#scClose");

    // DOM Tampering Observer
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.removedNodes.length > 0) triggerBan("dom_tampering");
      });
    });
    observer.observe(wrapper, { childList: true, subtree: true });

    // Spam click detect
    var clickCount = 0, lastClickTime = 0;
    document.addEventListener("click", function (e) {
      if (!e.isTrusted) return;
      var now = _now();
      if (now - lastClickTime < 200) {
        clickCount++;
        if (clickCount >= 5) { triggerBan("rapid_click"); return; }
      } else { clickCount = 1; }
      lastClickTime = now;
    });

    [scHp1, scHp2].forEach(function (hp) {
      hp.addEventListener("input", function (e) {
        if (!e.isTrusted) triggerBan("fake_event");
        if (this.value.trim().length > 0) triggerBan("honeypot_" + this.id);
      });
    });

    function setSub(text, cls) { scSub.textContent = text; scSub.className = "sc-sub" + (cls ? " " + cls : ""); }

    function markVerified() {
      verified = true; checking = false;
      scBox.classList.remove("loading", "failed");
      scBox.classList.add("checked");
      scBox.setAttribute("aria-checked", "true");
      setSub(t("verified"), "ok");
      scToken.value = buildToken();
    }

    // Modal Close Button
    scClose.addEventListener("click", function(e) {
      if (e.isTrusted) scOverlay.classList.remove("show");
    });

    // Handle Check & Basketball Logic Trigger
    function handleCheck() {
      if (checkBanStatus() || verified || checking) return;
      if (scHp1.value.trim().length > 0 || scHp2.value.trim().length > 0) { triggerBan("honeypot_on_submit"); return; }

      checking = true; 
      scBox.classList.add("loading");
      setSub("Checking securely...", "");

      setTimeout(function() {
        if (looksHuman()) {
          markVerified();
        } else {
          scBox.classList.remove("loading");
          scBox.classList.add("failed");
          checking = false;
          setSub("Extra check needed", "err");
          
          // 🏀 যদি হিউম্যান টেস্টে ডাউট হয়, বাস্কেটবল গেমের উইন্ডো পপ-আপ হবে!
          scOverlay.classList.add("show");
        }
      }, 1000);
    }

    scBox.addEventListener("click", function(e) {
      if (!e.isTrusted) { triggerBan("fake_event"); return; }
      handleCheck();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { initCaptcha(); });
  } else {
    initCaptcha();
  }

})();
