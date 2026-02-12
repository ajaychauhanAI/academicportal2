/*************************************************
 * admin-common.js
 * COMMON FOR ALL ADMIN PAGES (FINAL FIXED)
 *************************************************/

const APP_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyangvEJx0w5sCOwuedWgkEynKILbKcLYDvUzX_YPsd3wR4MQAnAsOjhwzjf00Ow1A_JQ/exec"
};

function handleAdminSoftFail(res) {

  if (res?.__rateLimited) {
    alert("⏳ Too many requests. Please wait a few seconds.");
    return true;
  }

  if (res?.__network) {
    alert("🌐 Network error. Check your internet.");
    return true;
  }

  if (res?.__httpError) {
    alert("⚠️ Server error. Try again.");
    return true;
  }

  if (res?.__aborted) {
    alert("⌛ Request timeout. Please retry.");
    return true;
  }

  if (res?.__softFail) {
    alert("⚠️ Operation failed. Please try again.");
    return true;
  }

  return false; // all good
}

/* =========================
   🚪 CENTRAL LOGOUT (SAFE)
========================= */
function adminLogout() {

  const token = localStorage.getItem("SESSION");

  if (token) {
    navigator.sendBeacon(
      APP_CONFIG.WEB_APP_URL,
      new URLSearchParams({
        action: "logout",
        sessionToken: token
      })
    );
  }

  localStorage.clear();
  window.top.location.replace("../login_page/login.html");
}

/* =========================
   🔁 COMMON ADMIN FETCH
   ❗ ONLY AUTH FAILURES CAN LOGOUT
========================= */

/* 🌐 GLOBAL RATE-LIMIT COOLDOWN */
let __RATE_LIMITED_UNTIL__ = 0;

async function adminFetch(params = {}, json = false, options = {}) {

  const { timeout = 15000, silent = false } = options;

  /* ⛔ RATE-LIMIT GUARD */
  if (Date.now() < __RATE_LIMITED_UNTIL__) {
    return { __rateLimited: true };
  }

  /* 🔐 SESSION CHECK */
  const token = localStorage.getItem("SESSION");
  if (!token) {
    adminLogout();
    throw new Error("NO_SESSION");
  }

  /* ⏱️ ABORT CONTROLLER */
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(APP_CONFIG.WEB_APP_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": json
          ? "application/json"
          : "application/x-www-form-urlencoded"
      },
      body: json
        ? JSON.stringify({ ...params, sessionToken: token })
        : new URLSearchParams({ ...params, sessionToken: token })
    });

    clearTimeout(timer);

    /* ❌ HTTP ERROR (SAFE FAIL) */
    if (!res.ok) {
      if (!silent) console.warn("adminFetch HTTP error:", res.status);
      return { __httpError: res.status };
    }

    const text = await res.text();
    if (!text) return { __empty: true };

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { __invalid: true };
    }

    /* 🔐 AUTH FAILURE (ONLY LOGOUT CASE) */
    if (data.status === "unauthorized" || data.status === "expired") {
      adminLogout();
      throw new Error("SESSION_EXPIRED");
    }

    /* ⚠️ NON-OK STATUS (SOFT FAIL)
       🔥 FIX: treat valid success states as success */
    const SUCCESS_STATUSES = ["ok", "uploaded", "updated", "deleted"];

    if (data.status && !SUCCESS_STATUSES.includes(data.status)) {

      if (data.status === "rate_limited") {
        __RATE_LIMITED_UNTIL__ = Date.now() + 30000; // 30s cooldown
        return { __rateLimited: true };
      }

      if (!silent) {
        console.warn("adminFetch abnormal status:", data.status, data);
      }
      return { __softFail: true, raw: data };
    }

    /* ✅ SUCCESS */
    return data;

  } catch (err) {

    clearTimeout(timer);

    /* ⏱️ TIMEOUT */
    if (err.name === "AbortError") {
      if (!silent) console.warn("adminFetch timeout / aborted");
      return { __aborted: true };
    }

    /* 🔐 REAL SESSION ERRORS */
    if (err.message === "NO_SESSION" || err.message === "SESSION_EXPIRED") {
      throw err;
    }

    /* 🌐 NETWORK / GAS BUSY */
    if (!silent) console.warn("adminFetch network issue:", err);
    return { __network: true };
  }
}

