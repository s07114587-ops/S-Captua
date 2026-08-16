import os
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

HTML_CONTENT = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta name="google-site-verification" content="E5EbStfGTng9SmGI0gozjEJ16zMqAd9x7_BRZh6dL14" />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S-Captcha Admin & Live Logs</title>
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
    </style>
</head>
<body>
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
    
    <!-- Local Storage Security Gate by Shubhomoy -->
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const isLoggedIn = localStorage.getItem("scap_user_logged_in");

        if (isLoggedIn !== "true") {
          document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #05050a; color: #ff007f; font-family: 'Consolas', monospace; text-align: center; padding: 20px;">
                <div style="border: 1px solid #ff007f; padding: 40px; border-radius: 12px; background: rgba(20, 20, 35, 0.9); box-shadow: 0 0 30px rgba(255, 0, 127, 0.2);">
                    <h2 style="margin-bottom: 15px; font-size: 28px; text-shadow: 0 0 10px rgba(255,0,127,0.6);">⛔ Access Restricted</h2>
                    <p style="font-size: 16px; color: #8b96ad; line-height: 1.8;">
                        Please turn on cookies and go to <br>
                        <a href="https://scaptua.duckdns.org" style="color: #00ffcc; font-weight: bold; text-decoration: none; font-size: 20px; text-shadow: 0 0 8px rgba(0,255,204,0.4);">scaptua.duckdns.org</a>
                    </p>
                </div>
            </div>
          `;
        }
      });
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    return HTML_CONTENT

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
