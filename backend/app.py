from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# -------------------------------
# DATABASE CONNECTION
# -------------------------------
def connect_db():
    return sqlite3.connect(
        "database.db",
        timeout=10,
        check_same_thread=False
    )

# -------------------------------
# CREATE ALL TABLES (ONE PLACE)
# -------------------------------
def create_tables():
    conn = connect_db()
    cursor = conn.cursor()

    # Customers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT
    )
    """)

    # Products
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER
    )
    """)

    # Sales
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL,
        payment_mode TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Sale items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        subtotal REAL
    )
    """)

    conn.commit()
    conn.close()

# Create tables on startup
create_tables()

# -------------------------------
# BASIC ROUTE
# -------------------------------
@app.route("/")
def home():
    return {"status": "Backend running"}

# -------------------------------
# PRODUCTS
# -------------------------------
@app.route("/products", methods=["GET"])
def get_products():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "price": r[2], "stock": r[3]}
        for r in rows
    ])

@app.route("/products", methods=["POST"])
def add_product():
    data = request.get_json()

    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        (data["name"], data["price"], data["stock"])
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Product added successfully"})

# -------------------------------
# POS BILLING
# -------------------------------
@app.route("/bill", methods=["POST"])
def create_bill():
    data = request.get_json()
    items = data["items"]
    payment_mode = data["payment"]
    customer = data["customer"]

    conn = connect_db()
    cursor = conn.cursor()

    # Insert customer
    cursor.execute(
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        (customer["name"], customer["phone"])
    )
    customer_id = cursor.lastrowid

    total = 0

    # Calculate total
    for item in items:
        cursor.execute(
            "SELECT price, stock FROM products WHERE id = ?",
            (item["product_id"],)
        )
        price, stock = cursor.fetchone()

        if stock < item["quantity"]:
            conn.close()
            return {"error": "Insufficient stock"}, 400

        total += price * item["quantity"]

    # Insert sale
    cursor.execute(
        "INSERT INTO sales (customer_id, total, payment_mode) VALUES (?, ?, ?)",
        (customer_id, total, payment_mode)
    )
    sale_id = cursor.lastrowid

    # Sale items + stock update
    for item in items:
        cursor.execute(
            "SELECT price FROM products WHERE id = ?",
            (item["product_id"],)
        )
        price = cursor.fetchone()[0]

        subtotal = price * item["quantity"]

        cursor.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
            (sale_id, item["product_id"], item["quantity"], subtotal)
        )

        cursor.execute(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            (item["quantity"], item["product_id"])
        )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Bill generated successfully",
        "sale_id": sale_id,
        "customer_id": customer_id,
        "total": total
    })

# -------------------------------
# SALES HISTORY
# -------------------------------
@app.route("/sales", methods=["GET"])
def get_sales():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, total, payment_mode, created_at
        FROM sales
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "sale_id": r[0],
            "total": r[1],
            "payment_mode": r[2],
            "date": r[3]
        }
        for r in rows
    ])

@app.route("/sales/<int:sale_id>", methods=["GET"])
def get_sale_details(sale_id):
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.name, si.quantity, si.subtotal
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
    """, (sale_id,))

    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"product": r[0], "quantity": r[1], "subtotal": r[2]}
        for r in rows
    ])

# -------------------------------
# ANALYTICS
# -------------------------------
@app.route("/analytics/summary", methods=["GET"])
def analytics_summary():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT SUM(total) FROM sales")
    total_revenue = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM sales")
    total_sales = cursor.fetchone()[0]

    conn.close()

    return jsonify({
        "total_revenue": total_revenue,
        "total_sales": total_sales
    })

@app.route("/analytics/top-products", methods=["GET"])
def top_products():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.name, SUM(si.quantity)
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.name
        ORDER BY SUM(si.quantity) DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"product": r[0], "quantity_sold": r[1]}
        for r in rows
    ])

@app.route("/analytics/payments", methods=["GET"])
def payment_breakdown():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT payment_mode, COUNT(*)
        FROM sales
        GROUP BY payment_mode
    """)

    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"payment_mode": r[0], "count": r[1]}
        for r in rows
    ])

@app.route("/analytics/trend", methods=["GET"])
def sales_trend():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DATE(created_at), SUM(total)
        FROM sales
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)

    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"date": r[0], "revenue": r[1]}
        for r in rows
    ])

# -------------------------------
# CUSTOMERS
# -------------------------------
@app.route("/customers", methods=["GET"])
def get_customers():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, phone FROM customers")
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "phone": r[2]}
        for r in rows
    ])

@app.route("/customers/<int:customer_id>/history", methods=["GET"])
def customer_history(customer_id):
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, total, payment_mode, created_at
        FROM sales
        WHERE customer_id = ?
    """, (customer_id,))

    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "sale_id": r[0],
            "total": r[1],
            "payment_mode": r[2],
            "date": r[3]
        }
        for r in rows
    ])
@app.route("/products/<int:product_id>/stock", methods=["PATCH"])
def update_stock(product_id):
    data = request.get_json()
    quantity = data.get("quantity")

    if quantity is None or quantity <= 0:
        return {"error": "Invalid quantity"}, 400

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        (quantity, product_id)
    )

    conn.commit()
    conn.close()

    return {"message": "Stock updated successfully"}

@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()

    return {"message": "Product deleted successfully"}

@app.route("/products/<int:product_id>/stock", methods=["PUT"])
def increase_stock(product_id):
    data = request.get_json()
    qty = data.get("quantity")

    if not qty or qty <= 0:
        return {"error": "Invalid quantity"}, 400

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        (qty, product_id)
    )

    if cursor.rowcount == 0:
        conn.close()
        return {"error": "Product not found"}, 404

    conn.commit()
    conn.close()

    return {"message": "Stock updated successfully"}

# -------------------------------
# RUN SERVER
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)

