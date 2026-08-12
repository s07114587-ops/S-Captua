(function () {
  "use strict";

  // Prevent multiple executions if script is embedded twice
  if (window.__SCaptchaInitialized) return;
  window.__SCaptchaInitialized = true;

  // Detect script tag and extract parameters dynamically
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var CFG = {
    sitekey: (currentScript && currentScript.getAttribute("data-sitekey")) || "sc_default_key",
    theme: (currentScript && currentScript.getAttribute("data-theme")) || "dark",
    verifyEndpoint: (currentScript && currentScript.getAttribute("data-verify-endpoint")) || null,
    assetBase: (currentScript && currentScript.getAttribute("data-asset-base")) || "https://www.scaptua.duckdns.org",
    banBaseMs: 5000,
    banMaxMs: 30 * 60 * 1000
  };

  // -------------------------------------------------------------------------
  // Self-Contained Dynamic CSS Injection
  // -------------------------------------------------------------------------
  var css = `
    :root {
      --sc-bg: #0f172a;
      --sc-panel: rgba(17, 28, 52, 0.92);
      --sc-border: rgba(148, 163, 184, 0.2);
      --sc-accent: #10b981;
      --sc-accent-glow: rgba(16, 185, 129, 0.45);
      --sc-text: #f8fafc;
      --sc-text-dim: #94a3b8;
      --sc-danger: #f43f5e;
      --sc-radius: 12px;
    }

    [data-theme="light"] {
      --sc-bg: #ffffff;
      --sc-panel: rgba(248, 250, 252, 0.95);
      --sc-border: rgba(203, 213, 225, 0.8);
      --sc-text: #0f172a;
      --sc-text-dim: #64748b;
    }

    .scaptcha-auto-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 14px 0;
      box-sizing: border-box;
    }

    .scaptcha {
      width: 100%;
      max-width: 320px;
      background: var(--sc-panel);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--sc-text);
      box-sizing: border-box;
    }

    .scaptcha-body {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
    }

    .sc-box {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      border-radius: 6px;
      border: 2px solid var(--sc-text-dim);
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .sc-box:hover {
      border-color: var(--sc-accent);
    }

    .sc-box:focus-visible {
      outline: 2px solid var(--sc-accent);
      outline-offset: 2px;
    }

    .sc-box.checked {
      border-color: var(--sc-accent);
      background: var(--sc-accent);
      box-shadow: 0 0 12px var(--sc-accent-glow);
    }

    .sc-box.failed {
      border-color: var(--sc-danger);
      animation: scShake 0.35s ease;
    }

    .sc-box svg {
      width: 14px;
      height: 14px;
      stroke: #0f172a;
      stroke-width: 3.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.15s ease;
    }

    .sc-box.checked svg {
      opacity: 1;
      transform: scale(1);
    }

    .sc-spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(16, 185, 129, 0.25);
      border-top-color: var(--sc-accent);
      animation: scSpin 0.7s linear infinite;
      display: none;
    }

    .sc-box.loading .sc-spinner {
      display: block;
    }

    .sc-box.loading svg {
      display: none;
    }

    .sc-label {
      flex: 1;
      cursor: pointer;
    }

    .sc-label-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text);
      line-height: 1.2;
    }

    .sc-sub {
      font-size: 10.5px;
      color: var(--sc-text-dim);
      margin-top: 2px;
      transition: color 0.2s ease;
    }

    .sc-sub.ok { color: var(--sc-accent); }
    .sc-sub.err { color: var(--sc-danger); }

    .sc-badge {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      opacity: 0.85;
    }

    .sc-badge svg { width: 22px; height: 22px; }
    .sc-badge span { font-size: 8px; color: var(--sc-text-dim); font-weight: 700; letter-spacing: 0.5px; }

    .scaptcha-footer {
      display: flex;
      justify-content: space-between;
      padding: 6px 14px 8px;
      border-top: 1px solid var(--sc-border);
      background: rgba(0, 0, 0, 0.1);
    }

    .scaptcha-footer a {
      font-size: 10px;
      color: var(--sc-text-dim);
      text-decoration: none;
    }

    .scaptcha-footer a:hover {
      text-decoration: underline;
    }

    .sc-hp {
      opacity: 0 !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
      height: 0 !important;
      width: 0 !important;
      pointer-events: none;
    }

    @keyframes scSpin { to { transform: rotate(360deg); } }
    @keyframes scShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `;

  var styleTag = document.createElement("style");
  styleTag.setAttribute("data-scaptcha", "1");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // -------------------------------------------------------------------------
  // Persistent Ban & Enforcement Store (LocalStorage + Cookie Fallback)
  // -------------------------------------------------------------------------
  function setCookie(name, value, ms) {
    var expires = new Date(Date.now() + ms).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function redirectToBan() {
    window.location.href = CFG.assetBase + "/to-dear-bot-or-hacker.html";
  }

  function getOffenseCount() {
    var n = parseInt(localStorage.getItem("scaptcha_offense_count") || "0", 10);
    return isNaN(n) ? 0 : n;
  }

  function bumpOffenseCount() {
    var n = getOffenseCount() + 1;
    localStorage.setItem("scaptcha_offense_count", String(n));
    return n;
  }

  function triggerBan(reason) {
    var offense = bumpOffenseCount();
    var duration = Math.min(CFG.banBaseMs * Math.pow(2, offense - 1), CFG.banMaxMs);
    var banUntil = Date.now() + duration;
    
    localStorage.setItem("scaptcha_ban_until", String(banUntil));
    localStorage.setItem("scaptcha_ban_reason", reason || "suspicious_activity");
    setCookie("scaptcha_ban_until", String(banUntil), duration);
    redirectToBan();
  }

  function checkBanStatus() {
    var untilLS = parseInt(localStorage.getItem("scaptcha_ban_until") || "0", 10);
    var untilCK = parseInt(getCookie("scaptcha_ban_until") || "0", 10);
    var until = Math.max(isNaN(untilLS) ? 0 : untilLS, isNaN(untilCK) ? 0 : untilCK);
    
    if (until && Date.now() < until) {
      redirectToBan();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Telemetry & Security Signal Collectors
  // -------------------------------------------------------------------------
  var mousePoints = [], MAX_POINTS = 60;
  var keyboardEventsSeen = 0;
  var pageLoadTime = Date.now();
  var pointerCapable = false;

  document.addEventListener("mousemove", function (e) {
    mousePoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (mousePoints.length > MAX_POINTS) mousePoints.shift();
  }, { passive: true });

  document.addEventListener("keydown", function () { keyboardEventsSeen++; }, { passive: true });
  document.addEventListener("pointerdown", function () { pointerCapable = true; }, { passive: true, once: true });

  function mouseEntropyScore() {
    if (mousePoints.length < 8) return 0;
    var pts = mousePoints, straightCount = 0, velocities = [];
    
    for (var i = 2; i < pts.length; i++) {
      var a = pts[i - 2], b = pts[i - 1], c = pts[i];
      var v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
      
      // Check for perfectly linear synthetic trajectories
      if (Math.abs(v1x * v2y - v1y * v2x) < 0.6) straightCount++;
      
      var dt = Math.max(1, c.t - b.t);
      var dist = Math.hypot(c.x - b.x, c.y - b.y);
      velocities.push(dist / dt);
    }
    
    var straightRatio = straightCount / (pts.length - 2);
    var mean = velocities.reduce(function (s, v) { return s + v; }, 0) / velocities.length;
    var variance = velocities.reduce(function (s, v) { return s + Math.pow(v - mean, 2); }, 0) / velocities.length;
    
    return (straightRatio > 0.92 || variance < 0.0008) ? 0 : 1;
  }

  function webdriverScore() {
    return navigator.webdriver ? 0 : 1;
  }

  function timingScore() {
    return (Date.now() - pageLoadTime) > 1200 ? 1 : 0;
  }

  function inputCapabilityScore() {
    return (keyboardEventsSeen > 0 || pointerCapable) ? 1 : 0;
  }

  function looksHuman() {
    var score = mouseEntropyScore() + webdriverScore() + timingScore() + inputCapabilityScore();
    return score >= 3;
  }

  // -------------------------------------------------------------------------
  // Base64 Security Token Generation
  // -------------------------------------------------------------------------
  function randomNonce(len) {
    var bytes = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function buildToken() {
    var payload = {
      sitekey: CFG.sitekey,
      nonce: randomNonce(16),
      ts: Date.now(),
      signals: {
        mouse: mouseEntropyScore(),
        webdriver: webdriverScore(),
        timing: timingScore(),
        input: inputCapabilityScore()
      }
    };
    return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function notifyServerOptional(token) {
    if (!CFG.verifyEndpoint) return;
    try {
      fetch(CFG.verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, sitekey: CFG.sitekey })
      }).catch(function () {});
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // Automatic Widget Initialization & DOM Mounting
  // -------------------------------------------------------------------------
  function initWidget() {
    if (checkBanStatus()) return;

    // Detect target location automatically
    var targetForm = document.querySelector("form");
    var mountPoint = null;

    if (targetForm) {
      var submitBtn = targetForm.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && submitBtn.parentNode) {
        mountPoint = { parent: submitBtn.parentNode, before: submitBtn };
      } else {
        mountPoint = { parent: targetForm, before: targetForm.firstChild };
      }
    } else {
      mountPoint = { parent: document.body, before: null };
    }

    var wrapper = document.createElement("div");
    wrapper.className = "scaptcha-auto-wrapper";
    wrapper.setAttribute("data-theme", CFG.theme);

    wrapper.innerHTML = `
      <div class="scaptcha" data-sitekey="${CFG.sitekey}">
        <div class="scaptcha-body">
          <label class="sc-hp" aria-hidden="true">
            <input type="text" id="scHoneypot1" name="website_confirm" tabindex="-1" autocomplete="off">
          </label>
          <label class="sc-hp" aria-hidden="true">
            <input type="email" id="scHoneypot2" name="email_verify" tabindex="-1" autocomplete="off">
          </label>
          <div class="sc-box" id="scBox" role="checkbox" aria-checked="false" aria-label="I am human" tabindex="0">
            <div class="sc-spinner"></div>
            <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>
          </div>
          <div class="sc-label" id="scLabelWrap">
            <div class="sc-label-text">I am human</div>
            <div class="sc-sub" id="scSub" aria-live="polite">S-Captcha</div>
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
          <a href="${CFG.assetBase}/privacy.html" target="_blank" rel="noopener">Privacy</a>
          <a href="${CFG.assetBase}/terms.html" target="_blank" rel="noopener">Terms</a>
          <a href="${CFG.assetBase}/about.html" target="_blank" rel="noopener">About</a>
        </div>
        <input type="hidden" name="scaptcha_token" id="scToken" value="">
      </div>
    `;

    // Mount to the detected position
    if (mountPoint.before) {
      mountPoint.parent.insertBefore(wrapper, mountPoint.before);
    } else {
      mountPoint.parent.appendChild(wrapper);
    }

    // Element references
    var verified = false, checking = false;
    var scBox = wrapper.querySelector("#scBox");
    var scSub = wrapper.querySelector("#scSub");
    var scHp1 = wrapper.querySelector("#scHoneypot1");
    var scHp2 = wrapper.querySelector("#scHoneypot2");
    var scToken = wrapper.querySelector("#scToken");
    var scLabelWrap = wrapper.querySelector("#scLabelWrap");

    // Spam click detector: 5 rapid clicks under 200ms threshold triggers ban
    var clickCount = 0, lastClickTime = 0;
    document.addEventListener("click", function () {
      var now = Date.now();
      if (now - lastClickTime < 200) {
        clickCount++;
        if (clickCount >= 5) { triggerBan("rapid_click_spam"); return; }
      } else {
        clickCount = 1;
      }
      lastClickTime = now;
    });

    // Invisible Honeypot Trap Listeners
    [scHp1, scHp2].forEach(function (hp) {
      hp.addEventListener("input", function () {
        if (this.value.trim().length > 0) triggerBan("honeypot_trap_" + this.id);
      });
    });

    function setSubText(text, cls) {
      scSub.textContent = text;
      scSub.className = "sc-sub" + (cls ? " " + cls : "");
    }

    function markVerified() {
      verified = true;
      checking = false;
      scBox.classList.remove("loading", "failed");
      scBox.classList.add("checked");
      scBox.setAttribute("aria-checked", "true");
      setSubText("Verified", "ok");

      var token = buildToken();
      scToken.value = token;
      notifyServerOptional(token);
    }

    function handleVerification() {
      if (checkBanStatus()) return;
      if (verified || checking) return;

      if (scHp1.value.trim().length > 0 || scHp2.value.trim().length > 0) {
        triggerBan("honeypot_on_click");
        return;
      }

      checking = true;
      scBox.classList.add("loading");
      setSubText("Verifying…");

      setTimeout(function () {
        checking = false;
        scBox.classList.remove("loading");
        if (looksHuman()) {
          markVerified();
        } else {
          scBox.classList.add("failed");
          setSubText("Verification failed", "err");
          setTimeout(function () {
            scBox.classList.remove("failed");
            setSubText("Try again");
          }, 1500);
        }
      }, 500);
    }

    scBox.addEventListener("click", handleVerification);
    scBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleVerification();
      }
    });
    scLabelWrap.addEventListener("click", handleVerification);

    // Guard parent form submit event
    if (targetForm) {
      targetForm.addEventListener("submit", function (e) {
        if (checkBanStatus()) {
          e.preventDefault();
          return;
        }
        if (!verified || scHp1.value.trim().length > 0 || scHp2.value.trim().length > 0) {
          e.preventDefault();
          triggerBan("unverified_form_submit");
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Self-Execution Bootstrapper
  // -------------------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }
})();
