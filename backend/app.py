from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB_NAME = "database.db"

# ================================
# DATABASE CONNECTION
# ================================
def connect_db():
    return sqlite3.connect(DB_NAME, check_same_thread=False)

# ================================
# CREATE TABLES
# ================================
def create_tables():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL,
        payment_mode TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
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

# ================================
# BASIC
# ================================
@app.route("/")
def home():
    return {"status": "Smart Retail Backend Running"}

# ================================
# PRODUCTS
# ================================
@app.route("/products", methods=["GET"])
def get_products():
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products")
    rows = cur.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "price": r[2], "stock": r[3]}
        for r in rows
    ])

@app.route("/products", methods=["POST"])
def add_product():
    data = request.get_json()
    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        (data["name"], data["price"], data["stock"])
    )

    conn.commit()
    conn.close()
    return {"message": "Product added successfully"}

@app.route("/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id=?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted"}

# ================================
# BILLING (POS)
# ================================
@app.route("/bill", methods=["POST"])
def create_bill():
    data = request.get_json()
    items = data["items"]
    customer = data["customer"]
    payment = data["payment"]

    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO customers (name, phone) VALUES (?,?)",
        (customer["name"], customer["phone"])
    )
    customer_id = cur.lastrowid

    total = 0
    for item in items:
        cur.execute("SELECT price, stock FROM products WHERE id=?", (item["product_id"],))
        price, stock = cur.fetchone()

        if stock < item["quantity"]:
            return {"error": "Insufficient stock"}, 400

        total += price * item["quantity"]

    cur.execute(
        "INSERT INTO sales (customer_id, total, payment_mode) VALUES (?,?,?)",
        (customer_id, total, payment)
    )
    sale_id = cur.lastrowid

    for item in items:
        cur.execute("SELECT price FROM products WHERE id=?", (item["product_id"],))
        price = cur.fetchone()[0]

        cur.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, subtotal) VALUES (?,?,?,?)",
            (sale_id, item["product_id"], item["quantity"], price * item["quantity"])
        )

        cur.execute(
            "UPDATE products SET stock = stock - ? WHERE id=?",
            (item["quantity"], item["product_id"])
        )

    conn.commit()
    conn.close()

    return {
        "message": "Bill generated successfully",
        "sale_id": sale_id,
        "customer_id": customer_id,
        "total": total
    }

# ================================
# ANALYTICS SUMMARY
# ================================
@app.route("/analytics/summary")
def analytics_summary():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("SELECT SUM(total) FROM sales")
    revenue = cur.fetchone()[0] or 0

    cur.execute("SELECT COUNT(*) FROM sales")
    total_sales = cur.fetchone()[0]

    conn.close()

    return {
        "total_revenue": revenue,
        "total_sales": total_sales
    }

# ================================
# WEEKLY / MONTHLY / YEARLY
# ================================
@app.route("/analytics/weekly")
def weekly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT strftime('%W', created_at) AS week, SUM(total)
    FROM sales
    GROUP BY week
    ORDER BY week
    """)

    data = [{"week": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/analytics/monthly")
def monthly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT strftime('%Y-%m', created_at) AS month, SUM(total)
    FROM sales
    GROUP BY month
    ORDER BY month
    """)

    data = [{"month": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/analytics/yearly")
def yearly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT strftime('%Y', created_at) AS year, SUM(total)
    FROM sales
    GROUP BY year
    ORDER BY year
    """)

    data = [{"year": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

# ================================
# STOCK PREDICTION (7 DAYS)
# ================================
@app.route("/analytics/stock-prediction")
def stock_prediction():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT p.id, p.name, IFNULL(SUM(si.quantity),0)
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    GROUP BY p.id
    """)

    results = []
    for pid, name, total_sold in cur.fetchall():
        avg_daily = round(total_sold / 7, 2) if total_sold else 0
        recommended = int(avg_daily * 7)

        results.append({
            "product_id": pid,
            "name": name,
            "avg_daily_sales": avg_daily,
            "recommended_stock": recommended
        })

    conn.close()
    return jsonify(results)

# ================================
# RUN
# ================================
if __name__ == "__main__":
    app.run(debug=True)
