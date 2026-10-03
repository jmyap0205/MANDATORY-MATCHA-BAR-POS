/**
 * Mandatory MATCHA BAR - Default Store Dataset & 35-Day Sales History
 * Configured with authentic menu items, categories, pricing (PHP ₱), and payment channels (GCash, Maya, UnionBank).
 */

const DEFAULT_SETTINGS = {
  storeName: "Mandatory MATCHA BAR",
  storeAddress: "Unit 2, Artisan Hub, Greenhills / BGC",
  storePhone: "+63 917 123 4567",
  storeEmail: "hello@mandatorymatcha.bar",
  taxId: "VAT-248-910-332-000",
  currencySymbol: "₱",
  taxRatePercent: 12.0, // 12% Philippine VAT
  taxInclusive: false,
  enableTips: true,
  receiptHeaderMsg: "Thank you for getting your matcha fix! 🍵",
  receiptFooterMsg: "Crafted with love & ceremonial grade matcha. Follow us @mandatorymatchabar",
  lowStockThreshold: 15
};

const DEFAULT_PAYMENT_METHODS = [
  { 
    id: "cash", 
    name: "Cash", 
    icon: "💵", 
    color: "#2C4A2E", 
    active: true, 
    isSystem: true,
    accountName: "",
    accountNumber: "",
    hasQr: false
  },
  { 
    id: "gcash", 
    name: "GCash", 
    icon: "📱", 
    color: "#007dfe", 
    active: true, 
    isSystem: false,
    accountName: "AL**E M** M.",
    accountNumber: "09** *** 9133",
    qrLabel: "Scan via GCash App",
    hasQr: true
  },
  { 
    id: "maya", 
    name: "Maya", 
    icon: "🟢", 
    color: "#00b276", 
    active: true, 
    isSystem: false,
    accountName: "Aljune Masado",
    accountNumber: "+63 9** *** 9133",
    qrLabel: "Scan via Maya App",
    hasQr: true
  },
  { 
    id: "unionbank", 
    name: "UnionBank", 
    icon: "🏦", 
    color: "#ea580c", 
    active: true, 
    isSystem: false,
    accountName: "ALJUNE MAS MASADO",
    accountNumber: "1014 **** ****",
    qrLabel: "InstaPay / UB Transfer",
    hasQr: true
  },
  { 
    id: "card_credit", 
    name: "Card (Terminal)", 
    icon: "💳", 
    color: "#476930", 
    active: true, 
    isSystem: true,
    accountName: "",
    accountNumber: "",
    hasQr: false
  },
  { 
    id: "owner_comp", 
    name: "Owner's Comp", 
    icon: "👑", 
    color: "#D4A373", 
    active: true, 
    isSystem: true,
    accountName: "Store Owner Account",
    accountNumber: "",
    hasQr: false
  }
];

const DEFAULT_CATEGORIES = [
  { 
    id: "cat_classic", 
    name: "Classic", 
    icon: "🍵", 
    color: "#3A5A40", 
    description: "Matcha/Hojicha, oat milk, sweetener" 
  },
  { 
    id: "cat_flavored", 
    name: "Flavored", 
    icon: "✨", 
    color: "#749C5B", 
    description: "Flavored Modern Matcha Signatures" 
  },
  { 
    id: "cat_pastries", 
    name: "Pastries", 
    icon: "🥐", 
    color: "#D4A373", 
    description: "Home-made baked goods to pair with matcha" 
  }
];

