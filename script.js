const API = "https://smart-retail-system-sz0s.onrender.com";

let products = [];
let cart = [];

// --------------------
// LOAD PRODUCTS
// --------------------
async function loadProducts() {
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
      <td><input type="number" min="1" max="${p.stock}" value="1" id="q-${p.id}"></td>
      <td><button onclick="addToCart(${p.id})">Add</button></td>
    `;

    tbody.appendChild(row);
  });
}

// --------------------
// ADD TO CART
// --------------------
function addToCart(id) {
  const qty = Number(document.getElementById(`q-${id}`).value);
  const p = products.find(x => x.id === id);

  if (!p || qty <= 0) return;

  cart.push({
    product_id: id,
    name: p.name,
    price: p.price,
    quantity: qty
  });

  renderCart();
}

// --------------------
// RENDER CART
// --------------------
function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += i.price * i.quantity;
    ul.innerHTML += `<li>${i.name} × ${i.quantity} = ₹${i.price * i.quantity}</li>`;
  });

  document.getElementById("total").innerText = total;
}

// --------------------
// BILL + PDF
// --------------------
async function createBill() {
  const name = document.getElementById("customer-name").value;
  const phone = document.getElementById("customer-phone").value;
  const payment = document.getElementById("payment-mode").value;

  if (!name || !phone || cart.length === 0) {
    alert("Fill all details & add items");
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

  const res = await fetch(`${API}/bill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  generateInvoicePDF(data.sale_id, name, phone, cart, data.total, payment);

  alert(`Bill Generated!\nSale ID: ${data.sale_id}`);

  cart = [];
  renderCart();
  loadProducts();
}

// --------------------
// PDF INVOICE
// --------------------
function generateInvoicePDF(id, name, phone, items, total, payment) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;
  doc.setFontSize(18);
  doc.text("Smart Retail Invoice", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Sale ID: ${id}`, 20, y); y += 8;
  doc.text(`Customer: ${name}`, 20, y); y += 8;
  doc.text(`Phone: ${phone}`, 20, y); y += 8;
  doc.text(`Payment: ${payment}`, 20, y); y += 10;

  doc.text("Items:", 20, y); y += 8;

  items.forEach(i => {
    doc.text(`${i.name} × ${i.quantity} = ₹${i.price * i.quantity}`, 20, y);
    y += 7;
  });

  y += 5;
  doc.setFontSize(14);
  doc.text(`TOTAL: ₹${total}`, 20, y);

  doc.save(`invoice_${id}.pdf`);
}

window.onload = loadProducts;
