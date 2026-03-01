/*************************************************
 * STUDENT COMMON JS — FINAL STABLE VERSION
 * LOGIC UNCHANGED, ONLY BUGS + CONFLICTS FIXED
 *************************************************/

/* =========================
   GLOBAL CONFIG
========================= */
window.APP_CONFIG = window.APP_CONFIG || {
  WEB_APP_URL:
    "https://script.google.com/macros/s/AKfycbyangvEJx0w5sCOwuedWgkEynKILbKcLYDvUzX_YPsd3wR4MQAnAsOjhwzjf00Ow1A_JQ/exec"
};

/* =========================
   SESSION HELPERS (SINGLE SOURCE)
========================= */
function getSessionToken() {
  return (
    localStorage.getItem("SESSION") ||
    localStorage.getItem("SESSION_TOKEN")
  );
}

function clearStudentSession() {
  localStorage.removeItem("SESSION");
  localStorage.removeItem("SESSION_TOKEN");
  localStorage.removeItem("ROLE");
  localStorage.removeItem("NAME");
  localStorage.removeItem("BATCH");
}

function logout() {
  localStorage.removeItem("SESSION");
  localStorage.removeItem("SESSION_TOKEN");
  localStorage.removeItem("NAME");
  localStorage.removeItem("BATCH");
  localStorage.removeItem("ROLE");
  window.location.replace("../login_page/login.html");
}

function studentFetch(payload) {
  const body = new URLSearchParams();

  Object.entries(payload).forEach(([k, v]) => {
    body.append(k, v);
  });

  return fetch(APP_CONFIG.WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  }).then(res => res.json());
}

/* =========================
   STATE
========================= */
let allContent = [];
let dashboardSummary = {};

/* =========================
   MAIN BOOTSTRAP (SINGLE ENTRY)
========================= */
document.addEventListener("DOMContentLoaded", async () => {

  try {

    const token = getSessionToken();

    if (!token) {
      window.location.replace("../login_page/login.html");
      return;
    }

    /* =========================
       🚀 INSTANT UI RENDER
    ========================= */
    initSidebar();
    renderUserInfo();
    startClock();
    renderGreeting();
    resetStudentSummary();
    showDashboard();   // show UI immediately

    /* =========================
       📡 LOAD DATA (ASYNC)
    ========================= */
    const data = await loadDashboardData();

    if (!data || data.status !== "ok") {
      showEmptyDashboard();
      return;
    }

    /* =========================
       🧠 SAFE DATA STORE
    ========================= */
    allContent = Array.isArray(data.content)
      ? data.content
      : [];

    dashboardSummary = data.summary || {};

    /* =========================
       📊 UPDATE SUMMARY (SAFE)
    ========================= */
    setText("totalNotes", dashboardSummary.notes);
    setText("totalAssignments", dashboardSummary.assignments);
    setText("pendingAssignments", dashboardSummary.pending);
    setText("expiredAssignments", dashboardSummary.expired);
    setText("totalPyq", dashboardSummary.pyq);
    setText("totalMessages", dashboardSummary.messages);

    /* =========================
       ⚡ NON-BLOCKING RENDER
    ========================= */
    requestAnimationFrame(() => {
      renderNews();
      renderUpcomingDeadlines();
      renderSubjectProgress();
      updateNewsBadge();
    });

  } catch (err) {

    console.error("❌ Dashboard initialization failed:", err);
    showEmptyDashboard();

  }

});

