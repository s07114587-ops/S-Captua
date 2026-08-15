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
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Consolas', 'Segoe UI', monospace; }
        body { 
            background-color: #05050a; 
            color: #00ffcc; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            padding: 20px;
            background-image: radial-gradient(#141428 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .container { 
            width: 100%; 
            max-width: 600px; 
            background: rgba(20, 20, 35, 0.85); 
            backdrop-filter: blur(10px);
            padding: 30px; 
            border-radius: 16px; 
            border: 1px solid #00ffcc; 
            box-shadow: 0 0 30px rgba(0, 255, 204, 0.15), inset 0 0 15px rgba(0, 255, 204, 0.05); 
        }
        
        .header { text-align: center; margin-bottom: 25px; }
        h1 { color: #00ffcc; font-size: 24px; text-shadow: 0 0 10px #00ffcc; letter-spacing: 1px; }
        p.sub { color: #ff007f; font-size: 11px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; }
        
        .status-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 11px;
            color: #888;
            margin-bottom: 20px;
            background: #0a0a14;
            padding: 6px;
            border-radius: 20px;
            border: 1px solid #222;
        }
        .dot { width: 8px; height: 8px; background: #00ffcc; border-radius: 50%; box-shadow: 0 0 8px #00ffcc; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

        .box { 
            background: #0a0a14; 
            border: 1px solid #1f1f3a; 
            padding: 18px; 
            border-radius: 10px; 
            margin-bottom: 20px; 
            transition: 0.3s;
        }
        .box:hover { border-color: #ff007f; box-shadow: 0 0 15px rgba(255, 0, 127, 0.2); }
        .box h3 { font-size: 13px; color: #ff007f; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        
        .form-group { margin-bottom: 12px; text-align: left; }
        label { display: block; font-size: 10px; margin-bottom: 5px; color: #00ffcc; font-weight: bold; letter-spacing: 1px; }
        input { 
            width: 100%; 
            padding: 11px; 
            background: #141426; 
            border: 1px solid #2a2a4a; 
            color: #fff; 
            border-radius: 6px; 
            outline: none; 
            font-size: 12px;
            transition: 0.2s;
        }
        input:focus { border-color: #00ffcc; box-shadow: 0 0 8px rgba(0, 255, 204, 0.3); }
        
        button { 
            width: 100%; 
            padding: 12px; 
            background: linear-gradient(45deg, #ff007f, #b30059); 
            color: white; 
            border: none; 
            font-size: 12px; 
            font-weight: bold; 
            border-radius: 6px; 
            cursor: pointer; 
            transition: 0.2s; 
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        button:hover { opacity: 0.9; box-shadow: 0 0 12px rgba(255, 0, 127, 0.6); transform: translateY(-1px); }
        
        .gen-btn { background: linear-gradient(45deg, #00ffcc, #00997a); color: #000; }
        .gen-btn:hover { box-shadow: 0 0 12px rgba(0, 255, 204, 0.6); }

        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
        th, td { padding: 10px; border-bottom: 1px solid #1f1f3a; text-align: left; word-break: break-all; }
        th { color: #ff007f; border-bottom: 2px solid #ff007f; font-size: 10px; text-transform: uppercase; }
        
        #genResult { margin-top: 12px; font-size: 12px; background: #000; padding: 12px; border-radius: 6px; border: 1px dashed #00ffcc; display: none; text-align: center; }
        #res { margin-top: 15px; font-weight: bold; padding: 12px; border-radius: 6px; text-align: center; display: none; font-size: 12px; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ S-CAPTCHA ENGINE</h1>
            <p class="sub">Dynamic Verification & Live Firewall Control</p>
        </div>

        <div class="status-bar">
            <div class="dot"></div>
            <span>FASTAPI SERVER ACTIVE & CONNECTED TO GAS</span>
        </div>

        <!-- SECTION 1: CODE GENERATOR -->
        <div class="box">
            <h3>🔑 1. Generate Domain Verification Key</h3>
            <button class="gen-btn" onclick="generateCode()">Generate Verification File</button>
            <div id="genResult">
                <p style="color:#888; font-size:10px; margin-bottom:5px;">Upload a file with this EXACT name to your website root folder:</p>
                <p id="secretOutput" style="color:#00ffcc; font-weight:bold; font-size:13px; background:#141426; padding:8px; border-radius:4px; border:1px solid #00ffcc;"></p>
            </div>
        </div>

        <!-- SECTION 2: LIVE BAN LOGS -->
        <div class="box">
            <h3>📊 2. Live Database Ban Logs</h3>
            <div class="form-group">
                <label>WEBSITE DOMAIN URL:</label>
                <input type="text" id="checkSiteUrl" placeholder="https://yourdomain.com">
            </div>
            <button class="gen-btn" onclick="fetchLogs()">Fetch Real-Time Logs</button>
            
            <div id="logsTableContainer" style="display:none; margin-top:15px;">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Encrypted Hash (SHA-256)</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody"></tbody>
                </table>
            </div>
        </div>

        <!-- SECTION 3: UNBAN FORM -->
        <div class="box">
            <h3>🔓 3. Domain Auth & IP Unban</h3>
            <div class="form-group">
                <label>TARGET WEBSITE URL:</label>
                <input type="text" id="siteUrl" placeholder="https://yourdomain.com">
            </div>

            <div class="form-group">
                <label>DYNAMIC SECRET KEY (12 CHARS):</label>
                <input type="text" id="secretCode" placeholder="Paste generated key string">
            </div>

            <div class="form-group">
                <label>TARGET IP ADDRESS TO UNBAN:</label>
                <input type="text" id="targetIp" placeholder="e.g. 103.45.12.89">
            </div>

            <button onclick="unbanIP()">VERIFY DOMAIN & UNBAN NOW</button>
        </div>

        <div id="res"></div>
    </div>

    <script>
        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsnnrJMh5Svw378pmlwqaKNz2HHuw5r2hbuzFDWAgeGNd0ctw3mPf-sbvGOrIC5HcE/exec";

        function generateCode() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randomKey = '';
            for (let i = 0; i < 12; i++) {
                randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            document.getElementById('secretOutput').innerText = "scaptcha-key-" + randomKey + ".txt";
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

            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#00ffcc;'>⏳ Fetching live logs...</td></tr>";
            container.style.display = "block";

            try {
                // GET Request handling
                const response = await fetch(`${APPS_SCRIPT_URL}?action=get_logs&siteUrl=${encodeURIComponent(siteUrl)}`, {
                    method: 'GET',
                    redirect: 'follow'
                });
                
                const data = await response.json();

                tbody.innerHTML = "";
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => {
                        const isPerm = log.type === 'Permanent';
                        const badgeColor = isPerm ? '#ff007f' : '#00ffcc';
                        const row = `<tr>
                            <td style="color:${badgeColor}; font-weight:bold;">${log.type}</td>
                            <td style="font-size:10px; color:#aaa;">${log.ip}</td>
                            <td style="color:#888;">${log.time}</td>
                        </tr>`;
                        tbody.innerHTML += row;
                    });
                } else {
                    tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#888;'>No active bans found for this site! 🎉</td></tr>";
                }
            } catch(e) {
                tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#ff007f;'>🚨 Failed to load logs! GAS API error.</td></tr>";
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
                resDiv.style.border = "1px solid #ff007f";
                resDiv.style.background = "#1a000d";
                return;
            }

            resDiv.style.display = "block";
            resDiv.innerText = "⏳ Verifying domain file & executing unban action...";
            resDiv.style.color = "#00ffcc";
            resDiv.style.border = "1px solid #00ffcc";
            resDiv.style.background = "#001a14";

            const payload = {
                action: "unban",
                siteUrl: siteUrl,
                secretCode: secretCode,
                ip: targetIp
            };

            try {
                // Handling POST with redirect & text mode for Apps Script
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload),
                    redirect: 'follow'
                });
                
                const data = await response.json();
                
                if(data.status === "success") {
                    resDiv.innerText = "🎉 SUCCESS: " + data.message;
                    resDiv.style.color = "#00ffcc";
                    resDiv.style.border = "1px solid #00ffcc";
                    document.getElementById('checkSiteUrl').value = siteUrl;
                    fetchLogs();
                } else {
                    resDiv.innerText = "❌ FAILED: " + data.message;
                    resDiv.style.color = "#ff007f";
                    resDiv.style.border = "1px solid #ff007f";
                }
            } catch(e) {
                resDiv.innerText = "🚨 Connection Error! Google Apps Script not responding.";
                resDiv.style.color = "#ff007f";
                resDiv.style.border = "1px solid #ff007f";
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
