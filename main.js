/* ==========================================================================
   AK / INDEX — interaction layer
   No dependencies. No trackers. Everything is progressive enhancement.
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  /* ---------------------------------- Theme -------------------------------- */

  const themeButton = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function syncThemeUI(theme) {
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "paper" ? "#F2F0EA" : "#0A0A0A");
    }
    if (themeButton) {
      const next = theme === "paper" ? "noir" : "paper";
      themeButton.setAttribute("aria-label", `Switch to ${next} theme`);
      themeButton.setAttribute("title", `Switch to ${next} theme`);
    }
  }

  function setTheme(theme, persist = true) {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem("ak-theme", theme);
      } catch (error) {}
    }
    syncThemeUI(theme);
  }

  function toggleTheme() {
    setTheme(root.dataset.theme === "paper" ? "noir" : "paper");
  }

  syncThemeUI(root.dataset.theme || "noir");
  themeButton?.addEventListener("click", toggleTheme);

  /* ---------------------------------- Clock -------------------------------- */

  const clocks = Array.from(document.querySelectorAll("[data-clock]"));
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function updateClock() {
    const value = timeFormatter.format(new Date());
    clocks.forEach((el) => {
      el.textContent = value;
    });
  }

  if (clocks.length) {
    updateClock();
    window.setInterval(updateClock, 1000);
  }

  /* ------------------------------ Scroll chrome ---------------------------- */

  const header = document.getElementById("site-header");
  const progressBar = document.querySelector(".scroll-progress span");
  const navLinks = Array.from(document.querySelectorAll(".nav a"));
  const navSections = navLinks
    .map((link) => ({
      link,
      section: document.querySelector(link.getAttribute("href")),
    }))
    .filter((item) => item.section);
  let scrollQueued = false;

  function updateNavState(y) {
    const probe = y + Math.min(window.innerHeight * 0.35, 320);
    let current = null;

    navSections.forEach((item) => {
      if (item.section.offsetTop <= probe) current = item.section;
    });

    navSections.forEach((item) => {
      const isActive = item.section === current;
      item.link.classList.toggle("is-active", isActive);
      if (isActive) item.link.setAttribute("aria-current", "location");
      else item.link.removeAttribute("aria-current");
    });
  }

  function updateScrollUI() {
    const y = window.scrollY || window.pageYOffset;
    header?.classList.toggle("is-scrolled", y > 24);
    updateNavState(y);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      progressBar.style.width = `${(ratio * 100).toFixed(3)}%`;
    }
    scrollQueued = false;
  }

  function queueScrollUI() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }

  window.addEventListener("scroll", queueScrollUI, { passive: true });
  window.addEventListener("resize", queueScrollUI, { passive: true });
  updateScrollUI();

  /* --------------------------------- Reveal -------------------------------- */

  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------ Work preview ----------------------------- */

  const preview = document.getElementById("preview");
  const workRows = Array.from(document.querySelectorAll(".work-row[data-preview]"));

  if (preview && workRows.length && finePointer.matches && !reduceMotion.matches) {
    let targetX = 0;
    let targetY = 0;
    let previewQueued = false;

    function positionPreview() {
      const rect = preview.getBoundingClientRect();
      const halfW = rect.width / 2 || 180;
      const halfH = rect.height / 2 || 120;
      const x = Math.min(Math.max(targetX, halfW + 12), window.innerWidth - halfW - 12);
      const y = Math.min(Math.max(targetY, halfH + 12), window.innerHeight - halfH - 12);
      preview.style.left = `${x}px`;
      preview.style.top = `${y}px`;
      previewQueued = false;
    }

    function queuePreview() {
      if (!previewQueued) {
        previewQueued = true;
        window.requestAnimationFrame(positionPreview);
      }
    }

    workRows.forEach((row) => {
      row.addEventListener("pointerenter", (event) => {
        const src = row.getAttribute("data-preview");
        if (!src) return;
        targetX = event.clientX;
        targetY = event.clientY;
        preview.style.backgroundImage = `url("${src}")`;
        positionPreview();
        preview.classList.add("is-visible");
      });

      row.addEventListener("pointermove", (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        queuePreview();
      });

      row.addEventListener("pointerleave", () => {
        preview.classList.remove("is-visible");
      });
    });
  }

  /* -------------------------------- Parallax ------------------------------- */

  const hero = document.querySelector(".hero");
  const seal = document.querySelector("[data-parallax]");

  if (hero && seal && finePointer.matches && !reduceMotion.matches) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        seal.style.transform = `translate3d(${(x / rect.width) * 18}px, ${(y / rect.height) * 18}px, 0)`;
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      seal.style.transform = "";
    });
  }

  /* ----------------------------- Command palette --------------------------- */

  const palette = document.getElementById("palette");
  const paletteInput = document.getElementById("palette-input");
  const paletteList = document.getElementById("palette-list");
  const menuButton = document.getElementById("menu-button");

  let lastFocus = null;
  let filteredItems = [];
  let activeIndex = 0;

  function getItems() {
    const nextTheme = root.dataset.theme === "paper" ? "noir" : "paper";
    return [
      { label: "Index", hint: "00", href: "#index", keywords: "home about intro" },
      { label: "Selected work", hint: "01", href: "#work", keywords: "projects cadence mek mec" },
      { label: "Capability ledger", hint: "02", href: "#ledger", keywords: "skills stack oracle erp" },
      { label: "Now", hint: "03", href: "#now", keywords: "status current building" },
      { label: "Contact", hint: "04", href: "#contact", keywords: "email hello hire" },
      {
        label: "Cadence on GitHub",
        hint: "↗",
        href: "https://github.com/theusercontent/cadence",
        keywords: "product offline task manager",
        external: true,
      },
      {
        label: "GitHub profile",
        hint: "↗",
        href: "https://github.com/theusercontent",
        keywords: "source code repositories",
        external: true,
      },
      {
        label: "Email Akaash",
        hint: "↗",
        href: "mailto:domain.developer.ak@gmail.com",
        keywords: "contact mail conversation",
      },
      {
        label: `Switch to ${nextTheme} theme`,
        hint: "theme",
        action: "theme",
        keywords: "dark light appearance color",
      },
    ];
  }

  function setActive(index) {
    if (!filteredItems.length) {
      paletteInput?.removeAttribute("aria-activedescendant");
      return;
    }

    activeIndex = (index + filteredItems.length) % filteredItems.length;
    const nodes = Array.from(paletteList.querySelectorAll(".palette-item"));
    nodes.forEach((node, i) => {
      const isActive = i === activeIndex;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-selected", String(isActive));
    });

    const activeNode = nodes[activeIndex];
    if (activeNode) {
      paletteInput?.setAttribute("aria-activedescendant", activeNode.id);
      activeNode.scrollIntoView({ block: "nearest" });
    }
  }

  function renderPalette(query = "") {
    const q = query.trim().toLowerCase();
    const all = getItems();
    filteredItems = q
      ? all.filter((item) => `${item.label} ${item.keywords || ""}`.toLowerCase().includes(q))
      : all;

    paletteList.innerHTML = "";

    if (!filteredItems.length) {
      const empty = document.createElement("li");
      empty.className = "palette-empty";
      empty.textContent = "No matches. Try “work”, “email”, or “cadence”.";
      paletteList.appendChild(empty);
      paletteInput?.removeAttribute("aria-activedescendant");
      return;
    }

    filteredItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = `palette-item${index === 0 ? " is-active" : ""}`;
      li.id = `palette-item-${index}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", index === 0 ? "true" : "false");
      li.dataset.index = String(index);

      const main = document.createElement("span");
      main.className = "item-main";

      const num = document.createElement("span");
      num.className = "item-num";
      num.textContent = item.hint || "";

      const label = document.createElement("span");
      label.textContent = item.label;

      main.append(num, label);

      const hint = document.createElement("span");
      hint.className = "item-hint";
      hint.textContent = item.external ? "external" : item.action ? "action" : "jump";

      li.append(main, hint);
      paletteList.appendChild(li);
    });

    activeIndex = 0;
    setActive(0);
  }

  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    menuButton?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  function openPalette() {
    if (!palette || !paletteInput) return;
    lastFocus = document.activeElement;
    palette.hidden = false;
    menuButton?.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    paletteInput.value = "";
    renderPalette("");
    window.setTimeout(() => paletteInput.focus(), 0);
  }

  function activateItem(item) {
    if (!item) return;
    closePalette();

    if (item.action === "theme") {
      toggleTheme();
      return;
    }

    if (!item.href) return;

    if (item.href.startsWith("#")) {
      const target = document.querySelector(item.href);
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start",
        });
        if (history.replaceState) history.replaceState(null, "", item.href);
      }
      return;
    }

    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = item.href;
  }

  if (palette && paletteInput && paletteList) {
    menuButton?.addEventListener("click", () => {
      if (palette.hidden) openPalette();
      else closePalette();
    });

    palette.addEventListener("click", (event) => {
      if (event.target === palette) {
        closePalette();
        return;
      }
      const option = event.target.closest(".palette-item");
      if (!option) return;
      const index = Number(option.dataset.index);
      activateItem(filteredItems[index]);
    });

    paletteInput.addEventListener("input", () => {
      renderPalette(paletteInput.value);
    });

    palette.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        activateItem(filteredItems[activeIndex]);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        paletteInput.focus();
      }
    });

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;

      if (mod && key === "k") {
        event.preventDefault();
        if (palette.hidden) openPalette();
        else closePalette();
        return;
      }

      if (
        event.key === "/" &&
        palette.hidden &&
        !mod &&
        !event.altKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        openPalette();
      }
    });
  }
})();
