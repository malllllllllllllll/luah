// app.js — Luah with Supabase backend

// State
let vents = [];
let currentIndex = -1;
let activeMood = "Uncategorized";
let activeFilter = "All";

// DOM references
const ventInput = document.getElementById("ventInput");
const charCount = document.getElementById("charCount");
const panelCounter = document.getElementById("panelCounter");
const postVentBtn = document.getElementById("postVentBtn");
const moodButtonsWrap = document.getElementById("moodButtons");
const filterButtonsWrap = document.getElementById("filterButtons");

const currentVentCard = document.getElementById("currentVentCard");
const currentVentText = document.getElementById("currentVentText");
const currentMoodLabel = document.getElementById("currentMoodLabel");
const currentMoodDot = document.getElementById("currentMoodDot");
const currentDayLabel = document.getElementById("currentDayLabel");
const heroCount = document.getElementById("heroCount");

const prevVentBtn = document.getElementById("prevVentBtn");
const nextVentBtn = document.getElementById("nextVentBtn");
const focusCreateBtn = document.getElementById("focusCreateBtn");
const openAllBtn = document.getElementById("openAllBtn");

const ventsList = document.getElementById("ventsList");

const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");

// ---------- UTIL ----------

function getMoodColor(mood) {
  switch (mood) {
    case "Calm":
      return "#22c55e";
    case "Heavy":
      return "#3b82f6";
    case "Hopeful":
      return "#22d3ee";
    case "Tired":
      return "#f97316";
    case "Anxious":
      return "#facc15";
    case "Uncategorized":
    default:
      return "#a855f7";
  }
}

function formatTimeAgo(ts) {
  if (!ts) return "";
  const date = typeof ts === "string" ? new Date(ts) : ts;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

// ---------- SUPABASE HELPERS ----------

async function loadVentsFromDB() {
  const { data, error } = await supabase
    .from("vents")
    .select("id, text, mood, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading vents:", error);
    vents = [];
    return;
  }

  vents = (data || []).map((v) => ({
    ...v,
    comments: [] // filled lazily
  }));
}

async function createVentInDB(text, mood) {
  const { data, error } = await supabase
    .from("vents")
    .insert([{ text, mood }])
    .select()
    .single();

  if (error) {
    console.error("Error saving vent:", error);
    alert("Could not save entry. Please try again.");
    return null;
  }

  return { ...data, comments: [] };
}

async function loadCommentsForVent(vent) {
  if (!vent || !vent.id) return;

  const { data, error } = await supabase
    .from("vent_comments")
    .select("id, text, created_at")
    .eq("vent_id", vent.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading comments:", error);
    vent.comments = [];
  } else {
    vent.comments = data || [];
  }

  renderComments(vent);
  renderVentsList(); // update counts
}

async function createCommentInDB(vent, text) {
  const { data, error } = await supabase
    .from("vent_comments")
    .insert([{ vent_id: vent.id, text }])
    .select()
    .single();

  if (error) {
    console.error("Error saving comment:", error);
    alert("Could not post reply.");
    return null;
  }

  return data;
}

// ---------- RENDER ----------

function refreshCurrentVent() {
  if (!vents.length) {
    currentIndex = -1;
    currentVentText.innerHTML =
      '<span class="vent-body-placeholder">Your first entry will show up here. Write something below.</span>';
    currentMoodLabel.textContent = "No mood yet";
    currentMoodDot.style.background = "rgba(148,163,184,0.7)";
    currentDayLabel.textContent = "Day 1";
    heroCount.textContent = "0";
    prevVentBtn.disabled = true;
    nextVentBtn.disabled = true;
    commentList.innerHTML = "";
    return;
  }

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= vents.length) currentIndex = vents.length - 1;

  const vent = vents[currentIndex];

  currentVentText.textContent = vent.text || "";
  currentMoodLabel.textContent = vent.mood || "Uncategorized";
  currentMoodDot.style.background = getMoodColor(vent.mood);
  currentDayLabel.textContent = "Day 1";
  heroCount.textContent = vents.length.toString();

  prevVentBtn.disabled = currentIndex === 0;
  nextVentBtn.disabled = currentIndex === vents.length - 1;

  currentVentCard.classList.remove("fade-in");
  void currentVentCard.offsetWidth;
  currentVentCard.classList.add("fade-in");

  // Show loading state for comments, then fetch
  commentList.innerHTML =
    '<div class="empty-state" style="font-style: italic; padding: 0;">Loading replies...</div>';
  loadCommentsForVent(vent).catch((err) =>
    console.error("Comment load error:", err)
  );
}

