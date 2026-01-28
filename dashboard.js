const API = "https://smart-retail-system-sz0s.onrender.com";

let trendChart = null;
let productChart = null;

// ================================
// SUMMARY
// ================================
async function loadSummary() {
  try {
    const res = await fetch(`${API}/analytics/summary`);
    const data = await res.json();

    document.getElementById("totalRevenue").innerText = data.total_revenue || 0;
    document.getElementById("totalSales").innerText = data.total_sales || 0;
  } catch (err) {
    console.error("Summary error", err);
  }
}

// ================================
// SALES TREND (DAILY)
// ================================
async function loadTrend() {
  try {
    const res = await fetch(`${API}/analytics/trend`);
    const data = await res.json();

    const labels = data.map(d => d.date);
    const values = data.map(d => d.revenue);

    const ctx = document.getElementById("trendChart");

    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Revenue (₹)",
          data: values,
          borderColor: "#3498db",
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } }
      }
    });
  } catch (err) {
    console.error("Trend error", err);
  }
}

// ================================
// PRODUCT-WISE SALES
// ================================
async function loadProductSales() {
  try {
    const res = await fetch(`${API}/analytics/top-products`);
    const data = await res.json();

    const labels = data.map(p => p.product);
    const values = data.map(p => p.quantity_sold);

    const ctx = document.getElementById("productChart");

    if (productChart) productChart.destroy();

    productChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Units Sold",
          data: values,
          backgroundColor: "#2ecc71"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } }
      }
    });
  } catch (err) {
    console.error("Product chart error", err);
  }
}

// ================================
// PLACEHOLDER (FUTURE FEATURES)
// ================================
function showComingSoon(id) {
  const table = document.getElementById(id);
  if (table) {
    table.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:gray;">
          🚧 Feature under development
        </td>
      </tr>
    `;
  }
}

// ================================
// INIT
// ================================
window.onload = () => {
  loadSummary();
  loadTrend();          // ✅ WORKING
  loadProductSales();   // ✅ WORKING

  // Planned features (no crashes)
  showComingSoon("lowStockTable");
  showComingSoon("predictionTable");
};
