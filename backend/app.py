from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB = "database.db"

# ===============================
# DATABASE
# ===============================
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

# ===============================
# HEALTH CHECK
# ===============================
@app.route("/")
def home():
    return {"status": "Backend running"}

# ===============================
# PRODUCTS
# ===============================
@app.route("/products", methods=["GET"])
def get_products():
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
    return {"message": "Product deleted"}

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


# ===============================
# BILLING
# ===============================
@app.route("/bill", methods=["POST"])
def create_bill():
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
        c.execute("SELECT price, stock FROM products WHERE id = ?", (item["product_id"],))
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
        c.execute("SELECT price FROM products WHERE id = ?", (item["product_id"],))
        price = c.fetchone()[0]

        c.execute("""
        INSERT INTO sale_items (sale_id, product_id, quantity, subtotal)
        VALUES (?, ?, ?, ?)
        """, (sale_id, item["product_id"], item["quantity"], price * item["quantity"]))

        c.execute(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            (item["quantity"], item["product_id"])
        )

    conn.commit()
    conn.close()
    return {"sale_id": sale_id, "total": total}

# ===============================
# ANALYTICS SUMMARY
# ===============================
@app.route("/analytics/summary")
def analytics_summary():
    conn = connect_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*), SUM(total) FROM sales")
    sales, revenue = c.fetchone()

    # simple profit assumption: 30%
    profit = (revenue or 0) * 0.3

    conn.close()
    return {
        "total_sales": sales or 0,
        "total_revenue": revenue or 0,
        "total_profit": round(profit, 2)
    }

# ===============================
# SALES TRENDS
# ===============================
def trend_query(group_by):
    conn = connect_db()
    c = conn.cursor()
    c.execute(f"""
    SELECT {group_by}, SUM(total)
    FROM sales
    GROUP BY {group_by}
    ORDER BY {group_by}
    """)
    rows = c.fetchall()
    conn.close()
    return rows

@app.route("/analytics/weekly")
def weekly():
    rows = trend_query("strftime('%Y-%W', created_at)")
    return jsonify([{"period": r[0], "revenue": r[1]} for r in rows])

@app.route("/analytics/monthly")
def monthly():
    rows = trend_query("strftime('%Y-%m', created_at)")
    return jsonify([{"period": r[0], "revenue": r[1]} for r in rows])

@app.route("/analytics/yearly")
def yearly():
    rows = trend_query("strftime('%Y', created_at)")
    return jsonify([{"period": r[0], "revenue": r[1]} for r in rows])

# ===============================
# LOW STOCK
# ===============================
@app.route("/analytics/low-stock")
def low_stock():
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT id, name, stock FROM products WHERE stock <= 5")
    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"id": r[0], "name": r[1], "stock": r[2]}
        for r in rows
    ])

# ===============================
# STOCK PREDICTION (NEXT 7 DAYS)
# ===============================
@app.route("/analytics/stock-prediction")
def stock_prediction():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
    SELECT p.id, p.name, p.stock,
           IFNULL(SUM(si.quantity) / 7.0, 0) as avg_daily
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id
    WHERE s.created_at >= date('now', '-7 day')
    GROUP BY p.id
    """)
    rows = c.fetchall()
    conn.close()

    result = []
    for r in rows:
        recommended = int(r[3] * 7)
        result.append({
            "product_id": r[0],
            "name": r[1],
            "avg_daily_sales": round(r[3], 2),
            "current_stock": r[2],
            "recommended_stock": recommended
        })

    return jsonify(result)

# ===============================
# RUN (RENDER)
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
