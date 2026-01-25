const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  try {
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
  } catch (err) {
    alert("Cannot connect to backend");
  }
}

// ================================
// ADD PRODUCT
// ================================
async function addProduct() {
  const name = document.getElementById("name").value.trim();
  const price = Number(document.getElementById("price").value);
  const stock = Number(document.getElementById("stock").value);

  if (!name || price <= 0 || stock < 0) {
    alert("Enter valid product details");
    return;
  }

  await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock })
  });

  alert("Product added successfully");
  loadProducts();

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("stock").value = "";
}

// ================================
// UPDATE STOCK (✅ FIXED)
// ================================
async function increaseStock() {
  const productId = Number(document.getElementById("productId").value);
  const quantity = Number(document.getElementById("addStock").value);

  if (!productId || quantity <= 0) {
    alert("Enter valid Product ID and Quantity");
    return;
  }

  const res = await fetch(`${API_BASE}/products/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Stock updated successfully");
    loadProducts();
    document.getElementById("productId").value = "";
    document.getElementById("addStock").value = "";
  } else {
    alert(data.error || "Stock update failed");
  }
}

// ================================
// DELETE PRODUCT
// ================================
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE"
  });

  if (res.ok) {
    alert("Product deleted");
    loadProducts();
  } else {
    alert("Delete failed");
  }
}

// ================================
// INIT
// ================================
loadProducts();
