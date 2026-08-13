import os
import json
import requests
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="🏀 S-Captcha Admin Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🌐 HTML & CSS ইনজেক্ট করে বানানো Single-Page Dashboard
@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>S-Captcha Control Panel</title>
        <style>
            body { font-family: 'Segoe UI', monospace; background-color: #0a0a12; color: #00ffcc; padding: 40px; text-align: center; }
            .container { max-width: 500px; margin: auto; background: #141423; padding: 30px; border-radius: 12px; border: 2px solid #00ffcc; box-shadow: 0 0 20px rgba(0, 255, 204, 0.2); }
            h1 { color: #00ffcc; font-size: 22px; margin-bottom: 20px; }
            input { width: 100%; padding: 12px; margin: 8px 0; background: #0a0a12; border: 1px solid #ff007f; color: #fff; border-radius: 6px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #ff007f; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 10px; }
            button:hover { background: #e0006f; }
            #res { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 6px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏀 S-Captcha Admin Dashboard</h1>
            <input type="text" id="scriptUrl" placeholder="Google Apps Script Web App URL">
            <input type="text" id="siteUrl" placeholder="Website URL (e.g., https://site.com)">
            <input type="text" id="secretCode" placeholder="Secret Code (from txt file)">
            <input type="text" id="targetIp" placeholder="IP Address to Unban">
            <button onclick="unban()">Verify & Unban IP</button>
            <div id="res"></div>
        </div>

        <script>
            async function unban() {
                const resDiv = document.getElementById('res');
                resDiv.innerText = "Processing...";
                resDiv.style.color = "#00ffcc";

                const payload = {
                    action: "unban",
                    siteUrl: document.getElementById('siteUrl').value,
                    secretCode: document.getElementById('secretCode').value,
                    ip: document.getElementById('targetIp').value
                };

                try {
                    const response = await fetch(document.getElementById('scriptUrl').value, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();
                    
                    if(data.status === "success") {
                        resDiv.innerText = "✅ " + data.message;
                        resDiv.style.color = "#00ffcc";
                    } else {
                        resDiv.innerText = "❌ " + data.message;
                        resDiv.style.color = "#ff007f";
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
