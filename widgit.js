(function () {
  "use strict";

  // 1. Inject Stylesheet Dynamically
  var style = document.createElement('style');
  style.innerHTML = `
    .scaptcha {
      width: 320px;
      background: rgba(17,28,52,0.72);
      border: 1px solid rgba(148,163,184,0.14);
      border-radius: 14px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
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
    .sc-box.failed { border-color: #f43f5e; animation: sc-shake .35s ease; }
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
    .scaptcha-footer a:hover { color: #10b981; }
    .sc-hp { opacity: 0 !important; position: absolute !important; top: -9999px !important; left: -9999px !important; height: 0 !important; width: 0 !important; pointer-events: none; }
    @keyframes sc-spin { to { transform: rotate(360deg); } }
    @keyframes sc-shake { 0%,100%{ transform: translateX(0); } 25%{ transform: translateX(-4px); } 75%{ transform: translateX(4px); } }

    /* Modal Overlay */
    .sc-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.72); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
    .sc-overlay.show { display: flex; }
    .sc-modal { width: 320px; background: linear-gradient(180deg, rgba(23,35,61,0.95), rgba(15,23,42,0.97)); border: 1px solid rgba(148,163,184,0.14); border-radius: 14px; padding: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .sc-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .sc-modal-head h3 { margin: 0; font-size: 13.5px; color: #f8fafc; }
    .sc-modal-head .sc-close { cursor: pointer; color: #94a3b8; font-size: 16px; background: none; border: none; }
    .sc-instructions { font-size: 11.5px; color: #94a3b8; margin: 0 0 10px; }
    .sc-court { position: relative; height: 210px; border-radius: 10px; background: radial-gradient(circle at 50% 100%, rgba(16,185,129,0.10), transparent 60%), #111c34; border: 1px dashed rgba(148,163,184,0.14); overflow: hidden; touch-action: none; }
    .sc-hoop { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 84px; height: 84px; display: flex; align-items: center; justify-content: center; }
    .sc-hoop img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
    .sc-hoop-zone { position: absolute; left: 50%; top: 58%; transform: translate(-50%,-50%); width: 46px; height: 20px; border-radius: 50%; }
    .sc-ball { position: absolute; left: 20px; bottom: 14px; width: 52px; height: 52px; cursor: grab; touch-action: none; z-index: 5; transition: left .35s ease, bottom .35s ease, opacity .25s ease; }
    .sc-ball.dragging { cursor: grabbing; transition: none; }
    .sc-ball img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
    .sc-fallback { display: flex; align-items: center; justify-content: center; font-size: 34px; }
    .sc-hoop .sc-fallback { font-size: 46px; }
    .sc-ball.success { opacity: 0; transform: scale(.4); }
    .sc-court-msg { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-size: 10.5px; color: #94a3b8; }
    .sc-verified-flash { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; background: rgba(15,23,42,0.9); opacity: 0; pointer-events: none; transition: opacity .25s ease; }
    .sc-verified-flash.show { opacity: 1; pointer-events: all; }
    .sc-verified-flash svg { width: 40px; height: 40px; stroke: #10b981; }
    .sc-verified-flash span { font-size: 12.5px; color: #10b981; font-weight: 600; }
  `;
  document.head.appendChild(style);

  // 2. Render Widget Template into <div class="scaptcha">
  var containers = document.querySelectorAll('.scaptcha');
  containers.forEach(function (container) {
    container.innerHTML = `
      <div class="scaptcha-body">
        <label class="sc-hp" aria-hidden="true">
          Leave this empty <input type="text" class="scHoneypot" tabindex="-1" autocomplete="off">
        </label>
        <div class="sc-box" role="checkbox" aria-checked="false" tabindex="0">
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
    `;
  });

  // 3. Inject Modal Overlay into Body
  var modalDiv = document.createElement('div');
  modalDiv.className = 'sc-overlay';
  modalDiv.id = 'scOverlay';
  modalDiv.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-head">
        <h3>Quick visual check</h3>
        <button type="button" class="sc-close" id="scClose">&times;</button>
      </div>
      <p class="sc-instructions">Drag the ball into the hoop to verify you're human.</p>
      <div class="sc-court" id="scCourt">
        <div class="sc-hoop">
          <img src="1.png" alt="" id="scHoopImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="sc-fallback" style="display:none;">🧺</div>
          <div class="sc-hoop-zone" id="scZone"></div>
        </div>
        <div class="sc-ball" id="scBall">
          <img src="0.png" alt="" id="scBallImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="sc-fallback" style="display:none;">🏀</div>
        </div>
        <div class="sc-court-msg" id="scCourtMsg">drag & drop the ball →</div>
        <div class="sc-verified-flash" id="scFlash">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
          <span>Verified — swish!</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  /* ---------------- Core Captcha Logic ---------------- */
  var mousePoints = [];
  var verified = false;
  var checking = false;

  document.addEventListener('mousemove', function (e) {
    mousePoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (mousePoints.length > 60) mousePoints.shift();
  }, { passive: true });

  function looksHuman() {
    if (mousePoints.length < 8) return false;
    var straightCount = 0;
    for (var i = 2; i < mousePoints.length; i++) {
      var a = mousePoints[i - 2], b = mousePoints[i - 1], c = mousePoints[i];
      var cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 0.6) straightCount++;
    }
    return (straightCount / (mousePoints.length - 2)) <= 0.92;
  }

  containers.forEach(function (container) {
    var scBox = container.querySelector('.sc-box');
    var scSub = container.querySelector('.sc-sub');
    var scHp = container.querySelector('.scHoneypot');
    var scToken = container.querySelector('.scToken');

    function handleCheck() {
      if (verified || checking) return;

      if (scHp.value.trim().length > 0) {
        scBox.classList.add('failed');
        scSub.textContent = 'Bot activity detected';
        scSub.className = 'sc-sub err';
        return;
      }

      checking = true;
      scBox.classList.add('loading');
      scSub.textContent = 'Verifying…';

      setTimeout(function () {
        checking = false;
        scBox.classList.remove('loading');

        if (looksHuman()) {
          verified = true;
          scBox.classList.add('checked');
          scSub.textContent = 'Verified';
          scSub.className = 'sc-sub ok';
          scToken.value = 'sc_token_' + Math.random().toString(36).substring(2);
        } else {
          scSub.textContent = 'Extra check needed';
          scSub.className = 'sc-sub err';
          document.getElementById('scOverlay').classList.add('show');
        }
      }, 450);
    }

    scBox.addEventListener('click', handleCheck);
    container.querySelector('.sc-label').addEventListener('click', handleCheck);
  });

  // Drag & Drop Modal Close Logic
  document.getElementById('scClose').addEventListener('click', function () {
    document.getElementById('scOverlay').classList.remove('show');
  });

})();
