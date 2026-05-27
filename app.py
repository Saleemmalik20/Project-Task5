from flask import Flask, request, jsonify, send_from_directory,session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import mysql.connector
from datetime import datetime
import re

app = Flask(__name__, static_folder='static')
app.secret_key = "secretkey"
bcrypt = Bcrypt(app)
CORS(app,supports_credentials=True)

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Saleem@786",
    database="expense_tracker"
)

cursor = db.cursor(dictionary=True)

CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Health",
    "Education",
    "Entertainment",
    "Other"
]

def logged_in():
    return 'user_id' in session


def validate_date(date_text):
    try:
        datetime.strptime(date_text, '%Y-%m-%d')
        return True
    except:
        return False
    

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "All fields required"}), 400

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        query = """
        INSERT INTO users (username, email, password)
        VALUES (%s, %s, %s)
        """
        cursor.execute(query, (username, email, hashed))
        db.commit()

        return jsonify({"message": "Registered successfully"}), 201

    except mysql.connector.Error:
        return jsonify({"message": "Username or email already exists"}), 400
    
@app.route('/login', methods=['POST'])
def login():
    data = request.json

    email = data.get('email')
    password = data.get('password')

    query = "SELECT * FROM users WHERE email=%s"
    cursor.execute(query, (email,))
    user = cursor.fetchone()

    if user and bcrypt.check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']

        return jsonify({
            "message": "Login successful",
            "username": user['username']
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200


@app.route('/expenses', methods=['GET'])
def get_expenses():

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    query = """
    SELECT * FROM expenses
    WHERE user_id=%s
    ORDER BY date DESC
    """

    cursor.execute(query, (session['user_id'],))
    expenses = cursor.fetchall()

    return jsonify(expenses), 200

@app.route('/expenses', methods=['POST'])
def add_expense():

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json

    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')
    date = data.get('date')
    note = data.get('note')

    if category not in CATEGORIES:
        return jsonify({"message": "Invalid category"}), 400

    try:
        amount = float(amount)

        if amount <= 0:
            return jsonify({"message": "Amount must be positive"}), 400

    except:
        return jsonify({"message": "Invalid amount"}), 400

    if not validate_date(date):
        return jsonify({"message": "Invalid date"}), 400

    query = """
    INSERT INTO expenses
    (user_id, title, amount, category, date, note)
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    values = (
        session['user_id'],
        title,
        amount,
        category,
        date,
        note
    )

    cursor.execute(query, values)
    db.commit()

    return jsonify({"message": "Expense added"}), 201

@app.route('/expenses/<int:id>', methods=['PUT'])
def update_expense(id):

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json

    query = """
    UPDATE expenses
    SET title=%s, amount=%s, category=%s,
        date=%s, note=%s
    WHERE id=%s AND user_id=%s
    """

    values = (
        data['title'],
        data['amount'],
        data['category'],
        data['date'],
        data.get('note'),
        id,
        session['user_id']
    )

    cursor.execute(query, values)
    db.commit()

    if cursor.rowcount == 0:
        return jsonify({"message": "Expense not found"}), 404

    return jsonify({"message": "Expense updated"}), 200

@app.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    query = """
    DELETE FROM expenses
    WHERE id=%s AND user_id=%s
    """

    cursor.execute(query, (id, session['user_id']))
    db.commit()

    if cursor.rowcount == 0:
        return jsonify({"message": "Expense not found"}), 404

    return jsonify({"message": "Deleted"}), 200

@app.route('/expenses/summary')
def summary():

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']

    cursor.execute("""
    SELECT SUM(amount) AS total
    FROM expenses
    WHERE user_id=%s
    """, (user_id,))
    total = cursor.fetchone()

    cursor.execute("""
    SELECT category, SUM(amount) AS total
    FROM expenses
    WHERE user_id=%s
    GROUP BY category
    """, (user_id,))
    categories = cursor.fetchall()

    cursor.execute("""
    SELECT MAX(amount) AS highest
    FROM expenses
    WHERE user_id=%s
    """, (user_id,))
    highest = cursor.fetchone()

    cursor.execute("""
    SELECT COUNT(*) AS count
    FROM expenses
    WHERE user_id=%s
    """, (user_id,))
    count = cursor.fetchone()

    return jsonify({
        "total_spent": total['total'] or 0,
        "categories": categories,
        "highest_expense": highest['highest'] or 0,
        "expense_count": count['count']
    })


@app.route('/expenses/filter')
def filter_expenses():

    if not logged_in():
        return jsonify({"message": "Unauthorized"}), 401

    category = request.args.get('category')
    from_date = request.args.get('from')
    to_date = request.args.get('to')

    query = """
    SELECT * FROM expenses
    WHERE user_id=%s
    """

    params = [session['user_id']]

    if category:
        query += " AND category=%s"
        params.append(category)

    if from_date and to_date:
        query += " AND date BETWEEN %s AND %s"
        params.extend([from_date, to_date])

    query += " ORDER BY date DESC"

    cursor.execute(query, tuple(params))
    expenses = cursor.fetchall()

    return jsonify(expenses)


@app.route('/')
@app.route('/login-page')
def login_page():
    return send_from_directory('static', 'login.html')

@app.route('/register-page')
def register_page():
    return send_from_directory('static', 'register.html')


@app.route('/dashboard')
def dashboard_page():

    if 'user_id' not in session:
        return send_from_directory('static', 'login.html')

    return send_from_directory('static', 'dashboard.html')


@app.route('/expenses-page')
def expenses_page():

    if 'user_id' not in session:
        return send_from_directory('static', 'login.html')

    return send_from_directory('static', 'expenses.html')


if __name__ == '__main__':  
    app.run(debug=True)
    

