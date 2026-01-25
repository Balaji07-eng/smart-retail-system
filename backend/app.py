from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

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

    # PRODUCTS (with cost price)
    c.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        cost REAL,
        price REAL,
        stock INTEGER
    )
    """)

    # CUSTOMERS
    c.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT
    )
    """)

    # SALES
    c.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL,
        payment_mode TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # SALE ITEMS
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

# -------------------------------
# HEALTH CHECK
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
    c = conn.cursor()
    c.execute("SELECT id, name, price, stock FROM products")
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

    c.execute("""
        INSERT INTO products (name, cost, price, stock)
        VALUES (?, ?, ?, ?)
    """, (
        data["name"],
        data["cost"],
        data["price"],
        data["stock"]
    ))

    conn.commit()
    conn.close()
    return {"message": "Product added successfully"}

@app.route("/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    conn = connect_db()
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted"}

@app.route("/products/stock", methods=["PUT"])
def increase_stock():
    data = request.json
    conn = connect_db()
    c = conn.cursor()

    c.execute("""
        UPDATE products
        SET stock = stock + ?
        WHERE id = ?
    """, (data["quantity"], data["product_id"]))

    conn.commit()
    conn.close()
    return {"message": "Stock updated"}

# -------------------------------
# BILLING
# -------------------------------
@app.route("/bill", methods=["POST"])
def create_bill():
    data = request.json
    conn = connect_db()
    c = conn.cursor()

    # Customer
    c.execute(
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        (data["customer"]["name"], data["customer"]["phone"])
    )
    customer_id = c.lastrowid

    total = 0

    # Validate stock + calculate total
    for item in data["items"]:
        c.execute(
            "SELECT price, stock FROM products WHERE id = ?",
            (item["product_id"],)
        )
        row = c.fetchone()
        if not row:
            return {"error": "Product not found"}, 404

        price, stock = row
        if stock < item["quantity"]:
            return {"error": "Insufficient stock"}, 400

        total += price * item["quantity"]

    # Sale entry
    c.execute("""
        INSERT INTO sales (customer_id, total, payment_mode)
        VALUES (?, ?, ?)
    """, (customer_id, total, data["payment"]))
    sale_id = c.lastrowid

    # Sale items + stock update
    for item in data["items"]:
        c.execute("SELECT price FROM products WHERE id = ?", (item["product_id"],))
        price = c.fetchone()[0]

        c.execute("""
            INSERT INTO sale_items (sale_id, product_id, quantity, subtotal)
            VALUES (?, ?, ?, ?)
        """, (
            sale_id,
            item["product_id"],
            item["quantity"],
            price * item["quantity"]
        ))

        c.execute("""
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
        """, (item["quantity"], item["product_id"]))

    conn.commit()
    conn.close()

    return {
        "message": "Bill generated successfully",
        "sale_id": sale_id,
        "total": total
    }

# -------------------------------
# ANALYTICS
# -------------------------------
@app.route("/analytics/summary")
def summary():
    conn = connect_db()
    c = conn.cursor()

    # Sales & revenue
    c.execute("SELECT COUNT(*), SUM(total) FROM sales")
    total_sales, revenue = c.fetchone()

    # Profit
    c.execute("""
        SELECT SUM((p.price - p.cost) * si.quantity)
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
    """)
    profit = c.fetchone()[0]

    conn.close()

    return {
        "total_sales": total_sales or 0,
        "total_revenue": revenue or 0,
        "total_profit": profit or 0
    }

@app.route("/analytics/trend/daily")
def daily_trend():
    conn = connect_db()
    c = conn.cursor()
    c.execute("""
        SELECT DATE(created_at), SUM(total)
        FROM sales
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)
    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"date": r[0], "revenue": r[1]} for r in rows
    ])

@app.route("/analytics/trend/monthly")
def monthly_trend():
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
        {"month": r[0], "revenue": r[1]} for r in rows
    ])

@app.route("/analytics/trend/yearly")
def yearly_trend():
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
        {"year": r[0], "revenue": r[1]} for r in rows
    ])

# -------------------------------
# RUN (RENDER READY)
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
