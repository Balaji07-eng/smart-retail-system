const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

let chart;

// SUMMARY
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("totalRevenue").innerText = "₹" + data.total_revenue;
  document.getElementById("totalSales").innerText = data.total_sales;
}

// TREND CHART
async function loadTrend(type) {
  const res = await fetch(`${API_BASE}/analytics/${type}`);
  const data = await res.json();

  const labels = data.map(d => d.period);
  const values = data.map(d => d.revenue);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${type.toUpperCase()} Revenue`,
        data: values,
        borderColor: "#2563eb",
        fill: true
      }]
    }
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
        <td>${p.current_stock}</td>
        <td><b>${p.recommended_stock}</b></td>
      </tr>
    `;
  });
}

// INIT
window.onload = () => {
  loadSummary();
  loadTrend("weekly");
  loadPrediction();
};
