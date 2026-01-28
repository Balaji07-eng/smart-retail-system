const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

let products = [];
let cart = [];

async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  products = await res.json();

  const list = document.getElementById("product-list");
  list.innerHTML = "";

  products.forEach(p => {
    const row = document.createElement("tr");
    if (p.stock <= 5) row.style.background = "#ffe6e6";

    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>₹${p.price}</td>
      <td>${p.stock}${p.stock<=5?" ⚠":""}</td>
      <td><input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}"></td>
      <td><button onclick="addToCart(${p.id})">Add</button></td>
    `;
    list.appendChild(row);
  });
}

function addToCart(id) {
  const qty = Number(document.getElementById(`qty-${id}`).value);
  const p = products.find(x => x.id === id);
  if (!p || qty<=0) return;

  const ex = cart.find(x => x.product_id === id);
  if (ex) ex.quantity += qty;
  else cart.push({product_id:id,name:p.name,price:p.price,quantity:qty});

  renderCart();
}

function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += i.price*i.quantity;
    ul.innerHTML += `<li>${i.name} × ${i.quantity}</li>`;
  });

  document.getElementById("total").innerText = total;
}

async function createBill() {
  const payload = {
    customer:{
      name:document.getElementById("customer-name").value,
      phone:document.getElementById("customer-phone").value
    },
    payment:document.getElementById("payment-mode").value,
    items:cart.map(i=>({product_id:i.product_id,quantity:i.quantity}))
  };

  const res = await fetch(`${API_BASE}/bill`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });

  const d = await res.json();
  alert(`Sale ${d.sale_id} | Total ₹${d.total}`);
  cart=[];
  renderCart();
  loadProducts();
}

window.onload = loadProducts;
