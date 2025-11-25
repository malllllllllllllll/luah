// app.js

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
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

// ---------- SUPABASE LOAD / SAVE ----------

async function loadVentsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("vents")
      .select("id, text, mood, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading vents:", error);
      vents = [];
      return;
    }

    vents = (data || []).map((row) => ({
      id: row.id,
      text: row.text || "",
      mood: row.mood || "Uncategorized",
      createdAt: row.created_at,
      day: 1 // simple for now
    }));
  } catch (err) {
    console.error("Unexpected error loading vents:", err);
    vents = [];
  }
}

async function loadCommentsForVent(ventId) {
  if (!ventId) {
    commentList.innerHTML = "";
    return;
  }

  try {
    const { data, error } = await supabase
      .from("vent_comments")
      .select("id, text, created_at")
      .eq("vent_id", ventId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      commentList.innerHTML = "";
      return;
    }

    renderComments(data || []);
  } catch (err) {
    console.error("Unexpected error loading comments:", err);
    commentList.innerHTML = "";
  }
}

// ---------- RENDER ----------

function refreshCurrentVent() {
  if (!vents.length) {
    currentIndex = -1;

    currentVentText.textContent = "";
    const placeholder = document.createElement("span");
    placeholder.className = "vent-body-placeholder";
    placeholder.textContent =
      "Your first entry will show up here. Write something below.";
    currentVentText.appendChild(placeholder);

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

  loadCommentsForVent(vent.id);
}

function renderVentsList() {
  ventsList.innerHTML = "";

  const filtered =
    activeFilter === "All"
      ? vents
      : vents.filter((v) => v.mood === activeFilter);

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No entries in this filter yet. Write one on the left.";
    ventsList.appendChild(empty);
    return;
  }

  filtered.forEach((v) => {
    const div = document.createElement("div");
    div.className = "vent-row";
    div.dataset.id = v.id;

    const top = document.createElement("div");
    top.className = "vent-row-top";

    const moodEl = document.createElement("div");
    moodEl.className = "vent-row-mood";
    moodEl.textContent = v.mood || "Uncategorized";

    const timeEl = document.createElement("div");
    timeEl.className = "vent-time";
    timeEl.textContent = formatTimeAgo(v.createdAt);

    top.appendChild(moodEl);
    top.appendChild(timeEl);

    const textEl = document.createElement("div");
    textEl.className = "vent-row-text";
    textEl.textContent = v.text || "";

    const meta = document.createElement("div");
    meta.className = "vent-row-meta";
    const span = document.createElement("span");
    span.textContent = `${(v.text || "").length} chars`;
    meta.appendChild(span);

    div.appendChild(top);
    div.appendChild(textEl);
    div.appendChild(meta);

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

function renderComments(comments) {
  commentList.innerHTML = "";

  if (!comments.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state empty-italic";
    empty.textContent = "No replies yet. Be the first.";
    commentList.appendChild(empty);
    return;
  }

  comments.forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment";

    const meta = document.createElement("span");
    meta.textContent = `${formatTimeAgo(c.created_at)} · `;

    const content = document.createElement("span");
    content.textContent = c.text || "";

    div.appendChild(meta);
    div.appendChild(content);

    commentList.appendChild(div);
  });
}

// ---------- EVENT HANDLERS ----------

// Textarea typing
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

  postVentBtn.disabled = true;

  try {
    const { data, error } = await supabase
      .from("vents")
      .insert({
        text,
        mood: activeMood || "Uncategorized"
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting vent:", error);
      return;
    }

    const newVent = {
      id: data.id,
      text: data.text,
      mood: data.mood,
      createdAt: data.created_at,
      day: 1
    };

    vents.unshift(newVent);

    ventInput.value = "";
    charCount.textContent = "0 / 600";
    panelCounter.textContent = "0 / 600 used";
    postVentBtn.disabled = true;

    currentIndex = 0;
    refreshCurrentVent();
    renderVentsList();
  } catch (err) {
    console.error("Unexpected error inserting vent:", err);
  } finally {
    if (ventInput.value.length > 0) {
      postVentBtn.disabled = false;
    }
  }
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

  try {
    const { error } = await supabase
      .from("vent_comments")
      .insert({
        vent_id: vent.id,
        text
      });

    if (error) {
      console.error("Error inserting comment:", error);
      return;
    }

    commentInput.value = "";
    await loadCommentsForVent(vent.id);
  } catch (err) {
    console.error("Unexpected error inserting comment:", err);
  }
});

// ---------- INIT ----------

async function init() {
  await loadVentsFromSupabase();
  currentIndex = vents.length ? 0 : -1;
  refreshCurrentVent();
  renderVentsList();
}

init();
