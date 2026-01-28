// ================================
// CONFIG
// ================================
const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
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
  const qty = parseInt(document.getElementById(`qty-${productId}`).value);
  const product = products.find(p => p.id === productId);

  if (!product || qty <= 0) return;

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
  const cartList = document.getElementById("cart");
  cartList.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.textContent = `${item.name} x ${item.quantity} = ₹${item.price * item.quantity}`;
    cartList.appendChild(li);
  });
if (p.stock <= 5) {
  row.style.backgroundColor = "#ffe6e6";
  row.innerHTML += `<td style="color:red;font-weight:bold">LOW ⚠️</td>`;
} else {
  row.innerHTML += `<td>OK</td>`;
}

  document.getElementById("total").textContent = total;
}

// ================================
// CREATE BILL
// ================================
async function createBill() {
  const name = document.getElementById("customer-name").value;
  const phone = document.getElementById("customer-phone").value;
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
