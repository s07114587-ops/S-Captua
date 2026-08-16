import os
import base64
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="S-Captcha Control Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Clerk gate config
# ---------------------------------------------------------------------------
# Set these in your host's environment variables (Render/Railway/etc):
#   CLERK_PUBLISHABLE_KEY = pk_live_...   (same key your main site uses)
#   ADMIN_EMAILS          = you@example.com,teammate@example.com
#
# CLERK_PUBLISHABLE_KEY is safe to expose to the browser (that's what it's
# for). ADMIN_EMAILS is the actual gate: only signed-in Clerk users whose
# email is in this list get to see the dashboard.
CLERK_PUBLISHABLE_KEY = os.environ.get("CLERK_PUBLISHABLE_KEY", "")
ADMIN_EMAILS = [
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "").split(",")
    if e.strip()
]


def _clerk_frontend_api(publishable_key: str) -> str:
    """Publishable keys are pk_(test|live)_<base64(frontend-api-domain + '$')>."""
    try:
        _, _, encoded = publishable_key.split("_", 2)
        padded = encoded + "=" * (-len(encoded) % 4)
        return base64.b64decode(padded).decode("utf-8").rstrip("$")
    except Exception:
        return ""


CLERK_FRONTEND_API = _clerk_frontend_api(CLERK_PUBLISHABLE_KEY) if CLERK_PUBLISHABLE_KEY else ""

CLERK_SCRIPT_TAG = (
    '<script async crossorigin="anonymous" '
    'data-clerk-publishable-key="{key}" '
    'src="https://{domain}/npm/@clerk/clerk-js@5/dist/clerk.browser.js"></script>'
).format(key=CLERK_PUBLISHABLE_KEY, domain=CLERK_FRONTEND_API) if CLERK_FRONTEND_API else (
    '<!-- CLERK_PUBLISHABLE_KEY env var is not set: the admin gate cannot load Clerk. -->'
)

