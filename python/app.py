import streamlit as st
import requests
import json

# ড্যাশবোর্ডের ডিজাইন ও টাইটেল
st.set_page_config(page_title="S-Captcha Admin", page_icon="🏀")
st.title("🏀 S-Captcha Control Panel")
st.caption("Domain Ownership Verification & IP Unban System")
st.markdown("---")

# ইনপুট নেওয়ার ঘরগুলো
script_url = st.text_input("Google Apps Script URL (Web App URL):")
site_url = st.text_input("Website URL (e.g., https://example.com):")
secret_code = st.text_input("Secret Code (from s-captcha-755842964.txt):")
target_ip = st.text_input("IP Address to Unban:")

# আনব্যান বাটন
if st.button("Verify & Unban IP", type="primary"):
    # চেক করা হচ্ছে সব ঘর পূরণ করা হয়েছে কি না
    if not script_url or not site_url or not secret_code or not target_ip:
        st.error("⚠️ সবগুলো ঘর ঠিকমতো পূরণ কর ভাই!")
    else:
        payload = {
            "action": "unban",
            "siteUrl": site_url,
            "secretCode": secret_code,
            "ip": target_ip
        }
        
        with st.spinner("ভেরিফাই আর আনব্যান করা হচ্ছে... একটু দাঁড়া!"):
            try:
                # Google Apps Script-এ ডেটা পাঠানো
                response = requests.post(script_url, data=json.dumps(payload))
                data = response.json()
                
                # রেজাল্ট দেখানো
                if data.get("status") == "success":
                    st.success(f"🎉 {data.get('message')}")
                else:
                    st.error(f"❌ {data.get('message')}")
            except Exception as e:
                st.error("⚠️ সার্ভারে রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে! URL ঠিক আছে কিনা চেক কর।")
