// ================================
// CONFIG
// ================================

// ✅ Render backend URL (KEEP THIS)
const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

let products = [];
let cart = [];

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    products = await res.json();

    const list = document.getElementById("product-list");
    list.innerHTML = "";

    products.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>${p.stock}</td>
        <td>
          <input type="number" min="1" max="${p.stock}" value="1" id="qty-${p.id}">
          <button onclick="addToCart(${p.id})">Add</button>
        </td>
      `;
      list.appendChild(row);
    });

  } catch (error) {
    alert("❌ Cannot connect to backend");
    console.error(error);
  }
}

// ================================
// ADD TO CART
// ================================
function addToCart(productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = parseInt(qtyInput.value);

  const product = products.find(p => p.id === productId);
  if (!product || qty <= 0) return;

  // If product already in cart → increase quantity
  const existing = cart.find(i => i.product_id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      product_id: productId,
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
  const cartList = document.getElementById("cart");
  cartList.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.quantity} = ₹${subtotal}`;
    cartList.appendChild(li);
  });

  document.getElementById("total").textContent = total;
}

// ================================
// CREATE BILL
// ================================
async function createBill() {
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const payment = document.getElementById("payment-mode").value;

  if (!name || !phone || cart.length === 0) {
    alert("⚠️ Enter customer details and add items");
    return;
  }

  const payload = {
    customer: { name, phone },
    payment,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "❌ Billing failed");
      return;
    }

    alert(
      `✅ Bill Generated!\n\nSale ID: ${data.sale_id}\nTotal: ₹${data.total}`
    );

    cart = [];
    renderCart();
    loadProducts();

    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";

  } catch (error) {
    alert("❌ Server error");
    console.error(error);
  }
}

// ================================
// INIT
// ================================
window.onload = loadProducts;
