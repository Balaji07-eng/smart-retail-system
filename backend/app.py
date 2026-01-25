from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB = "database.db"

# -------------------------------
# DATABASE
# -------------------------------
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
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL,
        created_at TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER
    )
    """)

    conn.commit()
    conn.close()

create_tables()

# -------------------------------
# HEALTH CHECK (IMPORTANT)
# -------------------------------
@app.route("/", methods=["GET"])
def health():
    return {"status": "API running"}, 200

# -------------------------------
# PRODUCTS
# -------------------------------
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

@app.route("/products/stock", methods=["PUT"])
def update_stock():
    data = request.json
    conn = connect_db()
    c = conn.cursor()
    c.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        (data["quantity"], data["product_id"])
    )
    conn.commit()
    conn.close()
    return {"message": "Stock updated"}

# -------------------------------
# BILLING
# -------------------------------
@app.route("/bill", methods=["POST"])
def bill():
    data = request.json
    conn = connect_db()
    c = conn.cursor()

    total = 0
    for item in data["items"]:
        c.execute("SELECT price, stock FROM products WHERE id = ?", (item["product_id"],))
        price, stock = c.fetchone()

        if stock < item["quantity"]:
            return {"error": "Insufficient stock"}, 400

        total += price * item["quantity"]

    c.execute(
        "INSERT INTO sales (total, created_at) VALUES (?, ?)",
        (total, datetime.now().strftime("%Y-%m-%d"))
    )
    sale_id = c.lastrowid

    for item in data["items"]:
        c.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity) VALUES (?, ?, ?)",
            (sale_id, item["product_id"], item["quantity"])
        )
        c.execute(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            (item["quantity"], item["product_id"])
        )

    conn.commit()
    conn.close()
    return {"sale_id": sale_id, "total": total}

# -------------------------------
# ANALYTICS
# -------------------------------
@app.route("/analytics/summary")
def summary():
    conn = connect_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*), SUM(total) FROM sales")
    count, revenue = c.fetchone()

    conn.close()
    return {
        "total_sales": count or 0,
        "total_revenue": revenue or 0
    }

@app.route("/analytics/trend")
def trend():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT created_at, SUM(total)
        FROM sales
        GROUP BY created_at
        ORDER BY created_at
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"date": r[0], "revenue": r[1]}
        for r in rows
    ])
# -------------------------------
# ANALYTICS – WEEKLY
# -------------------------------
@app.route("/analytics/weekly")
def weekly_sales():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT strftime('%W', created_at) AS week, SUM(total)
        FROM sales
        GROUP BY week
        ORDER BY week
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"period": f"Week {r[0]}", "revenue": r[1]}
        for r in rows
    ])


# -------------------------------
# ANALYTICS – MONTHLY
# -------------------------------
@app.route("/analytics/monthly")
def monthly_sales():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT strftime('%Y-%m', created_at), SUM(total)
        FROM sales
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY strftime('%Y-%m', created_at)
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"period": r[0], "revenue": r[1]}
        for r in rows
    ])


# -------------------------------
# ANALYTICS – YEARLY
# -------------------------------
@app.route("/analytics/yearly")
def yearly_sales():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT strftime('%Y', created_at), SUM(total)
        FROM sales
        GROUP BY strftime('%Y', created_at)
        ORDER BY strftime('%Y', created_at)
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"period": r[0], "revenue": r[1]}
        for r in rows
    ])
# -------------------------------
# STOCK PREDICTION
# -------------------------------
@app.route("/analytics/stock-prediction")
def stock_prediction():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT p.id, p.name,
               IFNULL(SUM(si.quantity), 0) / 30.0 AS avg_daily_sales,
               p.stock
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        AND s.created_at >= date('now', '-30 day')
        GROUP BY p.id
    """)

    rows = c.fetchall()
    conn.close()

    result = []
    for r in rows:
        recommended = int(r[2] * 7)  # next 7 days
        result.append({
            "product_id": r[0],
            "name": r[1],
            "avg_daily_sales": round(r[2], 2),
            "current_stock": r[3],
            "recommended_stock": recommended
        })

    return jsonify(result)

# -------------------------------
# RUN (Render compatible)
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