function showEmptyDashboard() {
  resetView();
  show("#contentGrid", "grid");

  const grid = document.getElementById("contentGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="content-card" style="text-align:center">
        <h3>📭 No content available</h3>
        <p style="color:#64748b">
          Please refresh or try again later.
        </p>
      </div>
    `;
  }
}

function initSidebar() {

  const sidebar   = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const overlay   = document.querySelector(".sidebar-overlay");
  const closeBtn  = document.querySelector(".close-btn");

  if (!sidebar || !toggleBtn) return;

  /* ===============================
     OPEN SIDEBAR
  =============================== */
  const open = () => {

    sidebar.classList.add("open");
    overlay?.classList.add("show");

    // 🔥 Lock background scroll properly
    document.body.classList.add("sidebar-open");
    document.documentElement.style.overflow = "hidden";

  };

  /* ===============================
     CLOSE SIDEBAR
  =============================== */
  const close = () => {

    sidebar.classList.remove("open");
    overlay?.classList.remove("show");

    document.body.classList.remove("sidebar-open");
    document.documentElement.style.overflow = "";

  };

  /* ===============================
     BUTTON EVENTS
  =============================== */
  toggleBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);

  /* ===============================
     AUTO CLOSE ON MOBILE NAV CLICK
  =============================== */
  sidebar.querySelectorAll(".nav a").forEach(a => {

    a.addEventListener("click", () => {
      if (window.innerWidth <= 900) close();
    });

    a.addEventListener("click", function () {
      sidebar.querySelectorAll(".nav a.active")
        .forEach(el => el.classList.remove("active"));
      this.classList.add("active");
    });

  });

  /* ===============================
     🔥 MOBILE TOUCH SCROLL FIX
  =============================== */
  sidebar.addEventListener("touchmove", function (e) {
    e.stopPropagation();
  }, { passive: true });

}

/* =========================
   VIEW CONTROL
========================= */
const DEBUG = false; // 🔁 sirf yahan true/false karo

async function loadDashboardData() {
  const token = getSessionToken();

  if (DEBUG) {
    console.log("🧪 SESSION TOKEN:", token);
    console.log("🧪 ROLE:", localStorage.getItem("ROLE"));
  }

  const res = await studentFetch({
    action: "student_dashboard",
    sessionToken: token
  });

  if (DEBUG) {
    console.log("🧪 DASHBOARD RESPONSE:", res);
  }

  if (res?.status === "unauthorized") {
    alert("Session expired");
    logout();
    return null;
  }

  return res;
}

function renderAssignments() {
  resetView();
  show("#contentGrid", "grid");
  setPageTitle("Assignments", "📘");

  const list = allContent.filter(
    c => safeType(c.type) === "ASSIGNMENT"
  );

  renderContent(list);
}

function renderNotes() {
  resetView();
  show("#contentGrid", "grid");
  setPageTitle("Notes", "📝");

  const list = allContent.filter(
    c => safeType(c.type) === "NOTES"
  );

  renderContent(list);
}

function renderPYQ() {
  resetView();
  show("#contentGrid", "grid");
  setPageTitle("Previous Year Questions", "📂");

  const list = allContent.filter(
    c => safeType(c.type) === "PYQ"
  );

  renderContent(list);
}

function resetView() {
  hide(".cards");
  hide("#contentGrid");
  hide("#subjectTabs");
  hide("#newsSection");
  hide("#subjectProgress");
  hide("#deadlineBox");
  hide(".quick-actions");   // ✅ ADD THIS
}

function showDashboard() {
  resetView();
  show(".cards", "grid");
  show(".quick-actions", "block");  // ✅ ADD THIS
  show("#newsSection", "block");
  show("#subjectProgress", "block");
  show("#deadlineBox", "block");
  
  setPageTitle("Student Dashboard Overview", "📊");
}

function renderUserInfo() {
  const name  = localStorage.getItem("NAME")  || "Student";
  const batch = localStorage.getItem("BATCH") || "";
  const role  = localStorage.getItem("ROLE")  || "";

  document.getElementById("studentName").innerText = name;
  document.getElementById("studentBatch").innerText =
    `${batch} • ${role}`;
  document.getElementById("avatar").innerText =
    name.charAt(0).toUpperCase();
}

/* =========================
   CONTENT RENDER
========================= */
function renderContent(list = []) {
  const grid = document.getElementById("contentGrid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `
      <div class="content-card empty">
        <h3>📭 No content yet</h3>
        <p>New items will appear here.</p>
      </div>`;
    return;
  }

  let html = "";

  list.forEach(i => {

    const type = safeType(i.type);
    const isAssignment = type === "ASSIGNMENT";

    const isResource =
      type === "ACADEMIC_CALENDAR" ||
      type === "SYLLABUS" ||
      type === "HOLIDAY_LIST";

    /* ===================================================
       🎓 ACADEMIC RESOURCE CARD (Premium Layout)
    =================================================== */
    if (isResource) {

      const icon =
        type === "ACADEMIC_CALENDAR" ? "📅" :
        type === "SYLLABUS" ? "📚" :
        "🏖";

      html += `
        <div class="resource-file-card">

          <div class="rf-header">
            <div class="rf-icon">${icon}</div>

            <div class="rf-info">
              <h3>${escapeHTML(i.title || "Untitled")}</h3>
              <div class="rf-meta">
                ${formatDateTime(i.date || i.uploadDate, i.time || i.uploadTime, i.uploadedAtTs)}
              </div>
            </div>
          </div>

          <div class="rf-actions">
            ${
              i.fileUrl
                ? `
                  <a href="${sanitizeURL(i.fileUrl)}"
                     target="_blank"
                     class="rf-view"
                     onclick="trackView('${i.id}')">
                     View
                  </a>

                  <a href="#"
                     class="rf-download"
                     onclick="return trackDownload(event,'${sanitizeURL(i.fileUrl)}','${i.id}')">
                     Download
                  </a>
                `
                : `<span class="no-file">❌ File not attached</span>`
            }
          </div>

        </div>
      `;

      return;
    }

    /* ===================================================
       📘 NORMAL CONTENT CARD (Assignments / Notes / PYQ)
    =================================================== */
    html += `
      <div class="card content-card">
        <div class="content-header">
          <h3 class="content-title">
            ${escapeHTML(i.title || "")}
          </h3>

          <div class="content-datetime">
            ${formatDateTime(i.date || i.uploadDate, i.time || i.uploadTime, i.uploadedAtTs)}
          </div>
        </div>

        ${
          isAssignment
            ? `<div class="deadline">
                 ⏳ ${getCountdown(i.deadline, i.deadlineTs)}
               </div>`
            : ""
        }

        <div class="actions">
          ${
            i.fileUrl
              ? `
                <a href="${sanitizeURL(i.fileUrl)}"
                   target="_blank"
                   class="view"
                   onclick="trackView('${i.id}')">
                   View
                </a>

                <a href="#"
                   class="download"
                   onclick="return trackDownload(event,'${sanitizeURL(i.fileUrl)}','${i.id}')">
                   Download
                </a>
              `
              : `<span class="no-file">❌ File not attached</span>`
          }
        </div>
      </div>
    `;
  });

  grid.innerHTML = html; // 🔥 Single optimized DOM write
}

/* =========================
   SEARCH / FILTER
========================= */
function showFiltered(type) {

  resetView();

  const t = safeType(type);
  const now = Date.now();
  const grid = document.getElementById("contentGrid");

  /* =========================
     📢 ANNOUNCEMENTS
  ========================= */
  if (t === "MESSAGE") {
    setPageTitle("Announcements", "📢");
    show("#newsSection", "block");
    renderNews();
    return;
  }

  show("#contentGrid", "grid");

  let filtered = [];

  /* =========================
     ⏳ PENDING / EXPIRED
  ========================= */
  if (t === "PENDING" || t === "EXPIRED") {

    filtered = allContent.filter(c => {

      if (safeType(c.type) !== "ASSIGNMENT") return false;

      let ts = null;

      // 🔹 Priority 1: direct timestamp
      if (c.deadlineTs) {
        ts = Number(c.deadlineTs);
      }

      // 🔹 Priority 2: safe parsing
      else if (c.deadline) {

        const dl = String(c.deadline).trim();

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dl)) {
          ts = new Date(`${dl}T23:59:59`).getTime();
        }

        // DD-MM-YYYY
        else if (/^\d{2}-\d{2}-\d{4}$/.test(dl)) {
          const [dd, mm, yyyy] = dl.split("-");
          ts = new Date(`${yyyy}-${mm}-${dd}T23:59:59`).getTime();
        }

        // Fallback
        else {
          const parsed = new Date(dl).getTime();
          if (!isNaN(parsed)) ts = parsed;
        }
      }

      if (!ts) return false;

      return t === "PENDING"
        ? ts >= now
        : ts < now;
    });

    setPageTitle(
      t === "PENDING" ? "Pending Assignments" : "Expired Assignments",
      t === "PENDING" ? "⏳" : "❌"
    );
  }

  /* =========================
     📘 NORMAL TYPES
  ========================= */
  else {

    filtered = allContent.filter(
      c => safeType(c.type) === t
    );

    const titles = {
      ASSIGNMENT: ["Assignments", "📘"],
      NOTES: ["Notes", "📝"],
      PYQ: ["Previous Year Questions", "📂"],
      ACADEMIC_CALENDAR: ["Academic Calendar", "📅"],
      SYLLABUS: ["Syllabus", "📚"],
      HOLIDAY_LIST: ["Holiday List", "🏖"]
    };

    const titleData = titles[t];

    if (titleData) {
      setPageTitle(titleData[0], titleData[1]);
    } else {
      setPageTitle("Results", "🔍");
    }
  }

  /* =========================
     🧾 EMPTY STATE
  ========================= */
  if (!filtered.length) {

    grid.innerHTML = `
      <div class="content-card" style="text-align:center">
        <h3>📭 No content found</h3>
        <p style="color:#64748b">
          Try another filter or check later.
        </p>
      </div>
    `;

    return;
  }

  /* =========================
     🖼 RENDER
  ========================= */
  renderContent(filtered);
}

function handleDashboardSearch(query) {

  const q = String(query || "").trim().toLowerCase();

  /* ======================
     EMPTY SEARCH → DASHBOARD
  ====================== */
  if (!q) {
    showDashboard();
    return;
  }

  resetView();
  show("#contentGrid", "grid");

  /* ======================
     EXCLUDED TYPES
  ====================== */
  const EXCLUDED_TYPES = new Set([
    "MESSAGE",
    "LATEST_NEWS"
  ]);

  /* ======================
     GLOBAL CONTENT SEARCH
  ====================== */
  const results = allContent
    .filter(c => {

      if (!c) return false;

      // ❌ Skip announcements
      if (EXCLUDED_TYPES.has(String(c.type).toUpperCase()))
        return false;

      const title   = String(c.title || "").toLowerCase();
      const subject = String(c.subject || "").toLowerCase();
      const message = String(c.message || "").toLowerCase();
      const type    = String(c.type || "").toLowerCase();
      const file    = String(c.fileUrl || "").toLowerCase();

      return (
        title.includes(q) ||
        subject.includes(q) ||
        message.includes(q) ||
        type.includes(q) ||
        file.includes(q)
      );
    })
    .sort((a, b) => {
      const at = a.uploadedAtTs || 0;
      const bt = b.uploadedAtTs || 0;
      return bt - at;
    });

  /* ======================
     EMPTY RESULT
  ====================== */
  if (!results.length) {
    setPageTitle("No results found", "❌");
    renderContent([]);
    return;
  }

  setPageTitle(`Search: ${query}`, "🔍");
  renderContent(results);
}

/* =========================
   UTILITIES
========================= */
function getCountdown(deadline, deadlineTs) {

  let d = null;

  // 🔹 Priority 1: Exact timestamp
  if (deadlineTs) {
    d = new Date(Number(deadlineTs));
  }

  // 🔹 Priority 2: Date string parsing
  else if (deadline) {

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(deadline)) {
      const [dd, mm, yyyy] = deadline.split("-");
      d = new Date(`${yyyy}-${mm}-${dd}T23:59:59`);
    }

    // YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      d = new Date(`${deadline}T23:59:59`);
    }

    // ISO or fallback
    else {
      d = new Date(deadline);
    }
  }

  // ❌ Invalid date
  if (!d || isNaN(d.getTime())) return "";

  const now = new Date();
  const diff = d.getTime() - now.getTime();

  if (diff <= 0) return "❌ Expired";

  const ONE_DAY = 86400000;
  const ONE_HOUR = 3600000;

  const days = Math.floor(diff / ONE_DAY);
  const hours = Math.floor((diff % ONE_DAY) / ONE_HOUR);

  if (days === 0 && hours === 0) {
    return "⏳ Due within 1 hour";
  }

  if (days === 0) {
    return hours === 1
      ? "⏳ 1 hour left"
      : `⏳ ${hours} hours left`;
  }

  if (days === 1) return "⏳ Due Tomorrow";

  return `⏳ ${days} days left`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = Number(val) || 0;
}

function hide(sel){
  document.querySelectorAll(sel).forEach(el=>{
    el.style.display="none";
  });
}

function show(sel, displayType="block"){
  document.querySelectorAll(sel).forEach(el=>{
    el.style.display=displayType;
  });
}

function resetStudentSummary() {
  [
    "totalNotes",
    "totalAssignments",
    "pendingAssignments",
    "expiredAssignments",
    "totalPyq",
    "totalMessages"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = "0";
  });
}

function renderGreeting() {

  const el = document.getElementById("welcomeText");
  if (!el) return;

  const rawName = localStorage.getItem("NAME") || "Student";
  const name = escapeHTML(rawName);

  const hour = new Date().getHours();

  let greet = "Hello";
  let emoji = "👋";

  if (hour >= 5 && hour < 12) {
    greet = "Good Morning";
    emoji = "🌅";
  } 
  else if (hour >= 12 && hour < 17) {
    greet = "Good Afternoon";
    emoji = "☀️";
  } 
  else if (hour >= 17 && hour < 21) {
    greet = "Good Evening";
    emoji = "🌇";
  } 
  else {
    greet = "Good Night";
    emoji = "🌙";
  }

  el.innerHTML = `
    ${greet}, 
    <span class="name">${name}</span> 
    <span class="greet-emoji">${emoji}</span>
  `;
}

function renderNews() {

  const section = document.getElementById("newsSection");
  const newsBox = document.getElementById("newsContainer");
  const docsBox = document.getElementById("noticeDocsContainer");

  if (!section || !newsBox || !docsBox) return;

  if (!Array.isArray(allContent)) {
    newsBox.innerHTML = `<div class="news-item">No announcements</div>`;
    docsBox.innerHTML = `<div class="news-item">No notice documents</div>`;
    section.style.display = "block";
    return;
  }

  const NEWS_TYPES = new Set(["MESSAGE", "LATEST_NEWS"]);

  const now = Date.now();
  const ONE_DAY   = 1 * 24 * 60 * 60 * 1000;
  const THREE_DAY = 3 * 24 * 60 * 60 * 1000;

  /* ===============================
     📦 Filter only 3-day visible news
  =============================== */
  const filtered = allContent
    .filter(c => {
      if (!c || !NEWS_TYPES.has(String(c.type).toUpperCase()))
        return false;

      if (!c.uploadedAtTs) return false;

      const age = now - c.uploadedAtTs;

      // Hide if older than 3 days
      return age <= THREE_DAY;
    })
    .sort((a, b) => (b.uploadedAtTs || 0) - (a.uploadedAtTs || 0));

  const textNotices = [];
  const docNotices  = [];

  for (const c of filtered) {

    const hasFile =
      typeof c.fileUrl === "string" &&
      c.fileUrl.trim().length > 0;

    if (hasFile) {
      docNotices.push(c);
    } else {
      textNotices.push(c);
    }
  }

  /* ===============================
     📰 Render Text Notices
  =============================== */
  newsBox.innerHTML = textNotices.length
    ? textNotices.map(n => {

        const age = now - n.uploadedAtTs;
        const isNew = age <= ONE_DAY;

        return `
          <div class="news-item">
            <div>
              ${escapeHTML(n.message || n.title || "No message")}
              ${isNew ? `<span class="news-badge">NEW</span>` : ""}
            </div>
          </div>
        `;
      }).join("")
    : `<div class="news-item">No announcements</div>`;

  /* ===============================
     📄 Render Document Notices
  =============================== */
  docsBox.innerHTML = docNotices.length
    ? docNotices.map(d => {

        const age = now - d.uploadedAtTs;
        const isNew = age <= ONE_DAY;

        return `
          <div class="news-item">
            <div>
              ${escapeHTML(d.message || d.title || "Untitled")}
              ${isNew ? `<span class="news-badge">NEW</span>` : ""}
            </div>
            <a href="#"
               onclick="openNoticeDocument('${d.id}','${sanitizeURL(d.fileUrl)}')">
               📄 View Document
            </a>
          </div>
        `;
      }).join("")
    : `<div class="news-item">No notice documents</div>`;

  section.style.display = "block";
}

function openNoticeDocument(uploadId, url) {

  if (!uploadId || !url) return;

  // 🔒 Sanitize URL
  const safeUrl = sanitizeURL(url);
  if (safeUrl === "#") return;

  /* =========================
     🔐 Silent View Logging
  ========================= */
  try {

    if (typeof adminFetch === "function") {
      // fire-and-forget (non-blocking)
      Promise.resolve(
        adminFetch({
          action: "log_notice_view",
          uploadId: uploadId
        }, false, { silent: true })
      ).catch(() => {});
    }

  } catch (_) {
    // Never break UI
  }

  /* =========================
     📄 Open Document Safely
  ========================= */
  try {

    const newTab = window.open(safeUrl, "_blank", "noopener,noreferrer");

    // fallback if popup blocked
    if (!newTab) {
      window.location.href = safeUrl;
    }

  } catch (_) {
    console.warn("Failed to open notice document");
  }
}

// =========================
// UTILITY HELPERS (GLOBAL)
// =========================
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[s]);
}

function sanitizeURL(url) {
  try {
    const u = new URL(url, location.origin);
    return u.href;
  } catch {
    return "#";
  }
}

function trackView(uploadId){
  studentFetch({
    action: "track",
    uploadId,
    actionType: "VIEWED",
    sessionToken: getSessionToken()
  });
}

function trackDownload(e, url, uploadId) {

  if (e && e.preventDefault) e.preventDefault();

  let finalUrl = url || "";

  if (finalUrl.includes("drive.google.com")) {

    const match1 = finalUrl.match(/\/d\/([^\/]+)/);
    if (match1 && match1[1]) {
      finalUrl = `https://drive.google.com/uc?export=download&id=${match1[1]}`;
    }

    const match2 = finalUrl.match(/[?&]id=([^&]+)/);
    if (match2 && match2[1]) {
      finalUrl = `https://drive.google.com/uc?export=download&id=${match2[1]}`;
    }
  }

  // 🔥 DIRECT REDIRECT (most reliable)
  window.location.href = finalUrl;

  // Background tracking
  try {
    setTimeout(() => {
      studentFetch({
        action: "track",
        uploadId,
        actionType: "DOWNLOADED",
        sessionToken: getSessionToken()
      });
    }, 0);
  } catch (_) {}

  return false;
}

