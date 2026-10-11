/**
 * TeenGirlsLK Admin UI - Interactive Logic, Chart Rendering & State Handling
 */
document.addEventListener("DOMContentLoaded", () => {
  // Font Awesome Icons Directory
  const ICONS = {
    "brand-bag": `<svg viewBox="0 0 40 40" width="34" height="34" fill="none"><rect width="40" height="40" rx="10" fill="#FFF0F5"/><path d="M12 15C12 13.8954 12.8954 13 14 13H26C27.1046 13 28 13.8954 28 15V27C28 28.1046 27.1046 29 26 29H14C12.8954 29 12 28.1046 12 27V15Z" stroke="#FF2A7A" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 13V11C16 8.79086 17.7909 7 20 7C22.2091 7 24 8.79086 24 11V13" stroke="#FF2A7A" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="20" r="2.5" fill="#FF2A7A"/></svg>`,
    "home": `<i class="fa-solid fa-house"></i>`,
    "categories": `<i class="fa-solid fa-table-cells-large"></i>`,
    "products": `<i class="fa-solid fa-bag-shopping"></i>`,
    "star": `<i class="fa-solid fa-gift"></i>`,
    "tag": `<i class="fa-solid fa-tag"></i>`,
    "zap": `<i class="fa-solid fa-bolt"></i>`,
    "cart": `<i class="fa-solid fa-cart-shopping"></i>`,
    "truck": `<i class="fa-solid fa-truck"></i>`,
    "credit-card": `<i class="fa-solid fa-credit-card"></i>`,
    "users": `<i class="fa-solid fa-user-group"></i>`,
    "user": `<i class="fa-solid fa-user"></i>`,
    "shield": `<i class="fa-solid fa-shield-halved"></i>`,
    "chart": `<i class="fa-solid fa-chart-line"></i>`,
    "ticket": `<i class="fa-solid fa-ticket"></i>`,
    "help-circle": `<i class="fa-solid fa-circle-question"></i>`,
    "dollar": `<i class="fa-solid fa-dollar-sign"></i>`,
    "coupon": `<i class="fa-solid fa-ticket-simple"></i>`,
    "log-out": `<i class="fa-solid fa-arrow-right-from-bracket"></i>`,
    "menu": `<i class="fa-solid fa-bars"></i>`,
    "search": `<i class="fa-solid fa-magnifying-glass"></i>`,
    "calendar": `<i class="fa-regular fa-calendar-days"></i>`,
    "bell": `<i class="fa-solid fa-bell"></i>`,
    "sun": `<i class="fa-solid fa-sun"></i>`,
    "receipt": `<i class="fa-solid fa-receipt"></i>`,
    "shopping-bag": `<i class="fa-solid fa-bag-shopping"></i>`,
    "clipboard": `<i class="fa-solid fa-clipboard-list"></i>`,
    "rotate-ccw": `<i class="fa-solid fa-rotate-left"></i>`,
    "box": `<i class="fa-solid fa-box"></i>`,
    "clock": `<i class="fa-solid fa-clock"></i>`,
    "check-circle": `<i class="fa-solid fa-circle-check"></i>`,
    "trending-up": `<i class="fa-solid fa-arrow-trend-up"></i>`,
    "bar-chart": `<i class="fa-solid fa-chart-column"></i>`
  };

  // Inject Icons into elements with [data-icon]
  document.querySelectorAll("[data-icon]").forEach(el => {
    const iconName = el.getAttribute("data-icon");
    if (ICONS[iconName]) {
      el.innerHTML = ICONS[iconName];
    }
  });

  // Render SVG Revenue Overview Chart
  const revenueChartMount = document.getElementById("tgl-revenue-chart-mount");
  if (revenueChartMount) {
    revenueChartMount.innerHTML = `
      <svg class="tgl-revenue-chart" viewBox="0 0 680 160" width="100%" height="160" preserveAspectRatio="none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feComposite in="SourceGraphic" in2="glow" operator="over"/>
          </filter>
        </defs>
        
        <!-- Horizontal Guide Lines -->
        <line x1="55" y1="20" x2="660" y2="20" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="55" y1="55" x2="660" y2="55" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="55" y1="90" x2="660" y2="90" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="55" y1="125" x2="660" y2="125" stroke="#E2E8F0" stroke-width="1"/>

        <!-- Y-Axis Labels -->
        <text x="8" y="24" fill="#94A3B8" font-size="11" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">Rs 3</text>
        <text x="8" y="59" fill="#94A3B8" font-size="11" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">Rs 2</text>
        <text x="8" y="94" fill="#94A3B8" font-size="11" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">Rs 1</text>
        <text x="8" y="129" fill="#94A3B8" font-size="11" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">Rs 0</text>

        <!-- Flat Trajectory Line along Rs 0 -->
        <line x1="65" y1="125" x2="650" y2="125" stroke="#FF2A7A" stroke-width="2.5" stroke-linecap="round"/>
        
        <!-- Trajectory Data Points -->
        <circle class="tgl-chart-point" cx="65" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 11" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="115" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 14" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="165" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 16" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="215" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 19" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="265" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 21" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="315" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 24" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="365" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 26" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="415" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 29" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="465" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="May 31" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="515" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="Jun 02" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="565" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="Jun 05" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="615" cy="125" r="3.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="1.5" data-date="Jun 07" data-val="Rs 0.00"/>
        <circle class="tgl-chart-point" cx="650" cy="125" r="4.5" fill="#FF2A7A" stroke="#FFFFFF" stroke-width="2" data-date="Jun 9" data-val="Rs 0.00"/>
      </svg>
      <div class="tgl-chart-tooltip" style="right: 18px; top: 72px; transform: none;">
        <span class="tgl-tooltip-val">Rs 0.00</span>
        <span class="tgl-tooltip-date">Jun 9</span>
      </div>
      <div class="tgl-chart-xaxis">
        <span>11 May</span>
        <span>16 May</span>
        <span>21 May</span>
        <span>26 May</span>
        <span>31 May</span>
        <span>5 Jun</span>
        <span>9 Jun</span>
      </div>
    `;
  }

  // Render SVG Donut Chart
  const donutChartMount = document.getElementById("tgl-donut-chart-mount");
  if (donutChartMount) {
    donutChartMount.innerHTML = `
      <div class="tgl-donut-visual">
        <svg viewBox="0 0 160 160" width="135" height="135" class="tgl-donut-svg">
          <!-- Background Base Ring -->
          <circle cx="80" cy="80" r="50" fill="none" stroke="#F1F5F9" stroke-width="24"/>
          <!-- Uncategorized 100% Solid Ring -->
          <circle cx="80" cy="80" r="50" fill="none" stroke="#FF2A7A" stroke-width="24"
            stroke-dasharray="314.16 314.16" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>
        </svg>
      </div>

      <div class="tgl-donut-legend-single">
        <span class="tgl-legend-bullet" style="background: #FF2A7A;"></span>
        <span class="tgl-legend-label">Uncategorized</span>
        <span class="tgl-legend-pct">100% (0)</span>
      </div>
    `;
  }

  // 1. Theme Persistence & Toggle
  const themeToggle = document.getElementById("tgl-theme-toggle");
  const savedTheme = localStorage.getItem("tgl-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      localStorage.setItem("tgl-theme", isDark ? "dark" : "light");
      showToast(isDark ? "Dark theme activated" : "Light theme activated", isDark ? "fa-moon" : "fa-sun");
    });
  }

  // 2. Tab Navigation & Menu Active State
  const pageTitleEl = document.querySelector(".tgl-page-title");

  const titlesMap = {
    "dashboard": "Dashboard",
    "categories": "Categories",
    "products": "Products",
    "orders": "Orders",
    "delivery": "Delivery & Dispatch",
    "payouts": "Payouts & Settlements",
    "customers": "Customers Directory",
    "promotions": "Promotions",
    "flash-sale": "Flash Sale",
    "surprise-box": "Surprise Box",
    "bidding": "Bidding",
    "coupons": "Coupons & Vouchers",
    "manage-admin": "Manage Admin Team",
    "reports": "Reports & Audits",
    "tickets": "Customer Support Tickets",
    "faq": "FAQ & Knowledgebase",
    "product-form": "Product Catalog",
    "category-form": "Categories Taxonomy",
    "coupon-form": "Coupons & Vouchers",
    "customer-form": "Customer Directory",
    "order-form": "Order Details"
  };

  function setAccordion(accordion, open) {
    accordion.classList.toggle('open', open);
    const button=accordion.querySelector('.tgl-accordion-btn');
    button?.setAttribute('aria-expanded',String(open));
    if(button?.dataset.toggle)button.setAttribute('aria-controls',button.dataset.toggle);
  }
  document.querySelectorAll('.tgl-nav-accordion').forEach(a=>setAccordion(a,a.classList.contains('open')));

  function switchTab(tabId) {
    if (!tabId) return;

    // Reset all nav active states
    document.querySelectorAll(".tgl-nav-item, .tgl-sub-item").forEach(item => {
      item.classList.remove("active");
      item.removeAttribute('aria-current');
    });

    // Mark current clicked item active
    const activeTargets = document.querySelectorAll(`[data-tab="${tabId}"]`);
    const selectedSubmenus=new Set();
    activeTargets.forEach(t => {
      const menu=t.closest('.tgl-sub-menu');
      if(menu&&selectedSubmenus.has(menu))return;
      if(menu)selectedSubmenus.add(menu);
      t.classList.add('active');
      if(t.matches('.tgl-sidebar a'))t.setAttribute('aria-current','page');
    });

    // If active item is inside an accordion, open the accordion
    document.querySelectorAll('.tgl-nav-accordion').forEach(a=>setAccordion(a,false));
    activeTargets.forEach(t => {
      const accordion = t.closest(".tgl-nav-accordion");
      if (accordion) {
        setAccordion(accordion,true);
        accordion.querySelector('.tgl-accordion-btn')?.classList.add('active');
      }
    });

    // Switch visible tab pane
    const allTabPanes = document.querySelectorAll(".tgl-tab-pane");
    let foundPane = false;
    allTabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add("active");
        foundPane = true;
      } else {
        pane.classList.remove("active");
      }
    });

    // If no direct pane exists, fall back to dashboard pane
    if (!foundPane) {
      const dashPane = document.getElementById("tab-dashboard");
      if (dashPane) dashPane.classList.add("active");
    }

    // Update Header Page Title
    if (pageTitleEl && titlesMap[tabId]) {
      pageTitleEl.textContent = titlesMap[tabId];
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update URL Hash without duplicating history if identical
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = `#${tabId}`;
    }
  }

  // Expose globally
  window.switchTab = switchTab;

  // Global click event delegation for data-tab, data-back, and accordion buttons
  document.addEventListener("click", (e) => {
    const accordionButton=e.target.closest('.tgl-accordion-btn');
    if(accordionButton){
      e.preventDefault();
      const accordion=accordionButton.closest('.tgl-nav-accordion');
      const open=!accordion.classList.contains('open');
      document.querySelectorAll('.tgl-nav-accordion').forEach(a=>setAccordion(a,a===accordion&&open));
      // Chevron clicks expand the menu without changing the current page.
      if(open&&!e.target.closest('.tgl-chevron'))switchTab(accordionButton.dataset.tab);
      return;
    }
    const tabItem = e.target.closest("[data-tab]");
    if (tabItem) {
      const tabId = tabItem.getAttribute("data-tab");
      if (tabId) {
        e.preventDefault();
        
        switchTab(tabId);
      }

      // Close mobile sidebar if open
      const sidebar = document.querySelector(".tgl-sidebar");
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
      return;
    }

    const backBtn = e.target.closest("[data-back]");
    if (backBtn) {
      e.preventDefault();
      const tabId = backBtn.getAttribute("data-back") || "dashboard";
      switchTab(tabId);
      return;
    }

    // Accordion chevron toggle
    const chevronBtn = e.target.closest(".tgl-chevron");
    if (chevronBtn) {
      e.preventDefault();
      e.stopPropagation();
      const parentAccordion = chevronBtn.closest(".tgl-nav-accordion");
      if (parentAccordion) {
        parentAccordion.classList.toggle("open");
      }
    }
  });

  // Handle URL Hash on initial page load and hashchange
  function handleCurrentHash() {
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash && titlesMap[currentHash]) {
      switchTab(currentHash);
    }
  }

  window.addEventListener("hashchange", handleCurrentHash);
  handleCurrentHash();

  // 4. Mobile Sidebar Drawer Toggle
  const mobileToggle = document.getElementById("tgl-mobile-toggle");
  const sidebar = document.querySelector(".tgl-sidebar");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== mobileToggle) {
        sidebar.classList.remove("open");
      }
    });
  }

  // 5. Global Search Focus via ⌘ K / Ctrl + K
  const searchInput = document.getElementById("tgl-global-search");
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          showToast(`Searching across catalog for "${query}"...`, "fa-magnifying-glass");
        }
      }
    });
  }

  // 6. Notification Bell Dropdown
  const notifBtn = document.getElementById("tgl-notification-btn");
  const notifDropdown = notifBtn?.closest(".tgl-dropdown-wrapper");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (notifDropdown.classList.contains("open") && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove("open");
      }
    });
  }

  // 7. Date Range Picker Trigger
  const datePickerBtn = document.getElementById("tgl-date-picker-btn");
  if (datePickerBtn) {
    datePickerBtn.addEventListener("click", () => {
      showToast("Date range calendar dialog: May 11, 2025 - Jun 9, 2025", "fa-calendar-days");
    });
  }

  // 8. Toast Notifications System
  const toastContainer = document.getElementById("tgl-toast-container");
  const TOAST_ICON_MAP = {
    "🌙": '<i class="fa-solid fa-moon"></i>',
    "☀️": '<i class="fa-solid fa-sun"></i>',
    "🔍": '<i class="fa-solid fa-magnifying-glass"></i>',
    "📅": '<i class="fa-regular fa-calendar-days"></i>',
    "✨": '<i class="fa-solid fa-circle-check"></i>',
    "📋": '<i class="fa-solid fa-clipboard"></i>',
    "🔄": '<i class="fa-solid fa-arrows-rotate"></i>',
    "↔": '<i class="fa-solid fa-arrows-left-right-to-line"></i>',
    "✕": '<i class="fa-solid fa-xmark"></i>',
    "📥": '<i class="fa-solid fa-download"></i>',
    "✓": '<i class="fa-solid fa-check"></i>',
    "🗑️": '<i class="fa-solid fa-trash-can"></i>',
    "⚡": '<i class="fa-solid fa-bolt"></i>',
    "🎉": '<i class="fa-solid fa-check-double"></i>',
    "📁": '<i class="fa-solid fa-folder"></i>',
    "🎟️": '<i class="fa-solid fa-ticket"></i>',
    "👤": '<i class="fa-solid fa-user"></i>',
    "💌": '<i class="fa-solid fa-envelope"></i>',
    "🛒": '<i class="fa-solid fa-cart-shopping"></i>',
    "🎁": '<i class="fa-solid fa-gift"></i>',
    "🖨️": '<i class="fa-solid fa-print"></i>',
    "🌳": '<i class="fa-solid fa-network-wired"></i>',
    "📦": '<i class="fa-solid fa-box"></i>',
    "⭐": '<i class="fa-solid fa-star"></i>',
    "⏳": '<i class="fa-solid fa-hourglass-half"></i>',
    "🚚": '<i class="fa-solid fa-truck"></i>',
    "↩️": '<i class="fa-solid fa-arrow-rotate-left"></i>',
    "🔔": '<i class="fa-solid fa-bell"></i>',
    "📊": '<i class="fa-solid fa-chart-line"></i>',
    "🏷️": '<i class="fa-solid fa-tag"></i>',
    "⏸️": '<i class="fa-solid fa-pause"></i>',
    "✏️": '<i class="fa-solid fa-pen-to-square"></i>',
    "👁️": '<i class="fa-solid fa-eye"></i>'
  };

  window.showToast = function(message, icon = '<i class="fa-solid fa-circle-check"></i>') {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "tgl-toast";
    let iconHtml = '<i class="fa-solid fa-circle-check"></i>';
    if (typeof icon === "string") {
      if (TOAST_ICON_MAP[icon]) {
        iconHtml = TOAST_ICON_MAP[icon];
      } else if (icon.startsWith("<")) {
        iconHtml = icon;
      } else if (icon.startsWith("fa-")) {
        iconHtml = `<i class="fa-solid ${icon}"></i>`;
      }
    }
    const cleanMsg = String(message)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[✨🎉💌🎟️📦✏️👁️🌙☀️🔍📅📋🔄↔✕📥✓🗑️⚡📁👤🛒🎁🖨️🌳⭐⏳🚚↩️🔔📊🏷️⏸️]/g, "")
      .trim();
    toast.innerHTML = `<span class="tgl-toast-icon">${iconHtml}</span><span class="tgl-toast-msg">${cleanMsg}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  };

  // 9. Coupon Code Copy Helper
  window.copyCouponCode = function(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        window.showToast(`Coupon code "${code}" copied to clipboard!`, "fa-clipboard");
      }).catch(() => {
        window.showToast(`Coupon code: ${code}`, "fa-clipboard");
      });
    } else {
      window.showToast(`Coupon code: ${code}`, "fa-clipboard");
    }
  };

  // 10. Live Flash Sale & Auction Countdown Ticker
  let flashSecondsRemaining = 4 * 3600 + 28 * 60 + 12;
  let bid1SecondsRemaining = 2 * 3600 + 45 * 60 + 18;
  let bid2SecondsRemaining = 5 * 3600 + 12 * 60 + 44;

  setInterval(() => {
    // Flash Sale Timer
    if (flashSecondsRemaining > 0) {
      flashSecondsRemaining--;
      const h = Math.floor(flashSecondsRemaining / 3600);
      const m = Math.floor((flashSecondsRemaining % 3600) / 60);
      const s = flashSecondsRemaining % 60;
      const hEl = document.getElementById("fs-hours");
      const mEl = document.getElementById("fs-mins");
      const sEl = document.getElementById("fs-secs");
      if (hEl) hEl.textContent = String(h).padStart(2, "0");
      if (mEl) mEl.textContent = String(m).padStart(2, "0");
      if (sEl) sEl.textContent = String(s).padStart(2, "0");
    }

    // Bidding Timers
    if (bid1SecondsRemaining > 0) {
      bid1SecondsRemaining--;
      const h = Math.floor(bid1SecondsRemaining / 3600);
      const m = Math.floor((bid1SecondsRemaining % 3600) / 60);
      const s = bid1SecondsRemaining % 60;
      const b1 = document.getElementById("bid-timer-1");
      if (b1) b1.textContent = `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }

    if (bid2SecondsRemaining > 0) {
      bid2SecondsRemaining--;
      const h = Math.floor(bid2SecondsRemaining / 3600);
      const m = Math.floor((bid2SecondsRemaining % 3600) / 60);
      const s = bid2SecondsRemaining % 60;
      const b2 = document.getElementById("bid-timer-2");
      if (b2) b2.textContent = `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }
  }, 1000);

  // 11. Interactive Modern Data Tables Engine
  function initModernDataTables() {
    const tableWraps = document.querySelectorAll(".tgl-table-wrap");

    tableWraps.forEach((tableWrap) => {
      const card = tableWrap.closest(".tgl-card") || tableWrap.parentElement;
      if (!card) return;

      const toolbar = card.querySelector(".tgl-table-toolbar");
      const searchInput = toolbar?.querySelector(".tgl-table-search");
      const searchBox = toolbar?.querySelector(".tgl-table-search-box");
      const clearBtn = toolbar?.querySelector(".tgl-search-clear");
      const filterSelects = toolbar ? toolbar.querySelectorAll(".tgl-table-filter") : [];
      const densityBtn = toolbar?.querySelector(".tgl-density-toggle");
      const exportBtn = toolbar?.querySelector(".tgl-export-csv");

      const thead = tableWrap.querySelector(".tgl-thead");
      const tbody = tableWrap.querySelector(".tgl-tbody");
      if (!tbody) return;

      const originalRows = Array.from(tbody.querySelectorAll(".tgl-tr"));
      // Tag original index
      originalRows.forEach((row, idx) => {
        row.dataset.origIndex = idx;
      });

      const checkAll = thead?.querySelector(".tgl-check-all");
      const sortHeaders = thead ? thead.querySelectorAll(".tgl-th.sortable") : [];
      const pagination = card.querySelector(".tgl-table-pagination");
      const pageInfo = pagination?.querySelector(".tgl-pagination-info");
      const pageSizeSelect = pagination?.querySelector(".tgl-page-size");
      const prevBtn = pagination?.querySelector(".tgl-page-btn.prev");
      const nextBtn = pagination?.querySelector(".tgl-page-btn.next");
      const pageNumbersWrap = pagination?.querySelector(".tgl-page-numbers");

      let currentPage = 1;
      let pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) || 5 : 5;
      let currentSortCol = null;
      let currentSortDir = null; // 'asc' | 'desc' | null
      let searchQuery = "";
      let activeFilters = {};

      // Empty State Element
      let emptyEl = card.querySelector(".tgl-table-empty");
      if (!emptyEl) {
        emptyEl = document.createElement("div");
        emptyEl.className = "tgl-table-empty";
        emptyEl.style.display = "none";
        emptyEl.innerHTML = `
          <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <div class="empty-title">No matching records found</div>
          <div class="empty-sub">We couldn't find any items matching your search or filters. Try adjusting your keywords.</div>
          <button type="button" class="empty-reset-btn">Reset All Filters</button>
        `;
        tableWrap.after(emptyEl);

        emptyEl.querySelector(".empty-reset-btn")?.addEventListener("click", () => {
          if (searchInput) {
            searchInput.value = "";
            searchBox?.classList.remove("has-query");
          }
          filterSelects.forEach(s => s.value = "");
          searchQuery = "";
          activeFilters = {};
          applyTableState();
          showToast("Table filters reset", "fa-arrows-rotate");
        });
      }

      function updateRowSelectionState() {
        const visibleRows = originalRows.filter(r => r.dataset.matched === "true");
        const checkedVisibleRows = visibleRows.filter(r => {
          const cb = r.querySelector(".tgl-row-check");
          return cb && cb.checked;
        });

        if (checkAll) {
          if (checkedVisibleRows.length === 0) {
            checkAll.checked = false;
            checkAll.indeterminate = false;
          } else if (checkedVisibleRows.length === visibleRows.length) {
            checkAll.checked = true;
            checkAll.indeterminate = false;
          } else {
            checkAll.checked = false;
            checkAll.indeterminate = true;
          }
        }

        updateBulkBar();
      }

      function applyTableState() {
        // 1. Filter rows
        let matchedRows = [];
        originalRows.forEach(row => {
          let matchSearch = true;
          if (searchQuery) {
            const textContent = row.textContent.toLowerCase();
            matchSearch = textContent.includes(searchQuery);
          }

          let matchFilters = true;
          for (const [col, val] of Object.entries(activeFilters)) {
            if (!val) continue;
            const rowVal = (row.dataset[col] || "").toLowerCase();
            if (!rowVal.includes(val.toLowerCase())) {
              matchFilters = false;
              break;
            }
          }

          const matched = matchSearch && matchFilters;
          row.dataset.matched = matched ? "true" : "false";
          if (matched) {
            matchedRows.push(row);
          }
        });

        // 2. Sort matched rows if sort active
        if (currentSortCol && currentSortDir) {
          const header = Array.from(sortHeaders).find(h => h.dataset.sort === currentSortCol);
          const colType = header?.dataset.type || "text";

          matchedRows.sort((a, b) => {
            let valA = a.dataset[currentSortCol] || "";
            let valB = b.dataset[currentSortCol] || "";

            if (colType === "number") {
              const numA = parseFloat(valA.replace(/[^0-9.-]+/g, "")) || 0;
              const numB = parseFloat(valB.replace(/[^0-9.-]+/g, "")) || 0;
              return currentSortDir === "asc" ? numA - numB : numB - numA;
            } else if (colType === "currency") {
              const numA = parseFloat(valA.replace(/[^0-9.-]+/g, "")) || 0;
              const numB = parseFloat(valB.replace(/[^0-9.-]+/g, "")) || 0;
              return currentSortDir === "asc" ? numA - numB : numB - numA;
            } else if (colType === "date") {
              const dateA = new Date(valA).getTime() || 0;
              const dateB = new Date(valB).getTime() || 0;
              return currentSortDir === "asc" ? dateA - dateB : dateB - dateA;
            } else {
              return currentSortDir === "asc"
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
            }
          });
        } else {
          // Restore original index order
          matchedRows.sort((a, b) => parseInt(a.dataset.origIndex, 10) - parseInt(b.dataset.origIndex, 10));
        }

        // Re-append to tbody in sorted order
        matchedRows.forEach(r => tbody.appendChild(r));

        // 3. Pagination calculation
        const totalMatched = matchedRows.length;
        const totalPages = Math.ceil(totalMatched / pageSize) || 1;

        if (currentPage > totalPages) {
          currentPage = totalPages;
        }
        if (currentPage < 1) {
          currentPage = 1;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalMatched);

        originalRows.forEach(r => {
          r.style.display = "none";
        });

        if (totalMatched === 0) {
          tableWrap.style.display = "none";
          if (emptyEl) emptyEl.style.display = "flex";
          if (pagination) pagination.style.display = "none";
        } else {
          tableWrap.style.display = "";
          if (emptyEl) emptyEl.style.display = "none";
          if (pagination) pagination.style.display = "flex";

          for (let i = startIndex; i < endIndex; i++) {
            matchedRows[i].style.display = "grid";
          }
        }

        // 4. Update pagination controls
        if (pageInfo) {
          if (totalMatched === 0) {
            pageInfo.textContent = "No entries to show";
          } else {
            pageInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalMatched} entries`;
          }
        }

        if (prevBtn) {
          prevBtn.disabled = currentPage <= 1;
        }
        if (nextBtn) {
          nextBtn.disabled = currentPage >= totalPages;
        }

        if (pageNumbersWrap) {
          pageNumbersWrap.innerHTML = "";
          for (let p = 1; p <= totalPages; p++) {
            const pBtn = document.createElement("button");
            pBtn.type = "button";
            pBtn.className = `tgl-page-num ${p === currentPage ? "active" : ""}`;
            pBtn.textContent = String(p);
            pBtn.addEventListener("click", () => {
              currentPage = p;
              applyTableState();
            });
            pageNumbersWrap.appendChild(pBtn);
          }
        }

        updateRowSelectionState();
      }

      // Live search input handling
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          searchQuery = e.target.value.trim().toLowerCase();
          if (searchQuery) {
            searchBox?.classList.add("has-query");
          } else {
            searchBox?.classList.remove("has-query");
          }
          currentPage = 1;
          applyTableState();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          searchBox?.classList.remove("has-query");
          searchQuery = "";
          currentPage = 1;
          applyTableState();
        });
      }

      // Filter select dropdowns handling
      filterSelects.forEach(select => {
        select.addEventListener("change", (e) => {
          const col = select.dataset.filterCol;
          if (col) {
            activeFilters[col] = e.target.value;
            currentPage = 1;
            applyTableState();
          }
        });
      });

      // Density toggle button handling
      if (densityBtn) {
        densityBtn.addEventListener("click", () => {
          tableWrap.classList.toggle("density-compact");
          const isCompact = tableWrap.classList.contains("density-compact");
          const labelSpan = densityBtn.querySelectorAll("span")[1];
          if (labelSpan) {
            labelSpan.textContent = isCompact ? "Comfortable" : "Compact";
          }
          showToast(isCompact ? "Compact density view" : "Comfortable density view", "↔");
        });
      }

      // Export CSV handling
      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          exportTableToCSV(tableWrap, card.querySelector(".tgl-card-title")?.textContent || "Data_Export");
        });
      }

      // Column Sorting handling
      sortHeaders.forEach(th => {
        th.addEventListener("click", () => {
          const col = th.dataset.sort;
          if (!col) return;

          if (currentSortCol === col) {
            if (currentSortDir === "asc") {
              currentSortDir = "desc";
            } else if (currentSortDir === "desc") {
              currentSortDir = null;
              currentSortCol = null;
            }
          } else {
            currentSortCol = col;
            currentSortDir = "asc";
          }

          // Update header icons and classes
          sortHeaders.forEach(otherTh => {
            const icon = otherTh.querySelector(".tgl-sort-icon");
            otherTh.classList.remove("sort-asc", "sort-desc");
            if (otherTh === th && currentSortDir) {
              otherTh.classList.add(currentSortDir === "asc" ? "sort-asc" : "sort-desc");
              if (icon) icon.innerHTML = currentSortDir === "asc" ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>';
            } else {
              if (icon) icon.innerHTML = '<i class="fa-solid fa-sort"></i>';
            }
          });

          applyTableState();
        });
      });

      // Checkbox interactions
      if (checkAll) {
        checkAll.addEventListener("change", (e) => {
          const isChecked = e.target.checked;
          const visibleRows = originalRows.filter(r => r.dataset.matched === "true");
          visibleRows.forEach(row => {
            const cb = row.querySelector(".tgl-row-check");
            if (cb) cb.checked = isChecked;
            if (isChecked) {
              row.classList.add("row-selected");
            } else {
              row.classList.remove("row-selected");
            }
          });
          updateBulkBar();
        });
      }

      originalRows.forEach(row => {
        const cb = row.querySelector(".tgl-row-check");
        if (cb) {
          cb.addEventListener("change", (e) => {
            if (e.target.checked) {
              row.classList.add("row-selected");
            } else {
              row.classList.remove("row-selected");
            }
            updateRowSelectionState();
          });
        }
      });

      // Pagination events
      if (pageSizeSelect) {
        pageSizeSelect.addEventListener("change", (e) => {
          pageSize = parseInt(e.target.value, 10) || 5;
          currentPage = 1;
          applyTableState();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage--;
            applyTableState();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          currentPage++;
          applyTableState();
        });
      }

      // Initial render
      applyTableState();
    });
  }

  // Floating Bulk Action Bar Controller
  function updateBulkBar() {
    const bulkBar = document.getElementById("tgl-bulk-actions-bar");
    const countEl = document.getElementById("tgl-bulk-count");
    if (!bulkBar) return;

    const checkedBoxes = Array.from(document.querySelectorAll(".tgl-row-check:checked"));
    const count = checkedBoxes.length;

    if (count > 0) {
      if (countEl) countEl.textContent = String(count);
      bulkBar.classList.add("visible");
    } else {
      bulkBar.classList.remove("visible");
    }
  }

  // Setup Global Bulk Bar Actions
  const bulkBar = document.getElementById("tgl-bulk-actions-bar");
  if (bulkBar) {
    // Clear button
    document.getElementById("tgl-bulk-clear")?.addEventListener("click", () => {
      document.querySelectorAll(".tgl-row-check:checked, .tgl-check-all:checked").forEach(cb => {
        cb.checked = false;
        if (cb.indeterminate) cb.indeterminate = false;
        const row = cb.closest(".tgl-tr");
        if (row) row.classList.remove("row-selected");
      });
      updateBulkBar();
      showToast("Selection cleared", "fa-xmark");
    });

    // Bulk export button
    document.getElementById("tgl-bulk-export")?.addEventListener("click", () => {
      const checkedRows = Array.from(document.querySelectorAll(".tgl-row-check:checked")).map(cb => cb.closest(".tgl-tr")).filter(Boolean);
      if (checkedRows.length === 0) return;

      const firstRow = checkedRows[0];
      const tableWrap = firstRow.closest(".tgl-table-wrap");
      const thead = tableWrap?.querySelector(".tgl-thead");
      const ths = thead ? Array.from(thead.querySelectorAll(".tgl-th")).filter(th => !th.classList.contains("col-check") && !th.classList.contains("col-act")) : [];
      const headers = ths.map(th => th.textContent.replace(/⇅|▲|▼/g, "").trim());

      const csvRows = [headers.join(",")];
      checkedRows.forEach(row => {
        const tds = Array.from(row.querySelectorAll(".tgl-td")).filter(td => !td.classList.contains("col-check") && !td.classList.contains("col-act"));
        const rowVals = tds.map(td => `"${td.textContent.replace(/"/g, '""').trim()}"`);
        csvRows.push(rowVals.join(","));
      });

      downloadCSVBlob(csvRows.join("\n"), `Selected_Items_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast(`Exported ${checkedRows.length} selected items to CSV`, "fa-download");
    });

    // Bulk update status button
    document.getElementById("tgl-bulk-status")?.addEventListener("click", () => {
      const checkedRows = Array.from(document.querySelectorAll(".tgl-row-check:checked")).map(cb => cb.closest(".tgl-tr")).filter(Boolean);
      checkedRows.forEach(row => {
        const statusPill = row.querySelector(".tgl-status-pill");
        if (statusPill) {
          statusPill.className = "tgl-status-pill badge-delivered";
          statusPill.innerHTML = `<span class="status-dot"></span><span>Delivered</span>`;
          row.dataset.status = "Delivered";
        }
        const cb = row.querySelector(".tgl-row-check");
        if (cb) cb.checked = false;
        row.classList.remove("row-selected");
      });
      updateBulkBar();
      showToast(`Updated status for ${checkedRows.length} items to Delivered`, "fa-check");
    });

    // Bulk delete button
    document.getElementById("tgl-bulk-delete")?.addEventListener("click", () => {
      const checkedRows = Array.from(document.querySelectorAll(".tgl-row-check:checked")).map(cb => cb.closest(".tgl-tr")).filter(Boolean);
      if (confirm(`Are you sure you want to remove ${checkedRows.length} selected items?`)) {
        checkedRows.forEach(row => {
          row.style.transition = "opacity 0.2s ease, transform 0.2s ease";
          row.style.opacity = "0";
          row.style.transform = "translateX(-20px)";
          setTimeout(() => row.remove(), 220);
        });
        setTimeout(() => updateBulkBar(), 250);
        showToast(`Removed ${checkedRows.length} items`, "fa-trash-can");
      }
    });
  }

  // CSV Exporter Helper
  function exportTableToCSV(tableWrap, filename) {
    const thead = tableWrap.querySelector(".tgl-thead");
    const tbody = tableWrap.querySelector(".tgl-tbody");
    if (!thead || !tbody) return;

    const ths = Array.from(thead.querySelectorAll(".tgl-th")).filter(th => !th.classList.contains("col-check") && !th.classList.contains("col-act"));
    const headers = ths.map(th => th.textContent.replace(/⇅|▲|▼/g, "").trim());

    const rows = Array.from(tbody.querySelectorAll(".tgl-tr")).filter(r => r.style.display !== "none");
    const csvRows = [headers.join(",")];

    rows.forEach(row => {
      const tds = Array.from(row.querySelectorAll(".tgl-td")).filter(td => !td.classList.contains("col-check") && !td.classList.contains("col-act"));
      const rowVals = tds.map(td => `"${td.textContent.replace(/"/g, '""').trim()}"`);
      csvRows.push(rowVals.join(","));
    });

    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadCSVBlob(csvRows.join("\n"), `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${rows.length} rows to ${safeName}.csv`, "fa-download");
  }

  function downloadCSVBlob(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ========================================================
  // ORDER DETAILS FULL PAGE CONTROLLER
  // ========================================================
  const orderDataMap = {
    "#TG1008": { id: "#TG1008", customer: "Amara Jayawardena", email: "amara.j@gmail.com", phone: "+94 77 123 4567", address: "No. 42 Flower Road, Colombo 07", date: "Jun 9, 2025 01:45 PM", status: "Processing", total: "Rs 6,250.00", payment: "Card (Visa ****4129)", items: [ { name: "Platform Canvas Pastel Sneakers (Size 38)", qty: 1, price: "Rs 4,950.00", img: "/public/images/products/pastel-sneakers.jpg" }, { name: "Crystal Butterfly Hairpins Set", qty: 1, price: "Rs 850.00", img: "/public/images/products/butterfly-hairpins.jpg" } ], subtotal: "Rs 5,800.00", shipping: "Rs 450.00" },
    "#TG1007": { id: "#TG1007", customer: "Dinithi Silva", email: "dinithi@outlook.com", phone: "+94 71 987 6543", address: "18 Peradeniya Road, Kandy", date: "Jun 9, 2025 12:30 PM", status: "Out for Delivery", total: "Rs 3,890.00", payment: "Cash on Delivery (COD)", items: [ { name: "Floral Summer Maxi Dress (Size M)", qty: 1, price: "Rs 3,450.00", img: "/public/images/products/floral-maxi-dress.jpg" } ], subtotal: "Rs 3,450.00", shipping: "Rs 440.00" },
    "#TG1006": { id: "#TG1006", customer: "Kasun Fernando", email: "kasun.f@yahoo.com", phone: "+94 76 555 1234", address: "89 Beach Road, Negombo", date: "Jun 9, 2025 11:50 AM", status: "Shipped", total: "Rs 5,120.00", payment: "Bank Transfer (Commercial Bank)", items: [ { name: "Pastel Pink Crossbody Bag", qty: 1, price: "Rs 2,890.00", img: "/public/images/products/pink-crossbody-bag.jpg" }, { name: "Pleated Tennis Skirt (Pink, Size S)", qty: 1, price: "Rs 2,230.00", img: "/public/images/products/floral-maxi-dress.jpg" } ], subtotal: "Rs 5,120.00", shipping: "Free" },
    "#TG1005": { id: "#TG1005", customer: "Pooja Weerasinghe", email: "pooja.w@gmail.com", phone: "+94 72 345 6789", address: "14 Fort Gate, Galle", date: "Jun 9, 2025 11:22 AM", status: "Dispatched", total: "Rs 4,350.00", payment: "Card (Mastercard ****8812)", items: [ { name: "Crop Knit Lavender Cardigan", qty: 1, price: "Rs 2,450.00", img: "/public/images/products/lavender-cardigan.jpg" }, { name: "Glossy Berry Lip Tint Trio", qty: 1, price: "Rs 1,650.00", img: "/public/images/products/lip-tint-trio.jpg" } ], subtotal: "Rs 4,100.00", shipping: "Rs 250.00" },
    "#TG1004": { id: "#TG1004", customer: "Guest Customer", email: "guest@teengirls.lk", phone: "+94 77 444 8899", address: "Express Pickup Desk - Store 1", date: "Jun 9, 2025 11:17 AM", status: "Out for Delivery", total: "Rs 1,799.00", payment: "Cash on Delivery (COD)", items: [ { name: "Glossy Berry Lip Tint Trio", qty: 1, price: "Rs 1,650.00", img: "/public/images/products/lip-tint-trio.jpg" } ], subtotal: "Rs 1,650.00", shipping: "Rs 149.00" },
    "#TG1003": { id: "#TG1003", customer: "Guest Customer", email: "guest@teengirls.lk", phone: "+94 77 333 7788", address: "55 Galle Road, Colombo 03", date: "Jun 9, 2025 09:24 AM", status: "Shipped", total: "Rs 3,450.00", payment: "Card (Visa ****5531)", items: [ { name: "Floral Summer Maxi Dress", qty: 1, price: "Rs 3,450.00", img: "/public/images/products/floral-maxi-dress.jpg" } ], subtotal: "Rs 3,450.00", shipping: "Free" },
    "#TG1002": { id: "#TG1002", customer: "Sarah Connor", email: "sconnor@teensgirls.com", phone: "+94 70 222 1100", address: "77 Dehiwala Road, Mount Lavinia", date: "Jun 9, 2025 08:12 AM", status: "Dispatched", total: "Rs 2,100.00", payment: "Cash on Delivery (COD)", items: [ { name: "Pleated High-Waist Tennis Skirt", qty: 1, price: "Rs 2,100.00", img: "/public/images/products/floral-maxi-dress.jpg" } ], subtotal: "Rs 2,100.00", shipping: "Free" },
    "#TG1001": { id: "#TG1001", customer: "Alex Mercer", email: "mercer.a@gmail.com", phone: "+94 75 111 9922", address: "12 Parliament Way, Battaramulla", date: "Jun 8, 2025 05:40 PM", status: "Delivered", total: "Rs 4,800.00", payment: "Bank Transfer (HNB)", items: [ { name: "Teen Sparkle Box - Vol 4 Edition", qty: 1, price: "Rs 4,800.00", img: "/public/images/products/surprise-box.jpg" } ], subtotal: "Rs 4,800.00", shipping: "Free" }
  };

  function openOrderPage(orderId) {
    const order = orderDataMap[orderId] || {
      id: orderId || "#TG1008",
      customer: "Amara Jayawardena",
      email: "amara.j@gmail.com",
      phone: "+94 77 123 4567",
      address: "No. 42 Flower Road, Colombo 07",
      date: "Jun 9, 2025 01:45 PM",
      status: "Processing",
      total: "Rs 6,250.00",
      payment: "Card (Visa ****4129)",
      items: [
        { name: "Platform Canvas Pastel Sneakers (Size 38)", qty: 1, price: "Rs 4,950.00", img: "/public/images/products/pastel-sneakers.jpg" },
        { name: "Crystal Butterfly Hairpins Set", qty: 1, price: "Rs 850.00", img: "/public/images/products/butterfly-hairpins.jpg" }
      ],
      subtotal: "Rs 5,800.00",
      shipping: "Rs 450.00"
    };

    const modalTitle = document.getElementById("modal-order-title");
    const modalBadge = document.getElementById("modal-order-badge");
    const modalContent = document.getElementById("tgl-modal-content");
    const breadcrumbCurrent = document.getElementById("order-breadcrumb-current");
    const metaSub = document.getElementById("order-page-meta-sub");

    if (modalTitle) modalTitle.textContent = `Order ${order.id}`;
    if (modalBadge) {
      modalBadge.textContent = order.status;
      modalBadge.className = `tgl-status-pill ${order.status === "Delivered" ? "badge-active" : "badge-limited"}`;
    }
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = `Order ${order.id}`;
    if (metaSub) metaSub.textContent = `Placed on ${order.date} • Paid via ${order.payment} • Dispatch to ${order.customer}`;

    if (modalContent) {
      const itemsHtml = order.items.map(it => `
        <tr>
          <td>
            <div class="tgl-order-prod-cell">
              <img class="tgl-order-prod-thumb" src="${it.img || '/public/images/products/floral-maxi-dress.jpg'}" alt="${it.name}" onerror="this.src='/public/images/placeholder.svg'">
              <div>
                <strong>${it.name}</strong>
                <div style="font-size:0.75rem;color:var(--tgl-text-muted);">Standard Boutique Item</div>
              </div>
            </div>
          </td>
          <td><strong style="color:var(--tgl-primary);">${it.qty}</strong></td>
          <td>${it.price}</td>
          <td><strong>${it.price}</strong></td>
        </tr>
      `).join("");

      modalContent.innerHTML = `
        <div class="tgl-form-grid-layout">
          <div class="tgl-form-col">
            <div class="tgl-form-section-card">
              <div class="tgl-section-card-head">
                <h3 class="tgl-section-card-title">Order Items & Merchandising (${order.items.length} Lines)</h3>
                <p class="tgl-section-card-sub">SKUs fulfilled by TeenGirlsLK Islandwide Distribution Center</p>
              </div>
              <div class="tgl-section-card-body" style="padding:0;">
                <table class="tgl-order-items-full-table">
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="tgl-form-section-card">
              <div class="tgl-section-card-head">
                <h3 class="tgl-section-card-title">Dispatch & Shipment Timeline</h3>
                <p class="tgl-section-card-sub">Tracking logistics partner Handover: TG-LK-EXP-9021</p>
              </div>
              <div class="tgl-section-card-body">
                <div style="display:flex;justify-content:space-between;align-items:center;position:relative;padding:0.75rem 0;">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;z-index:2;">
                    <span style="width:28px;height:28px;border-radius:50%;background:#10B981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;"><i class="fa-solid fa-check"></i></span>
                    <span style="font-size:0.75rem;font-weight:700;color:var(--tgl-text-title);">Order Placed</span>
                    <span style="font-size:0.7rem;color:var(--tgl-text-muted);">${order.date.split(" ")[0]}</span>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;z-index:2;">
                    <span style="width:28px;height:28px;border-radius:50%;background:#10B981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;"><i class="fa-solid fa-check"></i></span>
                    <span style="font-size:0.75rem;font-weight:700;color:var(--tgl-text-title);">Dispatched</span>
                    <span style="font-size:0.7rem;color:var(--tgl-text-muted);">Colombo Hub</span>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;z-index:2;">
                    <span style="width:28px;height:28px;border-radius:50%;background:${order.status === 'Delivered' || order.status === 'Out for Delivery' ? '#10B981' : '#FF4B8B'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;"><i class="fa-solid fa-truck-fast"></i></span>
                    <span style="font-size:0.75rem;font-weight:700;color:var(--tgl-text-title);">In Transit</span>
                    <span style="font-size:0.7rem;color:var(--tgl-text-muted);">Courier Agent</span>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;z-index:2;">
                    <span style="width:28px;height:28px;border-radius:50%;background:${order.status === 'Delivered' ? '#10B981' : '#E2E8F0'};color:${order.status === 'Delivered' ? '#fff' : '#94A3B8'};display:flex;align-items:center;justify-content:center;font-size:0.75rem;"><i class="fa-solid fa-box-open"></i></span>
                    <span style="font-size:0.75rem;font-weight:700;color:var(--tgl-text-title);">Delivered</span>
                    <span style="font-size:0.7rem;color:var(--tgl-text-muted);">${order.status === 'Delivered' ? 'Completed' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="tgl-form-col">
            <div class="tgl-form-section-card">
              <div class="tgl-section-card-head">
                <h3 class="tgl-section-card-title">Customer & Destination</h3>
                <p class="tgl-section-card-sub">Delivery address and direct customer phone</p>
              </div>
              <div class="tgl-section-card-body">
                <div style="display:flex;flex-direction:column;gap:0.85rem;">
                  <div>
                    <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--tgl-text-muted);">Recipient Name</span>
                    <div style="font-size:0.95rem;font-weight:700;color:var(--tgl-text-title);margin-top:2px;">${order.customer}</div>
                  </div>
                  <div>
                    <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--tgl-text-muted);">Contact Details</span>
                    <div style="font-size:0.85rem;color:var(--tgl-text-dim);">${order.email}</div>
                    <div style="font-size:0.85rem;font-weight:600;color:var(--tgl-primary);">${order.phone}</div>
                  </div>
                  <div>
                    <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--tgl-text-muted);">Shipping Address</span>
                    <div style="font-size:0.85rem;color:var(--tgl-text-title);line-height:1.4;margin-top:2px;">${order.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="tgl-form-section-card">
              <div class="tgl-section-card-head">
                <h3 class="tgl-section-card-title">Payment & Settlement Breakdown</h3>
                <p class="tgl-section-card-sub">Settled via ${order.payment}</p>
              </div>
              <div class="tgl-section-card-body">
                <div style="display:flex;flex-direction:column;gap:0.65rem;">
                  <div class="tgl-order-total-row">
                    <span>Items Subtotal:</span>
                    <strong>${order.subtotal}</strong>
                  </div>
                  <div class="tgl-order-total-row">
                    <span>Islandwide Courier:</span>
                    <strong>${order.shipping}</strong>
                  </div>
                  <div class="tgl-order-total-row">
                    <span>Tax & Service:</span>
                    <span>Rs 0.00 (Included)</span>
                  </div>
                  <div class="tgl-order-total-row grand-total">
                    <span>Grand Total:</span>
                    <strong>${order.total}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    switchTab("order-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ========================================================
  // SEPARATE FORM PAGES (PRODUCTS, CATEGORIES, COUPONS, CUSTOMERS)
  // ========================================================
  function initAddEditPages() {
    // 1. PRODUCT FORM PAGE
    const prodForm = document.getElementById("tgl-product-form");
    const prodTitle = document.getElementById("modal-prod-title");
    const prodBadge = document.getElementById("modal-prod-badge");
    const prodModePill = document.getElementById("prod-mode-pill");
    const prodBreadcrumb = document.getElementById("prod-breadcrumb-current");
    const prodSubmitText = document.getElementById("tgl-prod-submit-text");
    const prodImgPreview = document.getElementById("prod-img-preview");
    const prodImgUrl = document.getElementById("prod-img-url");
    const prodImgFile = document.getElementById("prod-img-file");
    const btnGenSku = document.getElementById("btn-gen-sku");
    const presetChips = document.querySelectorAll(".tgl-preset-chips .tgl-chip-btn");

    let currentEditingProdRow = null;

    function openProductPage(isEdit, row = null) {
      if (!prodForm) return;
      currentEditingProdRow = isEdit ? row : null;

      if (isEdit && row) {
        prodForm.setAttribute("data-mode", "edit");
        const name = row.getAttribute("data-prod") || "";
        const sku = row.getAttribute("data-sku") || "";
        const category = row.getAttribute("data-category") || "Dresses";
        const stock = row.getAttribute("data-stock") || "10";
        const price = (row.getAttribute("data-price") || "").replace(/[^0-9.]/g, "");
        const status = row.getAttribute("data-status") || "Active";
        const img = row.getAttribute("data-img") || "/public/images/products/floral-maxi-dress.jpg";
        const desc = row.querySelector(".tgl-td-sub")?.textContent?.trim() || "";

        prodForm.elements["name"].value = name;
        prodForm.elements["sku"].value = sku;
        prodForm.elements["category"].value = category;
        prodForm.elements["price"].value = price;
        prodForm.elements["stock"].value = stock;
        prodForm.elements["status"].value = status;
        prodForm.elements["description"].value = desc;

        if (prodImgUrl) prodImgUrl.value = img;
        if (prodImgPreview) prodImgPreview.src = img;

        if (prodTitle) prodTitle.textContent = `Edit Product: ${name}`;
        if (prodBadge) prodBadge.textContent = "Product Catalog";
        if (prodModePill) prodModePill.textContent = `Editing: ${sku}`;
        if (prodBreadcrumb) prodBreadcrumb.textContent = `Edit Product (${sku})`;
        if (prodSubmitText) prodSubmitText.textContent = "Update Product";
      } else {
        prodForm.setAttribute("data-mode", "add");
        prodForm.reset();
        const randSku = "TG-" + (prodForm.elements["category"]?.value?.substring(0, 2).toUpperCase() || "PR") + "-" + Math.floor(100 + Math.random() * 900);
        if (prodForm.elements["sku"]) prodForm.elements["sku"].value = randSku;
        const defaultImg = "/public/images/products/floral-maxi-dress.jpg";
        if (prodImgUrl) prodImgUrl.value = defaultImg;
        if (prodImgPreview) prodImgPreview.src = defaultImg;

        if (prodTitle) prodTitle.textContent = "Add New Product";
        if (prodBadge) prodBadge.textContent = "Product Catalog";
        if (prodModePill) prodModePill.textContent = "Creating Entry";
        if (prodBreadcrumb) prodBreadcrumb.textContent = "Add New Product";
        if (prodSubmitText) prodSubmitText.textContent = "Save Product";
      }

      switchTab("product-form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Preset Image Chips
    presetChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const presetUrl = chip.getAttribute("data-preset");
        if (presetUrl) {
          if (prodImgUrl) prodImgUrl.value = presetUrl;
          if (prodImgPreview) prodImgPreview.src = presetUrl;
          presetChips.forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
        }
      });
    });

    // Live URL preview
    prodImgUrl?.addEventListener("input", () => {
      if (prodImgPreview) prodImgPreview.src = prodImgUrl.value.trim() || "/public/images/placeholder.svg";
    });

    // Local file upload preview
    prodImgFile?.addEventListener("change", () => {
      const file = prodImgFile.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (prodImgPreview) prodImgPreview.src = ev.target.result;
          if (prodImgUrl) prodImgUrl.value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Auto SKU
    btnGenSku?.addEventListener("click", () => {
      const cat = prodForm.elements["category"]?.value || "PR";
      const catPrefix = cat.substring(0, 2).toUpperCase();
      prodForm.elements["sku"].value = `TG-${catPrefix}-${Math.floor(100 + Math.random() * 900)}`;
      showToast("Generated new unique SKU", "fa-bolt");
    });

    // Save / Submit Product Form
    prodForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = prodForm.elements["name"]?.value?.trim() || "Untitled Product";
      const sku = prodForm.elements["sku"]?.value?.trim() || "TG-PR-000";
      const category = prodForm.elements["category"]?.value || "Dresses";
      const priceNum = parseFloat(prodForm.elements["price"]?.value) || 0;
      const stockNum = parseInt(prodForm.elements["stock"]?.value, 10) || 0;
      const status = prodForm.elements["status"]?.value || "Active";
      const img = prodImgUrl?.value?.trim() || "/public/images/placeholder.svg";
      const desc = prodForm.elements["description"]?.value?.trim() || "Boutique fashion item";

      const formattedPrice = "Rs " + priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const stockClass = stockNum > 10 ? "stock-in" : (stockNum > 0 ? "stock-low" : "stock-out");
      const statusClass = status === "Active" ? "badge-active" : "badge-limited";

      if (currentEditingProdRow) {
        currentEditingProdRow.setAttribute("data-prod", name);
        currentEditingProdRow.setAttribute("data-sku", sku);
        currentEditingProdRow.setAttribute("data-category", category);
        currentEditingProdRow.setAttribute("data-stock", stockNum);
        currentEditingProdRow.setAttribute("data-price", formattedPrice);
        currentEditingProdRow.setAttribute("data-status", status);
        currentEditingProdRow.setAttribute("data-img", img);

        const prodNameEl = currentEditingProdRow.querySelector(".tgl-prod-name");
        if (prodNameEl) prodNameEl.textContent = name;
        const prodDescEl = currentEditingProdRow.querySelector(".tgl-td-sub");
        if (prodDescEl) prodDescEl.textContent = desc;
        const prodThumbEl = currentEditingProdRow.querySelector(".tgl-prod-thumb");
        if (prodThumbEl) {
          prodThumbEl.src = img;
          prodThumbEl.alt = name;
        }
        const skuEl = currentEditingProdRow.querySelector(".tgl-sku");
        if (skuEl) skuEl.textContent = sku;
        const catEl = currentEditingProdRow.querySelector(".col-category");
        if (catEl) catEl.textContent = category;
        const stockEl = currentEditingProdRow.querySelector(".col-stock");
        if (stockEl) stockEl.innerHTML = `<span class="tgl-stock-badge ${stockClass}">${stockNum} in stock</span>`;
        const priceEl = currentEditingProdRow.querySelector(".tgl-price");
        if (priceEl) priceEl.textContent = formattedPrice;
        const statusEl = currentEditingProdRow.querySelector(".col-status");
        if (statusEl) statusEl.innerHTML = `<span class="tgl-status-pill ${statusClass}"><span class="status-dot"></span><span>${status}</span></span>`;

        showToast(`Product "${name}" updated successfully! `, "fa-check");
      } else {
        const tbody = document.querySelector(".table-products .tgl-tbody");
        if (tbody) {
          const newRow = document.createElement("div");
          newRow.className = "tgl-tr";
          newRow.setAttribute("data-prod", name);
          newRow.setAttribute("data-sku", sku);
          newRow.setAttribute("data-category", category);
          newRow.setAttribute("data-stock", stockNum);
          newRow.setAttribute("data-price", formattedPrice);
          newRow.setAttribute("data-status", status);
          newRow.setAttribute("data-img", img);

          newRow.innerHTML = `
            <div class="tgl-td col-check">
              <input class="tgl-row-check" type="checkbox" aria-label="Select product">
            </div>
            <div class="tgl-td col-prod">
              <div class="tgl-prod-cell">
                <div class="tgl-prod-thumb-wrap">
                  <img class="tgl-prod-thumb" src="${img}" alt="${name}" onerror="this.onerror=null; this.src='/public/images/placeholder.svg';">
                </div>
                <div>
                  <strong class="tgl-prod-name">${name}</strong>
                  <div class="tgl-td-sub">${desc}</div>
                </div>
              </div>
            </div>
            <div class="tgl-td col-sku">
              <code class="tgl-sku">${sku}</code>
            </div>
            <div class="tgl-td col-category">${category}</div>
            <div class="tgl-td col-stock">
              <span class="tgl-stock-badge ${stockClass}">${stockNum} in stock</span>
            </div>
            <div class="tgl-td col-price">
              <strong class="tgl-price">${formattedPrice}</strong>
            </div>
            <div class="tgl-td col-status">
              <span class="tgl-status-pill ${statusClass}">
                <span class="status-dot"></span>
                <span>${status}</span>
              </span>
            </div>
            <div class="tgl-td col-act">
              <button class="tgl-btn-table-action" type="button" data-action="edit-product">Edit</button>
            </div>
          `;

          tbody.prepend(newRow);
          initModernDataTables();
          showToast(`Product "${name}" added to catalog! `, "fa-circle-check");
        }
      }

      currentEditingProdRow = null;
      switchTab("products");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 2. CATEGORY FORM PAGE
    const catForm = document.getElementById("tgl-category-form");
    const catTitle = document.getElementById("modal-cat-title");
    const catModePill = document.getElementById("cat-mode-pill");
    const catBreadcrumb = document.getElementById("cat-breadcrumb-current");

    let currentEditingCatCard = null;

    function openCategoryPage(isEdit, card = null) {
      if (!catForm) return;
      currentEditingCatCard = isEdit ? card : null;

      if (isEdit && card) {
        const name = card.getAttribute("data-cat-name") || card.querySelector("h3")?.textContent?.trim() || "";
        const slug = card.getAttribute("data-cat-slug") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const icon = card.getAttribute("data-cat-icon") || card.querySelector(".tgl-cat-icon")?.textContent?.trim() || "�";

        catForm.elements["catName"].value = name;
        catForm.elements["catSlug"].value = slug;
        catForm.elements["catIcon"].value = icon;
        if (catTitle) catTitle.textContent = `Edit Category: ${name}`;
        if (catModePill) catModePill.textContent = "Editing Category";
        if (catBreadcrumb) catBreadcrumb.textContent = `Edit Category (${name})`;
      } else {
        catForm.reset();
        if (catTitle) catTitle.textContent = "Add Category";
        if (catModePill) catModePill.textContent = "New Category";
        if (catBreadcrumb) catBreadcrumb.textContent = "Add Category";
      }

      switchTab("category-form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    catForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = catForm.elements["catName"]?.value?.trim() || "Untitled Category";
      const icon = catForm.elements["catIcon"]?.value?.trim() || "fa-folder";

      if (currentEditingCatCard) {
        const h3 = currentEditingCatCard.querySelector("h3");
        if (h3) h3.textContent = name;
        const iconEl = currentEditingCatCard.querySelector(".tgl-cat-icon");
        if (iconEl) iconEl.textContent = icon;
        currentEditingCatCard.setAttribute("data-cat-name", name);
        showToast(`Category "${name}" updated!`, "fa-folder");
      } else {
        const grid = document.querySelector(".tgl-categories-grid");
        if (grid) {
          const newCard = document.createElement("div");
          newCard.className = "tgl-cat-card";
          newCard.setAttribute("data-cat-name", name);
          newCard.setAttribute("data-cat-icon", icon);
          newCard.innerHTML = `
            <div class="tgl-cat-icon">${icon}</div>
            <h3>${name}</h3>
            <p>0 products listed</p>
            <button class="tgl-btn-xs-outline" type="button" data-action="edit-category" data-cat-name="${name}" data-cat-icon="${icon}">Edit</button>
          `;
          grid.appendChild(newCard);
          showToast(`Category "${name}" created!`, "fa-circle-check");
        }
      }

      currentEditingCatCard = null;
      switchTab("categories");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 3. COUPON FORM PAGE
    const coupForm = document.getElementById("tgl-coupon-form");
    const coupTitle = document.getElementById("modal-coup-title");
    const coupModePill = document.getElementById("coup-mode-pill");
    const coupBreadcrumb = document.getElementById("coup-breadcrumb-current");
    const btnGenCode = document.getElementById("btn-gen-code");

    let currentEditingCoupRow = null;

    function openCouponPage(isEdit, row = null) {
      if (!coupForm) return;
      currentEditingCoupRow = isEdit ? row : null;

      if (isEdit && row) {
        const code = row.getAttribute("data-code") || "";
        const type = row.getAttribute("data-type") || "Percentage";
        const val = row.getAttribute("data-disc") || "";
        const spend = (row.getAttribute("data-spend") || "").replace(/[^0-9.]/g, "");
        const status = row.getAttribute("data-status") || "Active";

        coupForm.elements["code"].value = code;
        coupForm.elements["type"].value = type;
        coupForm.elements["val"].value = val;
        coupForm.elements["spend"].value = spend;
        coupForm.elements["status"].value = status;
        if (coupTitle) coupTitle.textContent = `Edit Coupon: ${code}`;
        if (coupModePill) coupModePill.textContent = `Editing: ${code}`;
        if (coupBreadcrumb) coupBreadcrumb.textContent = `Edit Coupon (${code})`;
      } else {
        coupForm.reset();
        const prefixes = ["TEEN", "SUMMER", "GLAM", "SPARKLE", "CHIC"];
        const randCode = prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(10 + Math.random() * 40);
        coupForm.elements["code"].value = randCode;
        if (coupTitle) coupTitle.textContent = "Create Coupon Voucher";
        if (coupModePill) coupModePill.textContent = "New Voucher";
        if (coupBreadcrumb) coupBreadcrumb.textContent = "Create Coupon Voucher";
      }

      switchTab("coupon-form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    btnGenCode?.addEventListener("click", () => {
      const prefixes = ["PROMO", "FLASH", "WELCOME", "GIFT", "TEEN"];
      const code = prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(15 + Math.random() * 35);
      coupForm.elements["code"].value = code;
      showToast("Generated voucher code: " + code, "fa-ticket");
    });

    coupForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = coupForm.elements["code"]?.value?.trim()?.toUpperCase() || "VOUCHER";
      const type = coupForm.elements["type"]?.value || "Percentage";
      const val = coupForm.elements["val"]?.value?.trim() || "10%";
      const spend = parseFloat(coupForm.elements["spend"]?.value) || 0;
      const status = coupForm.elements["status"]?.value || "Active";
      const formattedSpend = "Rs " + spend.toLocaleString("en-US", { minimumFractionDigits: 2 });

      if (currentEditingCoupRow) {
        currentEditingCoupRow.setAttribute("data-code", code);
        currentEditingCoupRow.setAttribute("data-type", type);
        currentEditingCoupRow.setAttribute("data-disc", val);
        currentEditingCoupRow.setAttribute("data-spend", formattedSpend);
        currentEditingCoupRow.setAttribute("data-status", status);

        const codeEl = currentEditingCoupRow.querySelector(".tgl-code-pill");
        if (codeEl) codeEl.textContent = code;
        const typeEl = currentEditingCoupRow.querySelector(".col-type");
        if (typeEl) typeEl.textContent = type;
        const discEl = currentEditingCoupRow.querySelector(".col-disc strong");
        if (discEl) discEl.textContent = val;
        const spendEl = currentEditingCoupRow.querySelector(".col-spend");
        if (spendEl) spendEl.textContent = formattedSpend;

        showToast(`Coupon "${code}" updated!`, "fa-ticket");
      } else {
        const tbody = document.querySelector(".table-coupons .tgl-tbody");
        if (tbody) {
          const newRow = document.createElement("div");
          newRow.className = "tgl-tr";
          newRow.setAttribute("data-code", code);
          newRow.setAttribute("data-type", type);
          newRow.setAttribute("data-disc", val);
          newRow.setAttribute("data-spend", formattedSpend);
          newRow.setAttribute("data-redemp", "0 / 100");
          newRow.setAttribute("data-expiry", "Dec 31, 2026");
          newRow.setAttribute("data-status", status);

          newRow.innerHTML = `
            <div class="tgl-td col-check">
              <input class="tgl-row-check" type="checkbox" aria-label="Select coupon">
            </div>
            <div class="tgl-td col-code">
              <code class="tgl-code-pill">${code}</code>
            </div>
            <div class="tgl-td col-type">${type}</div>
            <div class="tgl-td col-disc">
              <strong class="text-pink">${val}</strong>
            </div>
            <div class="tgl-td col-spend">${formattedSpend}</div>
            <div class="tgl-td col-redemp">
              <div class="tgl-alloc-meter">
                <span class="alloc-text">0 / 100</span>
                <div class="alloc-bar"><div class="alloc-fill" style="width: 0%;"></div></div>
              </div>
            </div>
            <div class="tgl-td col-expiry">Dec 31, 2026</div>
            <div class="tgl-td col-status">
              <span class="tgl-status-pill badge-active"><span class="status-dot"></span><span>${status}</span></span>
            </div>
            <div class="tgl-td col-act">
              <button class="tgl-btn-table-action" type="button" data-action="edit-coupon">Edit</button>
            </div>
          `;

          tbody.prepend(newRow);
          initModernDataTables();
          showToast(`Coupon "${code}" published! `, "fa-circle-check");
        }
      }

      currentEditingCoupRow = null;
      switchTab("coupons");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 4. CUSTOMER FORM PAGE
    const custForm = document.getElementById("tgl-customer-form");
    const custTitle = document.getElementById("modal-cust-title");
    const custModePill = document.getElementById("cust-mode-pill");
    const custBreadcrumb = document.getElementById("cust-breadcrumb-current");

    let currentEditingCustRow = null;

    function openCustomerPage(isEdit, row = null) {
      if (!custForm) return;
      currentEditingCustRow = isEdit ? row : null;

      if (isEdit && row) {
        const name = row.getAttribute("data-cust") || "";
        const email = row.getAttribute("data-email") || "";
        const phone = row.getAttribute("data-phone") || "";
        const tier = row.getAttribute("data-tier") || "Silver Club";
        const city = row.getAttribute("data-city") || "";

        custForm.elements["custName"].value = name;
        custForm.elements["custEmail"].value = email;
        custForm.elements["custPhone"].value = phone;
        custForm.elements["custTier"].value = tier;
        custForm.elements["custCity"].value = city;

        if (custTitle) custTitle.textContent = `Edit Customer: ${name}`;
        if (custModePill) custModePill.textContent = "Editing Profile";
        if (custBreadcrumb) custBreadcrumb.textContent = `Edit Customer (${name})`;
      } else {
        custForm.reset();
        if (custTitle) custTitle.textContent = "Customer Profile";
        if (custModePill) custModePill.textContent = "New Customer";
        if (custBreadcrumb) custBreadcrumb.textContent = "Add Customer";
      }

      switchTab("customer-form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    custForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = custForm.elements["custName"]?.value?.trim() || "New Customer";
      const email = custForm.elements["custEmail"]?.value?.trim() || "";
      const phone = custForm.elements["custPhone"]?.value?.trim() || "";
      const tier = custForm.elements["custTier"]?.value || "Standard";
      const city = custForm.elements["custCity"]?.value?.trim() || "Colombo";

      const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "TG";

      if (currentEditingCustRow) {
        currentEditingCustRow.setAttribute("data-cust", name);
        currentEditingCustRow.setAttribute("data-email", email);
        currentEditingCustRow.setAttribute("data-phone", phone);
        currentEditingCustRow.setAttribute("data-city", city);
        currentEditingCustRow.setAttribute("data-tier", tier);

        const nameEl = currentEditingCustRow.querySelector(".tgl-customer-name");
        if (nameEl) nameEl.textContent = name;
        const cityEl = currentEditingCustRow.querySelector(".tgl-td-sub");
        if (cityEl) cityEl.textContent = city;
        const emailEl = currentEditingCustRow.querySelector(".col-email");
        if (emailEl) emailEl.textContent = email;
        const tierEl = currentEditingCustRow.querySelector(".col-tier");
        if (tierEl) {
          const badgeClass = tier.includes("VIP") ? "badge-vip" : (tier.includes("Silver") ? "badge-silver" : "badge-bronze");
          tierEl.innerHTML = `<span class="tgl-status-pill ${badgeClass}">${tier}</span>`;
        }

        showToast(`Customer "${name}" profile saved!`, "fa-user");
      } else {
        const tbody = document.querySelector(".table-customers .tgl-tbody");
        if (tbody) {
          const newRow = document.createElement("div");
          newRow.className = "tgl-tr";
          newRow.setAttribute("data-cust", name);
          newRow.setAttribute("data-email", email);
          newRow.setAttribute("data-phone", phone);
          newRow.setAttribute("data-city", city);
          newRow.setAttribute("data-orders", "0");
          newRow.setAttribute("data-spent", "Rs 0.00");
          newRow.setAttribute("data-active", "Just now");
          newRow.setAttribute("data-tier", tier);

          const badgeClass = tier.includes("VIP") ? "badge-vip" : (tier.includes("Silver") ? "badge-silver" : "badge-bronze");

          newRow.innerHTML = `
            <div class="tgl-td col-check">
              <input class="tgl-row-check" type="checkbox" aria-label="Select customer">
            </div>
            <div class="tgl-td col-cust">
              <div class="tgl-cust-cell">
                <span class="tgl-cust-avatar ${badgeClass}">${initials}</span>
                <div>
                  <strong class="tgl-customer-name">${name}</strong>
                  <div class="tgl-td-sub">${city}</div>
                </div>
              </div>
            </div>
            <div class="tgl-td col-email">${email}</div>
            <div class="tgl-td col-orders"><span class="tgl-badge-count">0 orders</span></div>
            <div class="tgl-td col-spent"><strong class="tgl-order-total">Rs 0.00</strong></div>
            <div class="tgl-td col-active"><span class="tgl-badge-active-dot"><span class="dot-green"></span><span>Just now</span></span></div>
            <div class="tgl-td col-tier"><span class="tgl-status-pill ${badgeClass}">${tier}</span></div>
            <div class="tgl-td col-act">
              <button class="tgl-btn-table-action" type="button" data-action="edit-customer">Edit</button>
            </div>
          `;

          tbody.prepend(newRow);
          initModernDataTables();
          showToast(`Customer invitation sent to ${email}! `, "fa-user");
        }
      }

      currentEditingCustRow = null;
      switchTab("customers");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 5. GLOBAL CLICK DELEGATION FOR ALL ACTIONS & BACK BUTTONS
    document.addEventListener("click", (e) => {
      // Back buttons (e.g. data-back="products")
      const backBtn = e.target.closest("[data-back]");
      if (backBtn) {
        e.preventDefault();
        const targetTab = backBtn.getAttribute("data-back") || "dashboard";
        switchTab(targetTab);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Add Product Trigger
      const addProdBtn = e.target.closest('[data-action="add-product"]');
      if (addProdBtn) {
        e.preventDefault();
        openProductPage(false);
        return;
      }

      // Edit Product Trigger
      const editProdBtn = e.target.closest('[data-action="edit-product"]');
      if (editProdBtn) {
        e.preventDefault();
        const row = editProdBtn.closest(".tgl-tr");
        if (row) openProductPage(true, row);
        return;
      }

      // Add Category Trigger
      const addCatBtn = e.target.closest('[data-action="add-category"]');
      if (addCatBtn) {
        e.preventDefault();
        openCategoryPage(false);
        return;
      }

      // Edit Category Trigger
      const editCatBtn = e.target.closest('[data-action="edit-category"]');
      if (editCatBtn) {
        e.preventDefault();
        const card = editCatBtn.closest(".tgl-cat-card");
        openCategoryPage(true, card || editCatBtn);
        return;
      }

      // Add Coupon Trigger
      const addCoupBtn = e.target.closest('[data-action="add-coupon"]');
      if (addCoupBtn) {
        e.preventDefault();
        openCouponPage(false);
        return;
      }

      // Edit Coupon Trigger
      const editCoupBtn = e.target.closest('[data-action="edit-coupon"]');
      if (editCoupBtn) {
        e.preventDefault();
        const row = editCoupBtn.closest(".tgl-tr");
        if (row) openCouponPage(true, row);
        return;
      }

      // Add Customer Trigger
      const addCustBtn = e.target.closest('[data-action="add-customer"]');
      if (addCustBtn) {
        e.preventDefault();
        openCustomerPage(false);
        return;
      }

      // Edit Customer Trigger
      const editCustBtn = e.target.closest('[data-action="edit-customer"]');
      if (editCustBtn) {
        e.preventDefault();
        const row = editCustBtn.closest(".tgl-tr");
        if (row) openCustomerPage(true, row);
        return;
      }

      // New Order Trigger
      const newOrderBtn = e.target.closest('[data-action="new-order"]');
      if (newOrderBtn) {
        e.preventDefault();
        openOrderPage("#TG1008");
        showToast("Opened Order Details workspace", "fa-cart-shopping");
        return;
      }

      // View Order Trigger
      const viewTrigger = e.target.closest("[data-order-view]");
      if (viewTrigger) {
        e.preventDefault();
        const orderId = viewTrigger.getAttribute("data-order-view");
        openOrderPage(orderId);
        return;
      }

      // Edit Surprise Box Tier Trigger
      const editTierBtn = e.target.closest('[data-action="edit-tier"]');
      if (editTierBtn) {
        e.preventDefault();
        const tierName = editTierBtn.getAttribute("data-tier-name") || "Surprise Box";
        const tierPrice = editTierBtn.getAttribute("data-tier-price") || "2,990";
        showToast(`Editing Subscription Plan: ${tierName} (Rs ${tierPrice}) `, "fa-gift");
        return;
      }
    });

    // Order Action Buttons in Order Page
    const orderPrintBtn = document.getElementById("tgl-modal-print");
    const orderActionBtn = document.getElementById("tgl-modal-action");

    orderPrintBtn?.addEventListener("click", () => {
      showToast("Printing packing slip and dispatch manifest...", "fa-print");
    });

    orderActionBtn?.addEventListener("click", () => {
      showToast("Order marked as Delivered successfully!", "fa-check");
      const badge = document.getElementById("modal-order-badge");
      if (badge) {
        badge.textContent = "Delivered";
        badge.className = "tgl-status-pill badge-active";
      }
    });

    // Form state and persisted records are handled by admin-features.js.

    // Expose to window
    window.openProductPage = openProductPage;
    window.openCategoryPage = openCategoryPage;
    window.openCouponPage = openCouponPage;
    window.openCustomerPage = openCustomerPage;
    window.openOrderPage = openOrderPage;
  }

  // Initialize Data Tables & Form Pages
  initModernDataTables();
  initAddEditPages();
});
