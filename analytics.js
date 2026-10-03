/**
 * Mandatory MATCHA BAR - Sales Analytics & Charting Engine
 * Modern ES6+ data aggregation, matcha green SVG visual charts, and CSV exporting.
 */

const POSAnalytics = {
  /**
   * Filter sales by date range
   */
  filterSales(sales, startDate, endDate, statusFilter = "completed") {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const inRange = saleDate >= start && saleDate <= end;
      if (!inRange) return false;
      if (statusFilter === "all") return true;
      return sale.status === statusFilter;
    });
  },

  /**
   * Filter sales for a specific calendar day
   */
  getDailySales(sales, dateStr) {
    const target = new Date(dateStr);
    return this.filterSales(sales, target, target, "completed");
  },

  /**
   * Filter sales for a specific calendar month (year, month: 0-11)
   */
  getMonthlySales(sales, year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return this.filterSales(sales, startDate, endDate, "completed");
  },

  /**
   * Calculate comprehensive metrics for any sales subset
   */
  calculateMetrics(salesList, allPaymentMethods = []) {
    let grossTotal = 0;
    let netTotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCost = 0;
    let totalItemsCount = 0;

    const productSalesMap = {};
    const paymentMap = {};

    // Initialize all active payment methods
    allPaymentMethods.forEach(pm => {
      paymentMap[pm.id] = {
        id: pm.id,
        name: pm.name,
        icon: pm.icon || "💳",
        color: pm.color || "#2C4A2E",
        total: 0,
        count: 0
      };
    });

    salesList.forEach(sale => {
      const total = Number(sale.total) || 0;
      const subtotal = Number(sale.subtotal) || 0;
      const discount = Number(sale.discount) || 0;
      const tax = Number(sale.tax) || 0;
      const cost = Number(sale.cost) || 0;

      grossTotal += subtotal;
      netTotal += total;
      totalDiscount += discount;
      totalTax += tax;
      totalCost += cost;

      (sale.items || []).forEach(item => {
        const qty = Number(item.quantity) || 1;
        const itemSubtotal = Number(item.subtotal) || (Number(item.price) * qty);
        totalItemsCount += qty;

        const pId = item.productId || item.name;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: item.name,
            sku: item.sku || "",
            quantity: 0,
            revenue: 0
          };
        }
        productSalesMap[pId].quantity += qty;
        productSalesMap[pId].revenue += itemSubtotal;
      });

      if (Array.isArray(sale.payments) && sale.payments.length > 0) {
        sale.payments.forEach(p => {
          const mId = p.methodId;
          const pAmount = Number(p.amount) || 0;
          if (!paymentMap[mId]) {
            paymentMap[mId] = {
              id: mId,
              name: mId,
              icon: "💰",
              color: "#6b7280",
              total: 0,
              count: 0
            };
          }
          paymentMap[mId].total += pAmount;
          paymentMap[mId].count += 1;
        });
      }
    });

    const txCount = salesList.length;
    const avgOrderValue = txCount > 0 ? netTotal / txCount : 0;
    const grossProfit = netTotal - totalTax - totalCost;
    const profitMargin = netTotal > 0 ? (grossProfit / netTotal) * 100 : 0;

    const paymentBreakdown = Object.values(paymentMap)
      .filter(p => p.total > 0 || allPaymentMethods.some(m => m.id === p.id && m.active))
      .map(p => ({
        ...p,
        total: parseFloat(p.total.toFixed(2)),
        percentage: netTotal > 0 ? parseFloat(((p.total / netTotal) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.total - a.total);

    const topProducts = Object.values(productSalesMap)
      .map(p => ({
        ...p,
        revenue: parseFloat(p.revenue.toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      transactionCount: txCount,
      grossSales: parseFloat(grossTotal.toFixed(2)),
      netSales: parseFloat(netTotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(1)),
      itemsSold: totalItemsCount,
      averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      paymentBreakdown,
      topProducts
    };
  },

  /**
   * Hourly breakdown for a single day (00:00 to 23:00)
   */
  getHourlyDistribution(dailySales) {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
      shortLabel: i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`,
      revenue: 0,
      count: 0
    }));

    dailySales.forEach(sale => {
      const h = new Date(sale.timestamp).getHours();
      if (hours[h]) {
        hours[h].revenue += Number(sale.total) || 0;
        hours[h].count += 1;
      }
    });

    hours.forEach(h => {
      h.revenue = parseFloat(h.revenue.toFixed(2));
    });

    let peakHour = hours[0];
    hours.forEach(h => {
      if (h.revenue > peakHour.revenue) peakHour = h;
    });

    return { hours, peakHour };
  },

  /**
   * Daily breakdown for an entire month
   */
  getMonthlyDailyDistribution(monthlySales, year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(year, month, dayNum);
      const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      return {
        day: dayNum,
        date: dateObj.toISOString().split("T")[0],
        label: `${dayOfWeek} ${dayNum}`,
        dayOfWeek,
        isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
        revenue: 0,
        count: 0
      };
    });

    monthlySales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      const d = saleDate.getDate() - 1;
      if (days[d]) {
        days[d].revenue += Number(sale.total) || 0;
        days[d].count += 1;
      }
    });

    days.forEach(d => {
      d.revenue = parseFloat(d.revenue.toFixed(2));
    });

    let peakDay = days[0];
    days.forEach(d => {
      if (d.revenue > peakDay.revenue) peakDay = d;
    });

    return { days, peakDay, daysInMonth };
  }
};

/**
 * Matcha Bar SVG Chart Rendering Components
 */
const POSCharts = {
  /**
   * Renders an interactive SVG Bar & Flow Line Chart for Hourly Sales
   */
  renderHourlyChart(containerEl, hourlyData, currency = "₱") {
    if (!containerEl) return;
    const { hours, peakHour } = hourlyData;
    const activeHours = hours.filter(h => h.hour >= 8 && h.hour <= 21); // 8 AM to 9 PM
    const maxRev = Math.max(...activeHours.map(h => h.revenue), 500);

    const svgWidth = 700;
    const svgHeight = 240;
    const padLeft = 65;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 40;
    const chartW = svgWidth - padLeft - padRight;
    const chartH = svgHeight - padTop - padBottom;

    const barW = Math.max(12, (chartW / activeHours.length) * 0.58);
    const step = chartW / activeHours.length;

    // Gridlines
    const gridCount = 4;
    let gridSvg = "";
    for (let i = 0; i <= gridCount; i++) {
      const yVal = padTop + (chartH / gridCount) * i;
      const amountVal = Math.round(maxRev * (1 - i / gridCount));
      gridSvg += `
        <line x1="${padLeft}" y1="${yVal}" x2="${svgWidth - padRight}" y2="${yVal}" stroke="var(--border-color, #E2D7C3)" stroke-dasharray="3 3" />
        <text x="${padLeft - 8}" y="${yVal + 4}" font-size="11" font-family="var(--font-mono)" fill="var(--text-muted, #8C7A6B)" text-anchor="end">${currency}${amountVal.toLocaleString()}</text>
      `;
    }

    let barsSvg = "";
    const points = [];

    activeHours.forEach((h, idx) => {
      const xCenter = padLeft + idx * step + step / 2;
      const barH = (h.revenue / maxRev) * chartH;
      const barY = padTop + chartH - barH;
      const isPeak = h.hour === peakHour.hour && peakHour.revenue > 0;

      points.push({ x: xCenter, y: barY, data: h });

      const barColor = isPeak
        ? "url(#matchaPeakGrad)"
        : h.revenue > 0
        ? "url(#matchaBarGrad)"
        : "var(--bg-subtle, #EDE4D0)";

      barsSvg += `
        <g class="chart-col" tabindex="0" data-hour="${h.label}" data-rev="${h.revenue}" data-count="${h.count}">
          <rect x="${xCenter - barW / 2}" y="${barY}" width="${barW}" height="${Math.max(barH, 3)}" rx="3" fill="${barColor}">
            <title>${h.label}: ${currency}${h.revenue.toLocaleString()} (${h.count} orders)</title>
          </rect>
          <text x="${xCenter}" y="${svgHeight - 12}" font-size="11" fill="var(--text-muted, #8C7A6B)" text-anchor="middle" font-weight="${idx % 2 === 0 ? '700' : '500'}">${h.shortLabel}</text>
        </g>
      `;
    });

    let pathD = "";
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const mx = (curr.x + next.x) / 2;
        pathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
      }
    }

    containerEl.innerHTML = `
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="pos-svg-chart" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="matchaBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#476930" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#2C4A2E" stop-opacity="0.6" />
            </linearGradient>
            <linearGradient id="matchaPeakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#D4A373" stop-opacity="1" />
              <stop offset="100%" stop-color="#C58F49" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="matchaLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#749C5B" />
              <stop offset="100%" stop-color="#8DB580" />
            </linearGradient>
          </defs>
          ${gridSvg}
          ${barsSvg}
          <path d="${pathD}" fill="none" stroke="url(#matchaLineGrad)" stroke-width="2.5" opacity="0.9" stroke-linecap="round" />
          ${points.filter(p => p.data.revenue > 0).map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#FAF6EE" stroke="#2C4A2E" stroke-width="2" />
          `).join('')}
        </svg>
      </div>
    `;
  },

  /**
   * Renders Day-by-Day matcha sales flow chart for the entire month
   */
  renderMonthlyFlowChart(containerEl, monthlyData, currency = "₱") {
    if (!containerEl) return;
    const { days, peakDay, daysInMonth } = monthlyData;
    const maxRev = Math.max(...days.map(d => d.revenue), 1000);

    const svgWidth = 850;
    const svgHeight = 250;
    const padLeft = 70;
    const padRight = 25;
    const padTop = 30;
    const padBottom = 45;
    const chartW = svgWidth - padLeft - padRight;
    const chartH = svgHeight - padTop - padBottom;

    const step = chartW / daysInMonth;
    const barW = Math.max(8, step * 0.65);

    const gridCount = 4;
    let gridSvg = "";
    for (let i = 0; i <= gridCount; i++) {
      const yVal = padTop + (chartH / gridCount) * i;
      const amountVal = Math.round(maxRev * (1 - i / gridCount));
      gridSvg += `
        <line x1="${padLeft}" y1="${yVal}" x2="${svgWidth - padRight}" y2="${yVal}" stroke="var(--border-color, #E2D7C3)" stroke-dasharray="3 3" />
        <text x="${padLeft - 8}" y="${yVal + 4}" font-size="11" font-family="var(--font-mono)" fill="var(--text-muted, #8C7A6B)" text-anchor="end">${currency}${amountVal.toLocaleString()}</text>
      `;
    }

    let barsSvg = "";
    const points = [];

    days.forEach((d, idx) => {
      const xCenter = padLeft + idx * step + step / 2;
      const barH = (d.revenue / maxRev) * chartH;
      const barY = padTop + chartH - barH;
      const isPeak = d.day === peakDay.day && peakDay.revenue > 0;
      const isWeekend = d.isWeekend;

      points.push({ x: xCenter, y: barY, data: d });

      let fill = isPeak
        ? "url(#monthPeakGrad)"
        : isWeekend
        ? "url(#weekendGrad)"
        : "url(#weekdayGrad)";

      if (d.revenue === 0) fill = "var(--bg-subtle, #EDE4D0)";

      const showLabel = daysInMonth <= 16 || d.day === 1 || d.day % 3 === 0 || d.day === daysInMonth;

      barsSvg += `
        <g class="month-col" tabindex="0" data-day="${d.label}" data-rev="${d.revenue}" data-count="${d.count}">
          <rect x="${xCenter - barW / 2}" y="${barY}" width="${barW}" height="${Math.max(barH, 3)}" rx="3" fill="${fill}">
            <title>${d.label}: ${currency}${d.revenue.toLocaleString()} (${d.count} orders)</title>
          </rect>
          ${showLabel ? `
            <text x="${xCenter}" y="${svgHeight - 14}" font-size="11" fill="${isWeekend ? 'var(--matcha-dark, #2C4A2E)' : 'var(--text-muted, #8C7A6B)'}" text-anchor="middle" font-weight="${isPeak || isWeekend ? '800' : '500'}">${d.day}</text>
          ` : ''}
        </g>
      `;
    });

    let areaPathD = "";
    let linePathD = "";
    if (points.length > 0) {
      linePathD = `M ${points[0].x} ${points[0].y}`;
      areaPathD = `M ${points[0].x} ${padTop + chartH} L ${points[0].x} ${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const mx = (curr.x + next.x) / 2;
        linePathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
        areaPathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
      }
      areaPathD += ` L ${points[points.length - 1].x} ${padTop + chartH} Z`;
    }

    containerEl.innerHTML = `
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="pos-svg-chart" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="weekdayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#476930" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#2C4A2E" stop-opacity="0.5" />
            </linearGradient>
            <linearGradient id="weekendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#D4A373" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#C58F49" stop-opacity="0.5" />
            </linearGradient>
            <linearGradient id="monthPeakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#BA3C3C" stop-opacity="1" />
              <stop offset="100%" stop-color="#8C7A6B" stop-opacity="0.7" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#476930" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#476930" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          ${gridSvg}
          <path d="${areaPathD}" fill="url(#areaGrad)" />
          ${barsSvg}
          <path d="${linePathD}" fill="none" stroke="#2C4A2E" stroke-width="2" opacity="0.6" />
        </svg>
      </div>
    `;
  },

  /**
   * Renders SVG Donut Chart for Payment Methods Distribution
   */
  renderPaymentDonut(containerEl, paymentBreakdown, currency = "₱", totalSales = 0) {
    if (!containerEl) return;

    const activePayments = paymentBreakdown.filter(p => p.total > 0);
    const grandSum = activePayments.reduce((acc, p) => acc + p.total, 0);

    if (activePayments.length === 0 || grandSum === 0) {
      containerEl.innerHTML = `
        <div class="empty-chart-msg">
          <span>🍵</span>
          <p>No payment transactions recorded for this period.</p>
        </div>
      `;
      return;
    }

    const size = 220;
    const center = size / 2;
    const radius = 80;
    const strokeWidth = 32;
    const circ = 2 * Math.PI * radius;

    let accumulatedPct = 0;
    let arcsSvg = "";

    activePayments.forEach(p => {
      const pct = p.total / grandSum;
      const strokeDasharray = `${pct * circ} ${circ}`;
      const strokeDashoffset = -accumulatedPct * circ;
      accumulatedPct += pct;

      arcsSvg += `
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="none"
          stroke="${p.color || '#2C4A2E'}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          class="donut-segment"
          transform="rotate(-90 ${center} ${center})"
        >
          <title>${p.name}: ${currency}${p.total.toLocaleString()} (${p.percentage}%)</title>
        </circle>
      `;
    });

    const legendHtml = activePayments.map(p => `
      <div class="payment-legend-row">
        <div class="legend-info">
          <span class="legend-color-dot" style="background-color: ${p.color};"></span>
          <span class="legend-icon">${p.icon}</span>
          <span class="legend-name">${p.name}</span>
        </div>
        <div class="legend-values">
          <span class="legend-amount">${currency}${p.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="legend-pct badge">${p.percentage}%</span>
        </div>
      </div>
    `).join('');

    containerEl.innerHTML = `
      <div class="donut-chart-layout">
        <div class="donut-svg-wrapper">
          <svg viewBox="0 0 ${size} ${size}" class="pos-donut-svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--bg-subtle, #EDE4D0)" stroke-width="${strokeWidth}" />
            ${arcsSvg}
          </svg>
          <div class="donut-center-label">
            <span class="center-title">Total</span>
            <span class="center-val">${currency}${grandSum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div class="donut-legend-container">
          ${legendHtml}
        </div>
      </div>
    `;
  },

  /**
   * Generates a downloadable CSV string for transactions
   */
  generateSalesCSV(sales, settings) {
    const currency = settings.currencySymbol || "₱";
    const headers = [
      "Order ID",
      "Timestamp",
      "Guest",
      "Items Count",
      "Subtotal",
      "Discount",
      "VAT",
      "Total Amount (PHP)",
      "Payment Methods",
      "Status",
      "Notes"
    ];

    const rows = sales.map(s => {
      const pmSummary = (s.payments || []).map(p => `${p.methodId} (${currency}${p.amount})`).join(" + ");
      const itemsCount = (s.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
      return [
        `"${s.id}"`,
        `"${s.timestamp}"`,
        `"${s.customer || 'Walk-in'}"`,
        itemsCount,
        s.subtotal,
        s.discount,
        s.tax,
        s.total,
        `"${pmSummary}"`,
        `"${s.status}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\r\n");
  }
};
