const API = "https://smart-retail-system-sz0s.onrender.com";
let chart;

async function loadSummary() {
  const res = await fetch(`${API}/analytics/summary`);
  const d = await res.json();
  document.getElementById("totalRevenue").innerText = "₹" + d.total_revenue;
  document.getElementById("totalSales").innerText = d.total_sales;
}

async function loadTrend(period) {
  const res = await fetch(`${API}/analytics/trend/${period}`);
  const data = await res.json();

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: "Revenue",
        data: data.map(d => d.revenue),
        borderColor: "blue",
        fill: false
      }]
    }
  });
}

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
        <td>${p.current_stock}</td>
        <td><b>${p.recommended_stock}</b></td>
      </tr>
    `;
  });
}

window.onload = () => {
  loadSummary();
  loadTrend("weekly");
  loadPrediction();
};
