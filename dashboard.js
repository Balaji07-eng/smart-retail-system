const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// SUMMARY
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").innerText = "₹" + data.total_revenue;
  document.getElementById("totalProfit").innerText = "₹" + data.total_profit;
  document.getElementById("totalSales").innerText = data.total_sales;
}

// CHARTS
async function loadChart(endpoint, elementId, label) {
  const res = await fetch(`${API_BASE}/analytics/${endpoint}`);
  const data = await res.json();

  new Chart(document.getElementById(elementId), {
    type: "line",
    data: {
      labels: data.map(d => Object.values(d)[0]),
      datasets: [{
        label: label,
        data: data.map(d => Object.values(d)[1]),
        borderWidth: 2,
        fill: false
      }]
    }
  });
}

// LOW STOCK
async function loadLowStock() {
  const res = await fetch(`${API_BASE}/analytics/low-stock`);
  const data = await res.json();

  const table = document.getElementById("lowStockTable");
  table.innerHTML = "";

  data.forEach(p => {
    table.innerHTML += `
      <tr class="table-danger">
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.stock}</td>
      </tr>
    `;
  });
}

// STOCK PREDICTION
async function loadPrediction() {
  const res = await fetch(`${API_BASE}/analytics/stock-prediction`);
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
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("revenue").innerText = `₹${data.total_revenue}`;
  document.getElementById("sales").innerText = data.total_sales;
  document.getElementById("profit").innerText = `₹${data.total_profit}`;
}

loadSummary();

// INIT
window.onload = () => {
  loadSummary();
  loadChart("weekly", "weeklyChart", "Weekly Revenue");
  loadChart("monthly", "monthlyChart", "Monthly Revenue");
  loadChart("yearly", "yearlyChart", "Yearly Revenue");
  loadLowStock();
  loadPrediction();
};
