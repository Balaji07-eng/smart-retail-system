const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// SUMMARY CARDS
// ================================
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("revenue").textContent = data.total_revenue;
  document.getElementById("sales-count").textContent = data.total_sales;
}

// ================================
// SALES TREND (LINE CHART)
// ================================
async function loadSalesTrend() {
  const res = await fetch(`${API_BASE}/analytics/trend`);
  const data = await res.json();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.revenue);

  new Chart(document.getElementById("salesTrendChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Revenue (₹)",
        data: values,
        borderColor: "blue",
        fill: false
      }]
    }
  });
}

// ================================
// PAYMENT MODE (PIE CHART)
// ================================
async function loadPayments() {
  const res = await fetch(`${API_BASE}/analytics/payments`);
  const data = await res.json();

  new Chart(document.getElementById("paymentChart"), {
    type: "pie",
    data: {
      labels: data.map(p => p.payment_mode),
      datasets: [{
        data: data.map(p => p.count),
        backgroundColor: ["green", "orange", "purple", "red"]
      }]
    }
  });
}

// ================================
// TOP PRODUCTS (BAR CHART)
// ================================
async function loadTopProducts() {
  const res = await fetch(`${API_BASE}/analytics/top-products`);
  const data = await res.json();

  new Chart(document.getElementById("topProductsChart"), {
    type: "bar",
    data: {
      labels: data.map(p => p.product),
      datasets: [{
        label: "Units Sold",
        data: data.map(p => p.quantity_sold),
        backgroundColor: "teal"
      }]
    }
  });
}
const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

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
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadTopProducts();
  loadPayments();
  loadStockPrediction();
  loadWeeklyChart();
  loadMonthlyChart();
  loadYearlyChart();
};
