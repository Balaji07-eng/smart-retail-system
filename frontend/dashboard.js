const BASE_URL = "http://127.0.0.1:5000";

// Summary
fetch(`${BASE_URL}/analytics/summary`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("revenue").innerText = "₹" + data.total_revenue;
        document.getElementById("sales").innerText = data.total_sales;
    });

// Sales Trend
fetch(`${BASE_URL}/analytics/trend`)
    .then(res => res.json())
    .then(data => {
        new Chart(document.getElementById("trendChart"), {
            type: "line",
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: "Revenue",
                    data: data.map(d => d.revenue),
                    fill: false
                }]
            }
        });
    });

// Top Products
fetch(`${BASE_URL}/analytics/top-products`)
    .then(res => res.json())
    .then(data => {
        new Chart(document.getElementById("topProductsChart"), {
            type: "bar",
            data: {
                labels: data.map(d => d.product),
                datasets: [{
                    label: "Quantity Sold",
                    data: data.map(d => d.quantity_sold)
                }]
            }
        });
    });

// Payment Modes
fetch(`${BASE_URL}/analytics/payments`)
    .then(res => res.json())
    .then(data => {
        new Chart(document.getElementById("paymentChart"), {
            type: "pie",
            data: {
                labels: data.map(d => d.payment_mode),
                datasets: [{
                    data: data.map(d => d.count)
                }]
            }
        });
    });
