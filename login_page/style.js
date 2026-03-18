let helpPopup;

let loginRoll, loginBatch, loginPassword;
let signupRoll, signupBatch, signupName, signupPassword, signupEmail;

/*************************************************
 * PASSWORD SHOW / HIDE
 *************************************************/
function togglePassword(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const start = input.selectionStart;
  const end   = input.selectionEnd;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  const icon = iconElement.querySelector("i");
  if (icon) {
    icon.classList.toggle("fa-eye", !isHidden);
    icon.classList.toggle("fa-eye-slash", isHidden);
  }

  input.focus();
  input.setSelectionRange(start, end);
}

/************************************************************
 * GOOGLE APPS SCRIPT URL == GLOBAL CONFIG
 ************************************************************/
window.APP_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyangvEJx0w5sCOwuedWgkEynKILbKcLYDvUzX_YPsd3wR4MQAnAsOjhwzjf00Ow1A_JQ/exec",

  ADMIN_HOME: "../admin_page/admin_dashboard.html",
  USER_HOME: "../student_page/student_dashboard.html",
  LOGIN_PAGE: "../login_page/login.html"
};

/*************************************************
 * REGISTER USER
 *************************************************/
function registerUser(e) {

  if (registerUser._busy) return;
  registerUser._busy = true;

  e.preventDefault();

  const msg = document.getElementById("signupErrorMsg");
  const registerBtn = document.getElementById("registerBtn");

  const nameVal  = signupName?.value.trim();
  const rollVal  = signupRoll?.value.trim();
  const batchVal = signupBatch?.value.trim();
  const passVal  = signupPassword?.value;
  const emailVal = signupEmail?.value.trim();

  const release = () => {
    if (registerBtn) registerBtn.disabled = false;
    registerUser._busy = false;
  };

  if (msg) {
    msg.innerText = "";
    msg.style.display = "none";
  }

  if (!nameVal) {
    alert("Please enter your name");
    return release();
  }

  if (!rollVal || !batchVal) {
    alert("Please enter Roll Number and select Batch");
    signupRoll?.focus();
    return release();
  }

  if (!emailVal || !emailVal.includes("@")) {
    alert("Please enter a valid email address");
    signupEmail?.focus();
    return release();
  }

  if (!passVal || passVal.length < 8) {
    alert("Password must be at least 8 characters long");
    signupPassword?.focus();
    return release();
  }

  if (!APP_CONFIG?.WEB_APP_URL) {
    alert("App not configured properly");
    return release();
  }

  if (registerBtn) registerBtn.disabled = true;

  if (msg) {
    msg.innerText = "Registering... please wait";
    msg.style.display = "block";
    msg.style.color = "#00d4ff";
  }

  fetch(APP_CONFIG.WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      action: "register",
      roll: rollVal,
      batch: batchVal,
      name: nameVal,
      password: passVal,
      email: emailVal
    })
  })
  .then(res => res.json())
  .then(data => {

    if (!data || !data.status) {
      throw new Error("Invalid response");
    }

    switch (data.status) {

      case "registered":
        document.querySelector(".auth-wrapper")
          ?.classList.remove("toggled");

        const lr = document.getElementById("loginRoll");
        const lb = document.getElementById("loginBatch");
        const lp = document.getElementById("loginPassword");

        if (lr && lb && lp) {
          lr.value = rollVal;
          lb.value = batchVal;
          lp.focus();
        }

        if (msg) {
          msg.innerText = "✅ Registered successfully. Please login.";
          msg.style.display = "block";
          msg.style.color = "#2ecc71";
        }
        break;

      case "duplicate_roll_batch":
        if (msg) {
          msg.innerText =
            "⚠️ You are already registered.\nPlease login.";
          msg.style.display = "block";
          msg.style.color = "#ffaa00";
        }
        document.querySelector(".auth-wrapper")
          ?.classList.remove("toggled");
        break;

      case "duplicate_email":
        if (msg) {
          msg.innerText =
            "📧 Email already registered.\nUse another email.";
          msg.style.display = "block";
          msg.style.color = "#ff9800";
        }
        signupEmail?.focus();
        break;

      case "invalid_registration":
        alert(
          "Password must contain:\n" +
          "• At least 8 characters\n" +
          "• 1 uppercase letter\n" +
          "• 1 number"
        );
        break;

      case "sheet_not_found":
        alert("⚠️ System maintenance. Try later.");
        break;

      default:
        alert("❌ Something went wrong");
    }

  })
  .catch(err => {
    console.warn("Register Error:", err);
    if (msg) {
      msg.innerText =
        "⚠️ Server error. Please try again.";
      msg.style.display = "block";
      msg.style.color = "#ff6b6b";
    }
  })
  .finally(release);
}

