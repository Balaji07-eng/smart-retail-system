const API = "https://smart-retail-system-sz0s.onrender.com";

let trendChart = null;
let productChart = null;

// ================================
// SUMMARY
// ================================
async function loadSummary() {
  const res = await fetch(`${API}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").innerText = data.total_revenue || 0;
  document.getElementById("totalSales").innerText = data.total_sales || 0;
}

// ================================
// SALES TREND (DAILY)
// ================================
async function loadTrend() {
  const res = await fetch(`${API}/analytics/trend`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.revenue);

  const ctx = document.getElementById("trendChart");

  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Revenue (₹)",
        data: values,
        borderColor: "#3498db",
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    }
  });
}

// ================================
// PRODUCT-WISE SALES
// ================================
async function loadProductSales() {
  const res = await fetch(`${API}/analytics/top-products`);
  const data = await res.json();

  const labels = data.map(p => p.product);
  const values = data.map(p => p.quantity_sold);

  const ctx = document.getElementById("productChart");

  if (productChart) {
    productChart.destroy();
  }

  productChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Units Sold",
        data: values,
        backgroundColor: "#2ecc71"
      }]
    }
  });
}

// ================================
// LOW STOCK
// ================================
async function loadLowStock() {
  const res = await fetch(`${API}/analytics/low-stock`);
  const data = await res.json();

  const table = document.getElementById("lowStockTable");
  table.innerHTML = "";

  data.forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td style="color:red;font-weight:bold">${p.stock}</td>
      </tr>
    `;
  });
}

// ================================
// STOCK PREDICTION
// ================================
async function loadPrediction() {
  const res = await fetch(`${API}/analytics/stock-prediction`);
  const data = await res.json();

  const table = document.getElementById("predictionTable");
  table.innerHTML = "";

  data.forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.product_id}</td>
        <td>${p.name}</td>
        <td>${p.avg_daily_sales}</td>
        <td><b>${p.recommended_stock}</b></td>
      </tr>
    `;
  });
}

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadTrend();           // daily trend (WORKS)
  loadProductSales();    // product-wise (WORKS)
  loadLowStock();
  loadPrediction();
};
