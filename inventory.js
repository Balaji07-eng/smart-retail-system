const API_BASE = "https://smart-retail-system-sz0s.onrender.com";

async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();

  const list = document.getElementById("products");
  list.innerHTML = "";

  products.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `ID:${p.id} | ${p.name} | ₹${p.price} | Stock:${p.stock}`;
    list.appendChild(li);
  });
}

async function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;

  await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name, price, stock})
  });

  alert("Product added");
  loadProducts();
}

async function increaseStock() {
  const id = document.getElementById("productId").value;
  const qty = document.getElementById("addStock").value;

  await fetch(`${API_BASE}/products/${id}/stock`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({quantity: parseInt(qty)})
  });

  alert("Stock updated");
  loadProducts();
}

window.onload = loadProducts;
