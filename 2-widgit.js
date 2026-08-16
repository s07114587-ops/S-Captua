// S-Captcha Widget v2 — hardened build. IMPORTANT: this is a front-end signal only — it's not real security until your SERVER calls the verify endpoint with a secret key before accepting a submission (see the SERVER-SIDE CONTRACT note at the bottom of this file).
(function () {
  "use strict";
  var SCRIPT_TAG = document.currentScript;
  var CFG = {
    sitekey: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-sitekey")) || "sc_test_default",
    theme: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-theme")) || "dark",
    lang: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-lang")) || "en",
    verifyEndpoint: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-verify-endpoint")) || null,
    assetBase: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-asset-base")) || "https://www.scaptua.duckdns.org",
    // Google Apps Script Web App URL that logs bans / answers ban checks. Recommend pointing this at the real script.google.com/macros/.../exec URL rather than a tinyurl redirect — one less hop, one less thing that can break if the short link ever expires or gets rate-limited.
    dbEndpoint: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-db-endpoint")) || "https://script.google.com/macros/s/AKfycbwsnnrJMh5Svw378pmlwqaKNz2HHuw5r2hbuzFDWAgeGNd0ctw3mPf-sbvGOrIC5HcE/exec",
    // How long the server ban-check is allowed to delay first render for a clean visitor before we give up waiting and show the widget anyway.
    serverCheckTimeoutMs: 2200,
    tier1Ms: 5 * 60 * 1000,           // 1st offense — 5 minutes
    tier2Ms: 12 * 60 * 60 * 1000,     // 2nd+ offense — 12 hours
    tier2ToPermanentCount: 3,         // 3rd time hitting tier2 => lifetime
    challengeAttempts: 3,             // 3 shots at the mini-game before a ban fires
    // "lettergrid" = tap the c-1.png tile game, "basketball" = the drag-the-ball game
    challengeType: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-challenge-type")) || "lettergrid",
    banPages: {
      tier1: "/to-dear-bot-or-hacker.html",
      tier2: "/you-ban-for-12hours.html",
      permanent: "/you-ban-for-lifetime.html"
    },
    // IPs in this list are never banned and skip the challenge entirely — meant for the site owner / admins / trusted testers, not end users. Add more via data-whitelist-ips="ip1,ip2,ip3" (comma separated).
    whitelistIps: (function () {
      // Static fallback IPs — always whitelisted even if the DuckDNS lookup below is stale or fails. Add more via data-whitelist-ips="ip1,ip2" (comma separated).
      var base = ["2a09:bac5:3e0e:1a8c::2a5:58"];
      var extra = (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-whitelist-ips")) || "";
      var extraList = extra.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      return base.concat(extraList);
    })(),
    // Dynamic DNS hostname that always points at the owner's current IP — resolved fresh (via DNS-over-HTTPS, since browsers/Apps Script can't do raw DNS) so this keeps working even if the IP changes, unlike a hardcoded address. Override with data-whitelist-host.
    whitelistHost: (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-whitelist-host")) || "s-ip.duckdns.org",
    whitelistCacheMs: 5 * 60 * 1000 // re-resolve the host every 5 min
  };
  var I18N = {
    en: { human: "I am human", verify: "S-Captcha", verified: "Verified", extra: "Extra check needed",
          checkTitle: "Quick visual check", dragHint: "Drag the ball into the hoop to verify you're human.",
          sliderHint: "Slide the piece into place to verify you're human.",
          gridHint: "Tap the D and Y tiles only. Any other tile ends the check.",
          captchaHint: "One last check — type the code shown below.",
          swish: "Verified — swish!", solved: "Verified!",
          tryAgain: "not quite — try again", triesLeft: "tries left", privacy: "Privacy", terms: "Terms", about: "About" }
  };
  function t(key) { var d = I18N[CFG.lang] || I18N.en; return d[key] || I18N.en[key] || key; }
  var css = `
  :root{ --bg:#000000; --bg-soft:#0a0a0a; --panel:rgba(10,10,10,0.95); --border:rgba(255,255,255,0.15); --accent:#10b981; --accent-glow:rgba(16,185,129,0.45); --text:#ffffff; --text-dim:#9ca3af; --danger:#f43f5e; --radius:14px;
  } .scaptcha-auto-wrapper{ display:flex; justify-content:center; align-items:center; width:100%; margin:10px 0; } .scaptcha{ width:320px; background:var(--panel); border:1px solid var(--border);
  border-radius:var(--radius); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); box-shadow:0 8px 32px rgba(0,0,0,0.35); overflow:hidden; user-select:none; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; color:var(--text); }
  .scaptcha-body{ display:flex; align-items:center; gap:12px; padding:14px 16px; } .sc-box{ width:26px; height:26px; flex:0 0 26px; border-radius:7px; border:2px solid var(--text-dim); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .2s ease; position:relative; } .sc-box:hover{ border-color:var(--accent); } .sc-box:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .sc-box.checked{ border-color:var(--accent); background:var(--accent); box-shadow:0 0 14px var(--accent-glow); } .sc-box.failed{ border-color:var(--danger); animation:scShake .35s ease; } .sc-box svg{ width:16px; height:16px; stroke:#0f172a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; opacity:0; transform:scale(.5); transition:all .15s ease; } .sc-box.checked svg{ opacity:1; transform:scale(1); }
  .sc-spinner{ width:18px; height:18px; border-radius:50%; border:2.5px solid rgba(16,185,129,0.25); border-top-color:var(--accent); animation:scSpin .7s linear infinite; display:none; } .sc-box.loading .sc-spinner{ display:block; } .sc-box.loading svg{ display:none; } .sc-label{ flex:1; cursor:pointer; }
  .sc-label-text{ font-size:14.5px; font-weight:500; color:var(--text); line-height:1.2; } .sc-sub{ font-size:11px; color:var(--text-dim); margin-top:2px; transition:color .2s ease; } .sc-sub.ok{ color:var(--accent); } .sc-sub.err{ color:var(--danger); }
  .sc-badge{ flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px; opacity:.85; } .sc-badge svg{ width:26px; height:26px; } .sc-badge span{ font-size:8.5px; color:var(--text-dim); font-weight:600; } .scaptcha-footer{ display:flex; justify-content:space-between; padding:8px 16px 12px; border-top:1px solid var(--border); }
  .scaptcha-footer a{ font-size:10.5px; color:var(--text-dim); text-decoration:none; } .sc-hp{ opacity:0!important; position:absolute!important; top:-9999px!important; left:-9999px!important; height:0!important; width:0!important; pointer-events:none; } .sc-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.8); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; z-index:999999; padding:20px; } .sc-overlay.show{ display:flex; }
  .sc-modal{ width:320px; background:linear-gradient(180deg, rgba(15,15,15,0.98), rgba(0,0,0,0.99)); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,0.7); padding:16px; font-family:'Segoe UI',sans-serif; } .sc-modal.sc-modal-wide{ width:360px; } .sc-modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:var(--text); } .sc-modal-head h3{ margin:0; font-size:13.5px; }
  .sc-close{ cursor:pointer; color:var(--text-dim); font-size:18px; background:none; border:none; } .sc-instructions{ font-size:11.5px; color:var(--text-dim); margin:0 0 10px; } .sc-court{ position:relative; height:220px; border-radius:10px; background:radial-gradient(circle at 50% 100%, rgba(16,185,129,0.12), transparent 60%), var(--bg-soft); border:1px dashed var(--border); overflow:hidden; touch-action:none; } .sc-court.sc-court-auto{ height:auto; overflow:visible; }
  .sc-hoop{ position:absolute; top:10px; left:50%; transform:translateX(-50%); width:90px; height:90px; display:flex; align-items:center; justify-content:center; } .sc-hoop img{ width:100%; height:100%; object-fit:contain; pointer-events:none; } .sc-hoop-zone{ position:absolute; left:50%; top:60%; transform:translate(-50%,-50%); width:40px; height:20px; border-radius:50%; } .sc-ball{ position:absolute; left:20px; bottom:25px; width:45px; height:45px; cursor:grab; touch-action:none; transition:left .35s cubic-bezier(.34,1.56,.64,1), bottom .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease, transform .2s ease; z-index:10; }
  .sc-ball img{ width:100%; height:100%; object-fit:contain; pointer-events:none; } .sc-ball.dragging{ cursor:grabbing; transition:none; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.4)); } .sc-slider-track{ position:absolute; left:20px; right:20px; top:50%; transform:translateY(-50%); height:46px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--border); } .sc-slider-target{ position:absolute; top:0; bottom:0; width:46px; border-radius:10px; background:rgba(16,185,129,0.15); border:2px dashed rgba(16,185,129,0.5); }
  .sc-slider-piece{ position:absolute; top:-2px; left:0; width:46px; height:46px; border-radius:10px; background:var(--accent); box-shadow:0 4px 14px var(--accent-glow); cursor:grab; touch-action:none; display:flex; align-items:center; justify-content:center; font-size:18px; color:#0f172a; font-weight:700; } .sc-slider-piece.dragging{ cursor:grabbing; } .sc-grid-wrap{ position:relative; width:100%; padding-top:66.67%; border-radius:10px; overflow:hidden; background:var(--bg-soft); } .sc-grid-wrap img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none; user-select:none; }
  .sc-grid-tile{ position:absolute; width:15%; height:17%; transform:translate(-50%,-50%); background:transparent; border:2px solid transparent; border-radius:10px; cursor:pointer; padding:0; -webkit-tap-highlight-color:transparent; transition:border-color .15s ease, background .15s ease;
  } .sc-grid-tile:hover{ border-color:rgba(255,255,255,0.25); } .sc-grid-tile:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; } .sc-grid-tile.sc-tile-correct{ border-color:var(--accent); background:rgba(16,185,129,0.18); }
  .sc-grid-tile.sc-tile-wrong{ border-color:var(--danger); background:rgba(244,63,94,0.18); } .sc-grid-tile[disabled]{ cursor:default; } .sc-captcha-wrap{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:8px 0; } .sc-captcha-canvas{ border-radius:8px; border:1px solid var(--border); filter:blur(0.5px); background:var(--bg-soft); }
  .sc-captcha-row{ display:flex; gap:8px; width:100%; } .sc-captcha-input{ flex:1; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:8px; padding:9px 11px; color:var(--text); font-size:14px; letter-spacing:2px; text-transform:uppercase; } .sc-captcha-input:focus{ outline:2px solid var(--accent); outline-offset:1px; } .sc-captcha-refresh{ flex:0 0 auto; width:38px; border-radius:8px; border:1px solid var(--border); background:rgba(255,255,255,0.04); color:var(--text-dim); font-size:16px; cursor:pointer; }
  .sc-captcha-refresh:hover{ color:var(--accent); border-color:var(--accent); } .sc-captcha-submit{ width:100%; padding:10px; border-radius:8px; border:none; background:var(--accent); color:#0f172a; font-weight:700; font-size:13.5px; cursor:pointer; } .sc-captcha-submit:hover{ box-shadow:0 0 14px var(--accent-glow); } .sc-captcha-err{ color:var(--danger); font-size:11.5px; margin-top:-2px; }
  .sc-fallback{ display:flex; align-items:center; justify-content:center; font-size:30px; user-select:none; } .sc-hoop .sc-fallback{ font-size:40px; } .sc-ball.success{ opacity:0; transform:scale(.4); } .sc-court-msg{ position:absolute; bottom:6px; left:0; right:0; text-align:center; font-size:11px; color:var(--text-dim); pointer-events:none; }
  .sc-verified-flash{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; background:rgba(0,0,0,0.92); opacity:0; pointer-events:none; transition:opacity .25s ease; z-index:20; } .sc-verified-flash.show{ opacity:1; pointer-events:all; } .sc-verified-flash svg{ width:40px; height:40px; stroke:var(--accent); } .sc-verified-flash span{ font-size:12.5px; color:var(--accent); font-weight:600; }
  @keyframes scSpin{ to{ transform:rotate(360deg); } } @keyframes scShake{ 0%,100%{ transform:translateX(0); } 25%{ transform:translateX(-4px); } 75%{ transform:translateX(4px); } }
  `;
  var styleTag = document.createElement("style");
  styleTag.setAttribute("data-scaptcha", "1");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
  // Ban store: localStorage + cookie fallback (a bot script that only clears one of the two still gets caught by the other; still trivial for a determined attacker to clear both, hence the server contract).
  function setCookie(name, value, ms) {
    var expires = new Date(Date.now() + ms).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function redirectToTier(tier) {
    var path = CFG.banPages[tier] || CFG.banPages.tier1;
    window.location.href = CFG.assetBase + path;
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
  function getTier2Count() {
    var n = parseInt(localStorage.getItem("scaptcha_tier2_count") || "0", 10);
    return isNaN(n) ? 0 : n;
  }
  function bumpTier2Count() {
    var n = getTier2Count() + 1;
    localStorage.setItem("scaptcha_tier2_count", String(n));
    return n;
  }
  function persistBan(tier, durationMs) {
    if (tier === "permanent") {
      localStorage.setItem("scaptcha_permanent", "1");
      setCookie("scaptcha_permanent", "1", 100 * 365 * 24 * 60 * 60 * 1000);
      return;
    }
    var until = Date.now() + durationMs;
    localStorage.setItem("scaptcha_ban_until", String(until));
    localStorage.setItem("scaptcha_ban_tier", tier);
    setCookie("scaptcha_ban_until", String(until), durationMs);
    setCookie("scaptcha_ban_tier", tier, durationMs);
  }
  // IP lookup: Apps Script's doPost/doGet has no reliable way to see the caller's IP on its own, so the client fetches its own public IP and sends it up. Cached per tab-session so we don't hit the IP service on every single check.
  function getClientIp() {
    var cached = sessionStorage.getItem("scaptcha_client_ip");
    if (cached) return Promise.resolve(cached);
    // api64 returns IPv6 when the client has one, falls back to IPv4 otherwise — plain api.ipify.org is IPv4-only and would never match an IPv6 entry in the whitelist/ban lists.
    return fetch("https://api64.ipify.org?format=json")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        sessionStorage.setItem("scaptcha_client_ip", j.ip);
        return j.ip;
      })
      .catch(function () { return "unknown"; });
  }
  var isWhitelistedClient = false;
  function resolveWhitelistIps() {
    var cacheKey = "scaptcha_whitelist_ips_cache";
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null"); } catch (e) {}
    if (cached && (Date.now() - cached.ts) < CFG.whitelistCacheMs) {
      return Promise.resolve(cached.ips);
    }
    var host = CFG.whitelistHost;
    var lookups = [
      fetch("https://dns.google/resolve?name=" + encodeURIComponent(host) + "&type=A").then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch("https://dns.google/resolve?name=" + encodeURIComponent(host) + "&type=AAAA").then(function (r) { return r.json(); }).catch(function () { return null; })
    ];
    return Promise.all(lookups).then(function (results) {
      var ips = [];
      results.forEach(function (res) {
        if (res && res.Answer) res.Answer.forEach(function (a) { if (a.data) ips.push(a.data); });
      });
      ips = ips.concat(CFG.whitelistIps); // any static extras from data-whitelist-ips still apply
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), ips: ips })); } catch (e) {}
      return ips;
    });
  }
  function isWhitelisted(ip, list) {
    var norm = (ip || "").toLowerCase();
    return list.some(function (entry) { return entry.toLowerCase() === norm; });
  }
  function clearLocalBanState() {
    ["scaptcha_offense_count", "scaptcha_tier2_count", "scaptcha_permanent",
     "scaptcha_ban_until", "scaptcha_ban_tier"].forEach(function (k) { localStorage.removeItem(k); });
    ["scaptcha_permanent", "scaptcha_ban_until", "scaptcha_ban_tier"].forEach(function (k) {
      document.cookie = k + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    });
  }
  // Resolved once at load; whitelisted visitors get their local ban state wiped immediately (covers being whitelisted after an earlier ban) and every later check/ban call short-circuits against this flag.
  var whitelistCheckPromise = Promise.all([getClientIp(), resolveWhitelistIps()]).then(function (res) {
    var ip = res[0], list = res[1];
    isWhitelistedClient = isWhitelisted(ip, list);
    if (isWhitelistedClient) clearLocalBanState();
    return isWhitelistedClient;
  });
  function postToDb(payload) {
    if (!CFG.dbEndpoint) return Promise.resolve(null);
    // text/plain avoids a CORS preflight OPTIONS request, which Apps Script web apps don't handle — the body is still valid JSON and e.postData.contents parses it exactly the same on the other end.
    return fetch(CFG.dbEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function () { return null; });
  }
  function checkServerBan(ip) {
    if (!CFG.dbEndpoint) return Promise.resolve(null);
    var url = CFG.dbEndpoint + (CFG.dbEndpoint.indexOf("?") === -1 ? "?" : "&") +
      "action=check&ip=" + encodeURIComponent(ip);
    return fetch(url).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function triggerBan(reason) {
    if (isWhitelistedClient) return; // never ban a whitelisted IP, full stop
    if (localStorage.getItem("scaptcha_permanent") === "1") {
      redirectToTier("permanent");
      return;
    }
    var offense = bumpOffenseCount();
    var siteUrl = window.location.hostname;
    getClientIp().then(function (ip) {
      if (offense === 1) {
        persistBan("tier1", CFG.tier1Ms);
        postToDb({ action: "log", website_url: siteUrl, ip: ip, ban_type: "temporary", tier: "tier1", reason: reason || "unknown" });
        redirectToTier("tier1");
        return;
      }
      var tier2Count = bumpTier2Count();
      if (tier2Count >= CFG.tier2ToPermanentCount) {
        persistBan("permanent", 0);
        postToDb({ action: "log", website_url: siteUrl, ip: ip, ban_type: "permanent", reason: reason || "unknown" }).then(function () {
          redirectToTier("permanent");
        });
        // Don't wait forever on the network for an already-decided outcome.
        setTimeout(function () { redirectToTier("permanent"); }, 800);
        return;
      }
      persistBan("tier2", CFG.tier2Ms);
      postToDb({ action: "log", website_url: siteUrl, ip: ip, ban_type: "temporary", tier: "tier2", reason: reason || "unknown" });
      redirectToTier("tier2");
    });
  }
  function checkLocalBanStatus() {
    if (localStorage.getItem("scaptcha_permanent") === "1" || getCookie("scaptcha_permanent") === "1") {
      redirectToTier("permanent");
      return true;
    }
    var untilLS = parseInt(localStorage.getItem("scaptcha_ban_until") || "0", 10);
    var untilCK = parseInt(getCookie("scaptcha_ban_until") || "0", 10);
    var until = Math.max(isNaN(untilLS) ? 0 : untilLS, isNaN(untilCK) ? 0 : untilCK);
    if (until && Date.now() < until) {
      var tier = localStorage.getItem("scaptcha_ban_tier") || getCookie("scaptcha_ban_tier") || "tier1";
      redirectToTier(tier);
      return true;
    }
    return false;
  }
  // Server-side check: catches repeat offenders who cleared storage/cookies or switched browsers, as long as they're still on the same IP. This is a network call, so it's given a short timeout and never blocks a clean visitor from seeing the page indefinitely.
  function checkServerBanStatusAsync() {
    return getClientIp().then(function (ip) {
      if (ip === "unknown") return false;
      return Promise.race([
        checkServerBan(ip),
        new Promise(function (resolve) { setTimeout(function () { resolve(null); }, CFG.serverCheckTimeoutMs); })
      ]).then(function (result) {
        if (!result || result.status !== "banned") return false;
        if (result.tier === "permanent") {
          persistBan("permanent", 0);
          redirectToTier("permanent");
        } else {
          persistBan("tier2", CFG.tier2Ms);
          redirectToTier("tier2");
        }
        return true;
      });
    }).catch(function () { return false; });
  }
  function checkBanStatus() {
    // fast synchronous local check first
    return checkLocalBanStatus();
  }
  // Signal collection: mouse entropy + keyboard use + webdriver flag + time-on-page + input capability. Combined into one score instead of a single pass/fail check, so no single spoofed signal clears you.
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
  // Battery signal: soft bonus only — the Battery Status API doesn't exist at all in Firefox/Safari, so it can never be required, only used when present. Automation environments that DO expose it tend to report a static, unrealistic snapshot (100%, permanently charging); a real laptop/phone rarely sits at exactly that on the very first check.
  var batterySignal = 1; // neutral default — "don't know" never counts against anyone
  if (navigator.getBattery) {
    navigator.getBattery().then(function (battery) {
      if (battery.level === 1 && battery.charging === true) batterySignal = 0.5;
    }).catch(function () {});
  }
  function mouseEntropyScore() {
    if (mousePoints.length < 8) return 0;
    var pts = mousePoints, straightCount = 0, velocities = [];
    for (var i = 2; i < pts.length; i++) {
      var a = pts[i - 2], b = pts[i - 1], c = pts[i];
      var v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
      if (Math.abs(v1x * v2y - v1y * v2x) < 0.6) straightCount++;
      var dt = Math.max(1, c.t - b.t), dist = Math.hypot(c.x - b.x, c.y - b.y);
      velocities.push(dist / dt);
    }
    var straightRatio = straightCount / (pts.length - 2);
    var mean = velocities.reduce(function (s, v) { return s + v; }, 0) / velocities.length;
    var variance = velocities.reduce(function (s, v) { return s + Math.pow(v - mean, 2); }, 0) / velocities.length;
    var suspicious = straightRatio > 0.92 || variance < 0.0008;
    return suspicious ? 0 : 1;
  }
  function webdriverScore() {
    // navigator.webdriver is set by Selenium/Playwright/Puppeteer unless explicitly patched out. Not authoritative, but a real signal.
    return navigator.webdriver ? 0 : 1;
  }
  function timingScore() {
    // A form filled and submitted in under ~1.2s of page load is very unlikely to be a human who read anything.
    return (Date.now() - pageLoadTime) > 1200 ? 1 : 0;
  }
  function inputCapabilityScore() {
    return (keyboardEventsSeen > 0 || pointerCapable) ? 1 : 0;
  }
  function looksHuman() {
    var score = mouseEntropyScore() + webdriverScore() + timingScore() + inputCapabilityScore() + batterySignal;
    // require at least 3 of the 4 hard signals worth of agreement; battery only ever adds confidence (max +1) or shaves a little (-0.5), never enough on its own to fail someone whose browser doesn't have it.
    return score >= 3;
  }
  // Token: still generated client-side (any JS-visible token can be), but now carries a nonce + timestamp + sitekey your server should check the shape and freshness of before calling the real verify endpoint. See SERVER-SIDE CONTRACT at the bottom.
  function randomNonce(len) {
    var bytes = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
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
    // base64url-encode the payload; server decodes, checks freshness (< 2 min old), checks sitekey, then treats it as a claim to verify — NOT as proof by itself.
    return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  // Optional: if the embedder configured a verify endpoint, ping it so the server can log/allowlist the token server-side ahead of submit. This is best-effort and never blocks the UI.
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
  // Noisy/blurred canvas text captcha — the final "100% human" check shown after the mini-game is solved. Renders random distorted characters onto an HTML5 canvas (per-character rotation/skew/color, random noise lines and dots, slight CSS blur) so it isn't a plain static image an OCR pass can read cleanly off the DOM.
  function generateCaptchaText(len) {
    // Ambiguous glyphs (0/O, 1/I/l) excluded so a human can't fail on legibility alone.
    var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var s = "";
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function drawCaptchaCanvas(canvas, text) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
    // noise curves
    for (var i = 0; i < 7; i++) {
      ctx.strokeStyle = "rgba(148,163,184," + (0.15 + Math.random() * 0.25) + ")";
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
    // noise dots
    for (var d = 0; d < 130; d++) {
      ctx.fillStyle = "rgba(16,185,129," + (0.08 + Math.random() * 0.2) + ")";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // distorted characters
    var slot = w / (text.length + 1);
    ctx.textBaseline = "middle";
    for (var idx = 0; idx < text.length; idx++) {
      ctx.save();
      var cx = slot * (idx + 1);
      var cy = h / 2 + (Math.random() * 12 - 6);
      ctx.translate(cx, cy);
      ctx.rotate((Math.random() * 40 - 20) * Math.PI / 180);
      var fontSize = 26 + Math.random() * 8;
      ctx.font = "bold " + fontSize + "px monospace";
      ctx.fillStyle = "hsl(" + (150 + Math.random() * 40) + ",70%," + (55 + Math.random() * 15) + "%)";
      ctx.fillText(text[idx], -fontSize / 3, 0);
      ctx.restore();
    }
    // CSS blur on the element itself finishes the obfuscation (set in the .sc-captcha-canvas class, kept subtle so it stays readable)
  }
  function initCaptcha(mountEl) {
    if (checkBanStatus()) return;
    var wrapper = document.createElement("div");
    wrapper.className = "scaptcha-auto-wrapper";
    wrapper.innerHTML = `
        <div class="scaptcha" data-sitekey="${CFG.sitekey}"> <div class="scaptcha-body"> <label class="sc-hp" aria-hidden="true">
        <input type="text" id="scHoneypot1" name="website" tabindex="-1" autocomplete="off"> </label> <label class="sc-hp" aria-hidden="true">
        <input type="email" id="scHoneypot2" name="email_confirm" tabindex="-1" autocomplete="off"> </label> <label class="sc-hp" aria-hidden="true">
        <input type="checkbox" id="scHoneypot3" name="subscribe_updates" tabindex="-1" autocomplete="off"> </label> <label class="sc-hp" aria-hidden="true">
        <input type="text" id="scHoneypot4" name="confirm_password" tabindex="-1" autocomplete="off"> </label> <div class="sc-box" id="scBox" role="checkbox" aria-checked="false" aria-label="${t('human')}" tabindex="0">
        <div class="sc-spinner"></div> <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg> </div>
        <div class="sc-label" id="scLabelWrap"> <div class="sc-label-text">${t('human')}</div> <div class="sc-sub" id="scSub" aria-live="polite">${t('verify')}</div>
        </div> <div class="sc-badge"> <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/> <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/> </svg>
        <span>SECURE</span> </div> </div>
        <div class="scaptcha-footer"> <a href="${CFG.assetBase}/privacy.html" target="_blank">${t('privacy')}</a> <a href="${CFG.assetBase}/terms.html" target="_blank">${t('terms')}</a>
        <a href="${CFG.assetBase}/about.html" target="_blank">${t('about')}</a> </div> <input type="hidden" name="scaptcha_token" id="scToken" value="">
        </div> <div class="sc-overlay" id="scOverlay"> <div class="sc-modal" role="dialog" aria-modal="true">
        <div class="sc-modal-head"> <h3>${t('checkTitle')}</h3> <button type="button" class="sc-close" id="scClose" aria-label="Close">&times;</button>
        </div> <p class="sc-instructions" id="scInstructions">${t('dragHint')}</p> <div class="sc-court" id="scCourt">
        <div id="scChallengeMount"></div> <div class="sc-court-msg" id="scCourtMsg"></div> <div class="sc-verified-flash" id="scFlash">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg> <span>${t('swish')}</span> </div>
        </div> </div> </div>
    `;
    var host = mountEl || document.querySelector("form") || document.body;
    if (mountEl) {
      mountEl.appendChild(wrapper);
    } else if (host.tagName === "FORM") {
      host.insertBefore(wrapper, host.firstChild);
    } else {
      host.appendChild(wrapper);
    }
    var verified = false, checking = false, pendingFormSubmit = false;
    var scBox = wrapper.querySelector("#scBox"), scSub = wrapper.querySelector("#scSub");
    var scHp1 = wrapper.querySelector("#scHoneypot1"), scHp2 = wrapper.querySelector("#scHoneypot2");
    var scHp3 = wrapper.querySelector("#scHoneypot3"), scHp4 = wrapper.querySelector("#scHoneypot4");
    var scAllHp = [scHp1, scHp2, scHp3, scHp4];
    var scToken = wrapper.querySelector("#scToken");
    var scLabelWrap = wrapper.querySelector("#scLabelWrap"), scOverlay = wrapper.querySelector("#scOverlay");
    var scClose = wrapper.querySelector("#scClose");
    var scCourtMsg = wrapper.querySelector("#scCourtMsg"), scFlash = wrapper.querySelector("#scFlash");
    var scChallengeMount = wrapper.querySelector("#scChallengeMount");
    var scInstructions = wrapper.querySelector("#scInstructions");
    // Fast spam-click detector: 5 clicks under 200ms apart => ban
    var clickCount = 0, lastClickTime = 0;
    document.addEventListener("click", function () {
      var now = Date.now();
      if (now - lastClickTime < 200) {
        clickCount++;
        if (clickCount >= 5) { triggerBan("rapid_click"); return; }
      } else {
        clickCount = 1;
      }
      lastClickTime = now;
    });
    function hpTripped(hp) {
      return hp.type === "checkbox" ? hp.checked : hp.value.trim().length > 0;
    }
    function anyHpTripped() {
      return scAllHp.some(hpTripped);
    }
    scAllHp.forEach(function (hp) {
      var evt = hp.type === "checkbox" ? "change" : "input";
      hp.addEventListener(evt, function () {
        if (hpTripped(this)) triggerBan("honeypot_" + this.id);
      });
    });
    function setSub(text, cls) { scSub.textContent = text; scSub.className = "sc-sub" + (cls ? " " + cls : ""); }
    function markVerified() {
      verified = true;
      checking = false;
      scBox.classList.remove("loading", "failed");
      scBox.classList.add("checked");
      scBox.setAttribute("aria-checked", "true");
      setSub(t("verified"), "ok");
      var token = buildToken();
      scToken.value = token;
      notifyServerOptional(token);
      if (pendingFormSubmit) {
        pendingFormSubmit = false;
        // Re-fire submit now that verified is true and no honeypot is tripped — the listener below just lets a verified submit through, so this completes the submission the user originally asked for instead of leaving it silently swallowed.
        if (formEl) { formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit(); }
      }
    }
    function handleCheck() {
      if (checkBanStatus()) return;
      if (verified || checking) return;
      if (anyHpTripped()) { triggerBan("honeypot_on_submit"); return; } // no-ops for whitelisted, see triggerBan
      checking = true; scBox.classList.add("loading"); setSub("Verifying…");
      setTimeout(function () {
        checking = false; scBox.classList.remove("loading");
        if (looksHuman()) { markVerified(); }
        else { setSub(t("extra"), "err"); openChallenge(); }
      }, 450);
    }
    scBox.addEventListener("click", handleCheck);
    scBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCheck(); }
    });
    scLabelWrap.addEventListener("click", handleCheck);
    // ---- Challenge: randomly basketball or slider ----
    var missCount = 0;
    function closeChallenge() { scOverlay.classList.remove("show"); }
    scClose.addEventListener("click", closeChallenge);
    function onMiss() {
      missCount++;
      if (missCount >= CFG.challengeAttempts) {
        if (isWhitelistedClient) {
          // Whitelisted visitors still play the game (so it can be tested), but a bad run never bans them — let them through instead of getting stuck or punished for it.
          closeChallenge();
          markVerified();
          return true;
        }
        triggerBan("challenge_missed");
        return true;
      }
      scCourtMsg.textContent = t("tryAgain") + " (" + (CFG.challengeAttempts - missCount) + " " + t("triesLeft") + ")";
      return false;
    }
    function onSolved() {
      scFlash.classList.add("show");
      setTimeout(function () {
        // Passing the mini-game isn't the final answer — chain into the canvas captcha for the "100% human" confirmation.
        scFlash.classList.remove("show");
        scChallengeMount.innerHTML = "";
        scCourtMsg.textContent = "";
        wrapper.querySelector("#scCourt").classList.add("sc-court-auto");
        scInstructions.textContent = t("captchaHint");
        mountCanvasCaptcha(scChallengeMount, function onCaptchaPass() {
          scFlash.classList.add("show");
          setTimeout(function () { closeChallenge(); markVerified(); }, 500);
        }, function onCaptchaFail() {
          onMiss(); // shares the same attempts pool / ban-or-whitelist-pass logic
        });
      }, 650);
    }
    function openChallenge() {
      missCount = 0;
      scFlash.classList.remove("show");
      scChallengeMount.innerHTML = "";
      scCourtMsg.textContent = "";
      var scModal = scOverlay.querySelector(".sc-modal");
      var scCourtEl = wrapper.querySelector("#scCourt");
      if (CFG.challengeType === "lettergrid") {
        scModal.classList.add("sc-modal-wide");
        scCourtEl.classList.add("sc-court-auto");
        scInstructions.textContent = t("gridHint");
        mountLetterGridChallenge(scChallengeMount, onSolved, onMiss);
      } else {
        scModal.classList.remove("sc-modal-wide");
        scCourtEl.classList.remove("sc-court-auto");
        scInstructions.textContent = t("dragHint");
        mountBasketballChallenge(scChallengeMount, onSolved, onMiss);
      }
      scOverlay.classList.add("show");
    }
    function mountBasketballChallenge(mount, solved, miss) {
      mount.innerHTML = `
        <div class="sc-hoop"> <img src="${CFG.assetBase}/1.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"> <div class="sc-fallback" style="display:none;">🧺</div>
        <div class="sc-hoop-zone" id="scZone"></div> </div> <div class="sc-ball" id="scBall">
        <img src="${CFG.assetBase}/0.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"> <div class="sc-fallback" style="display:none;">🏀</div> </div>
      `;
      var scBall = mount.querySelector("#scBall"), scZone = mount.querySelector("#scZone");
      var scCourt = mount.closest(".sc-court");
      var dragging = false, startLeft, startBottom, startX, startY;
      function resetBall() { scBall.style.left = "20px"; scBall.style.bottom = "25px"; scBall.classList.remove("success"); }
      resetBall();
      function pointFromEvent(e) { return (e.touches && e.touches[0]) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }
      function onDown(e) {
        dragging = true; scBall.classList.add("dragging");
        var p = pointFromEvent(e); startX = p.x; startY = p.y;
        var rect = scBall.getBoundingClientRect(), courtRect = scCourt.getBoundingClientRect();
        startLeft = rect.left - courtRect.left; startBottom = courtRect.bottom - rect.bottom;
        e.preventDefault();
      }
      function onMove(e) {
        if (!dragging) return;
        var p = pointFromEvent(e);
        scBall.style.left = (startLeft + (p.x - startX)) + "px";
        scBall.style.bottom = (startBottom - (p.y - startY)) + "px";
        e.preventDefault();
      }
      function onUp() {
        if (!dragging) return; dragging = false; scBall.classList.remove("dragging");
        var ballRect = scBall.getBoundingClientRect(), zoneRect = scZone.getBoundingClientRect();
        var hit = (ballRect.left + ballRect.width / 2 > zoneRect.left && ballRect.left + ballRect.width / 2 < zoneRect.right &&
                   ballRect.top + ballRect.height / 2 > zoneRect.top && ballRect.top + ballRect.height / 2 < zoneRect.bottom);
        if (hit) { scBall.classList.add("success"); solved(); cleanup(); }
        else { if (miss()) { cleanup(); return; } resetBall(); }
      }
      function cleanup() {
        scBall.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      scBall.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
    }
    function mountSliderChallenge(mount, solved, miss) {
      var targetPct = 30 + Math.random() * 45; // 30%-75% across the track
      mount.innerHTML = `
        <div class="sc-slider-track" id="scTrack"> <div class="sc-slider-target" id="scTarget" style="left:${targetPct}%;"></div> <div class="sc-slider-piece" id="scPiece">➤</div>
        </div>
      `;
      var track = mount.querySelector("#scTrack"), target = mount.querySelector("#scTarget"), piece = mount.querySelector("#scPiece");
      var dragging = false, startX, startLeft;
      function pointX(e) { return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; }
      function onDown(e) {
        dragging = true; piece.classList.add("dragging");
        startX = pointX(e);
        startLeft = piece.getBoundingClientRect().left - track.getBoundingClientRect().left;
        e.preventDefault();
      }
      function onMove(e) {
        if (!dragging) return;
        var dx = pointX(e) - startX;
        var trackW = track.clientWidth;
        var newLeft = Math.max(0, Math.min(trackW - 46, startLeft + dx));
        piece.style.left = newLeft + "px";
        e.preventDefault();
      }
      function onUp() {
        if (!dragging) return; dragging = false; piece.classList.remove("dragging");
        var pieceRect = piece.getBoundingClientRect(), targetRect = target.getBoundingClientRect();
        var pieceCenter = pieceRect.left + pieceRect.width / 2;
        var hit = pieceCenter > targetRect.left && pieceCenter < targetRect.right;
        if (hit) { solved(); cleanup(); }
        else {
          if (miss()) { cleanup(); return; }
          piece.style.left = "0px";
        }
      }
      function cleanup() {
        piece.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      piece.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
    }
    // Tile-grid challenge using c-1.png. All 9 tiles are clickable (as requested), but only the tiles marked valid:true below are correct. One wrong tap ends the attempt via onMiss (same 1-chance/ban path as the basketball game). Percentages are eyeballed against the 3x3 layout in c-1.png — nudge x/y here if they ever drift out of alignment with a re-exported version of that image.
    var LETTER_GRID_TILES = [
      { letter: "F", x: 34.8, y: 36.6, valid: false },
      { letter: "B", x: 50.5, y: 36.6, valid: false },
      { letter: "H", x: 66.1, y: 36.6, valid: false },
      { letter: "F", x: 34.8, y: 57.1, valid: false },
      { letter: "Y", x: 50.5, y: 57.1, valid: true },
      { letter: "W", x: 66.1, y: 57.1, valid: false },
      { letter: "D", x: 34.8, y: 77.6, valid: true },
      { letter: "S", x: 50.5, y: 77.6, valid: false },
      { letter: "Z", x: 66.1, y: 77.6, valid: false }
    ];
    function mountLetterGridChallenge(mount, solved, miss) {
      var neededCount = LETTER_GRID_TILES.filter(function (t2) { return t2.valid; }).length;
      var collected = 0;
      var done = false;
      mount.innerHTML = `
        <div class="sc-grid-wrap" id="scGridWrap"> <img src="${CFG.assetBase}/c-1.png" alt="" onerror="this.style.display='none';"> </div>
      `;
      var wrap = mount.querySelector("#scGridWrap");
      LETTER_GRID_TILES.forEach(function (tile, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sc-grid-tile";
        btn.setAttribute("aria-label", "tile " + tile.letter);
        btn.style.left = tile.x + "%";
        btn.style.top = tile.y + "%";
        btn.addEventListener("click", function () {
          if (done) return;
          if (tile.valid) {
            btn.classList.add("sc-tile-correct");
            btn.disabled = true;
            collected++;
            if (collected >= neededCount) {
              done = true;
              solved();
            }
          } else {
            btn.classList.add("sc-tile-wrong");
            var banned = miss();
            if (banned) {
              done = true;
            } else {
              // another try remains — reset the whole board after a beat
              setTimeout(function () {
                collected = 0;
                Array.prototype.forEach.call(wrap.querySelectorAll(".sc-grid-tile"), function (b) {
                  b.classList.remove("sc-tile-correct", "sc-tile-wrong");
                  b.disabled = false;
                });
              }, 400);
            }
          }
        });
        wrap.appendChild(btn);
      });
    }
    function mountCanvasCaptcha(mount, onPass, onFail) {
      var text = generateCaptchaText(5);
      mount.innerHTML = `
        <div class="sc-captcha-wrap"> <canvas id="scCaptchaCanvas" width="260" height="80" class="sc-captcha-canvas"></canvas> <div class="sc-captcha-row">
        <input type="text" id="scCaptchaInput" class="sc-captcha-input" autocomplete="off" spellcheck="false" placeholder="Type the code" maxlength="8"> <button type="button" id="scCaptchaRefresh" class="sc-captcha-refresh" aria-label="New code">&#8635;</button> </div>
        <button type="button" id="scCaptchaSubmit" class="sc-captcha-submit">Verify</button> <div class="sc-captcha-err" id="scCaptchaErr"></div> </div>
      `;
      var canvas = mount.querySelector("#scCaptchaCanvas");
      drawCaptchaCanvas(canvas, text);
      var input = mount.querySelector("#scCaptchaInput");
      var submitBtn = mount.querySelector("#scCaptchaSubmit");
      var refreshBtn = mount.querySelector("#scCaptchaRefresh");
      var errEl = mount.querySelector("#scCaptchaErr");
      refreshBtn.addEventListener("click", function () {
        text = generateCaptchaText(5);
        drawCaptchaCanvas(canvas, text);
        input.value = ""; errEl.textContent = "";
      });
      function trySubmit() {
        if (input.value.trim().toUpperCase() === text) {
          onPass();
        } else {
          errEl.textContent = t("tryAgain");
          onFail();
          text = generateCaptchaText(5);
          drawCaptchaCanvas(canvas, text);
          input.value = "";
        }
      }
      submitBtn.addEventListener("click", trySubmit);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); trySubmit(); } });
      input.focus();
    }
    var formEl = wrapper.closest("form") || document.querySelector("form");
    if (formEl) {
      formEl.addEventListener("submit", function (e) {
        if (checkBanStatus()) { e.preventDefault(); return; }
        if (isWhitelistedClient) return; // god mode — never intercept
        if (anyHpTripped()) {
          // A hidden field got filled — that's a real bot signal on its own, ban immediately, no need to show a challenge for it.
          e.preventDefault();
          triggerBan("honeypot_on_submit");
          return;
        }
        if (!verified) {
          // Not a bot signal yet — just hasn't proven human. Run them through the normal check flow (silent pass or the mini-game) instead of banning outright. This is what was banning real visitors who submitted without ticking the box first.
          e.preventDefault();
          pendingFormSubmit = true;
          handleCheck();
        }
      });
    }
  }
  function mountAll() {
    var explicitMounts = document.querySelectorAll(".scaptcha[data-sitekey]");
    if (explicitMounts.length) {
      explicitMounts.forEach(function (el) {
        var container = document.createElement("div");
        el.replaceWith(container);
        initCaptcha(container);
      });
    } else {
      initCaptcha(null);
    }
  }
  // Dev/testing convenience — call scaptchaDebug.clearMyBan() from the browser console any time to instantly clear YOUR local ban state (localStorage + cookies) without waiting out the timer. This only clears what your browser stores locally; it doesn't touch the Sheet log, so the server-side check can still catch you if your IP is logged there and isn't on the whitelist.
  window.scaptchaDebug = {
    clearMyBan: function () {
      clearLocalBanState();
      console.log("[S-Captcha] local ban state cleared. Reloading…");
      location.reload();
    },
    whoAmI: function () {
      getClientIp().then(function (ip) { console.log("[S-Captcha] detected IP:", ip); });
    }
  };
  function boot() {
    // Don't let a slow/unreachable IP lookup stall real visitors — if the whitelist check hasn't resolved fast, fall through to the normal flow. isWhitelistedClient still flips to true if it resolves later, so triggerBan/handleCheck stay safe even after this timeout.
    Promise.race([
      whitelistCheckPromise,
      new Promise(function (resolve) { setTimeout(function () { resolve(false); }, CFG.serverCheckTimeoutMs); })
    ]).then(function (whitelisted) {
      if (whitelisted) { mountAll(); return; } // skip all ban checks entirely
      if (checkBanStatus()) return; // instant local check, no network wait
      checkServerBanStatusAsync().then(function (wasBanned) {
        if (wasBanned) return; // redirect already fired
        mountAll();
      });
    });
  }
  if ("loading" === document.readyState) {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
// SERVER-SIDE CONTRACT: your backend must decode `scaptcha_token`, verify payload.sitekey, reject if payload.ts is >2min old, reject reused payload.nonce (dedupe with TTL storage), and require signals sum >= 3, rejecting the submission (4xx) on any failure — the checks above are bypassable client-side, this is what actually blocks a raw HTTP bot. If data-verify-endpoint is set it also gets a best-effort POST {token, sitekey} for server-side IP/rate correlation. SHEETS BAN LOG CONTRACT (data-db-endpoint / Apps Script): POST {action:"log", website_url, ip, ban_type, tier, reason} appends to Ban_Logs (temporary) or Permanent_Bans (permanent). GET ?action=check&ip=<ip> hashes ip the same way, checks Permanent_Bans then Ban_Logs (rows <12h old), returns {status:"banned", tier} or {status:"clear"} — GET is used deliberately to avoid a CORS preflight Apps Script won't answer. Note: this does a linear scan per check (fine for small/medium traffic, swap for a real KV store if it grows) and autoClean12HourBans() needs an installable hourly time-driven trigger or it never runs.
