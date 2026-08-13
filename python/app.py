import os
import requests
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', monospace; background-color: #0a0a12; color: #00ffcc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .container { width: 100%; max-width: 550px; background: #141423; padding: 30px; border-radius: 12px; border: 2px solid #00ffcc; box-shadow: 0 0 25px rgba(0, 255, 204, 0.2); }
        h1 { color: #00ffcc; font-size: 22px; text-align: center; margin-bottom: 5px; text-shadow: 0 0 8px #00ffcc; }
        p.sub { text-align: center; color: #888; font-size: 12px; margin-bottom: 20px; }
        
        .box { background: #0a0a12; border: 1px solid #ff007f; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .box h3 { font-size: 14px; color: #ff007f; margin-bottom: 10px; text-transform: uppercase; }
        
        .form-group { margin-bottom: 12px; text-align: left; }
        label { display: block; font-size: 11px; margin-bottom: 4px; color: #00ffcc; font-weight: bold; }
        input { width: 100%; padding: 10px; background: #141423; border: 1px solid #333; color: #fff; border-radius: 6px; font-family: monospace; outline: none; }
        input:focus { border-color: #00ffcc; }
        
        button { width: 100%; padding: 10px; background: #ff007f; color: white; border: none; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.2s; margin-top: 5px; }
        button:hover { background: #e0006f; box-shadow: 0 0 10px rgba(255, 0, 127, 0.5); }
        
        .gen-btn { background: #00ffcc; color: #000; }
        .gen-btn:hover { background: #00cca3; box-shadow: 0 0 10px rgba(0, 255, 204, 0.5); }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; text-align: left; }
        th, td { padding: 8px; border-bottom: 1px solid #222; word-break: break-all; }
        th { color: #ff007f; border-bottom: 2px solid #ff007f; }
        
        #genResult { margin-top: 10px; font-size: 12px; background: #1a1a2e; padding: 10px; border-radius: 4px; border: 1px dashed #00ffcc; display: none; text-align: center; }
        #res { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 6px; text-align: center; display: none; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏀 S-Captcha Control Panel</h1>
        <p class="sub">Dynamic Verification & Live Ban Logs Engine</p>

        <!-- 🛠️ SECTION 1: CODE GENERATOR -->
        <div class="box">
            <h3>🔑 1. Generate Secure Verification Key</h3>
            <button class="gen-btn" onclick="generateCode()">Generate Dynamic File Name</button>
            <div id="genResult">
                <p style="color:#aaa; font-size:11px;">Create a file with this EXACT name in your website root:</p>
                <p id="secretOutput" style="color:#ff007f; font-weight:bold; font-size:14px; margin:8px 0; background:#000; padding:5px; border-radius:4px;"></p>
            </div>
        </div>

        <!-- 🛠️ SECTION 2: LIVE BAN LOGS -->
        <div class="box">
            <h3>📊 2. View Banned IP Logs</h3>
            <div class="form-group">
                <label>YOUR WEBSITE URL:</label>
                <input type="text" id="checkSiteUrl" placeholder="https://example.com">
            </div>
            <button class="gen-btn" onclick="fetchLogs()">Fetch Ban Logs & Time</button>
            
            <div id="logsTableContainer" style="display:none; margin-top:15px;">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Encrypted IP (SHA-256)</th>
                            <th>Ban Time</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody"></tbody>
                </table>
            </div>
        </div>

        <!-- 🛠️ SECTION 3: UNBAN FORM -->
        <div class="box">
            <h3>🔓 3. Verify & Unban IP</h3>
            <div class="form-group">
                <label>WEBSITE URL:</label>
                <input type="text" id="siteUrl" placeholder="https://example.com">
            </div>

            <div class="form-group">
                <label>DYNAMIC SECRET KEY (e.g. a1b2c3d4):</label>
                <input type="text" id="secretCode" placeholder="Enter ONLY secret key part">
            </div>

            <div class="form-group">
                <label>TARGET REAL IP TO UNBAN:</label>
                <input type="text" id="targetIp" placeholder="e.g. 103.45.12.89">
            </div>

            <button onclick="unbanIP()">VERIFY DOMAIN & UNBAN</button>
        </div>

        <div id="res"></div>
    </div>

    <script>
        // ✅ Updated Google Apps Script Web App URL
        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsnnrJMh5Svw378pmlwqaKNz2HHuw5r2hbuzFDWAgeGNd0ctw3mPf-sbvGOrIC5HcE/exec";

        function generateCode() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randomKey = '';
            for (let i = 0; i < 12; i++) {
                randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            document.getElementById('secretOutput').innerText = "scaptua-key-" + randomKey + ".txt";
            document.getElementById('genResult').style.display = 'block';
            document.getElementById('secretCode').value = randomKey;
        }

        async function fetchLogs() {
            const siteUrl = document.getElementById('checkSiteUrl').value.trim();
            const tbody = document.getElementById('logsTableBody');
            const container = document.getElementById('logsTableContainer');

            if (!siteUrl) {
                alert("Please enter website URL!");
                return;
            }

            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Loading logs...</td></tr>";
            container.style.display = "block";

            try {
                const response = await fetch(APPS_SCRIPT_URL + "?action=get_logs&siteUrl=" + encodeURIComponent(siteUrl));
                const data = await response.json();

                tbody.innerHTML = "";
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => {
                        const color = log.type === 'Permanent' ? '#ff007f' : '#00ffcc';
                        const row = `<tr>
                            <td style="color:${color}">${log.type}</td>
                            <td>${log.ip}</td>
                            <td>${log.time}</td>
                        </tr>`;
                        tbody.innerHTML += row;
                    });
                } else {
                    tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#888;'>No active bans found for this site! 🎉</td></tr>";
                }
            } catch(e) {
                tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#ff007f;'>Error loading logs! Check Google Apps Script setup.</td></tr>";
            }
        }

        async function unbanIP() {
            const resDiv = document.getElementById('res');
            const siteUrl = document.getElementById('siteUrl').value.trim();
            const secretCode = document.getElementById('secretCode').value.trim();
            const targetIp = document.getElementById('targetIp').value.trim();

            if (!siteUrl || !secretCode || !targetIp) {
                resDiv.style.display = "block";
                resDiv.innerText = "❌ সবগুলো ঘর ঠিকমতো পূরণ কর ভাই!";
                resDiv.style.color = "#ff007f";
                return;
            }

            resDiv.style.display = "block";
            resDiv.innerText = "⏳ Checking dynamic file on domain...";
            resDiv.style.color = "#00ffcc";

            const payload = {
                action: "unban",
                siteUrl: siteUrl,
                secretCode: secretCode,
                ip: targetIp
            };

            try {
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if(data.status === "success") {
                    resDiv.innerText = "🎉 " + data.message;
                    resDiv.style.color = "#00ffcc";
                    fetchLogs();
                } else {
                    resDiv.innerText = "❌ " + data.message;
                    resDiv.style.color = "#ff007f";
                }
            } catch(e) {
                resDiv.innerText = "🚨 Error connecting to Google Apps Script!";
                resDiv.style.color = "#ff007f";
            }
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    return HTML_CONTENT

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
