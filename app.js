// app.js

const STORAGE_KEY = "quietroom_entries_v1";

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

// ---------- STORAGE ----------

function loadVents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      vents = seedVents();
      return;
    }
    const parsed = JSON.parse(raw);
    vents = Array.isArray(parsed) ? parsed : seedVents();
  } catch (err) {
    console.warn("Error loading entries, seeding defaults:", err);
    vents = seedVents();
  }
}

function saveVents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vents));
  } catch (err) {
    console.warn("Unable to save entries:", err);
  }
}

function seedVents() {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      text: "Trying to give myself credit for small wins instead of only noticing failures.",
      mood: "Hopeful",
      createdAt: now - 1000 * 60 * 60,
      day: 1,
      comments: [
        {
          id: "c1",
          text: "That absolutely counts. Tiny wins stack.",
          createdAt: now - 1000 * 60 * 40
        }
      ]
    },
    {
      id: "seed-2",
      text: "Brain is loud, body is tired, but I showed up anyway today.",
      mood: "Heavy",
      createdAt: now - 1000 * 60 * 30,
      day: 1,
      comments: []
    },
    {
      id: "seed-3",
      text: "Walked outside at night for five minutes and it helped more than I expected.",
      mood: "Calm",
      createdAt: now - 1000 * 60 * 12,
      day: 1,
      comments: [
        {
          id: "c2",
          text: "Night walks are underrated therapy.",
          createdAt: now - 1000 * 60 * 10
        }
      ]
    }
  ];
}

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
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  return `${days} d ago`;
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
    prevVentBtn.disabled = true;
    nextVentBtn.disabled = true;
    heroCount.textContent = "0";
    commentList.innerHTML = "";
    return;
  }

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= vents.length) currentIndex = vents.length - 1;

  const vent = vents[currentIndex];

  currentVentText.textContent = vent.text;
  currentMoodLabel.textContent = vent.mood;
  currentMoodDot.style.background = getMoodColor(vent.mood);
  currentDayLabel.textContent = "Day " + (vent.day || 1);
  heroCount.textContent = vents.length.toString();

  prevVentBtn.disabled = currentIndex === 0;
  nextVentBtn.disabled = currentIndex === vents.length - 1;

  currentVentCard.classList.remove("fade-in");
  void currentVentCard.offsetWidth;
  currentVentCard.classList.add("fade-in");

  renderComments(vent);
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

    div.innerHTML = `
      <div class="vent-row-top">
        <div class="vent-row-mood">${v.mood}</div>
        <div style="font-size: 10px;">${formatTimeAgo(v.createdAt)}</div>
      </div>
      <div class="vent-row-text">${v.text}</div>
      <div class="vent-row-meta">
        <span>${(v.text || "").length} chars</span>
        <span>${(v.comments || []).length} replies</span>
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

  comments
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((c) => {
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `<span>${formatTimeAgo(c.createdAt)} · </span>${c.text}`;
      commentList.appendChild(div);
    });
}

// ---------- EVENT HANDLERS ----------

ventInput.addEventListener("input", () => {
  const length = ventInput.value.length;
  charCount.textContent = `${length} / 600`;
  panelCounter.textContent = `${length} / 600 used`;
  charCount.classList.toggle("too-much", length >= 600);
  postVentBtn.disabled = length === 0;
});

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

postVentBtn.addEventListener("click", () => {
  const text = ventInput.value.trim();
  if (!text) return;

  const now = Date.now();
  const newVent = {
    id: "v-" + now + "-" + Math.random().toString(16).slice(2),
    text,
    mood: activeMood || "Uncategorized",
    createdAt: now,
    day: 1,
    comments: []
  };

  vents.unshift(newVent);
  saveVents();

  ventInput.value = "";
  charCount.textContent = "0 / 600";
  panelCounter.textContent = "0 / 600 used";
  postVentBtn.disabled = true;

  currentIndex = 0;
  refreshCurrentVent();
  renderVentsList();
});

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

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") prevVentBtn.click();
  if (e.key === "ArrowRight") nextVentBtn.click();
});

filterButtonsWrap.addEventListener("click", (event) => {
  const btn = event.target.closest(".filter-btn");
  if (!btn) return;

  activeFilter = btn.dataset.mood || "All";

  filterButtonsWrap
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.toggle("is-active", b === btn));

  renderVentsList();
});

focusCreateBtn.addEventListener("click", () => {
  ventInput.focus({ preventScroll: false });
  ventInput.scrollIntoView({ behavior: "smooth", block: "center" });
});

openAllBtn.addEventListener("click", () => {
  ventsList.scrollIntoView({ behavior: "smooth", block: "start" });
});

commentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentIndex < 0 || currentIndex >= vents.length) return;

  const text = commentInput.value.trim();
  if (!text) return;

  const now = Date.now();
  const vent = vents[currentIndex];

  vent.comments = vent.comments || [];
  vent.comments.push({
    id: "c-" + now + "-" + Math.random().toString(16).slice(2),
    text,
    createdAt: now
  });

  commentInput.value = "";
  saveVents();
  renderComments(vent);
  renderVentsList();
});

// ---------- INIT ----------

loadVents();
currentIndex = vents.length ? 0 : -1;
refreshCurrentVent();
renderVentsList();
