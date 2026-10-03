/**
 * Mandatory MATCHA BAR - POS Application Core Engine
 * State Management, PWD / Senior 20% Discounts, Checkout, Split Payments, QR Wallet Display, Inventory & Analytics Bridge.
 */

const STORAGE_KEY = "MANDATORY_MATCHA_POS_V1";

class POSApp {
  constructor() {
    this.state = {
      settings: {},
      categories: [],
      products: [],
      paymentMethods: [],
      sales: [],
      currentCart: [],
      parkedCarts: [],
      activeTab: "register",
      activeCategory: "all",
      searchQuery: "",
      reportScope: "daily", // "daily" or "monthly"
      selectedDate: new Date().toISOString().split("T")[0],
      selectedMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      activeCheckoutMethod: "gcash",
      tenderAmount: 0,
      splitPaymentList: [],
      isSplitPaymentMode: false,
      cartDiscountType: "none", // 'none' | 'pwd' | 'senior' | 'promo10' | 'custom'
      cartDiscountValue: 0,
      discountIdNumber: "",
      discountHolderName: "",
      currentReceiptOrder: null,
      editingOrderId: null,
      editingProductId: null,
      orderFilterKeyword: "",
      orderFilterStatus: "all",
      orderFilterPayment: "all"
    };

    this.init();
  }

  /**
   * Initialize Application
   */
  init() {
    this.loadStateFromStorage();
    this.bindEvents();
    this.startClock();
    this.renderAll();
  }

