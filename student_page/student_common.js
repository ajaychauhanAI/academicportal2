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
    body.append(k, typeof v === "object" ? JSON.stringify(v) : v);
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
       🚀 INSTANT UI BOOT
    ========================= */

    initSidebar();
    renderUserInfo();
    startClock();
    renderGreeting();
    resetStudentSummary();
    showDashboard();   // ⚡ instant UI


    /* =========================
       📡 LOAD DASHBOARD DATA
    ========================= */

    const data = await loadDashboardData();

    if (!data || data.status !== "ok") {
      showEmptyDashboard();
      return;
    }

    /* =========================
       🧠 STATE INIT
    ========================= */

    lastContentVersion = data.contentVersion || "0";

    allContent = Array.isArray(data.content)
      ? data.content
      : [];

    dashboardSummary = data.summary || {};


    /* =========================
       📊 SUMMARY CARDS
    ========================= */

    setText("totalNotes", dashboardSummary.notes);
    setText("totalAssignments", dashboardSummary.assignments);
    setText("pendingAssignments", dashboardSummary.pending);
    setText("expiredAssignments", dashboardSummary.expired);
    setText("totalPyq", dashboardSummary.pyq);
    setText("totalMessages", dashboardSummary.messages);


    /* =========================
       🏆 ACTIVITY SCORE INIT
    ========================= */

    setText("prodNotes", dashboardSummary.views);
    setText("prodAssignments", dashboardSummary.assignmentsOpened);
    setText("prodDownloads", dashboardSummary.downloads);

    setText("engNotes", dashboardSummary.views);
    setText("engAssignments", dashboardSummary.assignmentsOpened);
    setText("engDownloads", dashboardSummary.downloads);


    /* =========================
       ⚡ NON-BLOCKING UI RENDER
    ========================= */

    requestAnimationFrame(() => {

      renderNews();
      renderUpcomingDeadlines();
      renderSubjectProgress();
      renderAcademicResources();
      renderSmartWidgets();

      renderRecentActions();
      renderLatestUploads();

      updateNewsBadge();

    });


    /* =========================
       🔥 PRO MAX LIVE ENGINE
    ========================= */

    let lastSyncTime = 0;

    setInterval(async () => {

      if (Date.now() - lastSyncTime < 3000) return;

      try {

        const res = await studentFetch({
          action: "check_update",
          version: lastContentVersion,
          sessionToken: getSessionToken()
        });

        if (res?.updated) {

          lastSyncTime = Date.now();

          /* ======================
             🔄 UPDATE STATE
          ====================== */

          allContent = res.content || [];
          lastContentVersion = res.contentVersion;

          /* ======================
             ⚡ SMOOTH UI UPDATE
          ====================== */

          requestAnimationFrame(() => {

            renderLatestUploads();
            renderRecentActions();
            renderNews();
            renderAcademicResources();
            renderUpcomingDeadlines();
            updateActivityScore();
            updateNewsBadge();

          });

          /* ======================
             🔔 USER FEEDBACK
          ====================== */

          if (typeof showLiveToast === "function") {
            showLiveToast("New update received 🚀");
          }

        }

      } catch (err) {
        console.warn("Live sync error");
      }

    }, 3000); // ⚡ ultra smooth real-time


  } catch (err) {

    console.error("❌ Dashboard initialization failed:", err);
    showEmptyDashboard();

  }

});

function showEmptyDashboard(){

  try{

    resetView();
    show("#contentGrid","grid");

    const grid = document.getElementById("contentGrid");
    if(!grid) return;

    grid.innerHTML = `
      <div class="content-card empty-dashboard">

        <div class="empty-icon">📭</div>

        <h3 class="empty-title">
          No content available
        </h3>

        <p class="empty-subtitle">
          Please refresh or check back later.
        </p>

        <button class="empty-refresh-btn"
          onclick="location.reload()">
          🔄 Refresh
        </button>

      </div>
    `;

  }catch(err){
    console.warn("Empty dashboard render failed", err);
  }

}

