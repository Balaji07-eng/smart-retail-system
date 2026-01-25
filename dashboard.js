// ================================
// CONFIG
// ================================
const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// SUMMARY
// ================================
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").textContent = "₹" + data.total_revenue;
  document.getElementById("totalSales").textContent = data.total_sales;
}

// ================================
// WEEKLY SALES
// ================================
async function loadWeeklyChart() {
  const res = await fetch(`${API_BASE}/analytics/weekly`);
  const data = await res.json();

  new Chart(document.getElementById("weeklyChart"), {
    type: "line",
    data: {
      labels: data.map(d => d.week),
      datasets: [{
        label: "Weekly Revenue",
        data: data.map(d => d.revenue),
        borderWidth: 2
      }]
    }
  });
}

// ================================
// MONTHLY SALES
// ================================
async function loadMonthlyChart() {
  const res = await fetch(`${API_BASE}/analytics/monthly`);
  const data = await res.json();

  new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: data.map(d => d.month),
      datasets: [{
        label: "Monthly Revenue",
        data: data.map(d => d.revenue),
        borderWidth: 2
      }]
    }
  });
}

// ================================
// YEARLY SALES
// ================================
async function loadYearlyChart() {
  const res = await fetch(`${API_BASE}/analytics/yearly`);
  const data = await res.json();

  new Chart(document.getElementById("yearlyChart"), {
    type: "bar",
    data: {
      labels: data.map(d => d.year),
      datasets: [{
        label: "Yearly Revenue",
        data: data.map(d => d.revenue),
        borderWidth: 2
      }]
    }
  });
}

// ================================
// STOCK PREDICTION
// ================================
async function loadStockPrediction() {
  const res = await fetch(`${API_BASE}/analytics/stock-prediction`);
  const data = await res.json();

  const table = document.getElementById("prediction-table");
  table.innerHTML = "";

  data.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.product_id}</td>
      <td>${p.name}</td>
      <td>${p.avg_daily_sales}</td>
      <td><b>${p.recommended_stock}</b></td>
    `;
    table.appendChild(row);
  });
}

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadWeeklyChart();
  loadMonthlyChart();
  loadYearlyChart();
  loadStockPrediction();
};