/*************************************************
 * DEFINE => (DEVICE TYPE + BROWSER + OS)
 *************************************************/
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();

  // 📱 Mobile devices (highest priority)
  if (/android|iphone|ipod/.test(ua)) {
    return "Mobile";
  }

  // 📲 Tablets
  if (/ipad/.test(ua)) {
    return "Tablet";
  }

  // 📱 Fallback mobile keyword (webview / some browsers)
  if (ua.includes("mobile")) {
    return "Mobile";
  }

  // 💻 Everything else
  return "Laptop/Desktop";
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "Unknown";
}

function getOS() {
  const ua = navigator.userAgent;

  if (/iphone|ipod/i.test(ua)) return "iOS";

  // iPadOS masquerades as macOS
  if (/ipad/i.test(ua) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "iOS";
  }

  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";

  return "Unknown";
}

/*************************************************
 * LOGIN USER
 *************************************************/
function loginUser(e) {

  if (loginUser._busy) return false;
  loginUser._busy = true;

  e.preventDefault();

  /* ========= DOM CACHE ========= */
  const btn = document.getElementById("loginBtn");
  const msg = document.getElementById("loginErrorMsg");
  const passMsg = document.getElementById("loginPasswordMsg");
  const forgotLink = document.getElementById("forgotPasswordLink");

  const rollVal  = loginRoll?.value.trim();
  const batchVal = loginBatch?.value.trim();
  const passVal  = loginPassword?.value;

  const release = () => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Login";
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }
    loginUser._busy = false;
  };

  /* ========= VALIDATION ========= */
  if (!rollVal || !batchVal || !passVal) {
    release();
    return false;
  }

  /* ========= FAST UI UPDATE (MINIMIZED REFLOW) ========= */
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Logging in...";
    btn.style.cssText += "opacity:0.7;";
  }

  if (passMsg) passMsg.style.display = "none";
  if (forgotLink) forgotLink.style.display = "none";

  /* ========= DEVICE INFO ========= */
  const device  = getDeviceType();
  const browser = getBrowser();
  const os      = getOS();

  /* ========= FETCH ========= */
  fetch(APP_CONFIG.WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      action: "login",
      roll: rollVal,
      batch: batchVal,
      password: passVal,
      device,
      browser,
      os
    })
  })
  .then(res => res.ok ? res.json() : Promise.reject())
  .then(data => {

    if (!data || !data.status) {
      throw new Error("Invalid response");
    }

    const status = data.status;

    /* ================= SUCCESS ================= */
    if (status === "success") {

      const now = Date.now();

      // ⚡ grouped storage (faster execution)
      localStorage.setItem("SESSION", data.sessionToken);
      localStorage.setItem("SESSION_START", now);
      localStorage.setItem("NAME", data.name || "");
      localStorage.setItem("BATCH", data.batch || "");
      localStorage.setItem("ROLE", data.role);

      if (data.role === "student") {
        localStorage.removeItem("EMAIL");
      }

      /* ⚡ FAST NAVIGATION (NO BACK HISTORY) */
      window.location.replace(
        data.role === "admin"
          ? "../admin_page/admin_dashboard.html"
          : "../student_page/student_dashboard.html"
      );

      return;
    }

    /* ================= ERRORS ================= */

    if (!msg) return;

    msg.style.cssText = "display:block;color:#ff6b6b;";

    switch (status) {

      case "roll_not_found":
        msg.textContent =
          "❌ Login failed. Please check your credentials.";
        break;

      case "invalid_batch":
        if (passMsg) {
          passMsg.textContent = "Invalid Batch selected.";
          passMsg.style.display = "block";
        }
        return;

      case "wrong_password":
        msg.style.display = "none";

        if (!passMsg) return;

        if (data.locked === true) {
          passMsg.textContent =
            "❌ Account locked. Please reset your password.";
        }
        else if (data.lastAttempt === true) {
          passMsg.textContent =
            "⚠️ Last attempt! One more wrong password may lock your account.";
        }
        else {
          passMsg.textContent = "❌ Incorrect password.";
        }

        passMsg.style.cssText = "display:block;color:#ff3b3b;";

        if (forgotLink) forgotLink.style.display = "inline-block";
        loginPassword?.classList.add("input-error");
        return;

      case "account_locked":
        msg.textContent =
          "🔒 Account locked. Reset password to continue.";
        if (forgotLink) forgotLink.style.display = "block";
        break;

      case "account_blocked":
        msg.textContent = "⛔ Account blocked by admin.";
        break;

      case "email_missing":
        msg.textContent = "📧 Email not registered.";
        break;

      default:
        msg.textContent =
          "❌ Login failed. Please check your details.";
    }

  })
  .catch(() => {
    if (msg) {
      msg.style.cssText = "display:block;color:#ffaa00;";
      msg.textContent = "⚠️ Server error. Please try again.";
    }
  })
  .finally(release);

  return false;
}

