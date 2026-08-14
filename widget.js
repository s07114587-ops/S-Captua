/*!
 * S-Captcha Widget v3 — Auto-Inject, Battery & Tor Detection
 * Created by Shubhomoy (S-Captcha Project)
 */
(function () {
  "use strict";

  var CFG = {
    assetBase: "https://www.scaptua.duckdns.org",
    dbEndpoint: "https://script.google.com/macros/s/AKfycbwsnnrJMh5Svw378pmlwqaKNz2HHuw5r2hbuzFDWAgeGNd0ctw3mPf-sbvGOrIC5HcE/exec",
    tier1Ms: 5 * 60 * 1000,
    tier2Ms: 12 * 60 * 60 * 1000,
    whitelistHost: "s-ip.duckdns.org",
    whitelistIps: ["2a09:bac5:3e0e:1a8c::2a5:58"],
    spamLimit: 10, // ১০ বারের বেশি রিলোড করলে স্প্যাম/Tor ফায়ার হবে
    spamTimeframeMs: 60 * 1000 // ১ মিনিটের মধ্যে
  };

  var isWhitelistedClient = false;

  // 1. IP Whitelisting (তোর জন্য সব মাফ!)
  function checkAdminIP() {
    return fetch("https://api64.ipify.org?format=json")
      .then(r => r.json())
      .then(j => {
        var ip = j.ip || "";
        // এখানে তোর হোস্ট বা স্ট্যাটিক IP চেক হচ্ছে
        if (CFG.whitelistIps.includes(ip)) {
            isWhitelistedClient = true;
            console.log("S-Captcha: Boss is here! Banning completely disabled.");
        }
      }).catch(() => {});
  }

  // 2. Battery API Bot Detection (Headless Browser Check)
  function checkBatteryBot() {
    if (isWhitelistedClient) return; // তোর জন্য চেক হবে না
    if ('getBattery' in navigator) {
      navigator.getBattery().then(function(battery) {
        // হেডলেস বট সাধারণত ১০০% চার্জিং দেখায়
        if (battery.level === 1.0 && battery.charging === true) {
          console.warn("Suspicious Battery Level Detected (Possible Bot).");
          // তুই চাইলে এখানে triggerBan("bot_battery_signature") কল করতে পারিস!
        }
      });
    }
  }

  // 3. Tor / Repeated Spam Detection (Rate Limiting)
  function checkSpamAndTor() {
    if (isWhitelistedClient) return; // তোর জন্য চেক হবে না

    var now = Date.now();
    var visits = JSON.parse(localStorage.getItem("sc_visits") || "[]");
    
    // ১ মিনিটের পুরোনো রেকর্ড মুছে ফেল
    visits = visits.filter(t => now - t < CFG.spamTimeframeMs);
    visits.push(now);
    localStorage.setItem("sc_visits", JSON.stringify(visits));

    // যদি ১ মিনিটে ১০ বারের বেশি হিট করে (Tor বা স্প্যামার)
    if (visits.length > CFG.spamLimit) {
        triggerBan("spam_or_tor_detected");
    }
  }

  // 4. Ban Logic
  function triggerBan(reason) {
    if (isWhitelistedClient) return;
    
    var offense = parseInt(localStorage.getItem("scaptcha_offense_count") || "0", 10) + 1;
    localStorage.setItem("scaptcha_offense_count", offense);
    
    // ব্যান পেজে রিডাইরেক্ট (তোর আগের লজিক অনুযায়ী)
    var path = offense === 1 ? "/to-dear-bot-or-hacker.html" : "/you-ban-for-12hours.html";
    window.location.href = CFG.assetBase + path;
  }

  // 5. Auto-Inject UI (১ লাইনের ম্যাজিক!)
  function injectWidget() {
    // পেজে আগে থেকে উইজেট না থাকলে নিজে থেকে বানিয়ে নেবে
    if (!document.getElementById("scaptcha-auto-container")) {
        var container = document.createElement("div");
        container.id = "scaptcha-auto-container";
        container.innerHTML = `
            <div style="border: 1px solid #10b981; padding: 15px; background: #0f172a; color: #fff; width: 300px; border-radius: 8px; font-family: sans-serif; text-align: center; margin: 20px auto;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">Protected by <b>S-Captcha</b></p>
                <button id="sc-trigger-btn" style="background: #10b981; border: none; padding: 8px 16px; color: #fff; cursor: pointer; border-radius: 4px;">Verify you are human</button>
            </div>
        `;
        
        // ফর্মের ঠিক আগে বা বডির শেষে বসিয়ে দেবে
        var form = document.querySelector("form");
        if (form) {
            form.parentNode.insertBefore(container, form);
        } else {
            document.body.appendChild(container);
        }

        // বাটনে ক্লিক করলে গেম খুলবে
        document.getElementById("sc-trigger-btn").addEventListener("click", function(e) {
            e.preventDefault();
            // এখানে তোর আগের বাস্কেটবল বা টাইল গেম ওপেন করার কোড কল হবে
            alert("Mini-game will open here!"); 
        });
    }
  }

  // স্ক্রিপ্ট লোড হওয়ার সাথে সাথে সব চেক ফায়ার হবে!
  checkAdminIP().then(() => {
    checkBatteryBot();
    checkSpamAndTor();
    
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectWidget);
    } else {
      injectWidget();
    }
  });

})();
