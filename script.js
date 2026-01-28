// ================================
// CONFIG
// ================================
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
    console.error(err);
  }
}

// ================================
// ADD TO CART
// ================================
function addToCart(productId) {
  const qtyInput = document.getElementById(`q-${productId}`);
  const qty = Number(qtyInput.value);

  if (qty <= 0) {
    alert("Quantity must be at least 1");
    return;
  }

  const product = products.find(p => p.id === productId);
  if (!product) return;

  cart.push({
    product_id: productId,
    name: product.name,
    price: product.price,
    quantity: qty
  });

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

    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`;
    ul.appendChild(li);
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

  if (!name || !phone) {
    alert("⚠ Please enter customer details");
    return;
  }

  if (cart.length === 0) {
    alert("⚠ Cart is empty");
    return;
  }

  const payload = {
    customer: { name, phone },
    payment: payment,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
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

    alert(`✅ Bill Generated\nSale ID: ${data.sale_id}\nTotal: ₹${data.total}`);

    // Reset
    cart = [];
    renderCart();
    loadProducts();
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";

  } catch (err) {
    alert("❌ Server error");
    console.error(err);
  }
}

// ================================
// INIT
// ================================
window.onload = loadProducts;