let deadlineInterval = null;

function renderUpcomingDeadlines() {

  const box = document.getElementById("deadlineBox");
  if (!box) return;

  if (!Array.isArray(allContent) || !allContent.length) {
    box.style.display = "block";
    box.innerHTML = `
      <div class="news-panel-header">
        <h3>⏰ Upcoming Deadlines</h3>
      </div>
      <div class="news-item">No upcoming deadlines</div>
    `;
    return;
  }

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const upcoming = allContent
    .filter(c => safeType(c.type) === "ASSIGNMENT")
    .map(c => {

      let ts = null;

      // 🔹 Priority 1: exact timestamp
      if (c.deadlineTs) {
        ts = Number(c.deadlineTs);
      }

      // 🔹 Priority 2: parse date safely
      else if (c.deadline) {

        const dl = String(c.deadline).trim();

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dl)) {
          ts = new Date(`${dl}T23:59:59`).getTime();
        }

        // DD-MM-YYYY
        else if (/^\d{2}-\d{2}-\d{4}$/.test(dl)) {
          const [dd, mm, yyyy] = dl.split("-");
          ts = new Date(`${yyyy}-${mm}-${dd}T23:59:59`).getTime();
        }

        // fallback
        else {
          const parsed = new Date(dl).getTime();
          if (!isNaN(parsed)) ts = parsed;
        }
      }

      if (!ts) return null;

      const diff = ts - now;
      if (diff < 0 || diff > SEVEN_DAYS) return null;

      return { ...c, ts };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, 3);

  box.style.display = "block";

  if (!upcoming.length) {
    box.innerHTML = `
      <div class="news-panel-header">
        <h3>⏰ Upcoming Deadlines</h3>
      </div>
      <div class="news-item">No deadlines in next 7 days</div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="news-panel-header">
      <h3>⏰ Upcoming Deadlines</h3>
    </div>
    ${upcoming.map((a, i) => `
      <div class="deadline-item" data-ts="${a.ts}">
        <div class="deadline-left">
          <div class="deadline-title">
            ${escapeHTML(a.title || "Untitled")}
          </div>
          <div class="deadline-date">
            📅 ${new Date(a.ts).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>
        </div>
        <div class="deadline-countdown" id="countdown-${i}">
          --:--:--
        </div>
      </div>
    `).join("")}
  `;

  startDeadlineCountdown();
}


/* ===============================
   🔥 LIVE COUNTDOWN ENGINE
================================ */
function startDeadlineCountdown() {

  // 🔒 prevent multiple intervals
  if (deadlineInterval) {
    clearInterval(deadlineInterval);
  }

  function update() {

    const now = Date.now();
    const items = document.querySelectorAll(".deadline-item");

    items.forEach((el, index) => {

      const ts = Number(el.dataset.ts);
      const diff = ts - now;

      const cdBox = document.getElementById(`countdown-${index}`);
      if (!cdBox) return;

      if (diff <= 0) {
        cdBox.innerHTML = `<span class="deadline-expired">Expired</span>`;
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      let colorClass = "deadline-normal";

      if (diff <= 24 * 60 * 60 * 1000) {
        colorClass = "deadline-urgent";
      } else if (diff <= 3 * 24 * 60 * 60 * 1000) {
        colorClass = "deadline-warning";
      }

      cdBox.innerHTML = `
        <span class="${colorClass}">
          ${days > 0 ? days + "d " : ""}
          ${hours}h ${minutes}m ${seconds}s
        </span>
      `;
    });
  }

  update();
  deadlineInterval = setInterval(update, 1000);
}

/* =========================
   NEWS & SUBJECT
========================= */
function updateNewsBadge(){

  const el = document.getElementById("newsBadge");
  if (!el || !Array.isArray(allContent)) return;

  const count = allContent.filter(x => {
    const t = String(x?.type || "").toUpperCase();
    return t === "MESSAGE" || t === "LATEST_NEWS";
  }).length;

  el.innerText = count ? " " + count : "";
}

function renderSubjectProgress() {

  const box = document.getElementById("subjectProgress");
  if (!box) return;

  if (!Array.isArray(allContent) || allContent.length === 0) {
    box.innerHTML = `
      <div class="subject-progress-card empty">
        <h3>📊 Subject Progress</h3>
        <div class="subject-empty">
          No academic data available
        </div>
      </div>
    `;
    return;
  }

  const VALID_TYPES = new Set([
    "ASSIGNMENT",
    "NOTES",
    "PYQ"
  ]);

  const subjectMap = {};

  for (const item of allContent) {

    const type = String(item.type || "").toUpperCase();
    if (!VALID_TYPES.has(type)) continue;

    let subject = "";

    if (item.title) {
      const match = item.title.match(/\((.*?)\)/);
      if (match) subject = match[1].trim();
    }

    if (!subject) subject = "General";

    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        total: 0,
        ASSIGNMENT: 0,
        NOTES: 0,
        PYQ: 0
      };
    }

    subjectMap[subject].total++;
    subjectMap[subject][type]++;
  }

  const totalItems = Object.values(subjectMap)
    .reduce((sum, s) => sum + s.total, 0);

  const subjects = Object.entries(subjectMap)
    .map(([name, data]) => ({
      name,
      ...data,
      percent: Math.round((data.total / totalItems) * 100)
    }))
    .sort((a, b) => b.total - a.total);

  box.innerHTML = `
    <div class="subject-progress-card">
      <div class="subject-progress-header">
        <h3>📊 Subject Progress</h3>
        <div class="subject-total">
          ${totalItems} Academic Items
        </div>
      </div>

      <div class="subject-progress-body">
        ${subjects.map((s, index) => `
          <div class="subject-row">

            <div class="subject-top">
              <div class="subject-name">
                ${index === 0 ? "🏆 " : ""}
                ${escapeHTML(s.name)}
              </div>

              <div class="subject-count">
                ${s.total} • ${s.percent}%
              </div>
            </div>

            <div class="subject-meta" style="font-size:12.5px;color:#0f172a;margin-top:4px;">
              ${s.ASSIGNMENT ? `${s.ASSIGNMENT} Assignment${s.ASSIGNMENT > 1 ? "s" : ""}` : ""}
              ${s.NOTES ? ` • ${s.NOTES} Notes` : ""}
              ${s.PYQ ? ` • ${s.PYQ} PYQ` : ""}
            </div>

            <div class="progress-bar">
              <div class="progress-fill"
                   style="width:${s.percent}%">
              </div>
            </div>

          </div>
        `).join("")}
      </div>
    </div>
  `;
}
/* =========================
   MISSING FUNCTIONS FIX
========================= */

