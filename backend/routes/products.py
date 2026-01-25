from flask import Blueprint, request, jsonify
import sqlite3

products_bp = Blueprint("products_bp", __name__)

def connect_db():
    return sqlite3.connect("database.db")

@products_bp.route("/products", methods=["GET"])
def get_products():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row[0],
            "name": row[1],
            "price": row[2],
            "stock": row[3]
        } for row in rows
    ])

@products_bp.route("/products", methods=["POST"])
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