HTML_CONTENT = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta name="google-site-verification" content="E5EbStfGTng9SmGI0gozjEJ16zMqAd9x7_BRZh6dL14" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S-Captcha Admin & Live Logs</title>
    __CLERK_SCRIPT_TAG__
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Consolas', 'Segoe UI', monospace; }
        body { background-color: #05050a; color: #00ffcc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; background-image: radial-gradient(#141428 1px, transparent 1px); background-size: 20px 20px; }
        .container { width: 100%; max-width: 650px; background: rgba(20, 20, 35, 0.85); backdrop-filter: blur(10px); padding: 30px; border-radius: 16px; border: 1px solid #00ffcc; box-shadow: 0 0 30px rgba(0, 255, 204, 0.15); }
        .header { text-align: center; margin-bottom: 25px; }
        h1 { color: #00ffcc; font-size: 24px; text-shadow: 0 0 10px #00ffcc; }
        .box { background: #0a0a14; border: 1px solid #1f1f3a; padding: 18px; border-radius: 10px; margin-bottom: 20px; transition: 0.3s; }
        .box:hover { border-color: #ff007f; }
        .form-group { margin-bottom: 12px; }
        label { display: block; font-size: 10px; margin-bottom: 5px; color: #00ffcc; font-weight: bold; }
        input { width: 100%; padding: 11px; background: #141426; border: 1px solid #2a2a4a; color: #fff; border-radius: 6px; outline: none; }
        button { width: 100%; padding: 12px; background: linear-gradient(45deg, #ff007f, #b30059); color: white; border: none; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; }
        .gen-btn { background: linear-gradient(45deg, #00ffcc, #00997a); color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; color:#fff; text-align:left; }
        th, td { padding: 10px; border-bottom: 1px solid #1f1f3a; }
        th { color: #ff007f; text-transform: uppercase; border-bottom: 2px solid #ff007f; }
        .select-btn { background: #00ffcc; color: #000; padding: 5px 10px; font-size: 10px; border-radius: 4px; cursor: pointer; border: none; font-weight: bold; }
        #res { margin-top: 15px; font-weight: bold; padding: 12px; border-radius: 6px; text-align: center; display: none; }

        /* ---- Clerk auth gate ---- */
        #scap-gate {
            width: 100%; max-width: 420px; background: rgba(20, 20, 35, 0.9);
            backdrop-filter: blur(10px); padding: 34px 28px; border-radius: 16px;
            border: 1px solid #ff007f; box-shadow: 0 0 30px rgba(255, 0, 127, 0.18);
            text-align: center;
        }
        #scap-gate h2 { color: #ff007f; font-size: 18px; margin-bottom: 8px; text-shadow: 0 0 10px rgba(255,0,127,0.6); }
        #scap-gate p { color: #8b96ad; font-size: 12px; margin-bottom: 22px; line-height: 1.5; }
        #scap-gate button { background: linear-gradient(45deg, #ff007f, #b30059); }
        #scap-status { margin-top: 16px; font-size: 11px; color: #8b96ad; }
        #scap-status.is-error { color: #ff007f; }
        #scap-account {
            position: fixed; top: 16px; right: 16px; display: flex;
            align-items: center; gap: 10px; z-index: 20;
        }
        #scap-user-button { min-width: 32px; min-height: 32px; }
        [hidden] { display: none !important; }
    </style>
</head>

<body>
    <div id="scap-account" hidden>
        <div id="scap-user-button"></div>
    </div>

    <!-- Shown until Clerk confirms the visitor is a signed-in admin -->
    <div id="scap-gate">
        <h2>🔒 Restricted Access</h2>
        <p>This is the S-Captcha control engine. Sign in with an authorized admin account to continue.</p>
        <button id="scap-signin-btn" type="button">Sign In</button>
        <div id="scap-status">Connecting to auth service…</div>
    </div>

    <!-- Real dashboard, hidden until the gate above passes -->
    <div id="scap-app" hidden>
    <div class="container">
        <div class="header"><h1>🛡️ S-CAPTCHA ENGINE</h1></div>


        <!-- 1. Key Gen -->
        <div class="box">
            <h3>🔑 1. Generate Verification Key</h3>
            <button class="gen-btn" onclick="generateCode()">Generate Key</button>
            <div id="genResult" style="display:none; margin-top:10px;">
                <p style="font-size:10px; color:#aaa; margin-bottom:5px;">Create this file in your domain root:</p>
                <p id="secretOutput" style="color:#00ffcc; font-weight:bold; font-size:14px; background:#000; padding:8px; border-radius:4px; border: 1px dashed #00ffcc; text-align:center;"></p>
            </div>
        </div>

        <!-- 2. Logs -->
        <div class="box">
            <h3>📊 2. Live Ban Logs</h3>
            <div class="form-group"><input type="text" id="checkSiteUrl" placeholder="yourdomain.com"></div>
            <button class="gen-btn" onclick="fetchLogs()">Fetch Logs</button>
            <div id="logsTableContainer" style="display:none;">
                <table>
                    <thead><tr><th>Type</th><th>IP Hash</th><th>Time</th><th>Action</th></tr></thead>
                    <tbody id="logsTableBody"></tbody>
                </table>
            </div>
        </div>

        <!-- 3. Unban Form -->
        <div class="box">
            <h3>🔓 3. Verify & Unban IP via Timestamp</h3>
            <div class="form-group"><input type="text" id="siteUrl" placeholder="yourdomain.com"></div>
            <div class="form-group"><input type="text" id="secretCode" placeholder="Secret Key (e.g. a1b2c3...)"></div>
            <div class="form-group"><input type="text" id="banTimeInput" placeholder="Exact Timestamp (e.g. 2026-08-15T10:00:00.000Z)" readonly style="color:#888;"></div>
            <button onclick="unbanIP()">VERIFY DOMAIN & UNBAN</button>
        </div>
        <div id="res"></div>
    </div>
    </div>
    <!-- /#scap-app -->

    <script>
        const SCAP_ADMIN_EMAILS = __ADMIN_EMAILS_JSON__;

        (function () {
            const gate = document.getElementById('scap-gate');
            const app = document.getElementById('scap-app');
            const accountBox = document.getElementById('scap-account');
            const userButtonSlot = document.getElementById('scap-user-button');
            const signInBtn = document.getElementById('scap-signin-btn');
            const statusEl = document.getElementById('scap-status');

            let clerkReady = false;

            function setStatus(msg, isError) {
                statusEl.textContent = msg;
                statusEl.classList.toggle('is-error', !!isError);
            }

            function isAdmin(user) {
                if (!SCAP_ADMIN_EMAILS.length) return false;
                const addr = user && user.primaryEmailAddress && user.primaryEmailAddress.emailAddress;
                if (!addr) return false;
                return SCAP_ADMIN_EMAILS.indexOf(addr.toLowerCase()) !== -1;
            }

            function showGate(message, isError) {
                app.hidden = true;
                accountBox.hidden = true;
                gate.hidden = false;
                signInBtn.hidden = false;
                setStatus(message, isError);
            }

            function showApp() {
                gate.hidden = true;
                app.hidden = false;
                accountBox.hidden = false;
            }

            function mountUserButton() {
                try {
                    userButtonSlot.innerHTML = '';
                    window.Clerk.mountUserButton(userButtonSlot);
                } catch (e) { console.error('S-Captcha admin: could not mount user button', e); }
            }

            function evaluateAccess() {
                const user = window.Clerk.user;
                if (!user) {
                    signInBtn.hidden = false;
                    showGate('Sign in to continue.', false);
                    return;
                }
                if (!isAdmin(user)) {
                    signInBtn.hidden = true;
                    showGate('Signed in, but this account is not on the admin list. Contact the owner if you believe this is a mistake.', true);
                    return;
                }
                showApp();
                mountUserButton();
            }

            signInBtn.addEventListener('click', function () {
                if (clerkReady && window.Clerk.openSignIn) {
                    window.Clerk.openSignIn();
                } else {
                    setStatus('Still connecting… try again in a moment.', false);
                }
            });

            function boot() {
                if (!window.Clerk) {
                    showGate('Auth service failed to load. Check CLERK_PUBLISHABLE_KEY on the server.', true);
                    return;
                }
                window.Clerk.load().then(function () {
                    clerkReady = true;
                    evaluateAccess();
                    if (window.Clerk.addListener) {
                        window.Clerk.addListener(evaluateAccess);
                    }
                }).catch(function (err) {
                    console.error('S-Captcha admin: Clerk failed to initialize', err);
                    showGate('Auth service unavailable. Please refresh.', true);
                });
            }

            if (window.Clerk) {
                boot();
            } else {
                window.addEventListener('load', boot);
            }
        })();
    </script>
    <script>
        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxhafkm6BGu4TaRfPkmYeDF-nP4lx-AUx7d2Mk35NOV7JMTeG2zwCdzDVSkXiNRpA7j/exec";

        function normalizeUrl(url) {
            return url.replace(/^https?:\\/\\//i, '').replace(/\\/$/, '').toLowerCase();
        }

        function generateCode() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randomKey = '';
            for (let i = 0; i < 12; i++) randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
            document.getElementById('secretOutput').innerText = "scaptcha-key-" + randomKey + ".txt";
            document.getElementById('genResult').style.display = 'block';
            document.getElementById('secretCode').value = randomKey;
        }

        async function fetchLogs() {
            let siteUrl = normalizeUrl(document.getElementById('checkSiteUrl').value.trim());
            const tbody = document.getElementById('logsTableBody');
            document.getElementById('logsTableContainer').style.display = "block";
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Fetching data...</td></tr>";

            try {
                const response = await fetch(`${APPS_SCRIPT_URL}?action=get_logs&siteUrl=${encodeURIComponent(siteUrl)}`, { method: 'GET', redirect: 'follow' });
                const data = await response.json();
                
                tbody.innerHTML = "";
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => {
                        const color = log.type === 'Permanent' ? '#ff007f' : '#00ffcc';
                        // ✅ FIX: Using log.ipHash instead of log.ip
                        tbody.innerHTML += `<tr>
                            <td style="color:${color}; font-weight:bold;">${log.type}</td>
                            <td style="color:#aaa;">${log.ipHash.substring(0,6)}...</td>
                            <td style="color:#888; font-size:10px;">${log.time}</td>
                            <td><button class="select-btn" onclick="selectForUnban('${log.time}')">SELECT</button></td>
                        </tr>`;
                    });
                } else {
                    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#888;'>No active bans found! 🎉</td></tr>";
                }
            } catch(e) { tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#ff007f;'>Network Error!</td></tr>"; }
        }

        function selectForUnban(banTime) {
            document.getElementById('banTimeInput').value = banTime;
            document.getElementById('siteUrl').value = normalizeUrl(document.getElementById('checkSiteUrl').value);
            document.getElementById('banTimeInput').style.color = "#00ffcc";
            document.getElementById('banTimeInput').style.border = "1px solid #00ffcc";
        }

        async function unbanIP() {
            const resDiv = document.getElementById('res');
            let siteUrl = normalizeUrl(document.getElementById('siteUrl').value.trim());
            const secretCode = document.getElementById('secretCode').value.trim();
            const banTime = document.getElementById('banTimeInput').value.trim();

            if(!siteUrl || !banTime || !secretCode) {
                resDiv.style.display = "block";
                resDiv.innerText = "❌ Please fill all fields and select a ban time!";
                resDiv.style.background = "#1a000d";
                resDiv.style.color = "#ff007f";
                resDiv.style.border = "1px solid #ff007f";
                return;
            }

            resDiv.style.display = "block";
            resDiv.innerText = "⏳ Checking DB & Verifying Domain...";
            resDiv.style.background = "#001a14";
            resDiv.style.color = "#00ffcc";
            resDiv.style.border = "1px solid #00ffcc";

            const payload = {
                action: "unban",
                siteUrl: siteUrl,
                secretCode: secretCode,
                banTime: banTime
            };

            try {
                const response = await fetch(APPS_SCRIPT_URL, { 
                    method: 'POST', 
                    mode: 'cors', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
                    body: JSON.stringify(payload), 
                    redirect: 'follow' 
                });
                const data = await response.json();
                
                resDiv.innerText = data.message;
                if(data.status === "success") {
                    resDiv.style.color = "#00ffcc";
                    resDiv.style.border = "1px solid #00ffcc";
                    document.getElementById('banTimeInput').value = ""; // Clear time after success
                    fetchLogs(); // Auto refresh logs
                } else {
                    resDiv.style.color = "#ff007f";
                    resDiv.style.border = "1px solid #ff007f";
                    resDiv.style.background = "#1a000d";
                }
            } catch(e) { 
                resDiv.innerText = "🚨 Error connecting to server!"; 
                resDiv.style.color = "#ff007f";
            }
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    import json
    page = HTML_CONTENT.replace("__CLERK_SCRIPT_TAG__", CLERK_SCRIPT_TAG)
    page = page.replace("__ADMIN_EMAILS_JSON__", json.dumps(ADMIN_EMAILS))
    return page

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