let clockInterval = null;

function startClock() {

  const el = document.getElementById("liveDateTime");
  if (!el) return;

  // 🔁 Prevent multiple intervals
  if (clockInterval) {
    clearInterval(clockInterval);
  }

  function tick() {

    const now = new Date();

    el.innerText = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true   // 🔥 Clean AM/PM format
    });
  }

  // Run immediately
  tick();

  // Sync to next exact second
  const delay = 1000 - (Date.now() % 1000);

  setTimeout(() => {
    tick();
    clockInterval = setInterval(tick, 1000);
  }, delay);
}

function setPageTitle(title, icon = "") {
  const el = document.getElementById("pageTitle");
  if (!el) return;
  el.innerText = `${icon} ${title}`;
}

/* =========================
   HELPER
========================= */
function safeType(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[\s\-]+/g, "_")   // space & hyphen → underscore
    .replace(/__+/g, "_");      // multiple underscores → single
}

function norm(v){
  return String(v || "").trim().toUpperCase();
}

function openSummaryPopup(type) {

  const t = safeType(type);

  // Direct navigation instead of popup
  switch (t) {

    case "NOTES":
      showFiltered("NOTES");
      break;

    case "ASSIGNMENT":
      showFiltered("ASSIGNMENT");
      break;

    case "PENDING":
      showFiltered("PENDING");
      break;

    case "EXPIRED":
      showFiltered("EXPIRED");
      break;

    case "PYQ":
      showFiltered("PYQ");
      break;

    default:
      showDashboard();
  }
}