const DEFAULT_PRODUCTS = [
  // ==========================================
  // CLASSIC (Matcha/Hojicha, oat milk, sweetener)
  // ==========================================
  {
    id: "prod_mmb_01",
    sku: "CLS-01",
    name: "Level 1",
    categoryId: "cat_classic",
    price: 260,
    cost: 85,
    stock: 120,
    lowStockThreshold: 20,
    barcode: "480123450001",
    taxable: true,
    color: "#8DB580",
    badge: "",
    notes: "Light & smooth matcha latte. Soft, balanced, and easy to drink."
  },
  {
    id: "prod_mmb_02",
    sku: "CLS-02",
    name: "Level 2 ★",
    categoryId: "cat_classic",
    price: 270,
    cost: 95,
    stock: 140,
    lowStockThreshold: 25,
    barcode: "480123450002",
    taxable: true,
    color: "#2C4A2E",
    badge: "Best Seller",
    notes: "Rich & bold matcha latte. Deeper umami with a fuller body."
  },
  {
    id: "prod_mmb_03",
    sku: "CLS-03",
    name: "Hojicha",
    categoryId: "cat_classic",
    price: 250,
    cost: 80,
    stock: 80,
    lowStockThreshold: 15,
    barcode: "480123450003",
    taxable: true,
    color: "#8C7A6B",
    badge: "",
    notes: "Dark roast hojicha latte. Toasty with a savory finish."
  },

  // ==========================================
  // FLAVORED (Flavored Modern Matcha Signatures)
  // ==========================================
  {
    id: "prod_mmb_04",
    sku: "FLV-01",
    name: "Strawberry Matcha",
    categoryId: "cat_flavored",
    price: 280,
    cost: 95,
    stock: 75,
    lowStockThreshold: 15,
    barcode: "480123450004",
    taxable: true,
    color: "#E56B6F",
    badge: "",
    notes: "Matcha, strawberries, oat milk, sweetener."
  },
  {
    id: "prod_mmb_05",
    sku: "FLV-02",
    name: "Taro Matcha",
    categoryId: "cat_flavored",
    price: 280,
    cost: 95,
    stock: 60,
    lowStockThreshold: 15,
    barcode: "480123450005",
    taxable: true,
    color: "#9C89B8",
    badge: "",
    notes: "Matcha, taro milk, sweetener."
  },
  {
    id: "prod_mmb_06",
    sku: "FLV-03",
    name: "Matcha + Gelato ★",
    categoryId: "cat_flavored",
    price: 290,
    cost: 110,
    stock: 90,
    lowStockThreshold: 20,
    barcode: "480123450006",
    taxable: true,
    color: "#588157",
    badge: "Best Seller",
    notes: "Matcha latte topped with 1 scoop of home-made matcha gelato."
  },
  {
    id: "prod_mmb_07",
    sku: "FLV-04",
    name: "Honey Butter Matcha",
    categoryId: "cat_flavored",
    price: 320,
    cost: 120,
    stock: 50,
    lowStockThreshold: 12,
    barcode: "480123450007",
    taxable: true,
    color: "#E9C46A",
    badge: "New",
    notes: "Matcha latte topped with home-made honey butter cream."
  },
  {
    id: "prod_mmb_08",
    sku: "FLV-05",
    name: "Earl Grey Matcha",
    categoryId: "cat_flavored",
    price: 290,
    cost: 100,
    stock: 45,
    lowStockThreshold: 10,
    barcode: "480123450008",
    taxable: true,
    color: "#6D6875",
    badge: "New",
    notes: "Matcha, earl grey syrup, oat milk."
  },
  {
    id: "prod_mmb_09",
    sku: "FLV-06",
    name: "Apple Pie Matcha",
    categoryId: "cat_flavored",
    price: 300,
    cost: 105,
    stock: 40,
    lowStockThreshold: 10,
    barcode: "480123450009",
    taxable: true,
    color: "#D4A373",
    badge: "New",
    notes: "Matcha, apple pie syrup, oat milk."
  },
  {
    id: "prod_mmb_10",
    sku: "FLV-07",
    name: "Just Gelato",
    categoryId: "cat_flavored",
    price: 200,
    cost: 65,
    stock: 65,
    lowStockThreshold: 15,
    barcode: "480123450010",
    taxable: true,
    color: "#3A5A40",
    badge: "",
    notes: "2 scoops of home-made matcha ice cream."
  },

  // ==========================================
  // PASTRIES (Home-made baked goods)
  // ==========================================
  {
    id: "prod_mmb_11",
    sku: "PST-01",
    name: "Classic Brownies",
    categoryId: "cat_pastries",
    price: 90,
    cost: 30,
    stock: 60,
    lowStockThreshold: 12,
    barcode: "480123450011",
    taxable: true,
    color: "#4A3525",
    badge: "",
    notes: "Rich, fudgy home-made chocolate brownies."
  },
  {
    id: "prod_mmb_12",
    sku: "PST-02",
    name: "Chocolate Chip Cookie",
    categoryId: "cat_pastries",
    price: 55,
    cost: 18,
    stock: 80,
    lowStockThreshold: 15,
    barcode: "480123450012",
    taxable: true,
    color: "#C58F49",
    badge: "",
    notes: "Soft-baked chocolate chunk cookie."
  },
  {
    id: "prod_mmb_13",
    sku: "PST-03",
    name: "S'more Choco Chip Cookie",
    categoryId: "cat_pastries",
    price: 60,
    cost: 20,
    stock: 70,
    lowStockThreshold: 15,
    barcode: "480123450013",
    taxable: true,
    color: "#A26743",
    badge: "",
    notes: "Toasted marshmallow and melted chocolate cookie."
  }
];

/**
 * Generates realistic historical sales data in Philippine Pesos (₱) for the Matcha Bar.
 */
