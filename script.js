const API = "https://smart-retail-system-sz0s.onrender.com";

let products = [];
let cart = [];

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  try {
    const res = await fetch(`${API}/products`);
    products = await res.json();

    const tbody = document.getElementById("product-list");
    tbody.innerHTML = "";

    products.forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>${p.stock}</td>
        <td>
          <input type="number"
                 min="1"
                 max="${p.stock}"
                 value="1"
                 id="q-${p.id}">
        </td>
        <td>
          <button onclick="addToCart(${p.id})">Add</button>
        </td>
      `;

      tbody.appendChild(row);
    });

  } catch (err) {
    alert("❌ Backend not reachable");
  }
}

// ================================
// ADD TO CART
// ================================
function addToCart(id) {
  const qtyInput = document.getElementById(`q-${id}`);
  const qty = Number(qtyInput.value);
  const product = products.find(p => p.id === id);

  if (!product || qty <= 0) return;

  if (qty > product.stock) {
    alert("⚠ Quantity exceeds available stock");
    return;
  }

  // If product already in cart → update quantity
  const existing = cart.find(i => i.product_id === id);

  if (existing) {
    if (existing.quantity + qty > product.stock) {
      alert("⚠ Stock limit exceeded");
      return;
    }
    existing.quantity += qty;
  } else {
    cart.push({
      product_id: id,
      name: product.name,
      price: product.price,
      quantity: qty
    });
  }

  renderCart();
}

// ================================
// RENDER CART
// ================================
function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    ul.innerHTML += `
      <li>
        ${item.name} × ${item.quantity}
        = ₹${item.price * item.quantity}
      </li>
    `;
  });

  document.getElementById("total").innerText = total;
}

// ================================
// CREATE BILL
// ================================
async function createBill() {
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const payment = document.getElementById("payment-mode").value;

  if (!name || !phone || cart.length === 0) {
    alert("⚠ Fill customer details and add items");
    return;
  }

  const payload = {
    customer: { name, phone },
    payment,
    items: cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity
    }))
  };

  try {
    const res = await fetch(`${API}/bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Billing failed");
      return;
    }

    generateInvoicePDF(
      data.sale_id,
      name,
      phone,
      cart,
      data.total,
      payment
    );

    alert(`✅ Bill Generated\nSale ID: ${data.sale_id}`);

    cart = [];
    renderCart();
    loadProducts();

  } catch (err) {
    alert("❌ Server error");
  }
}

// ================================
// PDF INVOICE
// ================================
function generateInvoicePDF(id, name, phone, items, total, payment) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(18);
  doc.text("Smart Retail POS Invoice", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Sale ID: ${id}`, 20, y); y += 8;
  doc.text(`Customer: ${name}`, 20, y); y += 8;
  doc.text(`Phone: ${phone}`, 20, y); y += 8;
  doc.text(`Payment Mode: ${payment}`, 20, y); y += 10;

  doc.text("Items:", 20, y);
  y += 8;

  items.forEach(item => {
    doc.text(
      `${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`,
      20,
      y
    );
    y += 7;
  });

  y += 5;
  doc.setFontSize(14);
  doc.text(`TOTAL: ₹${total}`, 20, y);

  doc.save(`invoice_${id}.pdf`);
}

// ================================
// INIT
// ================================
window.onload = loadProducts;
