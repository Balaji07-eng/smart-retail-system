// ================================
// CONFIG
// ================================
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

      // LOW STOCK highlight
      if (p.stock <= 5) {
        row.style.backgroundColor = "#ffe6e6";
      }

      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>
          ${p.stock}
          ${p.stock <= 5 ? "<span style='color:red;font-weight:bold'> ⚠ LOW</span>" : ""}
        </td>
        <td>
          <input type="number" min="1" max="${p.stock}" value="1" id="qty-${p.id}">
        </td>
        <td>
          <button onclick="addToCart(${p.id})">Add</button>
        </td>
      `;

      list.appendChild(row);
    });

  } catch (err) {
    alert("❌ Cannot connect to backend");
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

  // Check if already in cart
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
    alert("⚠ Fill customer details and add items");
    return;
  }

  const payload = {
    customer: { name, phone },
    payment: payment,
    items: cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Bill Generated\nSale ID: ${data.sale_id}\nTotal: ₹${data.total}`);

      cart = [];
      renderCart();
      loadProducts();
    } else {
      alert(data.error || "Billing failed");
    }

  } catch (err) {
    alert("❌ Server error");
  }
}

// ================================
// INIT
// ================================
window.onload = loadProducts;
