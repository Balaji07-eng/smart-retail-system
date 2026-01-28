const API = "https://smart-retail-system-sz0s.onrender.com";
let products = [];
let cart = [];

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

function addToCart(id) {
  const qty = Number(document.getElementById(`q-${id}`).value);
  const p = products.find(x => x.id === id);
  cart.push({ product_id: id, name: p.name, price: p.price, quantity: qty });
  renderCart();
}

function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += i.price * i.quantity;
    ul.innerHTML += `<li>${i.name} × ${i.quantity}</li>`;
  });

  document.getElementById("total").innerText = total;
}

async function createBill() {
  const payload = {
    customer: {
      name: document.getElementById("customer-name").value,
      phone: document.getElementById("customer-phone").value
    },
    payment: document.getElementById("payment-mode").value,
    items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
  };

  const res = await fetch(`${API}/bill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  alert(`Sale ID: ${data.sale_id}\nTotal: ₹${data.total}`);
  cart = [];
  loadProducts();
  renderCart();
}

window.onload = loadProducts;
