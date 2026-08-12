(function(){
  "use strict";

  // Inject CSS Styles
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
  .sc-hp{ opacity:0!important; position:absolute!important; top:-9999px!important; pointer-events:none; }
  
  /* MODAL BASKETBALL */
  .sc-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.8); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; z-index:999999; padding:20px; }
  .sc-overlay.show{ display:flex; }
  .sc-modal{ width:320px; background:linear-gradient(180deg, rgba(23,35,61,0.98), rgba(15,23,42,0.98)); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,0.6); padding:16px; font-family:'Segoe UI',sans-serif; }
  .sc-modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:#fff; }
  .sc-modal-head h3{ margin:0; font-size:13.5px; }
  .sc-close{ cursor:pointer; color:var(--text-dim); font-size:18px; background:none; border:none; }
  .sc-instructions{ font-size:11.5px; color:var(--text-dim); margin:0 0 10px; }
  .sc-court{ position:relative; height:210px; border-radius:10px; background:radial-gradient(circle at 50% 100%, rgba(16,185,129,0.12), transparent 60%), var(--bg-soft); border:1px dashed var(--border); overflow:hidden; touch-action:none; }
  .sc-hoop{ position:absolute; top:14px; left:50%; transform:translateX(-50%); width:84px; height:84px; display:flex; align-items:center; justify-content:center; }
  .sc-hoop-zone{ position:absolute; left:50%; top:58%; transform:translate(-50%,-50%); width:46px; height:20px; border-radius:50%; }
  .sc-ball{ position:absolute; left:20px; bottom:14px; width:52px; height:52px; cursor:grab; touch-action:none; transition:left .35s cubic-bezier(.34,1.56,.64,1), bottom .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease, transform .2s ease; z-index:5; }
  .sc-ball.dragging{ cursor:grabbing; transition:none; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.4)); }
  .sc-fallback{ display:flex; align-items:center; justify-content:center; font-size:34px; user-select:none; }
  .sc-hoop .sc-fallback{ font-size:46px; }
  .sc-ball.success{ opacity:0; transform:scale(.4); }
  .sc-court-msg{ position:absolute; bottom:8px; left:0; right:0; text-align:center; font-size:10.5px; color:var(--text-dim); pointer-events:none; }
  .sc-verified-flash{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; background:rgba(15,23,42,0.92); opacity:0; pointer-events:none; transition:opacity .25s ease; }
  .sc-verified-flash.show{ opacity:1; pointer-events:all; }
  .sc-verified-flash svg{ width:40px; height:40px; stroke:var(--accent); }
  .sc-verified-flash span{ font-size:12.5px; color:var(--accent); font-weight:600; }
  @keyframes scSpin{ to{ transform:rotate(360deg); } }
  @keyframes scShake{ 0%,100%{ transform:translateX(0); } 25%{ transform:translateX(-4px); } 75%{ transform:translateX(4px); } }
  `;
  var styleTag = document.createElement("style");
  styleTag.innerHTML = css;
  document.head.appendChild(styleTag);

  function initCaptcha(){
    var targetForm = document.querySelector("form") || document.body;
    var wrapper = document.createElement("div");
    wrapper.className = "scaptcha-auto-wrapper";
    
    wrapper.innerHTML = `
      <div class="scaptcha">
        <div class="scaptcha-body">
          <label class="sc-hp" aria-hidden="true">
            <input type="text" id="scHoneypot" tabindex="-1" autocomplete="off">
          </label>
          <div class="sc-box" id="scBox" role="checkbox" aria-checked="false" tabindex="0">
            <div class="sc-spinner"></div>
            <svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>
          </div>
          <div class="sc-label" id="scLabelWrap">
            <div class="sc-label-text">I am human</div>
            <div class="sc-sub" id="scSub">S-Captcha</div>
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
        <input type="hidden" name="scaptcha_token" id="scToken" value="">
      </div>
      <div class="sc-overlay" id="scOverlay">
        <div class="sc-modal">
          <div class="sc-modal-head">
            <h3>Quick visual check</h3>
            <button type="button" class="sc-close" id="scClose">&times;</button>
          </div>
          <p class="sc-instructions">Drag the ball into the hoop to verify you're human.</p>
          <div class="sc-court" id="scCourt">
            <div class="sc-hoop">
              <img src="https://www.scaptua.duckdns.org/1.png" alt="" id="scHoopImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="sc-fallback" style="display:none;">🧺</div>
              <div class="sc-hoop-zone" id="scZone"></div>
            </div>
            <div class="sc-ball" id="scBall">
              <img src="https://www.scaptua.duckdns.org/0.png" alt="" id="scBallImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="sc-fallback" style="display:none;">🏀</div>
            </div>
            <div class="sc-court-msg" id="scCourtMsg">drag &amp; drop the ball →</div>
            <div class="sc-verified-flash" id="scFlash">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
              <span>Verified — swish!</span>
            </div>
          </div>
        </div>
      </div>
    `;

    var formEl = document.querySelector("form");
    if(formEl){
      formEl.insertBefore(wrapper, formEl.firstChild);
    } else {
      document.body.appendChild(wrapper);
    }

    /* Logic Setup */
    var mousePoints = [], MAX_POINTS = 60, verified = false, checking = false;
    var scBox = document.getElementById('scBox'), scSub = document.getElementById('scSub');
    var scHoneypot = document.getElementById('scHoneypot'), scToken = document.getElementById('scToken');
    var scLabelWrap = document.getElementById('scLabelWrap'), scOverlay = document.getElementById('scOverlay');
    var scClose = document.getElementById('scClose'), scBall = document.getElementById('scBall');
    var scZone = document.getElementById('scZone'), scCourt = document.getElementById('scCourt');
    var scCourtMsg = document.getElementById('scCourtMsg'), scFlash = document.getElementById('scFlash');

    function redirectToBan(){
      window.location.href = "https://www.scaptua.duckdns.org/to-dear-bot-or-hacker.html";
    }

    document.addEventListener('mousemove', function(e){
      mousePoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (mousePoints.length > MAX_POINTS) mousePoints.shift();
    }, { passive:true });

    function looksHuman(){
      if (mousePoints.length < 8) return false;
      var pts = mousePoints, straightCount = 0, velocities = [];
      for (var i = 2; i < pts.length; i++){
        var a = pts[i-2], b = pts[i-1], c = pts[i];
        var v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
        if (Math.abs(v1x * v2y - v1y * v2x) < 0.6) straightCount++;
        var dt = Math.max(1, c.t - b.t), dist = Math.hypot(c.x - b.x, c.y - b.y);
        velocities.push(dist / dt);
      }
      var straightRatio = straightCount / (pts.length - 2);
      var mean = velocities.reduce((s,v)=>s+v, 0) / velocities.length;
      var variance = velocities.reduce((s,v)=>s+Math.pow(v-mean,2), 0) / velocities.length;
      return !(straightRatio > 0.92 || variance < 0.0008);
    }

    function setSub(text, cls){ scSub.textContent = text; scSub.className = 'sc-sub' + (cls ? ' ' + cls : ''); }
    function markVerified(){
      verified = true;
      scBox.classList.remove('loading','failed');
      scBox.classList.add('checked');
      setSub('Verified', 'ok');
      scToken.value = 'sc_token_' + Math.random().toString(36).substring(2);
    }

    function handleCheck(){
      if (verified || checking) return;
      if (scHoneypot.value.trim().length > 0){ redirectToBan(); return; }

      checking = true; scBox.classList.add('loading'); setSub('Verifying…');
      setTimeout(function(){
        checking = false; scBox.classList.remove('loading');
        if (looksHuman()){ markVerified(); } else { setSub('Extra check needed', 'err'); openChallenge(); }
      }, 450);
    }

    scBox.addEventListener('click', handleCheck);
    scLabelWrap.addEventListener('click', handleCheck);
    scHoneypot.addEventListener('input', redirectToBan);

    /* Basketball Drag & Drop */
    var dragging = false, startLeft, startBottom, startX, startY, pointerId;
    function resetBall(){ scBall.style.left = '20px'; scBall.style.bottom = '14px'; scBall.classList.remove('success'); }
    function openChallenge(){ resetBall(); scFlash.classList.remove('show'); scOverlay.classList.add('show'); scCourtMsg.textContent = 'drag & drop the ball →'; }
    function closeChallenge(){ scOverlay.classList.remove('show'); }
    scClose.addEventListener('click', closeChallenge);

    function pointFromEvent(e){ return (e.touches && e.touches[0]) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }
    function onPointerDown(e){
      if (verified) return; dragging = true; scBall.classList.add('dragging');
      var p = pointFromEvent(e); startX = p.x; startY = p.y;
      var rect = scBall.getBoundingClientRect(), courtRect = scCourt.getBoundingClientRect();
      startLeft = rect.left - courtRect.left; startBottom = courtRect.bottom - rect.bottom;
      e.preventDefault();
    }
    function onPointerMove(e){
      if (!dragging) return;
      var p = pointFromEvent(e);
      scBall.style.left = (startLeft + (p.x - startX)) + 'px';
      scBall.style.bottom = (startBottom - (p.y - startY)) + 'px';
      e.preventDefault();
    }
    function onPointerUp(){
      if (!dragging) return; dragging = false; scBall.classList.remove('dragging');
      var ballRect = scBall.getBoundingClientRect(), zoneRect = scZone.getBoundingClientRect();
      var hit = (ballRect.left + ballRect.width/2 > zoneRect.left && ballRect.left + ballRect.width/2 < zoneRect.right &&
                 ballRect.top + ballRect.height/2 > zoneRect.top && ballRect.top + ballRect.height/2 < zoneRect.bottom);
      if (hit){
        scBall.classList.add('success'); scFlash.classList.add('show');
        setTimeout(function(){ closeChallenge(); markVerified(); }, 650);
      } else { resetBall(); scCourtMsg.textContent = 'not quite — try again'; }
    }

    scBall.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive:false });
    window.addEventListener('pointerup', onPointerUp);

    // Form submit restriction
    if(formEl){
      formEl.addEventListener('submit', function(e){
        if(!verified || scHoneypot.value.trim().length > 0){
          e.preventDefault();
          redirectToBan();
        }
      });
    }
  }

  if ("loading" === document.readyState) {
    document.addEventListener("DOMContentLoaded", initCaptcha);
  } else {
    initCaptcha();
  }
})();
