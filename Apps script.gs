// =============================================================================
// S-Captcha Sheets backend v2
// - doPost: logs bans (temporary -> Ban_Logs, permanent -> Permanent_Bans)
// - doGet:  answers "is this IP currently banned?" for the widget's
//           cross-device / cleared-storage check
// - autoClean12HourBans: deletes Ban_Logs rows older than 12h (needs an
//   installable time-driven trigger — see note at the bottom)
// =============================================================================

// IPs that are never banned and never logged, regardless of what the
// client sends. Static fallbacks — the primary source of truth is the
// dynamic DNS hostname below, which tracks the owner's current IP even
// if it changes (unlike a hardcoded address).
var WHITELIST_STATIC_IPS = [];
var WHITELIST_HOST = "s-ip.duckdns.org";
var WHITELIST_CACHE_KEY = "scaptcha_whitelist_ips_v1";
var WHITELIST_CACHE_TTL_SEC = 300; // re-resolve every 5 min

function resolveWhitelistIps_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(WHITELIST_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  var ips = [];
  ["A", "AAAA"].forEach(function (type) {
    try {
      var resp = UrlFetchApp.fetch(
        "https://dns.google/resolve?name=" + encodeURIComponent(WHITELIST_HOST) + "&type=" + type,
        { muteHttpExceptions: true }
      );
      var body = JSON.parse(resp.getContentText());
      if (body && body.Answer) {
        body.Answer.forEach(function (a) { if (a.data) ips.push(a.data); });
      }
    } catch (e) {
      // DNS lookup failed — fall through with whatever we already have
    }
  });
  ips = ips.concat(WHITELIST_STATIC_IPS);
  cache.put(WHITELIST_CACHE_KEY, JSON.stringify(ips), WHITELIST_CACHE_TTL_SEC);
  return ips;
}

function isWhitelistedIp_(rawIp) {
  return resolveWhitelistIps_().indexOf(rawIp) !== -1;
}

function hashIp_(rawIp) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawIp, Utilities.Charset.UTF_8);
  return rawHash.map(function (b) {
    var v = (b < 0) ? (b + 256) : b;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 1. Logging endpoint — called by the widget when a ban is triggered.
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    var siteUrl = data.website_url || "unknown";
    var rawIp = data.ip || "0.0.0.0";
    var banType = data.ban_type || "temporary"; // "temporary" or "permanent"

    if (isWhitelistedIp_(rawIp)) {
      return json_({ status: "success", message: "Whitelisted IP — not logged" });
    }

    var encryptedIp = hashIp_(rawIp);
    var now = new Date();
    var formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    if (banType === "permanent") {
      var permSheet = ss.getSheetByName("Permanent_Bans") || ss.insertSheet("Permanent_Bans");
      permSheet.appendRow([siteUrl, encryptedIp, formattedTime]);
    } else {
      var tempSheet = ss.getSheetByName("Ban_Logs") || ss.insertSheet("Ban_Logs");
      tempSheet.appendRow([siteUrl, encryptedIp, formattedTime]);
    }

    return json_({ status: "success", message: "Saved to DB" });
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

// 2. Check endpoint — called by the widget on page load with ?action=check&ip=...
//    GET is used deliberately so the browser can call it with no custom
//    headers, avoiding a CORS preflight that Apps Script won't answer.
function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action !== "check") {
      return json_({ status: "error", message: "unknown action" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rawIp = e.parameter.ip || "0.0.0.0";

    if (isWhitelistedIp_(rawIp)) {
      return json_({ status: "clear" });
    }

    var encryptedIp = hashIp_(rawIp);

    var permSheet = ss.getSheetByName("Permanent_Bans");
    if (permSheet) {
      var permData = permSheet.getDataRange().getValues();
      for (var i = 1; i < permData.length; i++) {
        if (permData[i][1] === encryptedIp) {
          return json_({ status: "banned", tier: "permanent" });
        }
      }
    }

    var tempSheet = ss.getSheetByName("Ban_Logs");
    if (tempSheet) {
      var tempData = tempSheet.getDataRange().getValues();
      var now = new Date().getTime();
      var twelveHoursInMs = 12 * 60 * 60 * 1000;
      for (var j = 1; j < tempData.length; j++) {
        if (tempData[j][1] === encryptedIp) {
          var banTime = new Date(tempData[j][2]).getTime();
          if (now - banTime < twelveHoursInMs) {
            return json_({ status: "banned", tier: "tier2", banned_at: tempData[j][2] });
          }
        }
      }
    }

    return json_({ status: "clear" });
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

// 3. Cleanup — deletes Ban_Logs rows older than 12h so the sheet (and the
//    doGet scan above) doesn't grow forever.
//    IMPORTANT: this only runs when something calls it. In the Apps Script
//    editor: Triggers (clock icon) -> Add Trigger -> function:
//    autoClean12HourBans -> Time-driven -> Hour timer -> Every hour -> Save.
function autoClean12HourBans() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tempSheet = ss.getSheetByName("Ban_Logs");
  if (!tempSheet) return;
  var data = tempSheet.getDataRange().getValues();
  var now = new Date().getTime();
  var twelveHoursInMs = 12 * 60 * 60 * 1000;
  for (var i = data.length - 1; i >= 1; i--) {
    var banTime = new Date(data[i][2]).getTime();
    if (now - banTime > twelveHoursInMs) {
      tempSheet.deleteRow(i + 1);
    }
  }
}
