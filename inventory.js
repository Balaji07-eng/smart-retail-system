const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();

  const tbody = document.getElementById("products");
  tbody.innerHTML = "";

  data.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>₹${p.price}</td>
      <td>${p.stock}</td>
      <td>
        <button class="danger" onclick="deleteProduct(${p.id})">
          Delete
        </button>
      </td>
    `;

    tbody.appendChild(row);
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
// UPDATE STOCK
// ================================
async function increaseStock() {
  const productId = document.getElementById("productId").value;
  const quantity = document.getElementById("addStock").value;

  if (!productId || !quantity || quantity <= 0) {
    alert("Enter valid Product ID and Quantity");
    return;
  }

  const res = await fetch(`${API_BASE}/products/${productId}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: Number(quantity) })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Stock updated successfully");
    loadProducts();
    document.getElementById("productId").value = "";
    document.getElementById("addStock").value = "";
  } else {
    alert(data.error || "Failed to update stock");
  }
}

// ================================
// DELETE PRODUCT
// ================================
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

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
