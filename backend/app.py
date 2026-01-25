from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

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
        cost_price REAL,
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
        profit REAL,
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
        subtotal REAL,
        profit REAL
    )
    """)

    conn.commit()
    conn.close()

create_tables()

# ================================
# HOME
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
        {
            "id": r[0],
            "name": r[1],
            "price": r[2],
            "cost_price": r[3],
            "stock": r[4]
        }
        for r in rows
    ])

@app.route("/products", methods=["POST"])
def add_product():
    data = request.get_json()
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO products (name, price, cost_price, stock)
        VALUES (?, ?, ?, ?)
    """, (
        data["name"],
        data["price"],
        data["cost_price"],
        data["stock"]
    ))

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
# POS BILLING
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
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        (customer["name"], customer["phone"])
    )
    customer_id = cur.lastrowid

    total = 0
    total_profit = 0

    for item in items:
        cur.execute(
            "SELECT price, cost_price, stock FROM products WHERE id=?",
            (item["product_id"],)
        )
        price, cost, stock = cur.fetchone()

        if stock < item["quantity"]:
            return {"error": "Insufficient stock"}, 400

        total += price * item["quantity"]
        total_profit += (price - cost) * item["quantity"]

    cur.execute("""
        INSERT INTO sales (customer_id, total, profit, payment_mode)
        VALUES (?, ?, ?, ?)
    """, (customer_id, total, total_profit, payment))

    sale_id = cur.lastrowid

    for item in items:
        cur.execute(
            "SELECT price, cost_price FROM products WHERE id=?",
            (item["product_id"],)
        )
        price, cost = cur.fetchone()

        quantity = item["quantity"]
        subtotal = price * quantity
        profit = (price - cost) * quantity

        cur.execute("""
            INSERT INTO sale_items
            (sale_id, product_id, quantity, subtotal, profit)
            VALUES (?, ?, ?, ?, ?)
        """, (sale_id, item["product_id"], quantity, subtotal, profit))

        cur.execute("""
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
        """, (quantity, item["product_id"]))

    conn.commit()
    conn.close()

    return {
        "message": "Bill generated successfully",
        "sale_id": sale_id,
        "total": total,
        "profit": total_profit
    }

# ================================
# ANALYTICS SUMMARY
# ================================
@app.route("/analytics/summary")
def analytics_summary():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("SELECT SUM(total), SUM(profit) FROM sales")
    revenue, profit = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM sales")
    sales_count = cur.fetchone()[0]

    conn.close()

    return {
        "total_revenue": revenue or 0,
        "total_profit": profit or 0,
        "total_sales": sales_count
    }

# ================================
# TIME-BASED ANALYTICS
# ================================
@app.route("/analytics/weekly")
def weekly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT strftime('%W', created_at), SUM(total)
        FROM sales
        GROUP BY strftime('%W', created_at)
        ORDER BY 1
    """)

    data = [{"week": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/analytics/monthly")
def monthly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT strftime('%Y-%m', created_at), SUM(total)
        FROM sales
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY 1
    """)

    data = [{"month": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/analytics/yearly")
def yearly_sales():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT strftime('%Y', created_at), SUM(total)
        FROM sales
        GROUP BY strftime('%Y', created_at)
        ORDER BY 1
    """)

    data = [{"year": r[0], "revenue": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

# ================================
# LOW STOCK ALERT
# ================================
@app.route("/analytics/low-stock")
def low_stock():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, stock
        FROM products
        WHERE stock <= 5
    """)

    data = [{"id": r[0], "name": r[1], "stock": r[2]} for r in cur.fetchall()]
    conn.close()
    return jsonify(data)

# ================================
# DEMAND FORECASTING (7 DAYS)
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
