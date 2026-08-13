import os
import json
import requests
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="🏀 S-Captcha Control Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🎯 তোর অরিজিনাল গুগল অ্যাপস স্ক্রিপ্ট ইউআরএল
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfwklXCDO9rSAaslH1lIYsMllc_sL-0QdhuTvD-TiHPcgo8EkGir3oY82RCRKku-1-/exec"

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>S-Captcha Admin Dashboard</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{ font-family: 'Segoe UI', monospace; background-color: #0a0a12; color: #00ffcc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }}
            .container {{ width: 100%; max-width: 480px; background: #141423; padding: 30px; border-radius: 12px; border: 2px solid #00ffcc; box-shadow: 0 0 25px rgba(0, 255, 204, 0.2); }}
            h1 {{ color: #00ffcc; font-size: 22px; text-align: center; margin-bottom: 5px; text-shadow: 0 0 8px #00ffcc; }}
            p.sub {{ text-align: center; color: #888; font-size: 12px; margin-bottom: 25px; }}
            .form-group {{ margin-bottom: 15px; text-align: left; }}
            label {{ display: block; font-size: 12px; margin-bottom: 6px; color: #ff007f; font-weight: bold; }}
            input {{ width: 100%; padding: 12px; background: #0a0a12; border: 1px solid #ff007f; color: #fff; border-radius: 6px; font-family: monospace; outline: none; }}
            input:focus {{ border-color: #00ffcc; box-shadow: 0 0 8px rgba(0,255,204,0.4); }}
            button {{ width: 100%; padding: 12px; background: #ff007f; color: white; border: none; font-size: 15px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 10px; transition: 0.2s; }}
            button:hover {{ background: #e0006f; box-shadow: 0 0 12px rgba(255, 0, 127, 0.5); }}
            #res {{ margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 6px; text-align: center; display: none; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏀 S-Captcha Control Panel</h1>
            <p class="sub">Domain Verification & IP Unban Engine</p>

            <div class="form-group">
                <label>WEBSITE URL:</label>
                <input type="text" id="siteUrl" placeholder="https://example.com">
            </div>

            <div class="form-group">
                <label>SECRET CODE (from txt file):</label>
                <input type="text" id="secretCode" placeholder="Enter code from s-captcha-755842964.txt">
            </div>

            <div class="form-group">
                <label>TARGET IP TO UNBAN:</label>
                <input type="text" id="targetIp" placeholder="e.g. 103.45.12.89">
            </div>

            <button onclick="unbanIP()">VERIFY & UNBAN IP</button>

            <div id="res"></div>
        </div>

        <script>
            const APPS_SCRIPT_URL = "{APPS_SCRIPT_URL}";

            async function unbanIP() {{
                const resDiv = document.getElementById('res');
                const siteUrl = document.getElementById('siteUrl').value.trim();
                const secretCode = document.getElementById('secretCode').value.trim();
                const targetIp = document.getElementById('targetIp').value.trim();

                if (!siteUrl || !secretCode || !targetIp) {{
                    resDiv.style.display = "block";
                    resDiv.innerText = "❌ সবগুলো ঘর ঠিকমতো পূরণ কর ভাই!";
                    resDiv.style.color = "#ff007f";
                    return;
                }}

                resDiv.style.display = "block";
                resDiv.innerText = "⏳ Verifying domain file & processing...";
                resDiv.style.color = "#00ffcc";

                const payload = {{
                    action: "unban",
                    siteUrl: siteUrl,
                    secretCode: secretCode,
                    ip: targetIp
                }};

                try {{
                    const response = await fetch(APPS_SCRIPT_URL, {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'text/plain' }},
                        body: JSON.stringify(payload)
                    }});
                    
                    const data = await response.json();
                    
                    if(data.status === "success") {{
                        resDiv.innerText = "🎉 " + data.message;
                        resDiv.style.color = "#00ffcc";
                    }} else {{
                        resDiv.innerText = "❌ " + data.message;
                        resDiv.style.color = "#ff007f";
                    }}
                }} catch(e) {{
                    resDiv.innerText = "🚨 Error connecting to Google Apps Script!";
                    resDiv.style.color = "#ff007f";
                }}
            }}
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
