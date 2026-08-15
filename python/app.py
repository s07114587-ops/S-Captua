// 📥 1. Dashboard Fetcher (doGet)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action;
    var targetSiteUrl = (e.parameter.siteUrl || "").replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();

    if (action === "get_logs") {
      var logs = [];
      var sheetsToSearch = [
        { name: "Ban_Logs", type: "Temporary" },
        { name: "Permanent_Bans", type: "Permanent" }
      ];

      sheetsToSearch.forEach(function(item) {
        var sheet = ss.getSheetByName(item.name);
        if (sheet) {
          var rows = sheet.getDataRange().getValues();
          for (var i = 1; i < rows.length; i++) {
            var dbSiteUrl = (rows[i][0] || "").toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
            if (dbSiteUrl === targetSiteUrl) {
              logs.push({
                type: item.type,
                ipHash: rows[i][1],
                time: String(rows[i][2]).trim()
              });
            }
          }
        }
      });

      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "logs": logs }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "Invalid Action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 📤 2. Dashboard Unban & Ban Receiver (doPost)
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // 🔓 আনব্যান লজিক
    if (data.action === "unban") {
      var cleanSiteUrl = (data.siteUrl || "").replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
      var secretCode = data.secretCode || "";
      var targetTime = (data.banTime || "").trim();

      var foundRow = false;
      var sheetsToSearch = ["Ban_Logs", "Permanent_Bans"];
      var targetSheet = null;
      var targetRowIndex = -1;

      // 🔍 স্টেপ ১: আগে চেক করা URL-এর আন্ডারে ওই Time-এর ব্যান আছে কি না!
      for (var s = 0; s < sheetsToSearch.length; s++) {
        var sheet = ss.getSheetByName(sheetsToSearch[s]);
        if (sheet) {
          var rows = sheet.getDataRange().getValues();
          for (var i = rows.length - 1; i >= 1; i--) {
            var dbSiteUrl = (rows[i][0] || "").toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
            var dbTime = String(rows[i][2]).trim();

            if (dbSiteUrl === cleanSiteUrl && dbTime === targetTime) {
              foundRow = true;
              targetSheet = sheet;
              targetRowIndex = i + 1; // +1 because array index starts at 0, sheet starts at 1
              break;
            }
          }
        }
        if (foundRow) break;
      }

      // যদি ডেটাবেসে না থাকে, এখানেই ব্লক করে দাও!
      if (!foundRow) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "❌ Failed: No matching ban found for this URL and Exact Time!" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }

      // 🔐 স্টেপ ২: যেহেতু ব্যান আছে, এবার ডোমেইন ভেরিফাই করো
      var verificationUrl = "https://" + cleanSiteUrl + "/scaptcha-key-" + secretCode + ".txt";
      var fetchResponse;
      try {
        fetchResponse = UrlFetchApp.fetch(verificationUrl, { muteHttpExceptions: true });
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "🚨 Domain Verification Failed: Could not access txt file!" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }

      if (fetchResponse.getContentText().trim() !== secretCode) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "🚨 Security Error: Secret key mismatch in txt file!" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }

      // 🗑️ স্টেপ ৩: সব ভেরিফিকেশন পাস! এবার আনব্যান করো (Delete Row)
      targetSheet.deleteRow(targetRowIndex);
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "🎉 SUCCESS: IP Unbanned successfully!" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // 🔒 সাধারণ ব্যান সেভ করার লজিক
    var cleanSiteUrl = (data.website_url || "unknown").replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
    var rawIp = data.ip || "0.0.0.0";
    var banType = data.ban_type || "temporary";

    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawIp, Utilities.Charset.UTF_8);
    var encryptedIp = rawHash.map(function(b) { return ("0" + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join("");
    var formattedTime = new Date().toISOString(); 

    var sheetName = banType === "permanent" ? "Permanent_Bans" : "Ban_Logs";
    var targetLogSheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    targetLogSheet.appendRow([cleanSiteUrl, encryptedIp, formattedTime]);

    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Ban Saved" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