function formatDateTime(dateStr, timeStr, uploadedAtTs) {
  try {

    let d = null;

    /* ===============================
       🔥 Priority 1: Exact Timestamp
    =============================== */
    if (uploadedAtTs) {
      const ts = Number(uploadedAtTs);
      if (!isNaN(ts)) {
        d = new Date(ts);
      }
    }

    /* ===============================
       🔹 Priority 2: Date + Time Strings
    =============================== */
    else if (dateStr) {

      // ISO format
      if (typeof dateStr === "string" && dateStr.includes("T")) {
        d = new Date(dateStr);
      }

      // DD-MM-YYYY
      else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split("-");
        d = new Date(`${yyyy}-${mm}-${dd}T${timeStr || "00:00:00"}`);
      }

      // YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        d = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
      }

      // Fallback
      else {
        d = new Date(`${dateStr} ${timeStr || ""}`);
      }
    }

    // ❌ Invalid date guard
    if (!d || isNaN(d.getTime())) return "";

    /* ===============================
       🇮🇳 Force IST Output
    =============================== */
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

  } catch {
    return "";
  }
}

// =========================
// 🔁 STUDENT HEARTBEAT
// =========================
setInterval(async () => {
  const token = getSessionToken();
  const role  = localStorage.getItem("ROLE");

  if (!token || role !== "student") return;

  try {
    const res = await studentFetch({
      action: "student_ping",
      sessionToken: token
    });

    if (res?.status === "unauthorized") {
      alert("Session expired");
      logout(); // 🔥 auto logout
    }

  } catch (_) {
    // network error ignore
  }

}, 60000); // ⏱️ every 60 seconds

