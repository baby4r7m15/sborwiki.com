// /js/navbar.js
(function () {
  const NAV_CONTAINER_ID = "site-nav";
  const NAV_JSON_PATH = "/data/navbar.json";

  function normalizePath(path) {
    // Make pathname comparisons consistent (remove trailing slash except root)
    if (!path) return "/";
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
  }

  function isActiveLink(href) {
    const current = normalizePath(window.location.pathname);
    const target = normalizePath(href);

    // Mark exact match active (and treat /index.html as / if it ever appears)
    if (current === target) return true;
    if (target === "/" && current === "/index.html") return true;
    return false;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k.startsWith("aria-")) node.setAttribute(k, v);
      else if (k === "role") node.setAttribute("role", v);
      else if (k === "href") node.setAttribute("href", v);
      else if (k === "type") node.setAttribute("type", v);
      else node[k] = v;
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  function buildLink(item) {
    const a = el("a", { class: "hud-link", href: item.href }, [item.label]);
    if (isActiveLink(item.href)) a.classList.add("active");
    return a;
  }

  function buildDropdown(item) {
    const wrap = el("div", { class: "hud-drop" });

    const btn = el(
      "button",
      {
        class: "hud-link hud-drop-btn",
        type: "button",
        "aria-haspopup": "menu"
      },
      [`${item.label} ▾`]
    );

    const menu = el("div", {
      class: "hud-menu",
      role: "menu",
      "aria-label": `${item.label} menu`
    });

    (item.items || []).forEach((sub) => {
      const a = el("a", { role: "menuitem", href: sub.href }, [sub.label]);
      if (isActiveLink(sub.href)) a.classList.add("active");
      menu.appendChild(a);
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  function renderNav(data) {
    const nav = document.getElementById(NAV_CONTAINER_ID);
    if (!nav) return;

    nav.innerHTML = "";

    (data.items || []).forEach((item) => {
      if (item.type === "link") nav.appendChild(buildLink(item));
      if (item.type === "dropdown") nav.appendChild(buildDropdown(item));
    });
  }

  async function loadNav() {
    try {
      const res = await fetch(NAV_JSON_PATH, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Navbar JSON fetch failed: ${res.status}`);
      const data = await res.json();
      renderNav(data);
    } catch (err) {
      // Fail gracefully (optional fallback)
      console.warn(err);
    }
  }

  // Render after DOM exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNav);
  } else {
    loadNav();
  }
})();