function generateSeedSales(products, paymentMethods) {
  const sales = [];
  const now = new Date();
  const daysToGenerate = 35;

  const methodsList = paymentMethods.filter(m => m.active).map(m => m.id);
  const methodWeights = {
    gcash: 0.40,      // In Manila / PH matcha bars, GCash is king!
    maya: 0.20,
    cash: 0.20,
    unionbank: 0.10,
    card_credit: 0.10
  };

  let orderIndex = 2001;

  for (let d = daysToGenerate; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - d);

    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    // Matcha bar daily volume: 15 to 25 transactions on weekdays, 25 to 45 on weekends
    const txCount = isWeekend ? Math.floor(Math.random() * 20) + 25 : Math.floor(Math.random() * 12) + 15;

    for (let t = 0; t < txCount; t++) {
      // Rush hour peaks:
      // Morning coffee/matcha start: 9 AM - 11 AM (weight 25%)
      // Post-lunch matcha rush: 1 PM - 4 PM (weight 45%)
      // Evening sweet tooth: 5 PM - 8 PM (weight 30%)
      const randBucket = Math.random();
      let hour;
      if (randBucket < 0.25) {
        hour = Math.floor(Math.random() * 3) + 9;
      } else if (randBucket < 0.70) {
        hour = Math.floor(Math.random() * 4) + 13;
      } else {
        hour = Math.floor(Math.random() * 4) + 17;
      }
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const orderTimestamp = new Date(targetDate);
      orderTimestamp.setHours(hour, minute, second, 0);

      if (orderTimestamp > now) continue;

      // 1 to 3 items per customer (e.g. 1 matcha drink + 1 pastry)
      const itemCount = Math.floor(Math.random() * 2) + 1;
      const orderItems = [];
      let subtotal = 0;
      let totalCost = 0;

      // Weight popular items: Level 2, Matcha + Gelato, Strawberry Matcha
      const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
      for (let i = 0; i < itemCount; i++) {
        const prod = shuffledProducts[i];
        if (!prod) continue;
        const qty = Math.random() < 0.8 ? 1 : 2;
        const itemSubtotal = prod.price * qty;
        subtotal += itemSubtotal;
        totalCost += (prod.cost || 0) * qty;

        orderItems.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: prod.price,
          cost: prod.cost,
          quantity: qty,
          discount: 0,
          subtotal: itemSubtotal
        });
      }

      // Add a pastry occasionally
      if (Math.random() < 0.40) {
        const pastryProd = products.find(p => p.categoryId === "cat_pastries" && !orderItems.some(oi => oi.productId === p.id));
        if (pastryProd) {
          const pSub = pastryProd.price;
          subtotal += pSub;
          totalCost += pastryProd.cost;
          orderItems.push({
            productId: pastryProd.id,
            name: pastryProd.name,
            sku: pastryProd.sku,
            price: pastryProd.price,
            cost: pastryProd.cost,
            quantity: 1,
            discount: 0,
            subtotal: pSub
          });
        }
      }

      let discountAmount = 0;
      if (Math.random() < 0.10) {
        discountAmount = Math.round(subtotal * 0.10); // 10% student/senior discount
      }

      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxRate = (DEFAULT_SETTINGS.taxRatePercent || 12) / 100;
      const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
      const grandTotal = parseFloat((taxableAmount + tax).toFixed(2));

      let chosenMethod = "gcash";
      const pRand = Math.random();
      let accum = 0;
      for (const [mId, weight] of Object.entries(methodWeights)) {
        accum += weight;
        if (pRand <= accum && methodsList.includes(mId)) {
          chosenMethod = mId;
          break;
        }
      }

      const payments = [
        {
          methodId: chosenMethod,
          amount: grandTotal,
          reference: chosenMethod !== "cash" ? `REF-${Math.floor(100000 + Math.random() * 900000)}` : ""
        }
      ];

      const amountTendered = chosenMethod === "cash" 
        ? Math.ceil(grandTotal / 100) * 100 
        : grandTotal;
      const changeDue = parseFloat(Math.max(0, amountTendered - grandTotal).toFixed(2));

      sales.push({
        id: `MMB-${orderIndex++}`,
        timestamp: orderTimestamp.toISOString(),
        items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: discountAmount,
        tax: tax,
        total: grandTotal,
        cost: parseFloat(totalCost.toFixed(2)),
        profit: parseFloat((grandTotal - tax - totalCost).toFixed(2)),
        payments: payments,
        amountTendered: amountTendered,
        changeDue: changeDue,
        status: "completed",
        notes: Math.random() < 0.2 ? "Less sweet / 50% sugar" : (Math.random() < 0.1 ? "Extra oat milk" : ""),
        customer: t % 3 === 0 ? "Walk-in Guest" : `Guest #${t + 1}`
      });
    }
  }

  return sales;
}
