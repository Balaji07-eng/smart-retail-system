// ================================
// CONFIG
// ================================
const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// LOAD SUMMARY
// ================================
async function loadSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await res.json();

  document.getElementById("revenue").textContent = data.total_revenue;
  document.getElementById("sales-count").textContent = data.total_sales;
}

// ================================
// LOAD TOP PRODUCTS
// ================================
async function loadTopProducts() {
  const res = await fetch(`${API_BASE}/analytics/top-products`);
  const data = await res.json();

  const list = document.getElementById("top-products");
  list.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.product} — ${p.quantity_sold} sold`;
    list.appendChild(li);
  });
}

// ================================
// LOAD PAYMENT MODES
// ================================
async function loadPayments() {
  const res = await fetch(`${API_BASE}/analytics/payments`);
  const data = await res.json();

  const list = document.getElementById("payments");
  list.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.payment_mode}: ${p.count}`;
    list.appendChild(li);
  });
}

// ================================
// LOAD SALES TREND
// ================================
async function loadTrend() {
  const res = await fetch(`${API_BASE}/analytics/trend`);
  const data = await res.json();

  const list = document.getElementById("trend");
  list.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.date}: ₹${t.revenue}`;
    list.appendChild(li);
  });
}

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadTopProducts();
  loadPayments();
  loadTrend();
};
