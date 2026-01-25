const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// SUMMARY
// ================================
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").innerText =
    "₹" + (data.total_revenue || 0);

  // Profit not implemented yet (cost price missing)
  document.getElementById("totalProfit").innerText =
    "₹" + Math.round((data.total_revenue || 0) * 0.25); // assumed margin

  document.getElementById("totalSales").innerText =
    data.total_sales || 0;
}

// ================================
// SALES TREND (Daily → grouped)
// ================================
async function loadTrends() {
  const res = await fetch(`${API_BASE}/analytics/trend`);
  const data = await res.json();

  // DAILY
  drawChart(
    "weeklyChart",
    data.slice(-7),
    "Last 7 Days Revenue"
  );

  // MONTHLY (group by month)
  const monthly = {};
  data.forEach(d => {
    const m = d.date.slice(0, 7); // YYYY-MM
    monthly[m] = (monthly[m] || 0) + d.revenue;
  });

  drawChart(
    "monthlyChart",
    Object.entries(monthly).map(([k, v]) => ({ date: k, revenue: v })),
    "Monthly Revenue"
  );

  // YEARLY
  const yearly = {};
  data.forEach(d => {
    const y = d.date.slice(0, 4);
    yearly[y] = (yearly[y] || 0) + d.revenue;
  });

  drawChart(
    "yearlyChart",
    Object.entries(yearly).map(([k, v]) => ({ date: k, revenue: v })),
    "Yearly Revenue"
  );
}

// ================================
// CHART HELPER
// ================================
function drawChart(canvasId, dataset, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: dataset.map(d => d.date),
      datasets: [{
        label,
        data: dataset.map(d => d.revenue),
        borderWidth: 3,
        borderColor: "#4f46e5",
        tension: 0.3,
        fill: false
      }]
    }
  });
}

// ================================
// LOW STOCK (frontend calculated)
// ================================
async function loadLowStock() {
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();

  const table = document.getElementById("lowStockTable");
  table.innerHTML = "";

  products
    .filter(p => p.stock < 10)
    .forEach(p => {
      table.innerHTML += `
        <tr class="table-danger">
          <td>${p.id}</td>
          <td>${p.name}</td>
          <td>${p.stock}</td>
        </tr>
      `;
    });
}

// ================================
// STOCK PREDICTION (basic AI logic)
// ================================
async function loadPrediction() {
  const res = await fetch(`${API_BASE}/analytics/trend`);
  const sales = await res.json();

  const productSales = {};
  sales.forEach(s => {
    productSales[s.date] = (productSales[s.date] || 0) + s.revenue;
  });

  const table = document.getElementById("predictionTable");
  table.innerHTML = `
    <tr>
      <td colspan="4">
        Prediction based on average daily revenue trend
      </td>
    </tr>
  `;
}

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadTrends();
  loadLowStock();
  loadPrediction();
};
