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
document.addEventListener("DOMContentLoaded", () => {

  const token = getSessionToken();
  if (!token) {
    window.location.replace("../login_page/login.html");
    return;
  }

  /* =========================
     🚀 FAST UI INIT (NO WAIT)
  ========================= */
  initSidebar();
  renderUserInfo();
  startClock();
  renderGreeting();
  resetStudentSummary();
  showDashboard();   // 🔥 show instantly

  /* =========================
     📡 LOAD DATA (NON-BLOCKING)
  ========================= */
  loadDashboardData()
    .then(data => {

      if (!data || data.status !== "ok") {
        showEmptyDashboard();
        return;
      }

      // store content
      allContent = Array.isArray(data.content) ? data.content : [];

      // summary cards
      setText("totalNotes", data.summary?.notes);
      setText("totalAssignments", data.summary?.assignments);
      setText("pendingAssignments", data.summary?.pending);
      setText("expiredAssignments", data.summary?.expired);
      setText("totalPyq", data.summary?.pyq);
      setText("totalMessages", data.summary?.messages);

      /* =========================
         ⚡ LAZY RENDER (SMOOTH)
      ========================= */
      setTimeout(() => renderNews(), 0);
      setTimeout(() => renderUpcomingDeadlines(), 0);
      setTimeout(() => renderSubjectProgress(), 0);
      setTimeout(() => updateNewsBadge(), 0);

    })
    .catch(err => {
      console.error("Dashboard load failed", err);
      showEmptyDashboard();
    });

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
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const overlay = document.querySelector(".sidebar-overlay");
  const closeBtn = document.querySelector(".close-btn");

  if (!sidebar || !toggleBtn) return;

  const open = () => {
    sidebar.classList.add("open");
    overlay?.classList.add("show");
    document.body.classList.add("sidebar-open");
  };

  const close = () => {
    sidebar.classList.remove("open");
    overlay?.classList.remove("show");
    document.body.classList.remove("sidebar-open");
  };

  toggleBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);

  sidebar.querySelectorAll(".nav a").forEach(a => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 900) close();
    });
  });
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
  hide("#deadlineBox");   // 🔥 ADD THIS LINE
}

function showDashboard() {
  resetView();
  show(".cards", "grid");
  show("#newsSection", "block");
  show("#subjectProgress", "block");
  show("#deadlineBox", "block");   // 🔥 ADD THIS LINE
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
    const isAssignment = safeType(i.type) === "ASSIGNMENT";

    html += `
      <div class="card content-card">
        <div class="content-header">
          <h3 class="content-title">${i.title || ""}</h3>
          <div class="content-datetime">
            ${formatDateTime(i.date, i.time)}
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
                <a href="${i.fileUrl}" target="_blank"
                   class="view"
                   onclick="trackView('${i.id}')">View</a>

                <a href="${i.fileUrl}" target="_blank"
                   class="download"
                   onclick="return trackDownload(event,'${i.fileUrl}','${i.id}')">
                   Download
                </a>
              `
              : `<span class="no-file">❌ File not attached</span>`
          }
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;   // 🔥 Only ONE DOM write
}

