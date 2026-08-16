// /rest/v1/shares
const SUPABASE_URL = "https://ylgxoiwygdtuxblmgomu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZ3hvaXd5Z2R0dXhibG1nb211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTM1MjksImV4cCI6MjEwMDM2OTUyOX0.OT4FwDtsQZRmctYNwfh7eXISbe_MD7Qk7J_0MfFVLRQ";
const supabase_client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

document.addEventListener("DOMContentLoaded", () => {
  // Initial fetch from database
  fetchAndRenderData();

  // Attach form submit handler
  const addWordForm = document.getElementById("addWordForm");
  if (addWordForm) {
    addWordForm.addEventListener("submit", handleWordSubmission);
  }
});

// 2. Form Submission Handler
async function handleWordSubmission(e) {
  e.preventDefault();

  const wordInput = document.getElementById("wordInput");
  const submitBtn = document.getElementById("submitBtn");
  const wordValue = wordInput.value.trim();

  if (!wordValue) return;

  try {
    submitBtn.disabled = true;

    // Insert new word into "shares" table
    const { error } = await supabase_client
      .from("shares")
      .insert([{ word: wordValue }]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("حدث خطأ أثناء إضافة الكلمة. حاول مرة أخرى.");
    } else {
      wordInput.value = "";
      // Refresh page data from DB
      await fetchAndRenderData();
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  } finally {
    submitBtn.disabled = false;
  }
}

// 3. Main Data Fetching & Rendering Function
async function fetchAndRenderData() {
  try {
    // A. Fetch Total Record Count
    const { count, error: countErr } = await supabase_client
      .from("shares")
      .select("*", { count: "exact", head: true });

    if (!countErr && count !== null) {
      document.getElementById("totalCount").textContent =
        count.toLocaleString("ar-EG");
    }

    // B. Fetch All Records (for recent list, flag overlay, and frequency calculation)
    const { data: shares, error: dataErr } = await supabase_client
      .from("shares")
      .select("*")
      .order("created_at", { ascending: false });

    if (dataErr || !shares) {
      console.error("Error fetching shares:", dataErr);
      return;
    }

    // C. Render Recent Submissions (Latest 3)
    renderRecentList(shares.slice(0, 3));

    // D. Render Flag Overlay Words (Latest 15)
    renderFlagWords(shares.slice(0, 15));

    // E. Calculate & Render Most Used Words
    renderMostUsedWords(shares);
  } catch (err) {
    console.error("Error loading page data:", err);
  }
}

// 4. Render Recent Submissions Sidebar
function renderRecentList(recentItems) {
  const listEl = document.getElementById("recentList");
  listEl.innerHTML = "";

  if (recentItems.length === 0) {
    listEl.innerHTML = '<p class="empty-msg">لا توجد مشاركات حتى الآن.</p>';
    return;
  }

  recentItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "recent-item";
    li.innerHTML = `
            <span class="recent-word">${escapeHtml(item.word)} <i class="fa-regular fa-heart"></i></span>
            <span class="recent-time">${formatTimeAgo(item.created_at)}</span>
        `;
    listEl.appendChild(li);
  });
}

// 5. Render Words directly on the Flag
function renderFlagWords(flagItems) {
  const container = document.getElementById("flagWordsContainer");
  container.innerHTML = "";

  if (flagItems.length === 0) {
    container.innerHTML =
      '<p class="empty-msg">كوني أول من يضيف كلمة إلى العلم!</p>';
    return;
  }

  flagItems.forEach((item) => {
    const span = document.createElement("span");
    span.className = "flag-word-pill";
    span.textContent = item.word;
    container.appendChild(span);
  });
}

// 6. Aggregate Frequencies & Render Top Used Words
function renderMostUsedWords(allShares) {
  const container = document.getElementById("mostUsedContainer");
  container.innerHTML = "";

  if (allShares.length === 0) {
    container.innerHTML = '<p class="empty-msg">لا توجد كلمات كافية للعرض.</p>';
    return;
  }

  // Count frequencies of each word
  const frequencyMap = {};
  allShares.forEach((item) => {
    const word = item.word.trim();
    frequencyMap[word] = (frequencyMap[word] || 0) + 1;
  });

  // Sort words by count descending
  const sortedWords = Object.keys(frequencyMap)
    .sort((a, b) => frequencyMap[b] - frequencyMap[a])
    .slice(0, 8); // Top 8 words

  sortedWords.forEach((word) => {
    const span = document.createElement("span");
    span.className = "popular-pill";
    span.innerHTML = `${escapeHtml(word)} <img src="leafs_logo.png" alt="leaf">`;
    container.appendChild(span);
  });
}

// 7. Helper: Format relative time in Arabic
function formatTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffInMinutes < 1) return "الآن";
  if (diffInMinutes === 1) return "منذ دقيقة";
  if (diffInMinutes === 2) return "منذ دقيقتين";
  if (diffInMinutes >= 3 && diffInMinutes <= 10)
    return `منذ ${diffInMinutes} دقائق`;
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return "منذ ساعة";
  if (diffInHours === 2) return "منذ ساعتين";
  if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "منذ يوم";
  if (diffInDays === 2) return "منذ يومين";
  return `منذ ${diffInDays} أيام`;
}

// Helper: XSS Prevention
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Add an event listener to the button in JS
const viewAllBtn = document.querySelector("#viewAllBtn");

if (viewAllBtn) {
  viewAllBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // Fetch ALL words from Supabase (no 5-item limit)
    const { data: allShares, error } = await supabase_client
      .from("shares")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && allShares) {
      renderRecentList(allShares); // Renders all shares instead of top 5
      viewAllBtn.style.display = "none"; // Hide button after expanding
    }
  });
}
