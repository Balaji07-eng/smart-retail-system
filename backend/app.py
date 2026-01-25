from flask import Flask
from flask_cors import CORS
from models import create_tables
from routes.products import products_bp   # 👈 ADD THIS

app = Flask(__name__)
CORS(app)

create_tables()

app.register_blueprint(products_bp)   # 👈 ADD THIS

@app.route("/")
def home():
    return {
        "project": "Smart Retail Management System",
        "status": "Backend + Database ready"
    }

if __name__ == "__main__":
    app.run(debug=True)