function renderVentsList() {
  ventsList.innerHTML = "";

  const filtered =
    activeFilter === "All"
      ? vents
      : vents.filter((v) => v.mood === activeFilter);

  if (!filtered.length) {
    ventsList.innerHTML =
      '<div class="empty-state">No entries in this filter yet. Write one on the left.</div>';
    return;
  }

  filtered.forEach((v) => {
    const div = document.createElement("div");
    div.className = "vent-row";
    div.dataset.id = v.id;

    const replyCount = (v.comments || []).length;

    div.innerHTML = `
      <div class="vent-row-top">
        <div class="vent-row-mood">${v.mood || "Uncategorized"}</div>
        <div style="font-size: 10px;">${formatTimeAgo(v.created_at)}</div>
      </div>
      <div class="vent-row-text">${v.text || ""}</div>
      <div class="vent-row-meta">
        <span>${(v.text || "").length} chars</span>
        <span>${replyCount} replies</span>
      </div>
    `;

    div.addEventListener("click", () => {
      const idx = vents.findIndex((item) => item.id === v.id);
      if (idx !== -1) {
        currentIndex = idx;
        refreshCurrentVent();
        currentVentCard.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    });

    ventsList.appendChild(div);
  });
}

function renderComments(vent) {
  commentList.innerHTML = "";
  const comments = vent.comments || [];

  if (!comments.length) {
    commentList.innerHTML =
      '<div class="empty-state" style="font-style: italic; padding: 0;">No replies yet. Be the first.</div>';
    return;
  }

  comments.forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `<span>${formatTimeAgo(c.created_at)} · </span>${c.text}`;
    commentList.appendChild(div);
  });
}

// ---------- EVENT HANDLERS ----------

// Typing in textarea
ventInput.addEventListener("input", () => {
  const length = ventInput.value.length;
  charCount.textContent = `${length} / 600`;
  panelCounter.textContent = `${length} / 600 used`;
  charCount.classList.toggle("too-much", length >= 600);
  postVentBtn.disabled = length === 0;
});

// Mood selection
moodButtonsWrap.addEventListener("click", (event) => {
  const btn = event.target.closest(".mood-btn");
  if (!btn) return;

  const mood = btn.dataset.mood;
  if (!mood) return;

  activeMood = mood;
  moodButtonsWrap
    .querySelectorAll(".mood-btn")
    .forEach((b) => b.classList.toggle("is-active", b === btn));
});

// Save entry
postVentBtn.addEventListener("click", async () => {
  const text = ventInput.value.trim();
  if (!text) return;

  const mood = activeMood || "Uncategorized";
  const newVent = await createVentInDB(text, mood);
  if (!newVent) return;

  // Newest at top
  vents.unshift(newVent);

  // Reset form
  ventInput.value = "";
  charCount.textContent = "0 / 600";
  panelCounter.textContent = "0 / 600 used";
  postVentBtn.disabled = true;

  currentIndex = 0;
  refreshCurrentVent();
  renderVentsList();
});

// Navigation arrows
prevVentBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    refreshCurrentVent();
  }
});

nextVentBtn.addEventListener("click", () => {
  if (currentIndex < vents.length - 1) {
    currentIndex++;
    refreshCurrentVent();
  }
});

// Keyboard arrows
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") prevVentBtn.click();
  if (e.key === "ArrowRight") nextVentBtn.click();
});

// Filter buttons
filterButtonsWrap.addEventListener("click", (event) => {
  const btn = event.target.closest(".filter-btn");
  if (!btn) return;

  activeFilter = btn.dataset.mood || "All";

  filterButtonsWrap
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.toggle("is-active", b === btn));

  renderVentsList();
});

// Focus textarea
focusCreateBtn.addEventListener("click", () => {
  ventInput.focus({ preventScroll: false });
  ventInput.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Scroll to list
openAllBtn.addEventListener("click", () => {
  ventsList.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Comments
commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (currentIndex < 0 || currentIndex >= vents.length) return;

  const text = commentInput.value.trim();
  if (!text) return;

  const vent = vents[currentIndex];
  const saved = await createCommentInDB(vent, text);
  if (!saved) return;

  if (!vent.comments) vent.comments = [];
  vent.comments.push(saved);

  commentInput.value = "";
  renderComments(vent);
  renderVentsList();
});

// ---------- INIT ----------

async function init() {
  await loadVentsFromDB();
  currentIndex = vents.length ? 0 : -1;
  refreshCurrentVent();
  renderVentsList();
}

init();
