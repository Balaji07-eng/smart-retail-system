const API = "https://smart-retail-system-sz0s.onrender.com";

async function loadDashboard() {
  const s = await fetch(`${API}/analytics/summary`).then(r => r.json());
  document.getElementById("revenue").innerText = s.total_revenue;
  document.getElementById("sales").innerText = s.total_sales;

  const t = await fetch(`${API}/analytics/trend`).then(r => r.json());

  new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: t.map(x => x.date),
      datasets: [{
        label: "Revenue",
        data: t.map(x => x.revenue),
        borderWidth: 2
      }]
    }
  });
}

loadDashboard();
