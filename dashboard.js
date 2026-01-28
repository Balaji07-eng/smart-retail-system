const API = "https://smart-retail-system-sz0s.onrender.com";

let chartInstance = null;

async function loadDashboard() {
  try {
    // ------------------------
    // SUMMARY
    // ------------------------
    const summaryRes = await fetch(`${API}/analytics/summary`);
    const summary = await summaryRes.json();

    document.getElementById("revenue").innerText = summary.total_revenue || 0;
    document.getElementById("sales").innerText = summary.total_sales || 0;

    // ------------------------
    // TREND DATA
    // ------------------------
    const trendRes = await fetch(`${API}/analytics/trend`);
    const trend = await trendRes.json();

    const labels = trend.map(x => x.date);
    const values = trend.map(x => x.revenue);

    const ctx = document.getElementById("chart").getContext("2d");

    // Destroy old chart if exists (prevents bugs)
    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Revenue",
          data: values,
          borderColor: "#3498db",
          borderWidth: 2,
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

  } catch (err) {
    alert("❌ Failed to load analytics data");
    console.error(err);
  }
}

window.onload = loadDashboard;
