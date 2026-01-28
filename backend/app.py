from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB = "database.db"

# ---------------- DATABASE ----------------
def connect_db():
    return sqlite3.connect(DB, check_same_thread=False)

def create_tables():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL,
        payment_mode TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    c.execute("""
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

create_tables()

# ---------------- PRODUCTS ----------------
@app.route("/products", methods=["GET"])
def products():
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT * FROM products")
    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "price": r[2], "stock": r[3]}
        for r in rows
    ])

@app.route("/products", methods=["POST"])
def add_product():
    data = request.json
    conn = connect_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        (data["name"], data["price"], data["stock"])
    )
    conn.commit()
    conn.close()
    return {"message": "Product added"}

@app.route("/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    conn = connect_db()
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@app.route("/products/<int:pid>/stock", methods=["PUT"])
def update_stock(pid):
    data = request.json
    conn = connect_db()
    c = conn.cursor()
    c.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        (data["quantity"], pid)
    )
    conn.commit()
    conn.close()
    return {"message": "Stock updated"}

# ---------------- BILLING ----------------
@app.route("/bill", methods=["POST"])
def bill():
    data = request.json
    conn = connect_db()
    c = conn.cursor()

    c.execute(
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        (data["customer"]["name"], data["customer"]["phone"])
    )
    customer_id = c.lastrowid

    total = 0
    for item in data["items"]:
        c.execute("SELECT price, stock FROM products WHERE id=?", (item["product_id"],))
        price, stock = c.fetchone()
        if stock < item["quantity"]:
            return {"error": "Insufficient stock"}, 400
        total += price * item["quantity"]

    c.execute(
        "INSERT INTO sales (customer_id, total, payment_mode) VALUES (?, ?, ?)",
        (customer_id, total, data["payment"])
    )
    sale_id = c.lastrowid

    for item in data["items"]:
        c.execute("SELECT price FROM products WHERE id=?", (item["product_id"],))
        price = c.fetchone()[0]

        c.execute("""
        INSERT INTO sale_items (sale_id, product_id, quantity, subtotal)
        VALUES (?, ?, ?, ?)
        """, (sale_id, item["product_id"], item["quantity"], price * item["quantity"]))

        c.execute(
            "UPDATE products SET stock = stock - ? WHERE id=?",
            (item["quantity"], item["product_id"])
        )

    conn.commit()
    conn.close()
    return {"sale_id": sale_id, "total": total}

# ---------------- ANALYTICS ----------------
@app.route("/analytics/summary")
def summary():
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*), SUM(total) FROM sales")
    sales, revenue = c.fetchone()
    conn.close()

    return {
        "total_sales": sales or 0,
        "total_revenue": revenue or 0
    }

@app.route("/analytics/trend/<period>")
def trend(period):
    conn = connect_db()
    c = conn.cursor()

    query = {
        "weekly": "strftime('%W', created_at)",
        "monthly": "strftime('%m', created_at)",
        "yearly": "strftime('%Y', created_at)"
    }[period]

    c.execute(f"""
        SELECT {query}, SUM(total)
        FROM sales
        GROUP BY {query}
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"label": r[0], "revenue": r[1]}
        for r in rows
    ])

@app.route("/analytics/low-stock")
def low_stock():
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT * FROM products WHERE stock <= 5")
    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "stock": r[3]}
        for r in rows
    ])

@app.route("/analytics/stock-prediction")
def stock_prediction():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
    SELECT p.id, p.name, IFNULL(SUM(si.quantity)/7,0) avg_daily, p.stock
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    GROUP BY p.id
    """)
    rows = c.fetchall()
    conn.close()

    result = []
    for r in rows:
        recommended = int(r[2] * 7)
        result.append({
            "product_id": r[0],
            "name": r[1],
            "avg_daily_sales": round(r[2], 2),
            "current_stock": r[3],
            "recommended_stock": recommended
        })

    return jsonify(result)

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
