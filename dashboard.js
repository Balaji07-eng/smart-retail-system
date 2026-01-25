const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// Wake up Render (important)
fetch(API_BASE).catch(() => {
  console.warn("Backend waking up...");
});

// ==========================
// LOAD SUMMARY
// ==========================
async function loadSummary() {
  try {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    const data = await res.json();

    document.getElementById("totalRevenue").innerText =
      "₹" + (data.total_revenue || 0);

    document.getElementById("totalSales").innerText =
      data.total_sales || 0;

  } catch (err) {
    alert("Cannot connect to backend");
  }
}

// ==========================
// LOAD SALES CHART
// ==========================
async function loadSalesChart() {
  const res = await fetch(`${API_BASE}/analytics/trend`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.revenue);

  new Chart(document.getElementById("salesChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Revenue (₹)",
        data: values,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

// ==========================
// INIT
// ==========================
window.onload = () => {
  loadSummary();
  loadSalesChart();
};
