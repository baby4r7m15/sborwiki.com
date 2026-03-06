(async function () {
  const titleEl = document.getElementById("guideTitle");
  const subtitleEl = document.getElementById("guideSubtitle");
  const kickerEl = document.getElementById("guideKicker");
  const introEl = document.getElementById("guideIntro");
  const quickLinksListEl = document.getElementById("quickLinksList");
  const bannerEl = document.getElementById("guideBanner");
  const heroTextEl = document.getElementById("guideHeroText");
  const recordTitleEl = document.getElementById("guideRecordTitle");
  const sectionsEl = document.getElementById("guideSections");
  const searchEl = document.getElementById("guideSearch");
  const navEl = document.getElementById("guideSectionNav");
  const tocEl = document.getElementById("guideToc");

  let renderedSectionCards = [];
  let navLinks = [];
  let tocLinks = [];

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(str = "") {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getGuidePath() {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("guide") || "new-player";
    return `/data/guides/${file}.json`;
  }

  function renderParagraphs(paragraphs = []) {
    return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
  }

  function renderList(items = [], ordered = false) {
    const tag = ordered ? "ol" : "ul";
    const className = ordered ? "guide-steps" : "guide-list";
    return `<${tag} class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
  }

  function buildSearchText(block) {
    const parts = [];
    if (block.title) parts.push(block.title);
    if (block.text) parts.push(block.text);
    if (block.caption) parts.push(block.caption);
    if (Array.isArray(block.paragraphs)) parts.push(block.paragraphs.join(" "));
    if (Array.isArray(block.items)) parts.push(block.items.join(" "));
    if (Array.isArray(block.columns)) parts.push(block.columns.join(" "));
    if (Array.isArray(block.rows)) {
      block.rows.forEach(row => {
        if (Array.isArray(row)) parts.push(row.join(" "));
      });
    }
    return parts.join(" ").toLowerCase();
  }

  function wrapSection(id, chip, title, innerHtml, searchableText = "") {
    return `
      <section class="hud-panel guide-section-anchor guide-section-card" id="${escapeHtml(id)}" data-search="${escapeHtml(searchableText)}" data-title="${escapeHtml(title || "")}">
        <div class="panel-head">
          <span>${escapeHtml(title || "SECTION")}</span>
          <span class="panel-chip">${escapeHtml(chip)}</span>
        </div>
        ${innerHtml}
      </section>
    `;
  }

  function renderText(block, id) {
    return wrapSection(id, "TEXT", block.title || "SECTION", `<div class="hud-lore">${renderParagraphs(block.paragraphs || [])}</div>`, buildSearchText(block));
  }

  function renderImage(block, id) {
    return wrapSection(id, "MEDIA", block.title || "IMAGE", `
      <img class="guide-image" src="${escapeHtml(block.src || "")}" alt="${escapeHtml(block.alt || block.title || "Guide image")}" loading="lazy" />
      ${block.caption ? `<div class="guide-caption">${escapeHtml(block.caption)}</div>` : ""}
    `, buildSearchText(block));
  }

  function renderSteps(block, id) {
    return wrapSection(id, "GUIDE", block.title || "STEPS", `<div class="hud-lore">${renderList(block.items || [], true)}</div>`, buildSearchText(block));
  }

  function renderBulletList(block, id) {
    return wrapSection(id, "INFO", block.title || "LIST", `<div class="hud-lore">${renderList(block.items || [], false)}</div>`, buildSearchText(block));
  }

  function renderTable(block, id) {
    const columns = Array.isArray(block.columns) ? block.columns : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];

    return wrapSection(id, "DATA", block.title || "TABLE", `
      <div class="guide-table-wrap">
        <table class="guide-table">
          <thead><tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map(row => `<tr>${Array.isArray(row) ? row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("") : ""}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    `, buildSearchText(block));
  }

  function renderCallout(block, id) {
    const variant = (block.variant || "notice").toLowerCase();
    return wrapSection(id, variant.toUpperCase(), block.title || "NOTICE", `
      <div class="guide-callout callout-${escapeHtml(variant)}">
        ${block.text ? `<p>${escapeHtml(block.text)}</p>` : ""}
        ${Array.isArray(block.paragraphs) ? renderParagraphs(block.paragraphs) : ""}
      </div>
    `, buildSearchText(block));
  }

  function renderSection(block, index) {
    const id = slugify(block.id || block.title || `section-${index + 1}`) || `section-${index + 1}`;

    switch (block.type) {
      case "text": return renderText(block, id);
      case "image": return renderImage(block, id);
      case "steps": return renderSteps(block, id);
      case "list": return renderBulletList(block, id);
      case "table": return renderTable(block, id);
      case "callout": return renderCallout(block, id);
      default:
        return wrapSection(id, "ERROR", "UNKNOWN BLOCK", `<div class="hud-lore"><p>Unsupported block type: <strong>${escapeHtml(block.type || "undefined")}</strong></p></div>`, buildSearchText(block));
    }
  }

  function renderQuickLinks(links = []) {
    if (!Array.isArray(links) || !links.length) {
      quickLinksListEl.innerHTML = `<li class="nav-empty">No quick links added yet.</li>`;
      return;
    }

    quickLinksListEl.innerHTML = links.map(link => `<li><a href="${escapeHtml(link.href || "#")}">${escapeHtml(link.label || "Link")}</a></li>`).join("");
  }

  function renderGuideMeta(guide) {
    const bits = [];

    if (Array.isArray(guide.intro)) bits.push(renderParagraphs(guide.intro));
    if (guide.updated) bits.push(`<div class="guide-meta-row"><span class="guide-badge">Updated: ${escapeHtml(guide.updated)}</span></div>`);
    if (Array.isArray(guide.tags) && guide.tags.length) {
      bits.push(`<div class="guide-meta-row">${guide.tags.map(tag => `<span class="guide-badge">${escapeHtml(tag)}</span>`).join("")}</div>`);
    }

    heroTextEl.innerHTML = bits.join("");
  }

  function buildSideNav() {
    renderedSectionCards = Array.from(document.querySelectorAll(".guide-section-card"));

    if (!renderedSectionCards.length) {
      navEl.innerHTML = `<li class="nav-empty">No sections available.</li>`;
      tocEl.innerHTML = `<li class="toc-empty">No headings found.</li>`;
      return;
    }

    const items = renderedSectionCards.map(card => ({ id: card.id, title: card.dataset.title || "Section" }));
    const navHtml = items.map(item => `<li><a href="#${escapeHtml(item.id)}" data-target="${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></li>`).join("");

    navEl.innerHTML = navHtml;
    tocEl.innerHTML = navHtml;

    navLinks = Array.from(navEl.querySelectorAll("a"));
    tocLinks = Array.from(tocEl.querySelectorAll("a"));
  }

  function updateActiveNav() {
    const cards = renderedSectionCards.filter(card => card.style.display !== "none");
    if (!cards.length) return;

    let activeId = cards[0].id;
    const offset = 130;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.top <= offset) activeId = card.id;
    }

    [...navLinks, ...tocLinks].forEach(link => {
      link.classList.toggle("active", link.dataset.target === activeId);
    });
  }

  function filterSections(query) {
    const q = String(query || "").trim().toLowerCase();
    let visibleCount = 0;

    renderedSectionCards.forEach(card => {
      const haystack = `${card.dataset.title || ""} ${card.dataset.search || ""}`.toLowerCase();
      const match = !q || haystack.includes(q);
      card.style.display = match ? "" : "none";
      if (match) visibleCount += 1;
    });

    Array.from(navEl.querySelectorAll("li")).forEach(li => {
      const link = li.querySelector("a");
      if (!link) return;
      const target = document.getElementById(link.dataset.target);
      li.style.display = target && target.style.display !== "none" ? "" : "none";
    });

    Array.from(tocEl.querySelectorAll("li")).forEach(li => {
      const link = li.querySelector("a");
      if (!link) return;
      const target = document.getElementById(link.dataset.target);
      li.style.display = target && target.style.display !== "none" ? "" : "none";
    });

    updateActiveNav();
  }

  try {
    const response = await fetch(getGuidePath(), { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load guide JSON: ${response.status}`);

    const guide = await response.json();

    document.title = `SBO:R Wiki – ${guide.title || "Guide"}`;
    titleEl.textContent = guide.title || "GUIDE";
    subtitleEl.textContent = guide.subtitle || "PLAYER GUIDE";
    kickerEl.textContent = guide.kicker || "SWORD BLOX ONLINE: REBIRTH";
    recordTitleEl.textContent = `SYSTEM RECORD: ${guide.title || "GUIDE"}`;

    if (guide.bannerImage) bannerEl.src = guide.bannerImage;
    bannerEl.alt = guide.bannerAlt || guide.title || "Guide banner";

    introEl.innerHTML = renderParagraphs(guide.intro || []);
    renderGuideMeta(guide);
    renderQuickLinks(guide.quickLinks || []);

    const sections = Array.isArray(guide.sections) ? guide.sections : [];
    sectionsEl.innerHTML = sections.map((block, index) => renderSection(block, index)).join("");

    buildSideNav();
    updateActiveNav();

    searchEl.addEventListener("input", event => filterSections(event.target.value));
    window.addEventListener("scroll", updateActiveNav);
  } catch (error) {
    console.error(error);
    titleEl.textContent = "GUIDE ERROR";
    subtitleEl.textContent = "FAILED TO LOAD";
    introEl.innerHTML = `<p>Could not load guide data.</p>`;
    heroTextEl.innerHTML = `<p>Check your JSON path, filename, and syntax.</p>`;
    navEl.innerHTML = `<li class="nav-empty">Guide nav unavailable.</li>`;
    tocEl.innerHTML = `<li class="toc-empty">TOC unavailable.</li>`;
    quickLinksListEl.innerHTML = `<li class="nav-empty">Quick links unavailable.</li>`;
    sectionsEl.innerHTML = `
      <section class="hud-panel">
        <div class="panel-head">
          <span>SYSTEM ERROR</span>
          <span class="panel-chip">LOAD</span>
        </div>
        <div class="hud-lore"><p>${escapeHtml(error.message)}</p></div>
      </section>
    `;
  }
})();
