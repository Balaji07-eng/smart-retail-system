const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();

  const list = document.getElementById("products");
  list.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      ID: ${p.id} | ${p.name} | ₹${p.price} | Stock: ${p.stock}
      <button onclick="deleteProduct(${p.id})">Delete</button>
    `;
    list.appendChild(li);
  });
}

// ================================
// ADD PRODUCT
// ================================
async function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;

  if (!name || !price || !stock) {
    alert("Fill all fields");
    return;
  }

  await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock })
  });

  alert("Product added");
  loadProducts();
}

// ================================
// INCREASE STOCK
// ================================
async function increaseStock() {
  const id = document.getElementById("productId").value;
  const qty = document.getElementById("addStock").value;

  if (!id || !qty) {
    alert("Enter product ID and quantity");
    return;
  }

  await fetch(`${API_BASE}/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: qty })
  });

  alert("Stock updated");
  loadProducts();
}

// ================================
// DELETE PRODUCT
// ================================
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE"
  });

  alert("Product deleted");
  loadProducts();
}

// ================================
// INIT
// ================================
loadProducts();