/* =========================
   🔐 VERIFY SESSION (ENTRY POINT)
   👉 CALL ON PAGE LOAD
========================= */
async function verifySession(requiredRole = null) {

  /* =========================
     🔐 1. SESSION TOKEN CHECK
     (REAL no-session only)
  ========================= */
  const token = localStorage.getItem("SESSION");
  if (!token) {
    adminLogout();
    throw new Error("NO_SESSION");
  }

  let data;

  try {
    /* =========================
       🌐 2. BACKEND VERIFY CALL
    ========================= */
    const res = await fetch(APP_CONFIG.WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        action: "verify_session",
        sessionToken: token
      })
    });

    /* =========================
       ❌ HTTP ERROR → TEMP FAIL
       (NO LOGOUT)
    ========================= */
    if (!res.ok) {
      console.warn("verifySession HTTP error:", res.status);
      throw new Error("VERIFY_TEMP_FAILED");
    }

    const text = await res.text();

    /* =========================
       ❌ EMPTY RESPONSE → TEMP FAIL
       (Apps Script busy case)
    ========================= */
    if (!text) {
      console.warn("verifySession empty response");
      throw new Error("VERIFY_TEMP_FAILED");
    }

    try {
      data = JSON.parse(text);
    } catch {
      console.warn("verifySession invalid JSON");
      throw new Error("VERIFY_TEMP_FAILED");
    }

  } catch (err) {
    /* =========================
       🌐 NETWORK / GAS / PARSE
       → NEVER LOGOUT
    ========================= */
    console.warn("verifySession skipped:", err);
    throw new Error("VERIFY_TEMP_FAILED");
  }

  /* =========================
     ⛔ 3. REAL AUTH FAILURE
     (ONLY PLACE FOR LOGOUT)
  ========================= */
  if (
    data?.status === "expired" ||
    data?.status === "unauthorized"
  ) {
    adminLogout();
    throw new Error("SESSION_EXPIRED");
  }

  /* =========================
     ⚠️ ANY OTHER STATUS
     → TEMP FAILURE (SAFE)
  ========================= */
  if (data?.status !== "ok") {
    console.warn("verifySession abnormal status:", data?.status);
    throw new Error("VERIFY_TEMP_FAILED");
  }

  /* =========================
     🛡️ 4. ROLE CHECK (SOFT)
     ❗ NO LOGOUT
  ========================= */
  if (requiredRole && data.role !== requiredRole) {
    console.warn(
      "verifySession role mismatch:",
      data.role,
      "required:",
      requiredRole
    );
    throw new Error("ROLE_MISMATCH");
  }

  /* =========================
     🔄 5. SYNC TRUSTED DATA
     (BACKEND = SOURCE OF TRUTH)
  ========================= */
  if (typeof data.loginTime === "number") {
    localStorage.setItem(
      "SESSION_START",
      String(data.loginTime)
    );
  }

  if (data.batch) {
    localStorage.setItem("BATCH", data.batch);
  }

  if (data.email) {
    localStorage.setItem("EMAIL", data.email);
  }

  /* =========================
     ✅ 6. VERIFIED SESSION
  ========================= */
  return data;
}

/* =========================
   🕒 DATE / TIME HELPERS
========================= */
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatTime(t) {
  if (!t) return "";
  return new Date(t).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

/* =========================
   🔁 ADMIN HEARTBEAT (FINAL)
   👉 Session validity check ONLY
   ❌ SESSION_START yahan touch nahi hoga
========================= */
setInterval(() => {
  const token = localStorage.getItem("SESSION");

  // 🔐 No session = nothing to do
  if (!token) return;

  fetch(APP_CONFIG.WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action: "admin_heartbeat",
      sessionToken: token
    })
  })
  .then(res => {
    // ❌ invalid / empty response → ignore
    if (!res.ok) return null;
    return res.json().catch(() => null);
  })
  .then(data => {

    // 🔴 REAL session invalidation only
    if (
      data?.status === "expired" ||
      data?.status === "unauthorized" ||
      data?.status === "invalid"
    ) {
      adminLogout();
    }

    // ❌ yahan SESSION_START / ROLE kuch bhi touch nahi karna
  })
  .catch(() => {
    // 🌐 network / GAS busy → ignore silently
  });

}, 60000); // ⏱️ every 60 seconds
