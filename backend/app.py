from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

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

# ---------------- HEALTH ----------------
@app.route("/")
def home():
    return {"status": "Smart Retail Backend Running"}

# ---------------- PRODUCTS ----------------
@app.route("/products")
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
    d = request.json
    conn = connect_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        (d["name"], d["price"], d["stock"])
    )
    conn.commit()
    conn.close()
    return {"message": "Product added"}

@app.route("/products/<int:pid>/stock", methods=["PUT"])
def update_stock(pid):
    d = request.json
    conn = connect_db()
    c = conn.cursor()
    c.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        (d["quantity"], pid)
    )
    conn.commit()
    conn.close()
    return {"message": "Stock updated"}

@app.route("/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    conn = connect_db()
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted"}

# ---------------- BILLING ----------------
@app.route("/bill", methods=["POST"])
def bill():
    d = request.json
    conn = connect_db()
    c = conn.cursor()

    c.execute(
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        (d["customer"]["name"], d["customer"]["phone"])
    )
    customer_id = c.lastrowid

    total = 0
    for i in d["items"]:
        c.execute("SELECT price, stock FROM products WHERE id=?", (i["product_id"],))
        price, stock = c.fetchone()
        if stock < i["quantity"]:
            return {"error": "Insufficient stock"}, 400
        total += price * i["quantity"]

    c.execute(
        "INSERT INTO sales (customer_id, total, payment_mode) VALUES (?, ?, ?)",
        (customer_id, total, d["payment"])
    )
    sale_id = c.lastrowid

    for i in d["items"]:
        c.execute("SELECT price FROM products WHERE id=?", (i["product_id"],))
        price = c.fetchone()[0]
        c.execute("""
            INSERT INTO sale_items (sale_id, product_id, quantity, subtotal)
            VALUES (?, ?, ?, ?)
        """, (sale_id, i["product_id"], i["quantity"], price * i["quantity"]))
        c.execute(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            (i["quantity"], i["product_id"])
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

    profit = round((revenue or 0) * 0.3, 2)

    return {
        "total_sales": sales or 0,
        "total_revenue": revenue or 0,
        "total_profit": profit
    }

@app.route("/analytics/trend/<period>")
def trend(period):
    group = {
        "weekly": "%Y-%W",
        "monthly": "%Y-%m",
        "yearly": "%Y"
    }.get(period, "%Y-%m")

    conn = connect_db()
    c = conn.cursor()
    c.execute(f"""
        SELECT strftime('{group}', created_at), SUM(total)
        FROM sales
        GROUP BY 1
        ORDER BY 1
    """)
    rows = c.fetchall()
    conn.close()

    return jsonify([{"label": r[0], "value": r[1]} for r in rows])

@app.route("/analytics/stock-prediction")
def stock_prediction():
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        SELECT p.id, p.name, p.stock,
               IFNULL(SUM(si.quantity)/7.0,0)
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        GROUP BY p.id
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "product_id": r[0],
            "name": r[1],
            "current_stock": r[2],
            "avg_daily_sales": round(r[3],2),
            "recommended_stock": int(r[3]*7 + 5)
        } for r in rows
    ])

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
