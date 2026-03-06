(async function () {
  const gridEl = document.getElementById("guidesGrid");
  const searchEl = document.getElementById("guidesSearch");
  let guides = [];

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getSearchText(guide) {
    return [guide.title || "", guide.description || "", Array.isArray(guide.tags) ? guide.tags.join(" ") : ""].join(" ").toLowerCase();
  }

  function renderCards(items) {
    if (!items.length) {
      gridEl.innerHTML = `<div class="guides-empty">No guides matched your search.</div>`;
      return;
    }

    gridEl.innerHTML = items.map(guide => `
      <a class="guide-card" href="/guides/index.html?guide=${encodeURIComponent(guide.slug)}">
        <img class="guide-card-image" src="${escapeHtml(guide.image || "/Sborlogotext.png")}" alt="${escapeHtml(guide.imageAlt || guide.title || "Guide image")}" loading="lazy" />
        <div class="guide-card-title">${escapeHtml(guide.title || "Guide")}</div>
        <div class="guide-card-desc">${escapeHtml(guide.description || "No description yet.")}</div>
        <div class="guide-card-tags">${(Array.isArray(guide.tags) ? guide.tags : []).map(tag => `<span class="guide-card-tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </a>
    `).join("");
  }

  function filterCards(query) {
    const q = String(query || "").trim().toLowerCase();
    const filtered = !q ? guides : guides.filter(guide => getSearchText(guide).includes(q));
    renderCards(filtered);
  }

  try {
    const res = await fetch("/data/guides/guides-index.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load guide index: ${res.status}`);

    const data = await res.json();
    guides = Array.isArray(data.guides) ? data.guides : [];
    renderCards(guides);
    searchEl.addEventListener("input", e => filterCards(e.target.value));
  } catch (error) {
    console.error(error);
    gridEl.innerHTML = `<div class="guides-empty">Could not load guides index.</div>`;
  }
})();