/*************************************************
 * DOM READY
 *************************************************/
document.addEventListener("DOMContentLoaded", function () {

  /* ================= URL MODE ================= */
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  const wrapper = document.querySelector(".auth-wrapper");
  const registerBtn = document.querySelector(".register-trigger");
  const loginTriggerBtn = document.querySelector(".login-trigger");

  if (wrapper) {
    if (mode === "register") wrapper.classList.add("toggled");
    else wrapper.classList.remove("toggled");
  }

  if (registerBtn && wrapper) {
    registerBtn.addEventListener("click", e => {
      e.preventDefault();
      wrapper.classList.add("toggled");
    });
  }

  if (loginTriggerBtn && wrapper) {
    loginTriggerBtn.addEventListener("click", e => {
      e.preventDefault();
      wrapper.classList.remove("toggled");
    });
  }

  /* ================= ELEMENTS ================= */
  loginRoll = document.getElementById("loginRoll");
  loginBatch = document.getElementById("loginBatch");
  loginPassword = document.getElementById("loginPassword");

  signupRoll = document.getElementById("signupRoll");
  signupBatch = document.getElementById("signupBatch");
  signupName = document.getElementById("signupName");
  signupPassword = document.getElementById("signupPassword");
  signupEmail = document.getElementById("signupEmail");

  helpPopup = document.getElementById("helpPopup");
  const helpMenu = document.querySelector(".help-menu");

  if (helpPopup && helpMenu) {
    helpPopup.addEventListener("click", e => e.stopPropagation());
    helpMenu.addEventListener("click", e => e.stopPropagation());
  }

  /* ================= HELPERS ================= */
  const notice = document.getElementById("resetNotice");

  const hideForgot = () => {
    const forgot = document.getElementById("forgotPasswordLink");
    if (forgot) forgot.style.display = "none";
    if (notice) notice.style.display = "none";
  };

  const hidenotice = () => {
    const n = document.getElementById("resetNotice");
    if (n) n.style.display = "none";
  };

  /* ================= INPUT EVENTS ================= */
  if (loginRoll) {
    loginRoll.addEventListener("input", hidenotice);
    loginRoll.addEventListener("input", hideForgot);
    loginRoll.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  if (loginBatch) {
    loginBatch.addEventListener("change", hidenotice);
    loginBatch.addEventListener("change", hideForgot);
  }

  if (loginPassword) {

    loginPassword.addEventListener("focus", hidenotice);
    loginPassword.addEventListener("focus", hideForgot);

    loginPassword.addEventListener("input", () => {

      // 🔥 clear wrong-password UI
      loginPassword.classList.remove("input-error");

      const passMsg = document.getElementById("loginPasswordMsg");
      const msg = document.getElementById("loginErrorMsg");
      if (passMsg) passMsg.style.display = "none";
      if (msg) msg.style.display = "none";

      hideForgot();

      // 👁️ password eye logic (unchanged)
      const eye =
        loginPassword.parentElement.querySelector(".toggle-password");
      if (!eye) return;

      eye.style.display =
        loginPassword.value.length > 0 ? "block" : "none";

      if (loginPassword.type === "text") {
        loginPassword.type = "password";
        eye.querySelector("i")
          ?.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }

  /* ================= SIGNUP VALIDATION ================= */
  if (signupRoll) {
    signupRoll.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  /* ================= STOP BUBBLING ================= */
  const loginForm =
    document.querySelector(".credentials-panel.signin form");

  if (loginForm) {
    loginForm.addEventListener("click", e => e.stopPropagation());
  }

  /* ================= PASSWORD EYE ================= */
  setupPasswordEye("loginPassword");
  setupPasswordEye("signupPassword");

});


/*************************************************
 * FORGOT PASSWORD (EMAIL LINK)
 *************************************************/
function forgotPassword(e) {
  e.preventDefault();
  e.stopPropagation();

  // 🔥 SHOW reset notice (Forgot Password ke niche)
  const notice = document.getElementById("resetNotice");
  if (notice) notice.style.display = "block";

  // ✅ DEFINE VARIABLES
  const roll  = loginRoll.value.trim();
  const batch = loginBatch.value.trim();

  // ✅ VALIDATION
  if (!roll || !batch) {
    alert("⚠️ Please enter Roll Number and select Batch");
    loginRoll.focus();
    return;
  }

  fetch(APP_CONFIG.WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action: "request_password_reset",
      roll: roll,
      batch: batch
    })
  })
  .then(res => res.text())
  .then(text => {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("❌ Invalid server response");
      return;
    }

    if (data.status === "reset_link_sent") {
      alert("✅ Password reset link has been sent to your email.");
    } else if (data.status === "email_not_found") {
      alert("❌ Email not registered. Contact admin.");
    } else if (data.status === "account_blocked") {
      alert("⛔ Account is blocked by admin.");
    } else if (data.status === "wait_before_retry") {
      alert("⏳ Please wait 1 minute before retrying.");
    } else {
      alert("❌ Unable to send reset link.");
    }
  })
  .catch(() => {
    alert("❌ Server error. Try again later.");
  });
}

/********************************************************
 * CLICK OUTSIDE – HIDE ALL ERROR MESSAGES ON ANY CLICK
 ********************************************************/
document.addEventListener("click", function (e) {

  // ❌ login / register button pe click ho to hide mat karo
  if (
    e.target.closest("#loginBtn") ||
    e.target.closest("#registerBtn") ||
    e.target.closest("form") ||
    e.target.closest(".password-eye")   // 👁️ eye pe click ignore
   ) return;


  const ids = [
    "loginErrorMsg",
    "loginPasswordMsg"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

});

/*************************************************
 * HELP POPUP TOGGLE (with Hide)
 *************************************************/

function toggleHelp() {
    const popup = document.getElementById("helpPopup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
}

/* 🔥 LOGIN + REGISTER FORM ke andar kahin bhi click → popup hide */
document.querySelectorAll(".credentials-panel").forEach(panel => {
    panel.addEventListener("click", () => {
        if (helpPopup && helpPopup.style.display === "block") {
           helpPopup.style.display = "none";
        }
    });
});

function setupPasswordEye(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const eye =
    input.parentElement.querySelector(".toggle-password");
  if (!eye) return;

  // start hidden
  eye.style.display = "none";

  input.addEventListener("input", () => {
    if (input.value.length > 0) {
      eye.style.display = "block";   // 👁️ show
    } else {
      eye.style.display = "none";    // ❌ hide
    }

    // agar password visible tha → wapas hide
    if (input.type === "text") {
      input.type = "password";
      eye.querySelector("i")
        ?.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
}