// =========================
// ⏳ SESSION EXPIRY WARNING
// =========================
(function sessionExpiryWatcher() {

  const MAX_AGE = 60 * 60 * 1000;      // 1 hour
  const WARNING_TIME = 59 * 60 * 1000; // 59 minutes

  const start = Number(localStorage.getItem("SESSION_START"));
  if (!start) return;

  const now = Date.now();
  const elapsed = now - start;

  // ⛔ already expired
  if (elapsed >= MAX_AGE) {
    logout();
    return;
  }

  // ⏳ show warning
  const warnIn = WARNING_TIME - elapsed;
  if (warnIn > 0) {
    setTimeout(showExpiryWarning, warnIn);
  }

  // 🔥 force logout
  const logoutIn = MAX_AGE - elapsed;
  setTimeout(() => {
    alert("Session expired. Please login again.");
    logout();
  }, logoutIn);

})();

function showExpiryWarning() {

  if (document.getElementById("sessionWarning")) return;

  const div = document.createElement("div");
  div.id = "sessionWarning";
  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:20px;
      right:20px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      color:#9a3412;
      padding:16px 20px;
      border-radius:10px;
      box-shadow:0 10px 25px rgba(0,0,0,.15);
      font-family:system-ui;
      z-index:9999;
      max-width:320px;
    ">
      <b>⏳ Session expiring soon</b><br>
      <span style="font-size:14px">
        Your session will expire in <b>1 minute</b>.<br>
        Please save your work.
      </span>
    </div>
  `;

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 55000);
}

function toggleTheme(){

  document.body.classList.toggle("light-mode");

  const icon = document.querySelector(".theme-toggle i");

  if(document.body.classList.contains("light-mode")){
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }
}

let cachedProfileData = null;

function toggleProfileDropdown() {

  const dropdown = document.getElementById("profileDropdown");
  if (!dropdown) return;

  // If already open → close
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
    return;
  }

  dropdown.style.display = "block";

  // ✅ If cached → render instantly
  if (cachedProfileData) {
    renderProfileDropdown(cachedProfileData);
    return;
  }

  // Otherwise load once
  dropdown.innerHTML = `
    <div style="text-align:center;padding:20px;color:#64748b;">
      Loading...
    </div>
  `;

  studentFetch({
    action: "student_profile",
    sessionToken: getSessionToken()
  }).then(res => {

    if (!res || res.status !== "ok") {
      dropdown.innerHTML = `
        <div style="text-align:center;padding:20px;color:#dc2626;">
          Failed to load profile
        </div>
      `;
      return;
    }

    cachedProfileData = res.data || {}; // ✅ Cache it
    renderProfileDropdown(cachedProfileData);

  }).catch(() => {
    dropdown.innerHTML = `
      <div style="text-align:center;padding:20px;color:#dc2626;">
        Failed to load profile
      </div>
    `;
  });
}

function renderProfileDropdown(d) {

  const dropdown = document.getElementById("profileDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">
        ${(d.name || "S").charAt(0).toUpperCase()}
      </div>
      <div>
        <div class="profile-name">
          ${escapeHTML(d.name || "")}
        </div>
        <div class="profile-role">
          ${escapeHTML(d.batch || "")} • student
        </div>
      </div>
    </div>

    <div class="profile-info">
      <div class="profile-row">
        <span class="profile-label">Roll No</span>
        <span class="profile-value">
          ${escapeHTML(d.rollNo || "")}
        </span>
      </div>

      <div class="profile-row">
        <span class="profile-label">Email</span>
        <span class="profile-value">
          ${escapeHTML(d.email || "")}
        </span>
      </div>

      <div class="profile-row">
        <span class="profile-label">Registered At</span>
        <span class="profile-value">
          ${escapeHTML(d.registeredAt || "")}
        </span>
      </div>
    </div>

    <div class="profile-footer">
      <div class="profile-footer-actions">
    
        <button class="admin-btn"
          onclick="window.location.href='../admin_profile/profile.html'">
          Admin Profile
        </button>

        <button onclick="logout()">
          Logout
        </button>

      </div>
    </div>
  `;
}

// =========================
// 🔒 Close Profile On Outside Click
// =========================
document.addEventListener("click", function (e) {

  const dropdown = document.getElementById("profileDropdown");
  const chip = document.querySelector(".user-chip");

  if (!dropdown || dropdown.style.display !== "block") return;

  if (!dropdown.contains(e.target) && !chip.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// ESC key close
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.style.display = "none";
  }
});

/* =========================
   CLOSE FUNCTION
========================= */
function closeSummaryPopup() {
  const modal = document.getElementById("summaryModal");
  if (modal) modal.style.display = "none";
}