/*!
 * S-Captcha Widget v4 — Turnstile Remake + Honeypot + Mouse Track
 * Created by Shubhomoy (S-Captcha Project)
 */
(function () {
  "use strict";

  var CFG = {
    assetBase: "https://www.scaptua.duckdns.org",
    whitelistIps: ["2a09:bac5:3e0e:1a8c::2a5:58"], // তোর আইপি
    minClickTimeMs: 400, // ৪০০ মিলি-সেকেন্ডের আগে ক্লিক করলে বট ধরবে
    spamLimit: 5, // ৫ বারের বেশি দ্রুত রিলোড করলে ব্যান
    spamTimeMs: 30000 // ৩০ সেকেন্ডের মধ্যে
  };

  var isWhitelistedClient = false;
  var pageLoadTime = Date.now();

  // 1. IP Whitelist Check (তোর জন্য সব মাফ)
  function checkAdminIP() {
    return fetch("https://api64.ipify.org?format=json")
      .then(r => r.json())
      .then(j => {
        if (CFG.whitelistIps.includes(j.ip)) {
            isWhitelistedClient = true;
            console.log("S-Captcha: Boss IP verified. All traps disabled!");
        }
      }).catch(() => {});
  }

  // 2. Ban Logic (ডিরেক্ট ব্যান)
  function triggerBan(reason) {
    if (isWhitelistedClient) return; // তুই সেফ!
    console.warn("BANNED REASON: " + reason);
    
    var offense = parseInt(localStorage.getItem("scaptcha_offense_count") || "0", 10) + 1;
    localStorage.setItem("scaptcha_offense_count", offense);
    
    var path = offense === 1 ? "/to-dear-bot-or-hacker.html" : "/you-ban-for-12hours.html";
    window.location.href = CFG.assetBase + path;
  }

  // 3. Fast Reload Trap
  function checkFastReload() {
    if (isWhitelistedClient) return;
    var visits = JSON.parse(localStorage.getItem("sc_fast_visits") || "[]");
    visits = visits.filter(t => Date.now() - t < CFG.spamTimeMs);
    visits.push(Date.now());
    localStorage.setItem("sc_fast_visits", JSON.stringify(visits));
    if (visits.length > CFG.spamLimit) triggerBan("fast_reload_spam");
  }

  // 4. Inject Turnstile UI & Honeypots
  function injectTurnstileUI() {
    if (document.getElementById("scaptcha-turnstile-box")) return;

    // Turnstile CSS 
    var style = document.createElement("style");
    style.innerHTML = `
      .sc-turnstile { display: flex; align-items: center; justify-content: space-between; width: 300px; padding: 12px 16px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; font-family: -apple-system, system-ui, sans-serif; box-shadow: 0px 2px 5px rgba(0,0,0,0.05); margin: 15px 0; user-select: none; }
      .sc-dark-mode { background: #1a1a1a; border-color: #333; color: #fff; }
      .sc-checkbox { width: 24px; height: 24px; border: 2px solid #c8c8c8; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff; transition: all 0.2s; }
      .sc-checkbox:hover { border-color: #999; }
      .sc-text { font-size: 14px; font-weight: 500; margin-left: 12px; color: #333; flex-grow: 1; }
      .sc-dark-mode .sc-text { color: #eaeaea; }
      .sc-logo { display: flex; flex-direction: column; align-items: flex-end; font-size: 10px; color: #999; }
      .sc-spinner { width: 20px; height: 20px; border: 2.5px solid #e5e5e5; border-top-color: #10b981; border-radius: 50%; animation: sc-spin 1s linear infinite; display: none; }
      .sc-tick { width: 14px; height: 14px; stroke: #fff; stroke-width: 3; fill: none; display: none; }
      .sc-checked { background: #10b981; border-color: #10b981; cursor: default; }
      .sc-checked .sc-tick { display: block; }
      .sc-hp { position: absolute; opacity: 0; pointer-events: none; height: 0; width: 0; }
      @keyframes sc-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // Turnstile HTML Box + 2 Honeypots
    var container = document.createElement("div");
    container.id = "scaptcha-turnstile-box";
    container.innerHTML = `
      <div class="sc-turnstile sc-dark-mode">
        
        <!-- Honeypot Traps (Bots will check these, humans won't see them) -->
        <input type="checkbox" class="sc-hp" id="hp-trap-1" />
        <input type="checkbox" class="sc-hp" id="hp-trap-2" />
        
        <!-- Main Checkbox UI -->
        <div class="sc-checkbox" id="sc-main-box">
          <div class="sc-spinner" id="sc-spin"></div>
          <svg class="sc-tick" id="sc-tick" viewBox="0 0 24 24"><path d="M4 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="sc-text" id="sc-main-text">Verify you are human</div>
        
        <!-- Branding -->
        <div class="sc-logo">
          <span style="font-weight:bold; color:#10b981;">S-Captcha</span>
          <span>Privacy - Terms</span>
        </div>
      </div>
    `;

    var form = document.querySelector("form");
    if (form) {
        form.parentNode.insertBefore(container, form);
    } else {
        document.body.appendChild(container);
    }

    // Interaction Logic
    var mainBox = document.getElementById("sc-main-box");
    var mainText = document.getElementById("sc-main-text");
    var spinner = document.getElementById("sc-spin");
    var tick = document.getElementById("sc-tick");

    mainBox.addEventListener("click", function(e) {
      if (mainBox.classList.contains("sc-checked")) return;

      // 1. Mouse Speed / Fast Click Trap (রোবটের মতো দ্রুত ক্লিক করলে)
      var clickTime = Date.now();
      if (!isWhitelistedClient && (clickTime - pageLoadTime < CFG.minClickTimeMs)) {
        triggerBan("inhuman_fast_click");
        return;
      }

      // 2. Honeypot Check (বট যদি লুকানো চেকবক্স টিক মেরে থাকে)
      var hp1 = document.getElementById("hp-trap-1").checked;
      var hp2 = document.getElementById("hp-trap-2").checked;
      if (!isWhitelistedClient && (hp1 || hp2)) {
        triggerBan("honeypot_triggered");
        return;
      }

      // 3. Turnstile Animation (Analyzing...)
      mainBox.style.background = "transparent";
      mainBox.style.borderColor = "transparent";
      spinner.style.display = "block";
      mainText.innerText = "Analyzing...";

      // Fake delay to look professional (like Cloudflare)
      setTimeout(function() {
        spinner.style.display = "none";
        mainBox.style.background = "";
        mainBox.style.borderColor = "";
        mainBox.classList.add("sc-checked");
        mainText.innerText = "Success!";
        
        // ফর্ম সাবমিট করার জন্য হিডেন ইনপুট অ্যাড করে দিতে পারিস
        var passedInput = document.createElement("input");
        passedInput.type = "hidden";
        passedInput.name = "scaptcha_passed";
        passedInput.value = "true";
        if(form) form.appendChild(passedInput);
        
      }, 1500 + Math.random() * 1000); // 1.5 to 2.5 seconds delay
    });
  }

  // Initialize
  checkAdminIP().then(() => {
    checkFastReload();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectTurnstileUI);
    } else {
      injectTurnstileUI();
    }
  });

})();