/* =========================
   SEARCH / FILTER
========================= */
function showFiltered(type) {
  resetView();

  const t = safeType(type);

  /* =========================
     📢 ANNOUNCEMENTS
  ========================= */
  if (t === "MESSAGE") {
    setPageTitle("Announcements", "📢");
    show("#newsSection", "block");
    renderNews();
    return;
  }

  /* =========================
     📦 CONTENT GRID
  ========================= */
  show("#contentGrid", "grid");

  let filtered = [];

  /* =========================
     ⏳ PENDING ASSIGNMENTS
  ========================= */
  if (t === "PENDING") {
    filtered = allContent.filter(c => {
      if (safeType(c.type) !== "ASSIGNMENT") return false;
      if (!c.deadlineTs && !c.deadline) return false;

      const ts = c.deadlineTs
        ? Number(c.deadlineTs)
        : new Date(c.deadline).getTime();

      return ts >= Date.now();
    });

    setPageTitle("Pending Assignments", "⏳");
  }

  /* =========================
     ❌ EXPIRED ASSIGNMENTS
  ========================= */
  else if (t === "EXPIRED") {
    filtered = allContent.filter(c => {
      if (safeType(c.type) !== "ASSIGNMENT") return false;
      if (!c.deadlineTs && !c.deadline) return false;

      const ts = c.deadlineTs
        ? Number(c.deadlineTs)
        : new Date(c.deadline).getTime();

      return ts < Date.now();
    });

    setPageTitle("Expired Assignments", "❌");
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
      PYQ: ["Previous Year Questions", "📂"]
    };

    if (titles[t]) {
      setPageTitle(titles[t][0], titles[t][1]);
    } else {
      setPageTitle("Results", "🔍");
    }
  }

  /* =========================
     🧾 EMPTY STATE HANDLING
  ========================= */
  if (!filtered.length) {
    document.getElementById("contentGrid").innerHTML = `
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

  // ======================
  // EMPTY SEARCH → DASHBOARD
  // ======================
  if (!q) {
    showDashboard();
    return;
  }

  resetView();
  show("#contentGrid", "grid");

  // ======================
  // TYPE SEARCH
  // ======================
  const typeMap = {
    assignment: "ASSIGNMENT",
    assignments: "ASSIGNMENT",
    note: "NOTES",
    notes: "NOTES",
    pyq: "PYQ",
    message: "MESSAGE",
    messages: "MESSAGE",
    news: "MESSAGE"
  };

  if (typeMap[q]) {
    const list = allContent.filter(
      c => safeType(c.type) === typeMap[q]
    );

    setPageTitle(`Search: ${query}`, "🔍");
    renderContent(list);
    return;
  }

  // ======================
  // SUBJECT SEARCH
  // ======================
  const subjectItems = allContent.filter(c =>
    String(c.subject || "")
      .toLowerCase()
      .includes(q)
  );

  if (!subjectItems.length) {
    setPageTitle("No results found", "❌");
    renderContent([]);
    return;
  }

  // ----------------------
  // Latest Assignment
  // ----------------------
  const latestAssignment = subjectItems
    .filter(c => safeType(c.type) === "ASSIGNMENT")
    .sort((a, b) => {
      const at = a.deadlineTs || 0;
      const bt = b.deadlineTs || 0;
      return bt - at;
    })[0];

  // ----------------------
  // All Notes
  // ----------------------
  const notes = subjectItems.filter(
    c => safeType(c.type) === "NOTES"
  );

  // ======================
  // FINAL RESULT (NO DUPES)
  // ======================
  const seen = new Set();
  const finalList = [];

  [latestAssignment, ...notes].forEach(item => {
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      finalList.push(item);
    }
  });

  setPageTitle(`Search: ${query}`, "🔍");
  renderContent(finalList);
}

/* =========================
   UTILITIES
========================= */
function getCountdown(deadline, deadlineTs) {
  const d = deadlineTs ? new Date(deadlineTs) : deadline ? new Date(deadline) : null;
  if (!d) return "";
  const diff = d - new Date();
  if (diff <= 0) return "❌ Expired";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "⏳ Due Today";
  if (days === 1) return "⏳ Due Tomorrow";
  return `⏳ ${days} days left`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = Number(val) || 0;
}

function hide(sel) {
  const el = document.querySelector(sel);
  if (el) el.style.display = "none";
}

function show(sel, d) {
  const el = document.querySelector(sel);
  if (el) el.style.display = d;
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

  // 🔒 Hard guards
  if (!section || !newsBox || !docsBox) return;

  if (!Array.isArray(allContent)) {
    newsBox.innerHTML = `<div class="news-item">No announcements</div>`;
    docsBox.innerHTML = `<div class="news-item">No notice documents</div>`;
    section.style.display = "block";
    return;
  }

  // ✅ Backend-aligned news types
  const NEWS_TYPES = new Set([
    "MESSAGE",
    "LATEST_NEWS",
    "ACADEMIC_CALENDAR"
  ]);

  const textNotices = [];
  const docNotices  = [];

  // 📦 Classify content
  for (const c of allContent) {
    if (!c || !c.type) continue;

    const t = String(c.type).toUpperCase();
    if (!NEWS_TYPES.has(t)) continue;

    const hasFile =
      typeof c.fileUrl === "string" &&
      c.fileUrl.trim().length > 0;

    if (hasFile) {
      docNotices.push(c);     // 📄 Notice Document
    } else {
      textNotices.push(c);    // 📰 Text Notice
    }
  }

  // 📰 Render text notices
  newsBox.innerHTML = textNotices.length
    ? textNotices.map(n => `
        <div class="news-item">
          <div>${escapeHTML(n.title || "Untitled")}</div>
        </div>
      `).join("")
    : `<div class="news-item">No announcements</div>`;

  // 📄 Render document notices (WITH VIEW LOG)
  docsBox.innerHTML = docNotices.length
    ? docNotices.map(d => `
        <div class="news-item">
          <div>${escapeHTML(d.title || "Untitled")}</div>
          <a href="#"
             onclick="openNoticeDocument('${d.id}','${sanitizeURL(d.fileUrl)}')">
             📄 View Document
          </a>
        </div>
      `).join("")
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

  if (e && e.preventDefault) {
    e.preventDefault();
  }

  studentFetch({
    action: "track",
    uploadId,
    actionType: "DOWNLOADED",
    sessionToken: getSessionToken()
  });

  // popup-safe download
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return false;
}

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
  const ONE_DAY = 86400000;

  const upcoming = allContent
    .filter(c => safeType(c.type) === "ASSIGNMENT")
    .map(c => {

      let ts = null;

      if (c.deadlineTs) {
        ts = Number(c.deadlineTs);
      } 
      else if (c.deadline) {
        const parsed = new Date(c.deadline).getTime();
        if (!isNaN(parsed)) ts = parsed;
      }

      if (!ts) return null;

      const diff = ts - now;
      const days = Math.ceil(diff / ONE_DAY);

      return { ...c, days, ts };
    })
    .filter(c => c && c.days >= 0 && c.days <= 7)
    .sort((a, b) => a.days - b.days)
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
    ${upcoming.map(a => {

      const dateObj = new Date(a.ts);

      const formattedDate = dateObj.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      const daysText =
        a.days === 0
          ? "Due Today"
          : a.days === 1
            ? "1 day left"
            : `${a.days} days left`;

      return `
        <div class="news-item">
          <div>
            <div>${escapeHTML(a.title || "Untitled")}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">
              📅 ${formattedDate}
            </div>
          </div>
          <div class="news-date">
            ${daysText}
          </div>
        </div>
      `;
    }).join("")}
  `;
}

