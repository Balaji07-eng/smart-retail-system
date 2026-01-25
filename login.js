function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // DEMO CREDENTIALS
  if (username === "admin" && password === "admin123") {
    localStorage.setItem("role", "admin");
    window.location.href = "dashboard.html";
  }
  else if (username === "cashier" && password === "cash123") {
    localStorage.setItem("role", "cashier");
    window.location.href = "index.html";
  }
  else {
    alert("Invalid credentials");
  }
}