function showLiveToast(message = "Update", type = "info"){

  try{

    /* ======================
       CONTAINER (SINGLE)
    ====================== */
    let container = document.getElementById("toastContainer");

    if(!container){
      container = document.createElement("div");
      container.id = "toastContainer";

      container.style.cssText = `
        position:fixed;
        top:20px;
        right:20px;
        display:flex;
        flex-direction:column;
        gap:10px;
        z-index:9999;
      `;

      document.body.appendChild(container);
    }

    /* ======================
       CREATE TOAST
    ====================== */
    const toast = document.createElement("div");

    /* ---------- COLORS ---------- */
    let bg = "#0ea5e9"; // info

    if(type==="success") bg = "#22c55e";
    else if(type==="error") bg = "#ef4444";
    else if(type==="warning") bg = "#f59e0b";

    toast.innerText = message;

    toast.style.cssText = `
      background:${bg};
      color:white;
      padding:10px 14px;
      border-radius:8px;
      font-size:13px;
      min-width:180px;
      box-shadow:0 10px 25px rgba(0,0,0,.2);
      animation:toastIn .3s ease;
      opacity:0.95;
    `;

    container.appendChild(toast);

    /* ======================
       AUTO REMOVE
    ====================== */
    setTimeout(()=>{
      toast.style.animation = "toastOut .3s ease";
      setTimeout(()=>toast.remove(),300);
    },2000);

  }catch(err){
    console.warn("Toast failed", err);
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
  hide("#academicResourceGrid");   // ✅ ADD THIS
  hide(".smart-widgets");   // ✅ ADD THIS
}

function showDashboard() {
  resetView();
  show(".cards", "grid");
  show(".quick-actions", "block");  // ✅ ADD THIS
  show(".smart-widgets","grid");
  show("#newsSection", "block");
  show("#subjectProgress", "block");
  show("#deadlineBox", "flex");
  show("#academicResourceGrid", "grid");   // ✅ ADD THIS
  renderAcademicResources();
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
                     onclick="trackView('${i.id}','${i.type}')">
                     View
                  </a>

                  <a href="#"
                     class="rf-download"
                     onclick="return trackDownload(event,'${sanitizeURL(i.fileUrl)}','${i.id}','${i.type}')">
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
                   onclick="trackView('${i.id}','${i.type}')">
                   View
                </a>

                <a href="#"
                   class="download"
                   onclick="return trackDownload(event,'${sanitizeURL(i.fileUrl)}','${i.id}','${i.type}')">
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
    "LATEST_NEWS",
    "ACADEMIC_CALENDAR",
    "SYLLABUS",
    "HOLIDAY_LIST"
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

function renderNews(){

  const newsBox = document.getElementById("newsContainer");
  const docsBox = document.getElementById("noticeDocsContainer");

  if(!newsBox || !docsBox) return;

  const NEWS_TYPES = new Set(["MESSAGE","LATEST_NEWS"]);

  const now = Date.now();
  const ONE_DAY = 86400000;
  const THREE_DAY = 3 * ONE_DAY;

  const filtered = allContent
    .filter(c=>{
      if(!c || !NEWS_TYPES.has(String(c.type).toUpperCase()))
        return false;

      if(!c.uploadedAtTs) return true;

      return (now - c.uploadedAtTs) <= THREE_DAY;
    })
    .sort((a,b)=>(b.uploadedAtTs||0)-(a.uploadedAtTs||0));

  const text = [];
  const docs = [];

  filtered.forEach(c=>{
    if(c.fileUrl && c.fileUrl.trim()!==""){
      docs.push(c);
    }else{
      text.push(c);
    }
  });

  /* ================= TEXT NEWS ================= */

  if(!text.length){

    newsBox.innerHTML = `
      <div class="empty-news">
        <span>📭</span>
        No announcements yet
      </div>
    `;

  }else{

    newsBox.innerHTML = text.map(n=>{

      const age = now - (n.uploadedAtTs||0);
      const isNew = age <= ONE_DAY;

      return `
        <div class="news-item">
          <div>
            ${escapeHTML(n.message || n.title || "Notice")}
            ${isNew ? `<span class="news-badge">NEW</span>`:""}
          </div>
        </div>
      `;

    }).join("");

  }

  /* ================= DOCUMENTS ================= */

  if(!docs.length){

    docsBox.innerHTML = `
      <div class="empty-news">
        <span>📄</span>
        No notice documents
      </div>
    `;

  }else{

    docsBox.innerHTML = docs.map(d=>{

      const age = now - (d.uploadedAtTs||0);
      const isNew = age <= ONE_DAY;

      return `
        <div class="news-item">

          <div>
            ${escapeHTML(d.message || d.title || "Notice")}
            ${isNew ? `<span class="news-badge">NEW</span>`:""}
          </div>

          <a href="#"
             onclick="openNoticeDocument('${d.id}','${sanitizeURL(d.fileUrl)}')">
             View
          </a>

        </div>
      `;

    }).join("");

  }
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

function trackView(uploadId, type){

  /* ======================
     SAFE ITEM FETCH
  ====================== */
  let item = null;

  try{
    item = Array.isArray(allContent)
      ? allContent.find(c => c.id === uploadId)
      : null;
  }catch(e){
    console.warn("Item find failed", e);
  }

  /* ======================
     ACTIVITY TRACK (LOCAL)
  ====================== */
  try{
    if(typeof logActivity === "function" && item){
      logActivity("VIEW", item);
    }
  }catch(e){
    console.warn("Activity log failed", e);
  }

  /* ======================
     BACKEND TRACK (ASYNC)
  ====================== */
  try{
    studentFetch({
      action: "track",
      uploadId,
      actionType: "VIEWED",
      sessionToken: getSessionToken()
    }).catch(()=>{});
  }catch(e){
    console.warn("Backend track failed", e);
  }

  /* ======================
     UI INSTANT UPDATE
  ====================== */
  try{

    const t = String(type || "").toUpperCase();

    /* ---------- NOTES ---------- */
    if(t === "NOTES"){

      const notesEl = document.getElementById("prodNotes");
      const engNotes = document.getElementById("engNotes");

      if(notesEl){
        notesEl.innerText = (Number(notesEl.innerText) || 0) + 1;
      }

      if(engNotes){
        engNotes.innerText = (Number(engNotes.innerText) || 0) + 1;
      }
    }

    /* ---------- ASSIGNMENTS ---------- */
    else if(t === "ASSIGNMENT"){

      const assignEl = document.getElementById("scoreAssignments");

      if(assignEl){
        assignEl.innerText = (Number(assignEl.innerText) || 0) + 1;
      }
    }

    /* ---------- PYQ ---------- */
    else if(t === "PYQ"){

      const pyqEl = document.getElementById("scoreNotes");

      if(pyqEl){
        pyqEl.innerText = (Number(pyqEl.innerText) || 0) + 1;
      }
    }

  }catch(e){
    console.warn("View counter update failed", e);
  }

  /* ======================
     🔥 REAL-TIME UI SYNC
  ====================== */
  try{

    setTimeout(() => {

      if(typeof renderRecentActions === "function"){
        renderRecentActions();
      }

      if(typeof renderLatestUploads === "function"){
        renderLatestUploads();
      }

    }, 120);

  }catch(e){
    console.warn("Live UI sync failed", e);
  }

  /* ======================
     📊 UPDATE SCORE
  ====================== */
  if(typeof updateActivityScore === "function"){
    setTimeout(() => renderSmartWidgets(), 150);
  }

}

function trackDownload(e, url, uploadId){

  /* ======================
     PREVENT DEFAULT
  ====================== */
  if(e && e.preventDefault) e.preventDefault();

  let finalUrl = url || "";

  /* ======================
     SAFE ITEM FETCH
  ====================== */
  let item = null;

  try{
    item = Array.isArray(allContent)
      ? allContent.find(c => c.id === uploadId)
      : null;
  }catch(err){
    console.warn("Item fetch failed", err);
  }

  /* ======================
     🔥 DUPLICATE PREVENTION
  ====================== */
  try{
    const key = "download_" + uploadId;

    if(sessionStorage.getItem(key)){
      // already downloaded in this session → skip duplicate count
    }else{
      sessionStorage.setItem(key, "1");

      /* ======================
         ACTIVITY TRACK (LOCAL)
      ====================== */
      if(typeof logActivity === "function" && item){
        logActivity("DOWNLOAD", item);
      }

      /* ======================
         UI INSTANT UPDATE (ALL)
      ====================== */
      const prodEl = document.getElementById("prodDownloads");
      const engEl  = document.getElementById("engDownloads");
      const scoreEl = document.getElementById("scoreDownloads"); // 🔥 IMPORTANT FIX

      if(prodEl){
        prodEl.innerText = (Number(prodEl.innerText) || 0) + 1;
      }

      if(engEl){
        engEl.innerText = (Number(engEl.innerText) || 0) + 1;
      }

      if(scoreEl){
        scoreEl.innerText = (Number(scoreEl.innerText) || 0) + 1;
      }
    }

  }catch(err){
    console.warn("Duplicate or UI update failed", err);
  }

  /* ======================
     GOOGLE DRIVE FIX
  ====================== */
  try{

    if(finalUrl.includes("drive.google.com")){

      const match1 = finalUrl.match(/\/d\/([^\/]+)/);
      if(match1 && match1[1]){
        finalUrl = `https://drive.google.com/uc?export=download&id=${match1[1]}`;
      }

      const match2 = finalUrl.match(/[?&]id=([^&]+)/);
      if(match2 && match2[1]){
        finalUrl = `https://drive.google.com/uc?export=download&id=${match2[1]}`;
      }
    }

  }catch(err){
    console.warn("Drive URL parse failed", err);
  }

  /* ======================
     🔥 REAL-TIME UI SYNC
  ====================== */
  try{

    setTimeout(() => {

      if(typeof renderRecentActions === "function"){
        renderRecentActions();
      }

      if(typeof renderLatestUploads === "function"){
        renderLatestUploads();
      }

    }, 120);

  }catch(err){
    console.warn("Live UI sync failed", err);
  }

  /* ======================
     🔥 UPDATE ACTIVITY SCORE
  ====================== */
  if(typeof updateActivityScore === "function"){
    setTimeout(() => renderSmartWidgets(), 150);
  }

  /* ======================
     BACKEND TRACK (ASYNC)
  ====================== */
  try{

    setTimeout(() => {
      studentFetch({
        action: "track",
        uploadId,
        actionType: "DOWNLOADED",
        sessionToken: getSessionToken()
      }).catch(()=>{});
    }, 0);

  }catch(err){
    console.warn("Backend track failed", err);
  }

  /* ======================
     SAFE DOWNLOAD OPEN
  ====================== */
  try{

    const newTab = window.open(finalUrl, "_blank");

    if(!newTab){
      window.location.href = finalUrl;
    }

  }catch(err){
    console.warn("Redirect failed", err);
  }

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

/* ===============================
   UPDATE LATEST NOTICE BADGE
================================ */

function updateNewsBadge(){

  const badge = document.getElementById("newsBadge");
  if(!badge) return;

  if(!Array.isArray(allContent)){
    badge.style.display="none";
    return;
  }

  const NEWS_TYPES = new Set(["MESSAGE","LATEST_NEWS"]);

  const now = Date.now();
  const THREE_DAY = 3 * 24 * 60 * 60 * 1000;

  let count = 0;

  for(const c of allContent){

    if(!c) continue;

    const type = String(c.type || "").toUpperCase();

    if(!NEWS_TYPES.has(type)) continue;

    if(!c.uploadedAtTs){
      count++;
      continue;
    }

    const age = now - Number(c.uploadedAtTs);

    if(age <= THREE_DAY){
      count++;
    }

  }

  if(count > 0){
    badge.innerText = count;
    badge.style.display = "inline-block";
  }else{
    badge.innerText = "";
    badge.style.display = "none";
  }

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

  if (v === null || v === undefined) return "";

  return String(v)
    .trim()
    .toUpperCase()

    
    .replace(/[\s\-]+/g, "_")   // spaces & hyphen → underscore
 
    .replace(/[^\w]/g, "_")     // remove special characters

    .replace(/__+/g, "_")       // multiple underscores → single

    .replace(/^_+|_+$/g, "");   // remove leading / trailing underscore

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

/* =========================================
   ENTERPRISE NOTIFICATION SYSTEM
========================================= */

const MAX_NOTIFICATIONS = 50;

let notifications = JSON.parse(localStorage.getItem("STUDENT_NOTIFS") || "[]");
let unreadCount = notifications.filter(n => !n.read).length;

/* =========================================
   💾 SAVE NOTIFICATIONS (FINAL PRO)
========================================= */

function saveNotifications(){

  try{

    /* ===============================
       🧠 VALIDATE DATA
    =============================== */
    if(!Array.isArray(notifications)){
      console.warn("Invalid notifications data");
      return;
    }

    /* ===============================
       ⚡ LIMIT DATA (PERFORMANCE)
    =============================== */
    const MAX_LIMIT = 100;

    if(notifications.length > MAX_LIMIT){
      notifications = notifications
        .sort((a,b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, MAX_LIMIT);
    }

    /* ===============================
       🧹 SANITIZE OBJECTS
    =============================== */
    const cleanData = notifications.map(n => ({
      id    : n.id || "",
      title : String(n.title || "").slice(0, 200),
      type  : n.type || "GENERAL",
      ts    : Number(n.ts) || Date.now(),
      read  : Boolean(n.read)
    }));

    /* ===============================
       💾 PRIMARY SAVE
    =============================== */
    const dataString = JSON.stringify(cleanData);

    localStorage.setItem("STUDENT_NOTIFICATIONS", dataString);

    /* ===============================
       🧷 BACKUP SAVE (FAIL SAFE)
    =============================== */
    localStorage.setItem("STUDENT_NOTIFICATIONS_BACKUP", dataString);

  }catch(err){

    console.error("❌ Notification save failed:", err);

    /* ===============================
       🚑 FALLBACK (TRY MIN SAVE)
    =============================== */
    try{

      const minimal = (notifications || []).slice(0,20);

      localStorage.setItem(
        "STUDENT_NOTIFICATIONS",
        JSON.stringify(minimal)
      );

    }catch(e){
      console.warn("⚠️ Critical storage failure");
    }

  }
}

/* =========================================
   LIVE POPUP
========================================= */

function showNewContentPopup(item){

  if(!item) return;

  const popup = document.createElement("div");
  popup.className = "live-popup";

  const title = item?.title || item?.message || "New content available";
  const type  = (item?.type || "").toUpperCase();

  popup.innerHTML = `
    <div class="popup-box">

      <div class="popup-icon">📢</div>

      <div class="popup-text">
        <div class="popup-title">New content uploaded</div>
        <div class="popup-sub">${escapeHTML(title)}</div>
      </div>

    </div>
  `;

  popup.onclick = () => {

    popup.remove();
    openNotification(type);

  };

  document.body.appendChild(popup);

  setTimeout(()=>{
    popup.remove();
  },6000);

}

/* =========================================
   LIVE CONTENT UPDATE CHECK (STREAMING)
========================================= */

let updateRunning = false;

async function checkContentUpdate(){

  if(updateRunning) return;
  updateRunning = true;

  try{

    const token = getSessionToken();
    if(!token) return;

    const res = await studentFetch({
      action:"student_dashboard",
      sessionToken:token
    });

    if(!res || res.status !== "ok") return;

    const newVersion = res.contentVersion || "0";

    /* ===============================
       CHECK VERSION CHANGE
    =============================== */

    if(lastContentVersion && newVersion !== lastContentVersion){

      lastContentVersion = newVersion;

      const latest = res.content?.[0] || {};

      /* ===============================
         POPUP + NOTIFICATION
      =============================== */

      if(typeof showNewContentPopup === "function"){
        showNewContentPopup(latest);
      }

      if(typeof addNotification === "function"){
        addNotification({
          title: latest.title || latest.message || "New content available",
          type: latest.type || "",
          ts: Date.now()
        });
      }

      /* ===============================
         UPDATE STATE
      =============================== */

      allContent = Array.isArray(res.content)
        ? res.content
        : [];

      dashboardSummary = res.summary || {};

      /* ===============================
         UPDATE SUMMARY CARDS
      =============================== */

      setText("totalNotes", dashboardSummary.notes);
      setText("totalAssignments", dashboardSummary.assignments);
      setText("pendingAssignments", dashboardSummary.pending);
      setText("expiredAssignments", dashboardSummary.expired);
      setText("totalPyq", dashboardSummary.pyq);
      setText("totalMessages", dashboardSummary.messages);

      /* ===============================
         LIVE DASHBOARD RENDER
      =============================== */

      requestAnimationFrame(()=>{

        if(typeof renderNews === "function")
          renderNews();

        if(typeof renderUpcomingDeadlines === "function")
          renderUpcomingDeadlines();

        if(typeof renderSubjectProgress === "function")
          renderSubjectProgress();

        if(typeof renderSmartWidgets === "function")
          renderSmartWidgets();

        if(typeof updateNewsBadge === "function")
          updateNewsBadge();

      });

    }

  }catch(e){

    console.warn("Content update check failed", e);

  }finally{

    updateRunning = false;

  }

}

/* =========================================
   ADD NOTIFICATION
========================================= */

function addNotification(data){

  if(!data) return;

  const exists = notifications.some(n =>
    n.title === data.title &&
    n.type === data.type
  );

  if(exists) return;

  notifications.unshift({
    title: data.title,
    type: data.type,
    ts: data.ts || Date.now(),
    read:false
  });

  if(notifications.length > MAX_NOTIFICATIONS){
    notifications.length = MAX_NOTIFICATIONS;
  }

  unreadCount++;

  saveNotifications();
  renderNotifications();

}

/* =========================================
   🔔 FINAL ADVANCED NOTIFICATION RENDER
========================================= */

function renderNotifications(){

  const box   = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifCount");

  if(!box || !badge) return;

  try{

    /* ===============================
       🧠 SAFE DATA CHECK
    =============================== */
    if(!Array.isArray(notifications)){
      notifications = [];
    }

    /* ===============================
       🔢 UNREAD COUNT (FAST)
    =============================== */
    unreadCount = 0;

    for(let i = 0; i < notifications.length; i++){
      if(!notifications[i]?.read){
        unreadCount++;
      }
    }

    /* ===============================
       🎯 BADGE UPDATE
    =============================== */
    if(unreadCount > 0){
      badge.innerText = unreadCount > 99 ? "99+" : unreadCount;
      badge.style.display = "flex";
    }else{
      badge.innerText = "";
      badge.style.display = "none";
    }

    /* ===============================
       📭 EMPTY STATE (PREMIUM)
    =============================== */
    if(notifications.length === 0){

      box.innerHTML = `
        <div class="notif-header">
          <span>Notifications</span>
        </div>

        <div class="notif-empty">
          <div class="notif-empty-icon">🔔</div>
          <div class="notif-empty-text">
            You're all caught up 🎉
          </div>
        </div>
      `;

      return;
    }

    /* ===============================
       ⚡ SORT (LATEST FIRST)
    =============================== */
    notifications.sort((a,b) => (b.ts || 0) - (a.ts || 0));

    /* ===============================
       🧩 BUILD LIST (OPTIMIZED)
    =============================== */
    let html = "";
    const limit = Math.min(notifications.length, 20);

    for(let i = 0; i < limit; i++){

      const n = notifications[i];
      if(!n) continue;

      const title = escapeHTML(n.title || "Notification");
      const time  = formatNotifTime(n.ts);
      const unreadClass = n.read ? "" : "unread";

      html += `
        <div class="notif-item ${unreadClass}"
             data-index="${i}"
             onclick="openNotification('${n.type}', ${i})">

          <div class="notif-row">

            <div class="notif-title">
              ${title}
            </div>

            ${!n.read ? `<span class="notif-dot"></span>` : ""}

          </div>

          <div class="notif-time">
            ${time}
          </div>

        </div>
      `;
    }

    /* ===============================
       🧠 HEADER ACTIONS (SMART)
    =============================== */
    const showMarkAll = unreadCount > 0;

    /* ===============================
       🧾 FINAL DOM WRITE (SINGLE)
    =============================== */
    box.innerHTML = `
      <div class="notif-header">

        <span>Notifications</span>

        <div class="notif-header-actions">

          ${
            showMarkAll
            ? `<button class="notif-mark"
                 onclick="markAllNotificationsRead(event)">
                 Mark all
               </button>`
            : ""
          }

          <button class="notif-clear"
                  onclick="clearNotifications(event)">
            Clear
          </button>

        </div>

      </div>

      <div class="notif-body">
        ${html}
      </div>
    `;

  }catch(err){

    console.error("❌ Notification render failed:", err);

    box.innerHTML = `
      <div class="notif-empty">
        ⚠️ Failed to load notifications
      </div>
    `;
  }
}

function markAllNotificationsRead(e){

  if(e) e.stopPropagation();

  for(let i = 0; i < notifications.length; i++){
    notifications[i].read = true;
  }

  saveNotifications();
  renderNotifications();
}

/* =========================================
   FORMAT TIME
========================================= */
function formatNotifTime(ts){

  const d = new Date(ts);
  const now = new Date();

  const diff = now - d;

  const oneDay = 86400000;

  if(diff < oneDay){

    return d.toLocaleTimeString([],{
      hour:"2-digit",
      minute:"2-digit"
    });

  }

  if(diff < oneDay * 2){
    return "Yesterday";
  }

  return d.toLocaleDateString();
}

/* =========================================
   🧹 CLEAR NOTIFICATIONS (PRO VERSION)
========================================= */

function clearNotifications(e){

  try{

    /* ===============================
       🛑 PREVENT EVENT BUBBLE
    =============================== */
    if(e && typeof e.stopPropagation === "function"){
      e.stopPropagation();
    }

    const box   = document.getElementById("notifDropdown");
    const badge = document.getElementById("notifCount");

    /* ===============================
       ⚡ UI FEEDBACK (SMOOTH CLEAR)
    =============================== */
    if(box){

      box.style.opacity = "0";
      box.style.transform = "scale(0.98)";

      setTimeout(()=>{

        /* ===============================
           🧠 RESET STATE
        =============================== */
        notifications = [];
        unreadCount   = 0;

        /* ===============================
           💾 STORAGE CLEAN (SAFE)
        =============================== */
        try{
          localStorage.removeItem("STUDENT_NOTIFICATIONS");
        }catch(err){
          console.warn("Storage clear failed");
        }

        /* ===============================
           🔢 BADGE RESET
        =============================== */
        if(badge){
          badge.innerText = "";
          badge.style.display = "none";
        }

        /* ===============================
           🔁 RE-RENDER UI
        =============================== */
        renderNotifications();

        /* ===============================
           🔔 USER FEEDBACK (OPTIONAL)
        =============================== */
        if(typeof showLiveToast === "function"){
          showLiveToast("Notifications cleared", "success");
        }

        /* ===============================
           🔄 RESTORE ANIMATION STATE
        =============================== */
        box.style.opacity = "1";
        box.style.transform = "scale(1)";

      },180);

    }

  }catch(err){

    console.error("❌ Clear notifications failed:", err);

  }
}

/* =========================================
   🔔 ADVANCED TOGGLE DROPDOWN
========================================= */

let notifOpen = false;

function toggleNotifications(){

  const box  = document.getElementById("notifDropdown");
  const bell = document.querySelector(".notification-bell");

  if(!box || !bell) return;

  notifOpen = !notifOpen;

  if(notifOpen){

    box.style.display = "flex";

    requestAnimationFrame(()=>{
      box.style.opacity = "1";
      box.style.transform = "translateY(0)";
    });

    // Remove pulse when opened
    bell.classList.remove("new");

  } else {

    box.style.opacity = "0";
    box.style.transform = "translateY(-8px)";

    setTimeout(()=>{
      box.style.display = "none";
    },200);
  }
}

/* =========================================
   CLOSE ON OUTSIDE CLICK
========================================= */

document.addEventListener("click", function(e){

  const bell = document.querySelector(".notification-bell");
  const box  = document.getElementById("notifDropdown");

  if(!bell || !box) return;

  if(!bell.contains(e.target)){

    notifOpen = false;

    box.style.opacity = "0";
    box.style.transform = "translateY(-8px)";

    setTimeout(()=>{
      box.style.display = "none";
    },200);

  }

});

/* =========================================
   🚀 OPEN NOTIFICATION (ADVANCED)
========================================= */

function openNotification(type, index = null){

  try{

    /* =========================
       🧠 MARK AS READ
    ========================= */
    if(index !== null && notifications[index]){

      if(!notifications[index].read){

        notifications[index].read = true;

        unreadCount = Math.max(0, unreadCount - 1);

        updateNotificationBadge();
        saveNotifications();

      }

    }

    /* =========================
       🔄 ROUTING SYSTEM
    ========================= */
    const routes = {
      ASSIGNMENT : () => showFiltered("ASSIGNMENT"),
      NOTES      : () => showFiltered("NOTES"),
      PYQ        : () => showFiltered("PYQ"),
      MESSAGE    : () => showFiltered("MESSAGE"),
      DEFAULT    : () => showDashboard()
    };

    const action = routes[String(type || "").toUpperCase()] || routes.DEFAULT;

    action();

    /* =========================
       🔽 CLOSE DROPDOWN
    ========================= */
    closeNotifications();

  }catch(err){

    console.warn("Notification open failed", err);
    showDashboard();

  }
}

function closeNotifications(){

  const box = document.getElementById("notifDropdown");

  if(!box) return;

  notifOpen = false;

  box.style.opacity = "0";
  box.style.transform = "translateY(-8px)";

  setTimeout(()=>{
    box.style.display = "none";
  },200);
}

function updateNotificationBadge(){

  const badge = document.getElementById("notifCount");

  if(!badge) return;

  badge.innerText = unreadCount;

  badge.style.display = unreadCount > 0 ? "block" : "none";
}

/* =========================================
   INIT ON LOAD
========================================= */

document.addEventListener("DOMContentLoaded",()=>{

  renderNotifications();

});

/* =========================================
   SMART DASHBOARD WIDGETS (FINAL VERSION)
========================================= */

function renderSmartWidgets(){

  /* =========================
     EMPTY STATE
  ========================= */
  if(!Array.isArray(allContent) || !allContent.length){

    setText("todayNotes", 0);
    setText("todayAssignments", 0);
    setText("todayNotices", 0);

    setText("scoreNotes", 0);
    setText("scoreAssignments", 0);
    setText("scoreDownloads", 0);

    updateActivityScore(0);
    renderLearningHeatmap([]);

    const reminder = document.getElementById("studyReminder");
    if(reminder) reminder.innerText = "No activity yet.";

    return;
  }

  const now = Date.now();
  const ONE_DAY = 86400000;

  /* =========================
     COUNTERS
  ========================= */
  let todayNotes = 0;
  let todayAssignments = 0;
  let todayNotices = 0;

  let views = 0;
  let assignments = 0;
  let downloads = 0;

  /* =========================
     🔥 REAL USER ACTIVITY
  ========================= */
  let activityLog = [];

  try{
    const log = JSON.parse(localStorage.getItem("student_activity_log") || "[]");

    activityLog = log;

    for(const a of log){

      if(!a || !a.type) continue;

      const type = String(a.type).toUpperCase();
      const action = String(a.action).toUpperCase();
  
      if(action === "VIEW"){
        views++;

        if(type === "ASSIGNMENT"){
          assignments++;
        }
      }

      if(action === "DOWNLOAD"){
        downloads++;
      }
    }

  }catch(e){
    console.warn("Activity log parse failed");
    activityLog = [];
  }

  /* =========================
     TODAY CONTENT (UNCHANGED)
  ========================= */
  for(const c of allContent){

    if(!c) continue;

    const type = String(c.type || "").toUpperCase();
    const ts = Number(c.uploadedAtTs) || 0;

    const isToday = ts && (now - ts <= ONE_DAY);

    if(isToday){
      if(type === "NOTES") todayNotes++;
      else if(type === "ASSIGNMENT") todayAssignments++;
      else if(type === "MESSAGE" || type === "LATEST_NEWS") todayNotices++;
    }
  }

  /* =========================
     UI UPDATE
  ========================= */
  setText("todayNotes", todayNotes);
  setText("todayAssignments", todayAssignments);
  setText("todayNotices", todayNotices);

  setText("scoreNotes", views);
  setText("scoreAssignments", assignments);
  setText("scoreDownloads", downloads);

  /* =========================
     SCORE CALCULATION (FIXED)
  ========================= */
  const score =
    (views * 2) +
    (assignments * 3) +
    (downloads * 2);

  const percent = Math.min(Math.round(score * 5), 100);

  updateActivityScore(percent);

  /* =========================
     SMART REMINDER (IMPROVED)
  ========================= */
  const reminder = document.getElementById("studyReminder");

  if(reminder){

    let msg = "";

    const totalActivity = views + assignments + downloads;

    if(todayAssignments > 0){
      msg = `⚠️ ${todayAssignments} assignment pending today`;
    }
    else if(totalActivity === 0){
      msg = "🚀 Start studying now";
    }
    else if(totalActivity < 3){
      msg = "⚡ Try to stay consistent";
    }
    else if(downloads > views){
      msg = "📥 You download more than study";
    }
    else if(score > 50){
      msg = "🔥 Excellent consistency";
    }
    else{
      msg = "📈 You're on track";
    }

    reminder.innerText = msg;
  }

  /* =========================
     🔥 HEATMAP (FIXED)
  ========================= */
  renderLearningHeatmap(activityLog.map(a => a.time));
}

/* =====================================
   UPDATE ACTIVITY SCORE BAR
===================================== */
function updateActivityScore(customPercent = null){

  try{

    /* =========================
       GET ELEMENTS (SAFE)
    ========================= */
    const notesEl = document.getElementById("scoreNotes");
    const assignEl = document.getElementById("scoreAssignments");
    const downloadEl = document.getElementById("scoreDownloads");

    const fill = document.getElementById("scoreFill");
    const label = document.getElementById("scorePercent");
    const levelEl = document.getElementById("scoreLevel");

    /* 🔥 SMART FOCUS ELEMENTS */
    const focusBar = document.getElementById("focusBar");
    const focusBadge = document.getElementById("focusBadge");

    /* =========================
       GET VALUES (SAFE PARSE)
    ========================= */
    const notes = parseInt(notesEl?.innerText) || 0;
    const assignments = parseInt(assignEl?.innerText) || 0;
    const downloads = parseInt(downloadEl?.innerText) || 0;

    /* =========================
       SCORE CALCULATION (IMPROVED)
    ========================= */
    const score =
      (notes * 2) +
      (assignments * 3) +
      (downloads * 2);

    let percent;

    if(typeof customPercent === "number"){
      percent = Math.min(Math.max(customPercent, 0), 100);
    }else{
      percent = Math.min(Math.round(score * 5), 100);
    }

    /* =========================
       UPDATE MAIN PROGRESS
    ========================= */
    if(fill){
      fill.style.width = percent + "%";

      // 🎨 Gradient colors (pro UI)
      if(percent >= 80){
        fill.style.background = "linear-gradient(90deg,#22c55e,#4ade80)";
      }
      else if(percent >= 50){
        fill.style.background = "linear-gradient(90deg,#38bdf8,#60a5fa)";
      }
      else{
        fill.style.background = "linear-gradient(90deg,#f59e0b,#fbbf24)";
      }
    }

    if(label){
      label.innerText = percent + "%";
    }

    /* =========================
       LEVEL SYSTEM (ENHANCED)
    ========================= */
    let level = "😴 Inactive";

    if(percent >= 85) level = "🔥 Excellent";
    else if(percent >= 65) level = "🚀 Highly Active";
    else if(percent >= 40) level = "📈 Improving";
    else if(percent >= 20) level = "⚡ Getting Started";

    if(levelEl){
      levelEl.innerText = level;
    }

    /* =========================
       🔥 SMART FOCUS INTEGRATION
    ========================= */
    if(focusBar){

      focusBar.style.width = percent + "%";

      if(percent >= 75){
        focusBar.style.background = "linear-gradient(90deg,#22c55e,#4ade80)";
        if(focusBadge) focusBadge.innerText = "🔥 High Focus";
      }
      else if(percent >= 40){
        focusBar.style.background = "linear-gradient(90deg,#f59e0b,#fbbf24)";
        if(focusBadge) focusBadge.innerText = "⚡ Moderate";
      }
      else{
        focusBar.style.background = "linear-gradient(90deg,#ef4444,#f87171)";
        if(focusBadge) focusBadge.innerText = "⚠️ Low Focus";
      }

    }

  }catch(err){

    console.warn("Activity score update failed:", err);

  }
}

function renderRecentActions(){

  const box = document.getElementById("recentActions");
  if(!box) return;

  const log = JSON.parse(localStorage.getItem("student_activity_log") || "[]");

  if(!log.length){
    box.innerHTML = `
      <div class="empty-activity">
        📭 No recent activity
      </div>
    `;
    return;
  }

  box.innerHTML = log.slice(0,5).map(item => {

    let icon = "📄";
    let color = "#64748b";

    if(item.type==="NOTES"){ icon="📘"; color="#2563eb"; }
    if(item.type==="ASSIGNMENT"){ icon="📝"; color="#16a34a"; }
    if(item.type==="PYQ"){ icon="📂"; color="#9333ea"; }
    if(item.type==="LATEST_NEWS"){ icon="📰"; color="#f59e0b"; }

    const actionText =
      item.action === "DOWNLOAD"
        ? "Downloaded"
        : "Viewed";

    return `
      <div class="activity-item">

        <div class="activity-left">
          <div class="activity-icon" style="color:${color}">
            ${icon}
          </div>

          <div class="activity-info">
            <div class="activity-title">
              ${item.title}
            </div>

            <div class="activity-meta">
              ${actionText}
            </div>
          </div>
        </div>

        <div class="activity-time">
          ${formatTimeAgo(item.time)}
        </div>

      </div>
    `;

  }).join("");
}

function renderLatestUploads(){

  const box = document.getElementById("latestUploads");
  if(!box) return;

  const uploads = (Array.isArray(allContent)?allContent:[])
    .filter(c=>{
      const type=(c?.type||"").toUpperCase();
      return type!=="MESSAGE";
    })
    .sort((a,b)=>(b.uploadedAtTs||0)-(a.uploadedAtTs||0))
    .slice(0,4);

  if(!uploads.length){
    box.innerHTML=`<div class="empty-activity">📭 No updates</div>`;
    return;
  }

  box.innerHTML = uploads.map(c=>{

    const type=(c?.type||"").toUpperCase();
    const title=c?.title||"Untitled";
    const url=sanitizeURL(c?.fileUrl||"#");

    let icon="📄";
    if(type==="NOTES") icon="📘";
    else if(type==="ASSIGNMENT") icon="📝";
    else if(type==="PYQ") icon="📂";
    else if(type==="LATEST_NEWS") icon="📰";

    return `
      <div class="update-item">

        <div class="update-left">
          <span class="update-icon">${icon}</span>
          <span class="update-title">${title}</span>
        </div>

        <button class="update-view-btn"
          onclick="handleUpdateClick('${c.id}','${url}','${type}','VIEW')">
          View →
        </button>

      </div>
    `;

  }).join("");
}

function formatTimeAgo(ts){

  const diff = Date.now() - ts;

  if(diff < 60000) return "now";
  if(diff < 3600000) return Math.floor(diff/60000)+"m";
  if(diff < 86400000) return Math.floor(diff/3600000)+"h";
  return Math.floor(diff/86400000)+"d";
}

function handleUpdateClick(id,url,type,action){

  if(!id) return;

  /* ======================
     TRACK (VIEW/DOWNLOAD)
  ====================== */
  if(action==="VIEW"){
    trackView(id,type);
  }

  /* ======================
     OPEN FILE
  ====================== */
  try{
    const win = window.open(url,"_blank");
    if(!win){
      window.location.href=url;
    }
  }catch(e){
    console.warn("Open failed");
  }
}

/* =====================================
   LEARNING HEATMAP (14 DAYS) — FINAL PRO
===================================== */

function renderLearningHeatmap(activityLog){

  const grid = document.getElementById("learningHeatmap");
  if(!grid) return;

  grid.innerHTML = "";

  /* =========================
     SAFE DATA CHECK
  ========================= */
  if(!Array.isArray(activityLog)){
    activityLog = [];
  }

  /* =========================
     BUILD ACTIVITY MAP (STORE EVENTS)
  ========================= */
  const activity = {};

  for(const ts of activityLog){

    if(!ts) continue;

    const d = new Date(Number(ts));
    if(isNaN(d.getTime())) continue;

    const key =
      d.getFullYear() + "-" +
      String(d.getMonth()+1).padStart(2,'0') + "-" +
      String(d.getDate()).padStart(2,'0');

    if(!activity[key]) activity[key] = [];

    activity[key].push(ts); // 🔥 store events (important)
  }

  /* =========================
     GENERATE LAST 14 DAYS
  ========================= */
  for(let i = 13; i >= 0; i--){

    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - i);

    const key =
      d.getFullYear() + "-" +
      String(d.getMonth()+1).padStart(2,'0') + "-" +
      String(d.getDate()).padStart(2,'0');

    const events = activity[key] || [];
    const count = events.length;

    /* =========================
       LEVEL LOGIC
    ========================= */
    let level = 0;

    if(count >= 5) level = 4;
    else if(count >= 3) level = 3;
    else if(count >= 2) level = 2;
    else if(count >= 1) level = 1;

    /* =========================
       CREATE CELL
    ========================= */
    const cell = document.createElement("div");

    cell.className = "heatmap-cell level-" + level;

    cell.title =
      d.toDateString() +
      " • " +
      count +
      (count === 1 ? " activity" : " activities");

    /* =========================
       🔥 CLICK EVENT (MAIN FEATURE)
    ========================= */
    cell.style.cursor = "pointer";

    cell.onclick = () => {
      showHeatmapDetails(d, events);
    };

    grid.appendChild(cell);
  }

}


/* =====================================
   📊 SHOW HEATMAP DETAILS (CLICK POPUP)
===================================== */
function showHeatmapDetails(date, events){

  const modal = document.getElementById("heatmapModal");
  const title = document.getElementById("heatmapDate");
  const list  = document.getElementById("heatmapList");

  if(!modal || !title || !list) return;

  title.innerText = "📅 " + date.toDateString();

  list.innerHTML = "";

  if(!events || events.length === 0){
    list.innerHTML = `<div class="heatmap-item">No activity</div>`;
  } else {

    const log = JSON.parse(localStorage.getItem("student_activity_log") || "[]");

    const dayKey =
      date.getFullYear() + "-" +
      String(date.getMonth()+1).padStart(2,'0') + "-" +
      String(date.getDate()).padStart(2,'0');

    const filtered = log.filter(item => {

      const d = new Date(item.time);

      const key =
        d.getFullYear() + "-" +
        String(d.getMonth()+1).padStart(2,'0') + "-" +
        String(d.getDate()).padStart(2,'0');

      return key === dayKey;
    });

    list.innerHTML = filtered.map(item => `
      <div class="heatmap-item">
        <strong>${item.title}</strong><br>
        <small>${item.action}</small>
      </div>
    `).join("");
  }

  modal.style.display = "flex";
}

function closeHeatmapModal(){
  const modal = document.getElementById("heatmapModal");
  if(modal) modal.style.display = "none";
}

/* =====================================
   SAFE TEXT UPDATE
===================================== */

function safeText(id,value){

  const el = document.getElementById(id);

  if(el){
    el.innerText = value;
  }

}

/* =====================================
   🔥 REAL ACTIVITY TRACKER
===================================== */

const ACTIVITY_KEY = "student_activity_log";

function logActivity(action, item){

  if(!item || !item.id) return;

  const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");

  log.unshift({
    id: item.id,
    title: item.title || "Untitled",
    type: (item.type || "").toUpperCase(),
    action: action,
    time: Date.now()
  });

  localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify(log.slice(0,20))
  );
}

function updateTodayBars(){

  const MAX_LIMIT = 10;

  const notesEl = document.getElementById("todayNotes");
  const assignEl = document.getElementById("todayAssignments");
  const noticeEl = document.getElementById("todayNotices");

  const notesBar = document.getElementById("todayNotesBar");
  const assignBar = document.getElementById("todayAssignmentsBar");
  const noticeBar = document.getElementById("todayNoticesBar");

  if(!notesEl || !assignEl || !noticeEl) return;

  const notes = Number(notesEl.innerText) || 0;
  const assignments = Number(assignEl.innerText) || 0;
  const notices = Number(noticeEl.innerText) || 0;

  const calc = v => Math.min(100, (v / MAX_LIMIT) * 100);

  if(notesBar) notesBar.style.width = calc(notes) + "%";
  if(assignBar) assignBar.style.width = calc(assignments) + "%";
  if(noticeBar) noticeBar.style.width = calc(notices) + "%";

}

function isAdmin(){
  const role = (localStorage.getItem("ROLE") || "").toUpperCase();
  return role === "ADMIN";
}
function updateTodayOverview(){

  const role = (localStorage.getItem("ROLE") || "").toUpperCase();
  const batch = localStorage.getItem("BATCH");

  let data = [];

  if(role === "ADMIN"){
    data = allContent; // admin sees everything
  }else{
    data = allContent.filter(c => {
      if(!c.batch) return true;
      return c.batch === batch;
    });
  }

  const notes = data.filter(c=>safeType(c.type)==="NOTES").length;
  const assignments = data.filter(c=>safeType(c.type)==="ASSIGNMENT").length;
  const notices = data.filter(c=>safeType(c.type)==="MESSAGE").length;

  setText("todayNotes",notes);
  setText("todayAssignments",assignments);
  setText("todayNotices",notices);

  updateTodayBars();
}

function renderAcademicResources(){

  const grid = document.getElementById("academicResourceGrid");
  if(!grid) return;

  /* =========================
     VALIDATE SOURCE DATA
  ========================= */

  if(!Array.isArray(allContent)){
    grid.innerHTML = "";
    return;
  }

  /* =========================
     FILTER RESOURCE TYPES
  ========================= */

  const RESOURCE_TYPES = new Set([
    "ACADEMIC_CALENDAR",
    "SYLLABUS",
    "HOLIDAY_LIST"
  ]);

  const resources = allContent
    .filter(item => RESOURCE_TYPES.has(safeType(item.type)))
    .sort((a,b)=> (b.uploadedAtTs || 0) - (a.uploadedAtTs || 0));

  /* =========================
     EMPTY STATE
  ========================= */

  if(resources.length === 0){

    grid.innerHTML = `
      <div class="content-card empty">
        <h3>📭 No academic resources</h3>
        <p>New files will appear here.</p>
      </div>
    `;

    return;
  }

  /* =========================
     ICON MAP
  ========================= */

  const ICON_MAP = {
    ACADEMIC_CALENDAR: "📅",
    SYLLABUS: "📚",
    HOLIDAY_LIST: "🏖"
  };

  /* =========================
     BUILD HTML
  ========================= */

  const html = resources.map(item => {

    const type = safeType(item.type);

    const icon = ICON_MAP[type] || "📄";

    const title = escapeHTML(
      item.title || "Untitled Resource"
    );

    const datetime = formatDateTime(
      item.date || item.uploadDate,
      item.time || item.uploadTime,
      item.uploadedAtTs
    );

    const fileUrl = sanitizeURL(item.fileUrl);

    const hasFile = fileUrl && fileUrl !== "#";

    return `
      <div class="resource-file-card">

        <div class="rf-header">

          <div class="rf-icon">${icon}</div>

          <div class="rf-info">
            <h3>${title}</h3>
            <div class="rf-meta">${datetime}</div>
          </div>

        </div>

        <div class="rf-actions">

          ${
            hasFile
              ? `
                <a href="${fileUrl}"
                   target="_blank"
                   rel="noopener"
                   class="rf-view"
                   onclick="trackView('${item.id}')">
                   View
                </a>

                <a href="#"
                   class="rf-download"
                   onclick="return trackDownload(event,'${fileUrl}','${item.id}')">
                   Download
                </a>
              `
              : `
                <span class="no-file">
                  ❌ File unavailable
                </span>
              `
          }

        </div>

      </div>
    `;

  }).join("");

  /* =========================
     SINGLE DOM WRITE
  ========================= */

  grid.innerHTML = html;

}