/* =========================
   NEWS & SUBJECT
========================= */
function updateNewsBadge(){
  const el = document.getElementById("newsBadge");
  if (!el) return;

  const c = allContent.filter(
    x => norm(x.type) === "MESSAGE"
  ).length;

  el.innerText = c ? " " + c : "";
}

function renderSubjectProgress() {
  const box = document.getElementById("subjectProgress");
  if (!box) return;

  if (!Array.isArray(allContent) || !allContent.length) {
    box.innerHTML = `
      <div class="subject-progress-card">
        <div class="subject-progress-header">
          <h3>📊 Subject Progress</h3>
        </div>
        <div style="color:#64748b;font-size:14px">
          No subject data available
        </div>
      </div>
    `;
    return;
  }

  // Count per subject
  const subjectMap = {};

  allContent.forEach(item => {
    const subject = item.subject || "General";
    subjectMap[subject] = (subjectMap[subject] || 0) + 1;
  });

  const totalItems = Object.values(subjectMap)
    .reduce((a,b) => a+b, 0);

  // Convert to array & sort highest first
  const subjects = Object.entries(subjectMap)
    .map(([name,count]) => ({
      name,
      count,
      percent: Math.round((count / totalItems) * 100)
    }))
    .sort((a,b) => b.count - a.count);

  box.innerHTML = `
    <div class="subject-progress-card">
      <div class="subject-progress-header">
        <h3>📊 Subject Progress</h3>
        <div class="subject-total">
          ${totalItems} Total Items
        </div>
      </div>

      ${subjects.map(s => `
        <div class="subject-row">
          <div class="subject-top">
            <div class="subject-name">${s.name}</div>
            <div class="subject-count">${s.count} (${s.percent}%)</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${s.percent}%"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================
   MISSING FUNCTIONS FIX
========================= */

function startClock() {
  const el = document.getElementById("liveDateTime");
  if (!el) return;

  function tick() {
    const now = new Date();
    el.innerText = now.toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  tick();
  setInterval(tick, 1000);
}

function setPageTitle(title, icon = "") {
  const el = document.getElementById("pageTitle");
  if (!el) return;
  el.innerText = `${icon} ${title}`;
}

/* =========================
   HELPER
========================= */
function safeType(v){
  return String(v || "").trim().toUpperCase();
}

function norm(v){
  return String(v || "").trim().toUpperCase();
}

function openSummaryPopup(type) {
  console.warn("openSummaryPopup not implemented yet:", type);
}

function formatDateTime(dateStr, timeStr) {
  try {
    // Case 1: already ISO timestamp
    if (dateStr && dateStr.includes("T")) {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // Case 2: date + time separately
    if (dateStr && timeStr) {
      const d = new Date(`${dateStr} ${timeStr}`);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    return "";
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

  document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", function () {

      // sabse pehle sabse active hatao
      document.querySelectorAll(".nav a.active")
        .forEach(el => el.classList.remove("active"));

      // clicked item ko active banao
      this.classList.add("active");
    });
  });


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
