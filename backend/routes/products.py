from flask import Blueprint, request, jsonify
import sqlite3

products_bp = Blueprint("products", __name__)

def connect_db():
    return sqlite3.connect("database.db")

@products_bp.route("/products", methods=["GET"])
def get_products():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()

    products = []
    for row in rows:
        products.append({
            "id": row[0],
            "name": row[1],
            "price": row[2],
            "stock": row[3]
        })

    return jsonify(products)

@products_bp.route("/products", methods=["POST"])
def add_product():
    data = request.json
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        (data["name"], data["price"], data["stock"])
    )

    conn.commit()
    conn.close()

    return {"message": "Product added successfully"}
