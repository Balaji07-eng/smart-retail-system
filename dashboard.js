const API = "https://smart-retail-system-sz0s.onrender.com";

let trendChart = null;
let productChart = null;

// ----------------------
// SUMMARY
// ----------------------
async function loadSummary() {
  const res = await fetch(`${API}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").innerText = data.total_revenue || 0;
  document.getElementById("totalSales").innerText = data.total_sales || 0;
}

// ----------------------
// SALES TREND
// ----------------------
async function loadTrend(type) {
  const res = await fetch(`${API}/analytics/${type}`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.revenue);

  const ctx = document.getElementById("trendChart");

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${type.toUpperCase()} Revenue`,
        data: values,
        borderColor: "#3498db",
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ----------------------
// PRODUCT SALES
// ----------------------
async function loadProductSales() {
  const res = await fetch(`${API}/analytics/top-products`);
  const data = await res.json();

  const ctx = document.getElementById("productChart");

  if (productChart) productChart.destroy();

  productChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.product),
      datasets: [{
        label: "Units Sold",
        data: data.map(d => d.quantity_sold),
        backgroundColor: "#2ecc71"
      }]
    }
  });
}

// ----------------------
// LOW STOCK
// ----------------------
async function loadLowStock() {
  const res = await fetch(`${API}/analytics/low-stock`);
  const data = await res.json();

  const tbody = document.getElementById("lowStockTable");
  tbody.innerHTML = "";

  data.forEach(p => {
    tbody.innerHTML += `
      <tr style="color:red;font-weight:bold">
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.stock}</td>
      </tr>
    `;
  });
}

// ----------------------
// STOCK PREDICTION
// ----------------------
async function loadPrediction() {
  const res = await fetch(`${API}/analytics/stock-prediction`);
  const data = await res.json();

  const tbody = document.getElementById("predictionTable");
  tbody.innerHTML = "";

  data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.product_id}</td>
        <td>${p.name}</td>
        <td>${p.avg_daily_sales}</td>
        <td><b>${p.recommended_stock}</b></td>
      </tr>
    `;
  });
}

// ----------------------
// INIT
// ----------------------
window.onload = () => {
  loadSummary();
  loadTrend("weekly");
  loadProductSales();
  loadLowStock();
  loadPrediction();
};
