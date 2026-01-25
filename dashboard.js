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

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadSalesTrend();
  loadPayments();
  loadTopProducts();
};