  /**
   * Load data from LocalStorage or seed default dataset
   */
  loadStateFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.state.settings = parsed.settings || DEFAULT_SETTINGS;
        this.state.categories = parsed.categories || DEFAULT_CATEGORIES;
        this.state.products = parsed.products || DEFAULT_PRODUCTS;
        this.state.paymentMethods = parsed.paymentMethods || DEFAULT_PAYMENT_METHODS;
        this.state.sales = parsed.sales || [];
        this.state.parkedCarts = parsed.parkedCarts || [];
        return;
      } catch (err) {
        console.error("Error parsing stored data:", err);
      }
    }

    // Seed Mandatory Matcha Bar defaults
    this.state.settings = { ...DEFAULT_SETTINGS };
    this.state.categories = [...DEFAULT_CATEGORIES];
    this.state.products = [...DEFAULT_PRODUCTS];
    this.state.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
    this.state.sales = generateSeedSales(this.state.products, this.state.paymentMethods);
    this.state.parkedCarts = [];
    this.saveStateToStorage();
  }

  /**
   * Save state to localStorage
   */
  saveStateToStorage() {
    const payload = {
      settings: this.state.settings,
      categories: this.state.categories,
      products: this.state.products,
      paymentMethods: this.state.paymentMethods,
      sales: this.state.sales,
      parkedCarts: this.state.parkedCarts
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  /**
   * Start live system clock
   */
  startClock() {
    const timeEl = document.getElementById("liveTimeDisplay");
    const dateEl = document.getElementById("liveDateDisplay");

    const update = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    };

    update();
    setInterval(update, 1000);
  }

  /**
   * Bind DOM Events and Listeners
   */
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Theme Toggle (Light Cream vs Dark Kyoto Night)
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        themeBtn.textContent = next === "dark" ? "☀️" : "🍵";
      });
    }

    // Product Search in Register
    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.searchQuery = e.target.value.toLowerCase().trim();
        this.renderProductsGrid();
      });
    }

    // Clear Cart
    const clearCartBtn = document.getElementById("clearCartBtn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => this.clearCart());
    }

    // Park Order Button
    const parkOrderBtn = document.getElementById("parkOrderBtn");
    if (parkOrderBtn) {
      parkOrderBtn.addEventListener("click", () => this.parkCurrentCart());
    }

    // View Parked Orders
    const viewParkedBtn = document.getElementById("viewParkedBtn");
    if (viewParkedBtn) {
      viewParkedBtn.addEventListener("click", () => this.openParkedModal());
    }

    // Pay / Checkout Button
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.openCheckoutModal());
    }

    // Report Scope Buttons (Daily vs Monthly)
    document.querySelectorAll(".scope-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const scope = btn.dataset.scope;
        this.setReportScope(scope);
      });
    });

    // Date Picker for Daily Report
    const datePicker = document.getElementById("reportDatePicker");
    if (datePicker) {
      datePicker.value = this.state.selectedDate;
      datePicker.addEventListener("change", (e) => {
        this.state.selectedDate = e.target.value;
        this.renderAnalyticsView();
      });
    }

    // Month Picker for Monthly Report
    const monthPicker = document.getElementById("reportMonthPicker");
    if (monthPicker) {
      monthPicker.value = this.state.selectedMonth;
      monthPicker.addEventListener("change", (e) => {
        this.state.selectedMonth = e.target.value;
        this.renderAnalyticsView();
      });
    }

    // Export Sales CSV
    const exportCsvBtn = document.getElementById("exportSalesCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportSalesCSV());
    }

    // Print Sales Report
    const printReportBtn = document.getElementById("printReportBtn");
    if (printReportBtn) {
      printReportBtn.addEventListener("click", () => this.printCurrentReport());
    }

    // Order History Search & Filters
    const orderSearch = document.getElementById("orderSearchInput");
    if (orderSearch) {
      orderSearch.addEventListener("input", (e) => {
        this.state.orderFilterKeyword = e.target.value.toLowerCase().trim();
        this.renderOrdersView();
      });
    }

    const orderStatusFilter = document.getElementById("orderStatusFilter");
    if (orderStatusFilter) {
      orderStatusFilter.addEventListener("change", (e) => {
        this.state.orderFilterStatus = e.target.value;
        this.renderOrdersView();
      });
    }

    const orderPaymentFilter = document.getElementById("orderPaymentFilter");
    if (orderPaymentFilter) {
      orderPaymentFilter.addEventListener("change", (e) => {
        this.state.orderFilterPayment = e.target.value;
        this.renderOrdersView();
      });
    }

    // Settings Form
    const settingsForm = document.getElementById("storeSettingsForm");
    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveStoreSettings();
      });
    }

    // Add Product & Add Category Buttons
    const openAddProductBtn = document.getElementById("openAddProductBtn");
    if (openAddProductBtn) {
      openAddProductBtn.addEventListener("click", () => this.openProductModal());
    }

    const openCategoriesBtn = document.getElementById("openCategoriesBtn");
    if (openCategoriesBtn) {
      openCategoriesBtn.addEventListener("click", () => this.openCategoriesModal());
    }

    const openAddPaymentMethodBtn = document.getElementById("openAddPaymentMethodBtn");
    if (openAddPaymentMethodBtn) {
      openAddPaymentMethodBtn.addEventListener("click", () => this.openPaymentMethodModal());
    }

    // Backup & Restore Actions
    const backupJsonBtn = document.getElementById("backupJsonBtn");
    if (backupJsonBtn) {
      backupJsonBtn.addEventListener("click", () => this.exportJSONBackup());
    }

    const restoreFileInput = document.getElementById("restoreFileInput");
    if (restoreFileInput) {
      restoreFileInput.addEventListener("change", (e) => this.importJSONBackup(e));
    }

    const resetDemoBtn = document.getElementById("resetDemoDataBtn");
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener("click", () => this.resetDemoData());
    }
  }

  /**
   * Switch Active Tab
   */
  switchTab(tabName) {
    this.state.activeTab = tabName;

    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.toggle("active", sec.id === `view-${tabName}`);
    });

    if (tabName === "reports") {
      this.renderAnalyticsView();
    } else if (tabName === "orders") {
      this.renderOrdersView();
    } else if (tabName === "products") {
      this.renderProductsMgmtView();
    } else if (tabName === "settings") {
      this.renderSettingsView();
    }
  }

  /**
   * Re-render all views
   */
  renderAll() {
    this.renderStoreBranding();
    this.renderCategoryPills();
    this.renderProductsGrid();
    this.renderCart();
    this.renderAnalyticsView();
    this.renderOrdersView();
    this.renderProductsMgmtView();
    this.renderSettingsView();
  }

  renderStoreBranding() {
    const s = this.state.settings;
    const nameEl = document.getElementById("headerStoreName");
    if (nameEl) nameEl.textContent = s.storeName ? s.storeName.replace(" MATCHA BAR", "") : "Mandatory";
  }

  /* ==========================================================================
     REGISTER & CART MANAGEMENT
     ========================================================================== */

  renderCategoryPills() {
    const container = document.getElementById("categoryPillsContainer");
    if (!container) return;

    let html = `
      <button class="category-pill ${this.state.activeCategory === 'all' ? 'active' : ''}" onclick="app.setCategory('all')">
        <span>🍵</span> All Menu (${this.state.products.length})
      </button>
    `;

    this.state.categories.forEach(cat => {
      const count = this.state.products.filter(p => p.categoryId === cat.id).length;
      html += `
        <button class="category-pill ${this.state.activeCategory === cat.id ? 'active' : ''}" onclick="app.setCategory('${cat.id}')">
          <span>${cat.icon || '🏷️'}</span> ${cat.name} (${count})
        </button>
      `;
    });

    container.innerHTML = html;
  }

  setCategory(catId) {
    this.state.activeCategory = catId;
    this.renderCategoryPills();
    this.renderProductsGrid();
  }

  renderProductsGrid() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const query = this.state.searchQuery;
    const cat = this.state.activeCategory;
    const currency = this.state.settings.currencySymbol || "₱";

    const filtered = this.state.products.filter(p => {
      const matchCat = cat === "all" || p.categoryId === cat;
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.notes && p.notes.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🔍</span>
          <p>No matcha items found matching your search.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const isLowStock = (p.stock || 0) <= (p.lowStockThreshold || 15) && (p.stock || 0) > 0;
      const isOutOfStock = (p.stock || 0) <= 0;

      let stockBadgeClass = "stock-badge";
      let stockText = `${p.stock || 0} in stock`;
      if (isOutOfStock) {
        stockBadgeClass += " out-of-stock";
        stockText = "Sold Out";
      } else if (isLowStock) {
        stockBadgeClass += " low-stock";
        stockText = `${p.stock} left (Low)`;
      }

      let badgeHtml = "";
      if (p.badge === "Best Seller" || p.name.includes("★")) {
        badgeHtml = `<span class="product-badge-star">★ Best Seller</span>`;
      } else if (p.badge === "New") {
        badgeHtml = `<span class="product-badge-new">New</span>`;
      }

      return `
        <div class="product-card" onclick="app.addToCart('${p.id}')">
          <div class="product-card-top">
            <div class="badge-tag-row">
              ${badgeHtml}
            </div>
            <span class="${stockBadgeClass}">${stockText}</span>
          </div>
          <div>
            <div class="product-card-name">${p.name}</div>
            ${p.notes ? `<div class="product-card-desc">${p.notes}</div>` : ''}
          </div>
          <div class="product-card-bottom">
            <span class="product-card-sku">${p.sku || ''}</span>
            <span class="product-card-price">${currency}${p.price.toLocaleString()}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  addToCart(productId) {
    const product = this.state.products.find(p => p.id === productId);
    if (!product) return;

    if ((product.stock || 0) <= 0) {
      this.showToast(`Cannot add "${product.name}" — item is sold out!`, "danger");
      return;
    }

    const existingIndex = this.state.currentCart.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      const currentQty = this.state.currentCart[existingIndex].quantity;
      if (currentQty + 1 > product.stock) {
        this.showToast(`Max available stock for "${product.name}" is ${product.stock}.`, "warning");
        return;
      }
      this.state.currentCart[existingIndex].quantity += 1;
      this.state.currentCart[existingIndex].subtotal = this.state.currentCart[existingIndex].quantity * this.state.currentCart[existingIndex].price;
    } else {
      this.state.currentCart.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost || 0,
        quantity: 1,
        discount: 0,
        subtotal: product.price
      });
    }

    this.renderCart();
  }

  updateCartQty(productId, delta) {
    const index = this.state.currentCart.findIndex(i => i.productId === productId);
    if (index === -1) return;

    const item = this.state.currentCart[index];
    const product = this.state.products.find(p => p.id === productId);
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      this.state.currentCart.splice(index, 1);
    } else {
      if (product && newQty > product.stock) {
        this.showToast(`Max stock for "${item.name}" is ${product.stock}.`, "warning");
        return;
      }
      item.quantity = newQty;
      item.subtotal = item.quantity * item.price;
    }

    this.renderCart();
  }

  removeFromCart(productId) {
    this.state.currentCart = this.state.currentCart.filter(i => i.productId !== productId);
    this.renderCart();
  }

  clearCart() {
    if (this.state.currentCart.length === 0) return;
    this.state.currentCart = [];
    this.state.cartDiscountType = "none";
    this.state.cartDiscountValue = 0;
    this.state.discountIdNumber = "";
    this.state.discountHolderName = "";
    this.renderCart();
    this.showToast("Current order cleared.", "success");
  }

  /**
   * Calculate cart financial totals including PWD / Senior 20% discounts and VAT exemption
   */
  calculateCartTotals() {
    let subtotal = 0;
    let cost = 0;
    this.state.currentCart.forEach(item => {
      subtotal += item.subtotal;
      cost += (item.cost || 0) * item.quantity;
    });

    let discount = 0;
    let discountPercent = 0;
    let isVatExempt = false;
    let discountLabel = "Discount";

    const dType = this.state.cartDiscountType;

    if (dType === "pwd") {
      discountPercent = 20;
      discount = parseFloat((subtotal * 0.20).toFixed(2));
      isVatExempt = true; // Philippine RA 10754 VAT Exempt
      discountLabel = "PWD Discount (20%)";
    } else if (dType === "senior") {
      discountPercent = 20;
      discount = parseFloat((subtotal * 0.20).toFixed(2));
      isVatExempt = true; // Philippine RA 9994 VAT Exempt
      discountLabel = "Senior Citizen (20%)";
    } else if (dType === "promo10") {
      discountPercent = 10;
      discount = parseFloat((subtotal * 0.10).toFixed(2));
      discountLabel = "Promo Discount (10%)";
    } else if (dType === "custom") {
      discountPercent = Math.min(100, Math.max(0, this.state.cartDiscountValue || 0));
      discount = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
      discountLabel = `Custom Discount (${discountPercent}%)`;
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);

    let tax = 0;
    if (!isVatExempt) {
      const taxRate = (this.state.settings.taxRatePercent || 0) / 100;
      tax = parseFloat((discountedSubtotal * taxRate).toFixed(2));
    }

    const grandTotal = parseFloat((discountedSubtotal + tax).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount,
      discountPercent,
      discountLabel,
      isVatExempt,
      tax,
      total: grandTotal,
      cost: parseFloat(cost.toFixed(2))
    };
  }

  renderCart() {
    const container = document.getElementById("cartItemsContainer");
    const subtotalEl = document.getElementById("cartSubtotalDisplay");
    const discountRow = document.getElementById("cartDiscountSummaryRow");
    const discountLabelEl = document.getElementById("cartDiscountLabelDisplay");
    const discountValEl = document.getElementById("cartDiscountDisplay");
    const taxEl = document.getElementById("cartTaxDisplay");
    const taxLabelEl = document.getElementById("cartTaxLabelDisplay");
    const grandTotalEl = document.getElementById("cartGrandTotalDisplay");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const cartCountEl = document.getElementById("cartItemsCountDisplay");

    if (!container) return;

    const currency = this.state.settings.currencySymbol || "₱";
    const totals = this.calculateCartTotals();
    const totalUnits = this.state.currentCart.reduce((a, b) => a + b.quantity, 0);

    if (cartCountEl) cartCountEl.textContent = `${totalUnits} items`;

    if (this.state.currentCart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <span>🍵</span>
          <p>No matcha items in cart.<br><small>Click on any drink or pastry to add.</small></p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = `${currency}0.00`;
      if (discountRow) discountRow.style.display = "none";
      if (taxEl) taxEl.textContent = `${currency}0.00`;
      if (grandTotalEl) grandTotalEl.textContent = `${currency}0.00`;
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    container.innerHTML = this.state.currentCart.map(item => `
      <div class="cart-item-row">
        <div class="cart-item-main">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-unit-price">${currency}${item.price.toFixed(2)} each</div>
          </div>
          <div class="cart-item-total">${currency}${item.subtotal.toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-stepper">
            <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', -1)">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', 1)">+</button>
          </div>
          <button class="cart-item-del-btn" onclick="app.removeFromCart('${item.productId}')">✕ Remove</button>
        </div>
      </div>
    `).join('');

    if (subtotalEl) subtotalEl.textContent = `${currency}${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (discountRow) {
      if (totals.discount > 0) {
        discountRow.style.display = "flex";
        if (discountLabelEl) discountLabelEl.textContent = `${totals.discountLabel}:`;
        if (discountValEl) discountValEl.textContent = `-${currency}${totals.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (taxLabelEl) {
      if (totals.isVatExempt) {
        taxLabelEl.textContent = "VAT (Exempt - PWD/Senior):";
      } else {
        taxLabelEl.textContent = `VAT (${this.state.settings.taxRatePercent || 0}%):`;
      }
    }
    if (taxEl) taxEl.textContent = `${currency}${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (grandTotalEl) grandTotalEl.textContent = `${currency}${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  /* ==========================================================================
     HOLD / PARK CART ENGINE
     ========================================================================== */

  parkCurrentCart() {
    if (this.state.currentCart.length === 0) {
      this.showToast("Cannot hold an empty cart.", "warning");
      return;
    }

    const ticketName = prompt("Enter guest name or table # for this order:", `Table ${this.state.parkedCarts.length + 1}`) || `Order #${this.state.parkedCarts.length + 1}`;
    const totals = this.calculateCartTotals();

    this.state.parkedCarts.push({
      id: `PARK-${Date.now()}`,
      label: ticketName,
      timestamp: new Date().toISOString(),
      items: [...this.state.currentCart],
      total: totals.total,
      discountType: this.state.cartDiscountType,
      discountValue: this.state.cartDiscountValue,
      discountIdNumber: this.state.discountIdNumber
    });

    this.state.currentCart = [];
    this.state.cartDiscountType = "none";
    this.state.cartDiscountValue = 0;
    this.state.discountIdNumber = "";
    this.saveStateToStorage();
    this.renderCart();
    this.updateParkedBadge();
    this.showToast(`Order "${ticketName}" put on hold.`, "success");
  }

  updateParkedBadge() {
    const badge = document.getElementById("parkedBadge");
    if (badge) {
      const count = this.state.parkedCarts.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
  }

  openParkedModal() {
    const modal = document.getElementById("parkedModal");
    const container = document.getElementById("parkedListContainer");
    const currency = this.state.settings.currencySymbol || "₱";

    if (!modal || !container) return;

    if (this.state.parkedCarts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <span>📌</span>
          <p>No held matcha orders currently.</p>
        </div>
      `;
    } else {
      container.innerHTML = this.state.parkedCarts.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-md); margin-bottom: 0.6rem; border: 1.5px solid var(--border-color);">
          <div>
            <div style="font-family: var(--font-serif); font-weight: 800; color: var(--text-primary); font-size: 1rem;">${p.label}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(p.timestamp).toLocaleTimeString()} • ${p.items.length} items</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-family: var(--font-mono); font-weight: 900; color: var(--matcha-dark); font-size: 1.1rem;">${currency}${p.total.toFixed(2)}</span>
            <button class="btn-primary" onclick="app.resumeParkedOrder('${p.id}')">Resume</button>
            <button style="background: transparent; border: none; color: var(--danger); cursor: pointer;" onclick="app.deleteParkedOrder('${p.id}')">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    modal.classList.add("active");
  }

  resumeParkedOrder(parkId) {
    const foundIdx = this.state.parkedCarts.findIndex(p => p.id === parkId);
    if (foundIdx === -1) return;

    if (this.state.currentCart.length > 0) {
      if (!confirm("Current cart has items. Overwrite with resumed order?")) return;
    }

    const parked = this.state.parkedCarts[foundIdx];
    this.state.currentCart = [...parked.items];
    this.state.cartDiscountType = parked.discountType || "none";
    this.state.cartDiscountValue = parked.discountValue || 0;
    this.state.discountIdNumber = parked.discountIdNumber || "";

    this.state.parkedCarts.splice(foundIdx, 1);
    this.saveStateToStorage();
    this.renderCart();
    this.updateParkedBadge();
    this.closeModal("parkedModal");
    this.showToast("Held order resumed.", "success");
  }

  deleteParkedOrder(parkId) {
    this.state.parkedCarts = this.state.parkedCarts.filter(p => p.id !== parkId);
    this.saveStateToStorage();
    this.updateParkedBadge();
    this.openParkedModal();
    this.showToast("Held order deleted.", "success");
  }

  /* ==========================================================================
     FAST CHECKOUT & PAYMENT PROCESSING (DISCOUNTS, SINGLE & SPLIT PAYMENT)
     ========================================================================== */

  openCheckoutModal() {
    if (this.state.currentCart.length === 0) return;

    const modal = document.getElementById("checkoutModal");
    const pMethodsGrid = document.getElementById("checkoutPaymentMethodsGrid");

    // Reset to Single Mode by default
    this.setPaymentMode("single");

    // Render active payment methods for Single Mode
    const activeMethods = this.state.paymentMethods.filter(m => m.active);
    this.state.activeCheckoutMethod = activeMethods.find(m => m.id === "gcash") ? "gcash" : (activeMethods[0]?.id || "cash");

    if (pMethodsGrid) {
      pMethodsGrid.innerHTML = activeMethods.map(m => `
        <div class="payment-select-card ${m.id === this.state.activeCheckoutMethod ? 'selected' : ''}" onclick="app.selectCheckoutPaymentMethod('${m.id}')">
          <span class="payment-select-icon">${m.icon || '💳'}</span>
          <span class="payment-select-name">${m.name}</span>
        </div>
      `).join('');
    }

    // Refresh discount UI & totals
    this.setDiscount(this.state.cartDiscountType || "none");
    this.selectCheckoutPaymentMethod(this.state.activeCheckoutMethod);

    if (modal) modal.classList.add("active");
  }

  /**
   * Set discount type (None, PWD 20%, Senior 20%, Promo 10%, Custom %)
   */
  setDiscount(discountType) {
    this.state.cartDiscountType = discountType;

    // Update discount buttons styling
    document.querySelectorAll(".discount-chip-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    const btnIdMap = {
      none: "discBtnNone",
      pwd: "discBtnPwd",
      senior: "discBtnSenior",
      promo10: "discBtnPromo10",
      custom: "discBtnCustom"
    };

    const targetBtn = document.getElementById(btnIdMap[discountType]);
    if (targetBtn) targetBtn.classList.add("active");

    // Show/Hide PWD or Custom details sections
    const pwdSection = document.getElementById("pwdDetailsSection");
    const pwdIdLabel = document.getElementById("pwdIdLabel");
    const customSection = document.getElementById("customDiscountSection");
    const badgeEl = document.getElementById("appliedDiscountBadge");

    if (pwdSection) {
      if (discountType === "pwd" || discountType === "senior") {
        pwdSection.style.display = "block";
        if (pwdIdLabel) pwdIdLabel.textContent = discountType === "pwd" ? "PWD ID Number *" : "Senior Citizen ID Number *";
      } else {
        pwdSection.style.display = "none";
      }
    }

    if (customSection) {
      customSection.style.display = discountType === "custom" ? "block" : "none";
    }

    // Update Applied Badge
    if (badgeEl) {
      if (discountType === "pwd") {
        badgeEl.textContent = "♿ PWD (20% Off + VAT Exempt)";
        badgeEl.style.color = "var(--matcha-dark)";
        badgeEl.style.backgroundColor = "var(--matcha-foam)";
      } else if (discountType === "senior") {
        badgeEl.textContent = "🧓 Senior (20% Off + VAT Exempt)";
        badgeEl.style.color = "var(--matcha-dark)";
        badgeEl.style.backgroundColor = "var(--matcha-foam)";
      } else if (discountType === "promo10") {
        badgeEl.textContent = "🏷️ 10% Off";
        badgeEl.style.color = "var(--warning)";
        badgeEl.style.backgroundColor = "var(--warning-light)";
      } else if (discountType === "custom") {
        badgeEl.textContent = `✏️ ${this.state.cartDiscountValue || 0}% Off`;
        badgeEl.style.color = "var(--matcha-dark)";
        badgeEl.style.backgroundColor = "var(--matcha-foam)";
      } else {
        badgeEl.textContent = "None (0%)";
        badgeEl.style.color = "var(--text-muted)";
        badgeEl.style.backgroundColor = "var(--bg-card)";
      }
    }

    this.refreshCheckoutTotals();
    this.renderCart();
  }

  updateDiscountDetails() {
    const idInput = document.getElementById("discountIdNumberInput");
    const nameInput = document.getElementById("discountHolderNameInput");
    if (idInput) this.state.discountIdNumber = idInput.value.trim();
    if (nameInput) this.state.discountHolderName = nameInput.value.trim();
  }

  updateCustomDiscount(val) {
    this.state.cartDiscountValue = parseFloat(val) || 0;
    const badgeEl = document.getElementById("appliedDiscountBadge");
    if (badgeEl) badgeEl.textContent = `✏️ ${this.state.cartDiscountValue}% Off`;
    this.refreshCheckoutTotals();
    this.renderCart();
  }

  refreshCheckoutTotals() {
    const totals = this.calculateCartTotals();
    const currency = this.state.settings.currencySymbol || "₱";
    const totalDisplay = document.getElementById("modalCheckoutTotalDisplay");
    const tenderInput = document.getElementById("tenderAmountInput");

    if (totalDisplay) totalDisplay.textContent = `${currency}${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // Refresh Cash Presets
    const presetsContainer = document.getElementById("cashPresetsContainer");
    if (presetsContainer) {
      const t = totals.total;
      const presets = [
        { label: "Exact", val: t },
        { label: `${currency}${Math.ceil(t / 100) * 100}`, val: Math.ceil(t / 100) * 100 },
        { label: `${currency}500`, val: 500 },
        { label: `${currency}1,000`, val: 1000 },
        { label: `${currency}2,000`, val: 2000 }
      ].filter((p, i, arr) => p.val >= t && arr.findIndex(x => x.val === p.val) === i);

      presetsContainer.innerHTML = presets.map(p => `
        <button type="button" class="preset-chip-btn" onclick="app.setTenderAmount(${p.val})">${p.label}</button>
      `).join('');
    }

    this.state.tenderAmount = totals.total;
    if (tenderInput) tenderInput.value = totals.total;
    this.updateCheckoutChange();

    // Rebalance split payment allocation
    if (this.state.isSplitPaymentMode) {
      const half1 = Math.round(totals.total / 2);
      const half2 = totals.total - half1;
      this.state.splitPaymentList = [
        { methodId: "cash", amount: half1 },
        { methodId: "gcash", amount: half2 }
      ];
      this.renderSplitPayments();
    }
  }

  setPaymentMode(mode) {
    this.state.isSplitPaymentMode = mode === "split";

    const singleTab = document.getElementById("singlePaymentModeBtn");
    const splitTab = document.getElementById("splitPaymentModeBtn");
    const singleSection = document.getElementById("singlePaymentSection");
    const splitSection = document.getElementById("splitPaymentSection");

    if (singleTab) singleTab.classList.toggle("active", mode === "single");
    if (splitTab) splitTab.classList.toggle("active", mode === "split");

    if (singleSection) singleSection.style.display = mode === "single" ? "block" : "none";
    if (splitSection) splitSection.style.display = mode === "split" ? "flex" : "none";

    if (mode === "split") {
      this.renderSplitPayments();
    }
  }

  renderSplitPayments() {
    const container = document.getElementById("splitRowsContainer");
    const remainingEl = document.getElementById("splitRemainingAmountDisplay");
    const statusBadge = document.getElementById("splitStatusBadge");
    const banner = document.getElementById("splitRemainingBanner");
    const submitBtn = document.getElementById("completeSaleSubmitBtn");

    if (!container) return;

    const totals = this.calculateCartTotals();
    const currency = this.state.settings.currencySymbol || "₱";
    const activeMethods = this.state.paymentMethods.filter(m => m.active);

    const totalAllocated = this.state.splitPaymentList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const remaining = Math.max(0, parseFloat((totals.total - totalAllocated).toFixed(2)));

    if (remainingEl) remainingEl.textContent = `${currency}${remaining.toFixed(2)}`;

    const isBalanced = Math.abs(totals.total - totalAllocated) <= 0.005;
    const isOverpaid = totalAllocated > totals.total + 0.005;

    if (banner) {
      banner.classList.toggle("balanced", isBalanced);
    }

    if (statusBadge) {
      if (isBalanced) {
        statusBadge.textContent = "Balanced ✓";
        statusBadge.className = "split-status-badge status-completed";
      } else if (isOverpaid) {
        statusBadge.textContent = `Overpaid (+${currency}${(totalAllocated - totals.total).toFixed(2)})`;
        statusBadge.className = "split-status-badge status-warning";
      } else {
        statusBadge.textContent = `Need ${currency}${remaining.toFixed(2)}`;
        statusBadge.className = "split-status-badge status-voided";
      }
    }

    if (submitBtn) {
      submitBtn.disabled = !isBalanced && !isOverpaid;
    }

    container.innerHTML = this.state.splitPaymentList.map((split, idx) => `
      <div class="split-row-item">
        <select class="form-control" onchange="app.updateSplitMethod(${idx}, this.value)">
          ${activeMethods.map(m => `
            <option value="${m.id}" ${split.methodId === m.id ? 'selected' : ''}>${m.icon} ${m.name}</option>
          `).join('')}
        </select>
        
        <input 
          type="number" 
          step="1" 
          class="form-control" 
          value="${split.amount}" 
          placeholder="0" 
          style="font-family: var(--font-mono); font-weight: 700;"
          oninput="app.updateSplitAmount(${idx}, this.value)"
        >
        
        <button 
          type="button" 
          class="btn-quick-fill" 
          title="Fill remaining balance into this payment" 
          onclick="app.fillRemainingSplit(${idx})"
        >
          ⚡ Auto Fill
        </button>

        ${this.state.splitPaymentList.length > 1 ? `
          <button 
            type="button" 
            style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 1rem; padding: 0.2rem;" 
            onclick="app.removeSplitRow(${idx})"
            title="Remove method"
          >
            🗑️
          </button>
        ` : '<span></span>'}
      </div>
    `).join('');
  }

  addSplitRow() {
    const totals = this.calculateCartTotals();
    const activeMethods = this.state.paymentMethods.filter(m => m.active);
    const totalAllocated = this.state.splitPaymentList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const remaining = Math.max(0, parseFloat((totals.total - totalAllocated).toFixed(2)));

    const existingIds = this.state.splitPaymentList.map(s => s.methodId);
    const nextMethod = activeMethods.find(m => !existingIds.includes(m.id)) || activeMethods[0];

    this.state.splitPaymentList.push({
      methodId: nextMethod ? nextMethod.id : "cash",
      amount: remaining
    });

    this.renderSplitPayments();
  }

  updateSplitMethod(index, methodId) {
    if (this.state.splitPaymentList[index]) {
      this.state.splitPaymentList[index].methodId = methodId;
    }
  }

  updateSplitAmount(index, amountVal) {
    if (this.state.splitPaymentList[index]) {
      this.state.splitPaymentList[index].amount = parseFloat(amountVal) || 0;
      this.renderSplitPayments();
    }
  }

  removeSplitRow(index) {
    if (this.state.splitPaymentList.length > 1) {
      this.state.splitPaymentList.splice(index, 1);
      this.renderSplitPayments();
    }
  }

  fillRemainingSplit(index) {
    const totals = this.calculateCartTotals();
    const otherAllocated = this.state.splitPaymentList
      .filter((_, i) => i !== index)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const remainingForThis = Math.max(0, parseFloat((totals.total - otherAllocated).toFixed(2)));
    this.state.splitPaymentList[index].amount = remainingForThis;
    this.renderSplitPayments();
  }

  selectCheckoutPaymentMethod(methodId) {
    this.state.activeCheckoutMethod = methodId;
    document.querySelectorAll(".payment-select-card").forEach(el => {
      el.classList.toggle("selected", el.onclick.toString().includes(methodId));
    });

    const cashSection = document.getElementById("cashTenderSection");
    const qrContainer = document.getElementById("walletQrContainer");

    const selectedPm = this.state.paymentMethods.find(m => m.id === methodId);

    if (cashSection) {
      cashSection.style.display = methodId === "cash" ? "flex" : "none";
    }

    // Render Digital Wallet Scan-to-Pay QR Card
    if (qrContainer) {
      if (selectedPm && selectedPm.hasQr) {
        qrContainer.style.display = "block";
        qrContainer.innerHTML = `
          <div class="wallet-qr-display-box">
            <div class="wallet-qr-graphic">
              <span style="font-size: 2rem;">📲</span>
              <span style="font-size: 0.65rem; font-weight: 800; color: #333; margin-top: 2px;">SCAN TO PAY</span>
            </div>
            <div class="wallet-qr-info">
              <div class="wallet-qr-title">${selectedPm.name} Payment</div>
              <div class="wallet-qr-account">Account: <strong>${selectedPm.accountName || 'ALJUNE MASADO'}</strong></div>
              ${selectedPm.accountNumber ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${selectedPm.accountNumber}</div>` : ''}
              <span class="wallet-qr-instapay-badge">✓ QRPH / InstaPay Verified</span>
            </div>
          </div>
        `;
      } else {
        qrContainer.style.display = "none";
      }
    }

    this.updateCheckoutChange();
  }

  setTenderAmount(val) {
    this.state.tenderAmount = val;
    const tenderInput = document.getElementById("tenderAmountInput");
    if (tenderInput) tenderInput.value = val;
    this.updateCheckoutChange();
  }

  updateCheckoutChange() {
    const totals = this.calculateCartTotals();
    const currency = this.state.settings.currencySymbol || "₱";
    const changeDisplay = document.getElementById("modalChangeDueDisplay");

    if (this.state.activeCheckoutMethod !== "cash") {
      if (changeDisplay) changeDisplay.textContent = `${currency}0.00`;
      return;
    }

    const change = Math.max(0, this.state.tenderAmount - totals.total);
    if (changeDisplay) changeDisplay.textContent = `${currency}${change.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  completeCheckout() {
    if (this.state.currentCart.length === 0) return;

    const totals = this.calculateCartTotals();
    const customerInput = document.getElementById("checkoutCustomerName");
    const notesInput = document.getElementById("checkoutOrderNotes");
    const customer = customerInput ? customerInput.value.trim() || "Walk-in Guest" : "Walk-in Guest";
    const notes = notesInput ? notesInput.value.trim() : "";

    let payments = [];
    let amountTendered = totals.total;
    let changeDue = 0;

    if (this.state.isSplitPaymentMode) {
      const validSplits = this.state.splitPaymentList.filter(s => (Number(s.amount) || 0) > 0);
      const totalAllocated = validSplits.reduce((acc, s) => acc + Number(s.amount), 0);

      if (totalAllocated < totals.total - 0.01) {
        this.showToast("Split payment total is less than amount due!", "danger");
        return;
      }

      payments = validSplits.map(s => ({
        methodId: s.methodId,
        amount: parseFloat(Number(s.amount).toFixed(2)),
        reference: s.methodId !== "cash" ? `MMB-REF-${Math.floor(100000 + Math.random() * 900000)}` : ""
      }));

      amountTendered = totalAllocated;
      changeDue = Math.max(0, parseFloat((totalAllocated - totals.total).toFixed(2)));

    } else {
      if (this.state.activeCheckoutMethod === "cash" && this.state.tenderAmount < totals.total) {
        this.showToast("Tendered amount is less than total due!", "danger");
        return;
      }

      payments = [
        {
          methodId: this.state.activeCheckoutMethod,
          amount: totals.total,
          reference: this.state.activeCheckoutMethod !== "cash" ? `MMB-REF-${Math.floor(100000 + Math.random() * 900000)}` : ""
        }
      ];

      amountTendered = this.state.tenderAmount;
      changeDue = this.state.activeCheckoutMethod === "cash" 
        ? Math.max(0, this.state.tenderAmount - totals.total)
        : 0;
    }

    const orderId = `MMB-${2000 + this.state.sales.length + 1}`;
    const timestamp = new Date().toISOString();

    const newOrder = {
      id: orderId,
      timestamp,
      items: [...this.state.currentCart],
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountType: this.state.cartDiscountType,
      discountPercent: totals.discountPercent,
      discountIdNumber: this.state.discountIdNumber,
      discountHolderName: this.state.discountHolderName,
      isVatExempt: totals.isVatExempt,
      tax: totals.tax,
      total: totals.total,
      cost: totals.cost,
      profit: parseFloat((totals.total - totals.tax - totals.cost).toFixed(2)),
      payments,
      amountTendered: parseFloat(amountTendered.toFixed(2)),
      changeDue: parseFloat(changeDue.toFixed(2)),
      status: "completed",
      customer,
      notes
    };

    // Deduct stock from inventory
    this.state.currentCart.forEach(cartItem => {
      const prod = this.state.products.find(p => p.id === cartItem.productId);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - cartItem.quantity);
      }
    });

    // Add to sales record
    this.state.sales.unshift(newOrder);

    // Save & reset cart & discount state
    this.state.currentCart = [];
    this.state.cartDiscountType = "none";
    this.state.cartDiscountValue = 0;
    this.state.discountIdNumber = "";
    this.state.discountHolderName = "";

    this.saveStateToStorage();
    this.renderCart();
    this.renderProductsGrid();
    this.closeModal("checkoutModal");

    // Launch Receipt Modal
    this.showReceiptModal(newOrder);
    this.showToast(`Order ${orderId} completed! 🍵`, "success");
  }

  /* ==========================================================================
     RECEIPT GENERATION & PRINT ENGINE
     ========================================================================== */

  showReceiptModal(order) {
    this.state.currentReceiptOrder = order;
    const modal = document.getElementById("receiptModal");
    const container = document.getElementById("receiptPaperContainer");
    const s = this.state.settings;
    const currency = s.currencySymbol || "₱";

    if (!modal || !container) return;

    const orderDate = new Date(order.timestamp).toLocaleString();
    const pmList = (order.payments || []).map(p => {
      const pmObj = this.state.paymentMethods.find(m => m.id === p.methodId);
      return `${pmObj ? pmObj.name : p.methodId}: ${currency}${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }).join("<br>");

    let discountHtml = "";
    if (order.discount > 0) {
      let discountTitle = "Discount";
      if (order.discountType === "pwd") discountTitle = "PWD Discount (20%)";
      else if (order.discountType === "senior") discountTitle = "Senior Citizen (20%)";
      else if (order.discountType === "promo10") discountTitle = "Promo (10%)";
      else if (order.discountType === "custom") discountTitle = `Discount (${order.discountPercent}%)`;

      discountHtml = `
        <div class="receipt-total-row" style="color: #2C4A2E; font-weight: 700;">
          <span>${discountTitle}:</span>
          <span>-${currency}${Number(order.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    }

    let pwdDetailsHtml = "";
    if (order.discountIdNumber) {
      pwdDetailsHtml = `
        <div class="receipt-meta-row" style="font-weight: 700; color: #2C4A2E;">
          <span>ID #: ${order.discountIdNumber}</span>
          ${order.discountHolderName ? `<span>Holder: ${order.discountHolderName}</span>` : ''}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="receipt-paper">
        <div class="receipt-header-center">
          <div class="receipt-mascot-img">🐈‍⬛</div>
          <div class="receipt-store-title">${s.storeName || 'MANDATORY MATCHA BAR'}</div>
          <div class="receipt-store-sub">${s.storeAddress || ''}</div>
          <div class="receipt-store-sub">Tel: ${s.storePhone || ''}</div>
          ${s.taxId ? `<div class="receipt-store-sub">VAT ID: ${s.taxId}</div>` : ''}
        </div>

        <div class="receipt-divider-dash"></div>

        <div class="receipt-meta-row">
          <span>Order: <strong>${order.id}</strong></span>
          <span>${order.status.toUpperCase()}</span>
        </div>
        <div class="receipt-meta-row">
          <span>Date: ${orderDate}</span>
        </div>
        <div class="receipt-meta-row">
          <span>Guest: ${order.customer || 'Walk-in Guest'}</span>
        </div>
        ${pwdDetailsHtml}
        ${order.notes ? `
          <div class="receipt-meta-row" style="color: #666; font-style: italic;">
            <span>Notes: ${order.notes}</span>
          </div>
        ` : ''}

        <div class="receipt-divider-dash"></div>

        <table class="receipt-items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${currency}${item.price.toFixed(2)}</td>
                <td style="text-align: right;">${currency}${(item.subtotal || item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="receipt-divider-dash"></div>

        <div class="receipt-total-row">
          <span>Subtotal:</span>
          <span>${currency}${Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        ${discountHtml}
        <div class="receipt-total-row">
          <span>${order.isVatExempt ? 'VAT (Exempt - RA 10754/9994):' : `VAT (${s.taxRatePercent || 0}%):`}</span>
          <span>${currency}${Number(order.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="receipt-divider-double"></div>

        <div class="receipt-total-row receipt-grand-total">
          <span>TOTAL DUE:</span>
          <span>${currency}${Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="receipt-divider-dash"></div>

        <div class="receipt-total-row">
          <span>Payment Breakdown:</span>
        </div>
        <div style="font-size: 0.8rem; padding-left: 0.5rem; color: #222; margin-top: 0.2rem;">
          ${pmList}
        </div>

        ${order.amountTendered ? `
          <div class="receipt-total-row" style="margin-top: 0.3rem;">
            <span>Tendered:</span>
            <span>${currency}${Number(order.amountTendered).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="receipt-total-row">
            <span>Change:</span>
            <span>${currency}${Number(order.changeDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        ` : ''}

        <div class="receipt-footer-center">
          <p>${s.receiptHeaderMsg || 'Thank you for getting your matcha fix! 🍵'}</p>
          <div class="receipt-not-sure-script">Not sure? Feel free to ask!</div>
          <small style="color: #666; margin-top: 0.2rem; display: block;">${s.receiptFooterMsg || ''}</small>
          <div class="qr-code-placeholder">★ MANDATORY ★</div>
        </div>
      </div>
    `;

    modal.classList.add("active");
  }

  printReceipt() {
    window.print();
  }

  /* ==========================================================================
     SALES ANALYTICS & REPORTS VIEW
     ========================================================================== */

  setReportScope(scope) {
    this.state.reportScope = scope;
    document.querySelectorAll(".scope-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.scope === scope);
    });

    const dateFilterBox = document.getElementById("dailyDateFilterBox");
    const monthFilterBox = document.getElementById("monthlyDateFilterBox");

    if (dateFilterBox) dateFilterBox.style.display = scope === "daily" ? "flex" : "none";
    if (monthFilterBox) monthFilterBox.style.display = scope === "monthly" ? "flex" : "none";

    this.renderAnalyticsView();
  }

  renderAnalyticsView() {
    const currency = this.state.settings.currencySymbol || "₱";
    let targetSales = [];

    if (this.state.reportScope === "daily") {
      targetSales = POSAnalytics.getDailySales(this.state.sales, this.state.selectedDate);
    } else {
      const [yearStr, monthStr] = this.state.selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      targetSales = POSAnalytics.getMonthlySales(this.state.sales, year, month);
    }

    const metrics = POSAnalytics.calculateMetrics(targetSales, this.state.paymentMethods);

    // Update KPI Card Numbers
    const grossEl = document.getElementById("kpiGrossSales");
    const netEl = document.getElementById("kpiNetSales");
    const txEl = document.getElementById("kpiTxCount");
    const aovEl = document.getElementById("kpiAvgOrderValue");
    const profitEl = document.getElementById("kpiGrossProfit");
    const marginEl = document.getElementById("kpiProfitMargin");

    if (grossEl) grossEl.textContent = `${currency}${metrics.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (netEl) netEl.textContent = `${currency}${metrics.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (txEl) txEl.textContent = metrics.transactionCount.toLocaleString();
    if (aovEl) aovEl.textContent = `${currency}${metrics.averageOrderValue.toFixed(2)}`;
    if (profitEl) profitEl.textContent = `${currency}${metrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (marginEl) marginEl.textContent = `${metrics.profitMargin}% Margin`;

    // Render Primary Flow Chart
    const flowChartContainer = document.getElementById("primaryFlowChartContainer");
    const flowChartTitle = document.getElementById("flowChartTitleText");
    const flowChartSub = document.getElementById("flowChartSubtitleText");

    if (this.state.reportScope === "daily") {
      if (flowChartTitle) flowChartTitle.textContent = "Hourly Matcha Rush (Rush Hours)";
      const hourlyData = POSAnalytics.getHourlyDistribution(targetSales);
      if (flowChartSub) flowChartSub.textContent = `Peak Rush: ${hourlyData.peakHour.label} (${currency}${hourlyData.peakHour.revenue.toLocaleString()})`;
      POSCharts.renderHourlyChart(flowChartContainer, hourlyData, currency);
    } else {
      const [yearStr, monthStr] = this.state.selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const monthlyData = POSAnalytics.getMonthlyDailyDistribution(targetSales, year, month);

      if (flowChartTitle) flowChartTitle.textContent = "Day-by-Day Matcha Sales Trend";
      if (flowChartSub) flowChartSub.textContent = `Peak Day: ${monthlyData.peakDay.label} (${currency}${monthlyData.peakDay.revenue.toLocaleString()})`;
      POSCharts.renderMonthlyFlowChart(flowChartContainer, monthlyData, currency);
    }

    // Render Payment Methods Donut & Breakdown
    const donutContainer = document.getElementById("paymentDonutChartContainer");
    POSCharts.renderPaymentDonut(donutContainer, metrics.paymentBreakdown, currency, metrics.netSales);

    // Render Top Selling Items Table
    const topItemsContainer = document.getElementById("topItemsTableBody");
    if (topItemsContainer) {
      const maxProductRev = metrics.topProducts[0] ? metrics.topProducts[0].revenue : 1;

      if (metrics.topProducts.length === 0) {
        topItemsContainer.innerHTML = `
          <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No matcha items sold in this period.</td></tr>
        `;
      } else {
        topItemsContainer.innerHTML = metrics.topProducts.slice(0, 7).map((p, idx) => {
          const pct = Math.min(100, Math.max(5, (p.revenue / maxProductRev) * 100));
          return `
            <tr>
              <td>
                <div class="top-item-name-cell">
                  <span class="rank-badge top-${idx + 1}">${idx + 1}</span>
                  <div>
                    <div>${p.name}</div>
                    <div class="revenue-bar-bg">
                      <div class="revenue-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                </div>
              </td>
              <td style="font-family: var(--font-mono);">${p.sku || '—'}</td>
              <td><strong>${p.quantity}</strong> cups/pcs</td>
              <td style="font-family: var(--font-mono); font-weight: 800; color: var(--matcha-dark);">${currency}${p.revenue.toLocaleString()}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  exportSalesCSV() {
    let targetSales = [];
    let filename = `matcha-sales-${this.state.selectedDate}.csv`;

    if (this.state.reportScope === "daily") {
      targetSales = POSAnalytics.getDailySales(this.state.sales, this.state.selectedDate);
    } else {
      const [yearStr, monthStr] = this.state.selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      targetSales = POSAnalytics.getMonthlySales(this.state.sales, year, month);
      filename = `matcha-sales-${this.state.selectedMonth}.csv`;
    }

    const csvContent = POSAnalytics.generateSalesCSV(targetSales, this.state.settings);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${targetSales.length} records to ${filename}`, "success");
  }

  printCurrentReport() {
    window.print();
  }

  /* ==========================================================================
     ORDERS & HISTORY MANAGEMENT (EDITABLE)
     ========================================================================== */

  renderOrdersView() {
    const tableBody = document.getElementById("ordersTableBody");
    if (!tableBody) return;

    const currency = this.state.settings.currencySymbol || "₱";
    const keyword = this.state.orderFilterKeyword;
    const status = this.state.orderFilterStatus;
    const payment = this.state.orderFilterPayment;

    const filtered = this.state.sales.filter(s => {
      const matchKeyword = !keyword ||
        s.id.toLowerCase().includes(keyword) ||
        (s.customer && s.customer.toLowerCase().includes(keyword)) ||
        (s.discountIdNumber && s.discountIdNumber.toLowerCase().includes(keyword)) ||
        (s.notes && s.notes.toLowerCase().includes(keyword));

      const matchStatus = status === "all" || s.status === status;
      const matchPayment = payment === "all" || (s.payments || []).some(p => p.methodId === payment);

      return matchKeyword && matchStatus && matchPayment;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No orders match your filter criteria.</td></tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.slice(0, 100).map(s => {
      const itemsSummary = (s.items || []).map(i => `${i.quantity}x ${i.name}`).join(", ");
      const paymentChips = (s.payments || []).map(p => {
        const pm = this.state.paymentMethods.find(m => m.id === p.methodId);
        return `<span class="payment-chip">${pm ? pm.icon : '💳'} ${pm ? pm.name : p.methodId}</span>`;
      }).join('');

      let discountTag = "";
      if (s.discount > 0) {
        discountTag = `<span class="product-badge-new" style="font-size: 0.68rem; margin-left: 4px;">-${s.discountPercent || 20}%</span>`;
      }

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;"><strong>${s.id}</strong></td>
          <td>${new Date(s.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          <td style="font-weight: 600;">
            ${s.customer || 'Walk-in Guest'}
            ${s.discountIdNumber ? `<br><small style="color: var(--matcha-dark); font-size: 0.72rem;">ID: ${s.discountIdNumber}</small>` : ''}
          </td>
          <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</td>
          <td>${paymentChips}</td>
          <td style="font-family: var(--font-mono); font-weight: 800; color: var(--matcha-dark);">${currency}${Number(s.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}${discountTag}</td>
          <td><span class="status-badge status-${s.status}">${s.status}</span></td>
          <td style="text-align: right;">
            <button class="cart-icon-btn" title="View Receipt" onclick="app.viewReceiptById('${s.id}')">🧾</button>
            <button class="cart-icon-btn" title="Edit Order" onclick="app.openEditOrderModal('${s.id}')">✏️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  viewReceiptById(orderId) {
    const order = this.state.sales.find(s => s.id === orderId);
    if (order) this.showReceiptModal(order);
  }

  openEditOrderModal(orderId) {
    const order = this.state.sales.find(s => s.id === orderId);
    if (!order) return;

    this.state.editingOrderId = orderId;
    const modal = document.getElementById("editOrderModal");
    const idEl = document.getElementById("editOrderIdDisplay");
    const statusSelect = document.getElementById("editOrderStatusSelect");
    const paymentSelect = document.getElementById("editOrderPaymentSelect");
    const customerInput = document.getElementById("editOrderCustomerInput");
    const notesInput = document.getElementById("editOrderNotesInput");

    if (idEl) idEl.textContent = order.id;
    if (statusSelect) statusSelect.value = order.status;
    if (customerInput) customerInput.value = order.customer || "";
    if (notesInput) notesInput.value = order.notes || "";

    if (paymentSelect) {
      paymentSelect.innerHTML = this.state.paymentMethods.map(m => `
        <option value="${m.id}" ${order.payments && order.payments[0] && order.payments[0].methodId === m.id ? 'selected' : ''}>${m.icon} ${m.name}</option>
      `).join('');
    }

    if (modal) modal.classList.add("active");
  }

  saveOrderEdits() {
    const order = this.state.sales.find(s => s.id === this.state.editingOrderId);
    if (!order) return;

    const statusSelect = document.getElementById("editOrderStatusSelect");
    const paymentSelect = document.getElementById("editOrderPaymentSelect");
    const customerInput = document.getElementById("editOrderCustomerInput");
    const notesInput = document.getElementById("editOrderNotesInput");

    const oldStatus = order.status;
    const newStatus = statusSelect.value;

    order.status = newStatus;
    order.customer = customerInput.value.trim();
    order.notes = notesInput.value.trim();

    if (paymentSelect) {
      order.payments = [
        {
          methodId: paymentSelect.value,
          amount: order.total,
          reference: order.payments && order.payments[0] ? order.payments[0].reference : ""
        }
      ];
    }

    if (oldStatus === "completed" && (newStatus === "refunded" || newStatus === "voided")) {
      order.items.forEach(cartItem => {
        const prod = this.state.products.find(p => p.id === cartItem.productId);
        if (prod) prod.stock = (prod.stock || 0) + cartItem.quantity;
      });
      this.showToast(`Order ${order.id} marked as ${newStatus}. Inventory replenished!`, "warning");
    }

    this.saveStateToStorage();
    this.renderOrdersView();
    this.renderAnalyticsView();
    this.renderProductsGrid();
    this.closeModal("editOrderModal");
    this.showToast(`Order ${order.id} updated successfully.`, "success");
  }

  /* ==========================================================================
     PRODUCT & CATEGORY MANAGEMENT (EDITABLE)
     ========================================================================== */

  renderProductsMgmtView() {
    const tableBody = document.getElementById("productsMgmtTableBody");
    if (!tableBody) return;

    const currency = this.state.settings.currencySymbol || "₱";

    tableBody.innerHTML = this.state.products.map(p => {
      const cat = this.state.categories.find(c => c.id === p.categoryId);
      const isLow = (p.stock || 0) <= (p.lowStockThreshold || 15);

      return `
        <tr>
          <td>
            <div style="font-family: var(--font-serif); font-weight: 800; font-size: 0.95rem;">${p.name}</div>
            ${p.notes ? `<small style="color: var(--text-muted);">${p.notes}</small>` : ''}
          </td>
          <td style="font-family: var(--font-mono);">${p.sku || '—'}</td>
          <td>${cat ? `${cat.icon} ${cat.name}` : 'Uncategorized'}</td>
          <td style="font-family: var(--font-mono); font-weight: 800; color: var(--matcha-dark);">${currency}${p.price.toFixed(2)}</td>
          <td style="font-family: var(--font-mono);">${currency}${(p.cost || 0).toFixed(2)}</td>
          <td>
            <span class="stock-badge ${isLow ? 'low-stock' : ''}">${p.stock || 0} units</span>
          </td>
          <td style="text-align: right;">
            <button class="cart-icon-btn" title="Edit Item" onclick="app.openProductModal('${p.id}')">✏️</button>
            <button class="cart-icon-btn" title="Delete Item" onclick="app.deleteProduct('${p.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openProductModal(productId = null) {
    this.state.editingProductId = productId;
    const modal = document.getElementById("productModal");
    const modalTitle = document.getElementById("productModalTitle");
    const nameInput = document.getElementById("prodFormName");
    const skuInput = document.getElementById("prodFormSku");
    const catSelect = document.getElementById("prodFormCategory");
    const priceInput = document.getElementById("prodFormPrice");
    const costInput = document.getElementById("prodFormCost");
    const stockInput = document.getElementById("prodFormStock");
    const alertInput = document.getElementById("prodFormLowAlert");
    const notesInput = document.getElementById("prodFormNotes");
    const colorInput = document.getElementById("prodFormColor");

    if (catSelect) {
      catSelect.innerHTML = this.state.categories.map(c => `
        <option value="${c.id}">${c.icon} ${c.name}</option>
      `).join('');
    }

    if (productId) {
      const p = this.state.products.find(x => x.id === productId);
      if (!p) return;
      if (modalTitle) modalTitle.textContent = "Edit Menu Item";
      if (nameInput) nameInput.value = p.name;
      if (skuInput) skuInput.value = p.sku || "";
      if (catSelect) catSelect.value = p.categoryId;
      if (priceInput) priceInput.value = p.price;
      if (costInput) costInput.value = p.cost || 0;
      if (stockInput) stockInput.value = p.stock || 0;
      if (alertInput) alertInput.value = p.lowStockThreshold || 15;
      if (notesInput) notesInput.value = p.notes || "";
      if (colorInput) colorInput.value = p.color || "#3A5A40";
    } else {
      if (modalTitle) modalTitle.textContent = "Add Menu Item";
      if (nameInput) nameInput.value = "";
      if (skuInput) skuInput.value = `FLV-${Math.floor(10 + Math.random() * 90)}`;
      if (priceInput) priceInput.value = "";
      if (costInput) costInput.value = "";
      if (stockInput) stockInput.value = 80;
      if (alertInput) alertInput.value = 15;
      if (notesInput) notesInput.value = "";
      if (colorInput) colorInput.value = "#3A5A40";
    }

    if (modal) modal.classList.add("active");
  }

  saveProductForm(e) {
    if (e) e.preventDefault();

    const name = document.getElementById("prodFormName").value.trim();
    const sku = document.getElementById("prodFormSku").value.trim();
    const categoryId = document.getElementById("prodFormCategory").value;
    const price = parseFloat(document.getElementById("prodFormPrice").value) || 0;
    const cost = parseFloat(document.getElementById("prodFormCost").value) || 0;
    const stock = parseInt(document.getElementById("prodFormStock").value, 10) || 0;
    const lowStockThreshold = parseInt(document.getElementById("prodFormLowAlert").value, 10) || 15;
    const notes = document.getElementById("prodFormNotes") ? document.getElementById("prodFormNotes").value.trim() : "";
    const color = document.getElementById("prodFormColor").value;

    if (!name) {
      this.showToast("Item name is required!", "danger");
      return;
    }

    if (this.state.editingProductId) {
      const prod = this.state.products.find(p => p.id === this.state.editingProductId);
      if (prod) {
        prod.name = name;
        prod.sku = sku;
        prod.categoryId = categoryId;
        prod.price = price;
        prod.cost = cost;
        prod.stock = stock;
        prod.lowStockThreshold = lowStockThreshold;
        prod.notes = notes;
        prod.color = color;
        this.showToast(`Menu item "${name}" updated.`, "success");
      }
    } else {
      const newProduct = {
        id: `prod_mmb_${Date.now()}`,
        name,
        sku,
        categoryId,
        price,
        cost,
        stock,
        lowStockThreshold,
        notes,
        barcode: `480${Math.floor(100000000 + Math.random() * 900000000)}`,
        taxable: true,
        color,
        image: ""
      };
      this.state.products.push(newProduct);
      this.showToast(`Item "${name}" added to menu!`, "success");
    }

    this.saveStateToStorage();
    this.renderCategoryPills();
    this.renderProductsGrid();
    this.renderProductsMgmtView();
    this.closeModal("productModal");
  }

  deleteProduct(productId) {
    const prod = this.state.products.find(p => p.id === productId);
    if (!prod) return;

    if (confirm(`Are you sure you want to delete "${prod.name}" from the menu?`)) {
      this.state.products = this.state.products.filter(p => p.id !== productId);
      this.saveStateToStorage();
      this.renderCategoryPills();
      this.renderProductsGrid();
      this.renderProductsMgmtView();
      this.showToast(`"${prod.name}" removed from menu.`, "success");
    }
  }

  /* ==========================================================================
     CATEGORY MANAGEMENT MODAL
     ========================================================================== */

  openCategoriesModal() {
    const modal = document.getElementById("categoriesModal");
    const container = document.getElementById("categoriesListContainer");

    if (!modal || !container) return;

    container.innerHTML = this.state.categories.map(cat => {
      const count = this.state.products.filter(p => p.categoryId === cat.id).length;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-subtle); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">${cat.icon || '🏷️'}</span>
            <strong>${cat.name}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">(${count} items)</span>
          </div>
          <button style="background: transparent; border: none; color: var(--danger); cursor: pointer;" onclick="app.deleteCategory('${cat.id}')">🗑️</button>
        </div>
      `;
    }).join('');

    modal.classList.add("active");
  }

  addCategory() {
    const nameInput = document.getElementById("newCategoryNameInput");
    const iconInput = document.getElementById("newCategoryIconInput");
    const name = nameInput ? nameInput.value.trim() : "";
    const icon = iconInput ? iconInput.value.trim() || "🍵" : "🍵";

    if (!name) {
      this.showToast("Category name is required!", "warning");
      return;
    }

    const newCat = {
      id: `cat_${Date.now()}`,
      name,
      icon,
      color: "#3A5A40"
    };

    this.state.categories.push(newCat);
    this.saveStateToStorage();
    if (nameInput) nameInput.value = "";
    this.renderCategoryPills();
    this.openCategoriesModal();
    this.showToast(`Category "${name}" created!`, "success");
  }

  deleteCategory(catId) {
    const cat = this.state.categories.find(c => c.id === catId);
    if (!cat) return;

    if (confirm(`Delete category "${cat.name}"? Items will become uncategorized.`)) {
      this.state.categories = this.state.categories.filter(c => c.id !== catId);
      this.saveStateToStorage();
      this.renderCategoryPills();
      this.openCategoriesModal();
      this.renderProductsMgmtView();
      this.showToast(`Category "${cat.name}" removed.`, "success");
    }
  }

  /* ==========================================================================
     PAYMENT METHODS & SETTINGS VIEW (EDITABLE)
     ========================================================================== */

  renderSettingsView() {
    const s = this.state.settings;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : "";
    };

    setVal("settingStoreName", s.storeName);
    setVal("settingStoreAddress", s.storeAddress);
    setVal("settingStorePhone", s.storePhone);
    setVal("settingTaxId", s.taxId);
    setVal("settingCurrencySymbol", s.currencySymbol);
    setVal("settingTaxRate", s.taxRatePercent);
    setVal("settingReceiptHeader", s.receiptHeaderMsg);
    setVal("settingReceiptFooter", s.receiptFooterMsg);

    // Populate Payment Methods Manager
    const pmContainer = document.getElementById("settingsPaymentMethodsList");
    if (pmContainer) {
      pmContainer.innerHTML = this.state.paymentMethods.map(pm => `
        <div class="pm-item-row">
          <div class="pm-item-left">
            <span class="pm-icon-tag">${pm.icon}</span>
            <div>
              <div class="pm-item-name">${pm.name}</div>
              ${pm.accountName ? `<small style="color: var(--text-muted); font-size: 0.72rem;">Account: ${pm.accountName}</small>` : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <label class="switch-label">
              <input type="checkbox" ${pm.active ? 'checked' : ''} onchange="app.togglePaymentMethod('${pm.id}', this.checked)">
              <span class="slider"></span>
            </label>
            ${!pm.isSystem ? `
              <button style="background: transparent; border: none; color: var(--danger); cursor: pointer;" onclick="app.deletePaymentMethod('${pm.id}')">🗑️</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  saveStoreSettings() {
    this.state.settings.storeName = document.getElementById("settingStoreName").value.trim();
    this.state.settings.storeAddress = document.getElementById("settingStoreAddress").value.trim();
    this.state.settings.storePhone = document.getElementById("settingStorePhone").value.trim();
    this.state.settings.taxId = document.getElementById("settingTaxId").value.trim();
    this.state.settings.currencySymbol = document.getElementById("settingCurrencySymbol").value.trim() || "₱";
    this.state.settings.taxRatePercent = parseFloat(document.getElementById("settingTaxRate").value) || 0;
    this.state.settings.receiptHeaderMsg = document.getElementById("settingReceiptHeader").value.trim();
    this.state.settings.receiptFooterMsg = document.getElementById("settingReceiptFooter").value.trim();

    this.saveStateToStorage();
    this.renderStoreBranding();
    this.renderProductsGrid();
    this.renderCart();
    this.renderAnalyticsView();
    this.showToast("Store settings saved successfully!", "success");
  }

  togglePaymentMethod(methodId, active) {
    const pm = this.state.paymentMethods.find(m => m.id === methodId);
    if (pm) {
      pm.active = active;
      this.saveStateToStorage();
      this.showToast(`Payment method "${pm.name}" ${active ? 'enabled' : 'disabled'}.`, "success");
    }
  }

  openPaymentMethodModal() {
    const modal = document.getElementById("paymentMethodModal");
    const nameInput = document.getElementById("newPmNameInput");
    const iconInput = document.getElementById("newPmIconInput");
    const colorInput = document.getElementById("newPmColorInput");

    if (nameInput) nameInput.value = "";
    if (iconInput) iconInput.value = "📱";
    if (colorInput) colorInput.value = "#3A5A40";

    this.selectPresetIcon("📱");
    this.updatePmPreview();

    if (modal) modal.classList.add("active");
  }

  selectPresetIcon(emoji) {
    const iconInput = document.getElementById("newPmIconInput");
    if (iconInput) iconInput.value = emoji;

    document.querySelectorAll(".icon-chip").forEach(chip => {
      chip.classList.toggle("selected", chip.textContent.trim() === emoji);
    });

    this.updatePmPreview();
  }

  updatePmPreview() {
    const nameInput = document.getElementById("newPmNameInput");
    const iconInput = document.getElementById("newPmIconInput");
    const colorInput = document.getElementById("newPmColorInput");

    const previewIcon = document.getElementById("pmPreviewIcon");
    const previewName = document.getElementById("pmPreviewName");
    const previewDot = document.getElementById("pmPreviewDot");

    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Custom Method";
    const icon = iconInput && iconInput.value.trim() ? iconInput.value.trim() : "🍵";
    const color = colorInput ? colorInput.value : "#3A5A40";

    if (previewIcon) previewIcon.textContent = icon;
    if (previewName) previewName.textContent = name;
    if (previewDot) previewDot.style.backgroundColor = color;
  }

  saveNewPaymentMethod() {
    const nameInput = document.getElementById("newPmNameInput");
    const iconInput = document.getElementById("newPmIconInput");
    const colorInput = document.getElementById("newPmColorInput");

    const name = nameInput ? nameInput.value.trim() : "";
    const icon = iconInput ? iconInput.value.trim() || "🍵" : "🍵";
    const color = colorInput ? colorInput.value : "#3A5A40";

    if (!name) {
      this.showToast("Payment method name is required!", "warning");
      return;
    }

    const newPm = {
      id: `custom_pm_${Date.now()}`,
      name,
      icon,
      color,
      active: true,
      isSystem: false,
      accountName: "ALJUNE MASADO",
      hasQr: true
    };

    this.state.paymentMethods.push(newPm);
    this.saveStateToStorage();
    this.renderSettingsView();
    this.closeModal("paymentMethodModal");
    if (nameInput) nameInput.value = "";
    this.showToast(`Payment method "${name}" created!`, "success");
  }

  deletePaymentMethod(methodId) {
    const pm = this.state.paymentMethods.find(m => m.id === methodId);
    if (!pm || pm.isSystem) return;

    if (confirm(`Remove custom payment method "${pm.name}"?`)) {
      this.state.paymentMethods = this.state.paymentMethods.filter(m => m.id !== methodId);
      this.saveStateToStorage();
      this.renderSettingsView();
      this.showToast(`Payment method "${pm.name}" removed.`, "success");
    }
  }

  /* ==========================================================================
     BACKUP, RESTORE & DEMO SEEDING
     ========================================================================== */

  exportJSONBackup() {
    const payload = {
      brand: "Mandatory MATCHA BAR",
      version: "2.0",
      exportDate: new Date().toISOString(),
      settings: this.state.settings,
      categories: this.state.categories,
      products: this.state.products,
      paymentMethods: this.state.paymentMethods,
      sales: this.state.sales
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mandatory-matcha-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Database backup downloaded successfully.", "success");
  }

  importJSONBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.products && data.sales) {
          this.state.settings = data.settings || this.state.settings;
          this.state.categories = data.categories || this.state.categories;
          this.state.products = data.products;
          this.state.paymentMethods = data.paymentMethods || this.state.paymentMethods;
          this.state.sales = data.sales;

          this.saveStateToStorage();
          this.renderAll();
          this.showToast("Backup restored successfully!", "success");
        } else {
          this.showToast("Invalid backup JSON file structure.", "danger");
        }
      } catch (err) {
        this.showToast("Error parsing backup JSON file.", "danger");
      }
    };
    reader.readAsText(file);
  }

  resetDemoData() {
    if (confirm("Reset POS data to Mandatory Matcha Bar menu with 35-day sales history? Current customizations will be overwritten.")) {
      localStorage.removeItem(STORAGE_KEY);
      this.loadStateFromStorage();
      this.renderAll();
      this.showToast("Mandatory Matcha Bar dataset loaded!", "success");
    }
  }

  /* ==========================================================================
     UI HELPERS & MODAL UTILITIES
     ========================================================================== */

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let icon = "✓";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "✕";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Instantiate globally on DOM ready
let app;
window.addEventListener("DOMContentLoaded", () => {
  app = new POSApp();
  window.app = app;
});
