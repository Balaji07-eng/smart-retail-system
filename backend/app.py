from flask import Flask, request, jsonify
from flask_cors import CORS
from models import create_tables, connect_db

app = Flask(__name__)
CORS(app)

create_tables()

@app.route("/")
def home():
    return {"status": "Backend running"}

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

    return jsonify({"message": "Product added"})

if __name__ == "__main__":
    app.run(debug=True)
