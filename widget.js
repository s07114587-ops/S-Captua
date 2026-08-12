(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    global.SCaptcha = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var CONFIG = {
    sitekey: null,
    apiBase: "https://api.scaptcha.com/v1",
    powDifficulty: 4
  };

  var state = {
    sessionToken: null,
    metrics: [],
    powNonce: null,
    isVerified: false
  };

  // -------------------------------------------------------------------------
  // Biometric Trajectory & Feature Extraction Engine
  // Captures high-frequency movement vectors, timing, and hardware variance.
  // -------------------------------------------------------------------------
  function Collector() {
    this.events = [];
    this.maxEvents = 150;
    this.boundHandler = this.record.bind(this);
  }

  Collector.prototype.start = function () {
    window.addEventListener("mousemove", this.boundHandler, { passive: true });
    window.addEventListener("touchmove", this.boundHandler, { passive: true });
  };

  Collector.prototype.stop = function () {
    window.removeEventListener("mousemove", this.boundHandler);
    window.removeEventListener("touchmove", this.boundHandler);
  };

  Collector.prototype.record = function (e) {
    if (this.events.length >= this.maxEvents) this.events.shift();
    var p = e.touches ? e.touches[0] : e;
    this.events.push([
      Math.round(p.clientX),
      Math.round(p.clientY),
      Date.now(),
      e.pressure || 0
    ]);
  };

  Collector.prototype.getPayload = function () {
    return {
      points: this.events,
      screen: [window.screen.width, window.screen.height, window.devicePixelRatio],
      timing: performance.now(),
      tz: new Date().getTimezoneOffset(),
      hardware: navigator.hardwareConcurrency || 0
    };
  };

  // -------------------------------------------------------------------------
  // Client Proof-of-Work (PoW)
  // Forces client CPU execution time before server verification to throttle bots.
  // -------------------------------------------------------------------------
  async function computePoW(seed, difficulty) {
    var prefix = "0".repeat(difficulty);
    var nonce = 0;
    var encoder = new TextEncoder();
    while (true) {
      var data = encoder.encode(seed + nonce);
      var buffer = await crypto.subtle.digest("SHA-256", data);
      var hashArray = Array.from(new Uint8Array(buffer));
      var hashHex = hashArray.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      if (hashHex.startsWith(prefix)) {
        return { nonce: nonce, hash: hashHex };
      }
      nonce++;
    }
  }

  // -------------------------------------------------------------------------
  // Core Widget Setup
  // -------------------------------------------------------------------------
  function init(options) {
    CONFIG.sitekey = options.sitekey;
    if (options.apiBase) CONFIG.apiBase = options.apiBase;

    var container = typeof options.element === "string" 
      ? document.querySelector(options.element) 
      : options.element;

    if (!container) throw new Error("[SCaptcha] Target container not found.");

    var collector = new Collector();
    collector.start();

    renderUI(container, async function () {
      try {
        // Step 1: Fetch dynamic challenge payload from backend
        var sessionRes = await fetch(CONFIG.apiBase + "/challenge/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sitekey: CONFIG.sitekey })
        });
        var sessionData = await sessionRes.json();

        // Step 2: Resolve CPU Proof-of-Work constraint
        var powResult = await computePoW(sessionData.powSeed, CONFIG.powDifficulty);

        // Step 3: Package biometric telemetry & cryptographic response
        var payload = {
          sessionToken: sessionData.sessionToken,
          powNonce: powResult.nonce,
          telemetry: collector.getPayload()
        };

        // Step 4: Validate directly against server
        var verifyRes = await fetch(CONFIG.apiBase + "/challenge/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        var verifyData = await verifyRes.json();
        if (verifyData.success) {
          collector.stop();
          state.isVerified = true;
          state.sessionToken = verifyData.verificationToken;
          injectHiddenToken(container, verifyData.verificationToken);
          updateUIState("verified");
          if (options.onSuccess) options.onSuccess(verifyData.verificationToken);
        } else {
          updateUIState("failed");
          if (options.onError) options.onError(verifyData.reason);
        }
      } catch (err) {
        updateUIState("failed");
        if (options.onError) options.onError(err.message);
      }
    });
  }

  function renderUI(container, onClick) {
    container.innerHTML = `
      <div class="scaptcha-v2-box" style="border:1px solid #334155; padding:12px; border-radius:8px; background:#0f172a; color:#f8fafc; font-family:sans-serif; display:flex; align-items:center; gap:12px; width:300px;">
        <button type="button" id="scaptcha-btn" style="width:24px; height:24px; border-radius:4px; border:2px solid #64748b; background:transparent; cursor:pointer;"></button>
        <span id="scaptcha-label" style="font-size:14px;">I am human</span>
      </div>
    `;
    var btn = container.querySelector("#scaptcha-btn");
    btn.addEventListener("click", onClick, { once: true });
  }

  function updateUIState(status) {
    var label = document.getElementById("scaptcha-label");
    var btn = document.getElementById("scaptcha-btn");
    if (status === "verified") {
      label.textContent = "Verification Complete";
      btn.style.background = "#10b981";
      btn.style.borderColor = "#10b981";
    } else if (status === "failed") {
      label.textContent = "Verification Failed. Try Again.";
      btn.style.borderColor = "#f43f5e";
    }
  }

  function injectHiddenToken(container, token) {
    var form = container.closest("form");
    if (!form) return;
    var input = form.querySelector('input[name="scaptcha_token"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "scaptcha_token";
      form.appendChild(input);
    }
    input.value = token;
  }

  return { init: init };
});
