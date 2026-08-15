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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S-Captcha Admin & Live Logs</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Consolas', 'Segoe UI', monospace; }
        body { background-color: #05050a; color: #00ffcc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; background-image: radial-gradient(#141428 1px, transparent 1px); background-size: 20px 20px; }
        .container { width: 100%; max-width: 600px; background: rgba(20, 20, 35, 0.85); backdrop-filter: blur(10px); padding: 30px; border-radius: 16px; border: 1px solid #00ffcc; box-shadow: 0 0 30px rgba(0, 255, 204, 0.15); }
        .header { text-align: center; margin-bottom: 25px; }
        h1 { color: #00ffcc; font-size: 24px; text-shadow: 0 0 10px #00ffcc; }
        .box { background: #0a0a14; border: 1px solid #1f1f3a; padding: 18px; border-radius: 10px; margin-bottom: 20px; }
        .form-group { margin-bottom: 12px; }
        label { display: block; font-size: 10px; margin-bottom: 5px; color: #00ffcc; font-weight: bold; }
        input { width: 100%; padding: 11px; background: #141426; border: 1px solid #2a2a4a; color: #fff; border-radius: 6px; outline: none; }
        button { width: 100%; padding: 12px; background: linear-gradient(45deg, #ff007f, #b30059); color: white; border: none; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; }
        .gen-btn { background: linear-gradient(45deg, #00ffcc, #00997a); color: #000; }
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
                <p id="secretOutput" style="color:#00ffcc; font-weight:bold; font-size:13px; background:#000; padding:8px; border-radius:4px;"></p>
            </div>
        </div>

        <!-- 2. Logs -->
        <div class="box">
            <h3>📊 2. Live Ban Logs</h3>
            <div class="form-group"><input type="text" id="checkSiteUrl" placeholder="https://yourdomain.com"></div>
            <button class="gen-btn" onclick="fetchLogs()">Fetch Logs</button>
            <div id="logsTableContainer" style="display:none; margin-top:15px;">
                <table id="logsTable" style="width:100%; font-size:11px; color:#fff;"><thead><tr><th>Type</th><th>Hash</th><th>Time</th></tr></thead><tbody id="logsTableBody"></tbody></table>
            </div>
        </div>

        <!-- 3. Unban -->
        <div class="box">
            <h3>🔓 3. Unban IP</h3>
            <div class="form-group"><input type="text" id="siteUrl" placeholder="https://yourdomain.com"></div>
            <div class="form-group"><input type="text" id="secretCode" placeholder="Secret Key"></div>
            <div class="form-group"><input type="text" id="targetIp" placeholder="IP Address"></div>
            <button onclick="unbanIP()">VERIFY & UNBAN</button>
        </div>
        <div id="res"></div>
    </div>

    <script>
        // ✅ NEW URL UPDATED
        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxhafkm6BGu4TaRfPkmYeDF-nP4lx-AUx7d2Mk35NOV7JMTeG2zwCdzDVSkXiNRpA7j/exec";

        function generateCode() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randomKey = '';
            for (let i = 0; i < 12; i++) randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
            document.getElementById('secretOutput').innerText = "scaptcha-key-" + randomKey + ".txt";
            document.getElementById('genResult').style.display = 'block';
            document.getElementById('secretCode').value = randomKey;
        }

        async function fetchLogs() {
            const siteUrl = document.getElementById('checkSiteUrl').value.trim();
            const tbody = document.getElementById('logsTableBody');
            document.getElementById('logsTableContainer').style.display = "block";
            tbody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

            try {
                const response = await fetch(`${APPS_SCRIPT_URL}?action=get_logs&siteUrl=${encodeURIComponent(siteUrl)}`, { method: 'GET', redirect: 'follow' });
                const data = await response.json();
                tbody.innerHTML = "";
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => {
                        tbody.innerHTML += `<tr><td>${log.type}</td><td>${log.ip.substring(0,8)}...</td><td>${log.time}</td></tr>`;
                    });
                } else {
                    tbody.innerHTML = "<tr><td colspan='3'>No bans found!</td></tr>";
                }
            } catch(e) { tbody.innerHTML = "<tr><td colspan='3'>Error!</td></tr>"; }
        }

        async function unbanIP() {
            const resDiv = document.getElementById('res');
            const payload = {
                action: "unban",
                siteUrl: document.getElementById('siteUrl').value.trim(),
                secretCode: document.getElementById('secretCode').value.trim(),
                ip: document.getElementById('targetIp').value.trim()
            };
            try {
                const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow' });
                const data = await response.json();
                resDiv.style.display = "block";
                resDiv.innerText = data.message;
                resDiv.style.color = data.status === "success" ? "#00ffcc" : "#ff007f";
            } catch(e) { alert("Error!"); }
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    return HTML_CONTENT

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
