# app.py — Full Flask App (NO CS50 LIBRARY)

from flask import Flask, render_template, request, redirect, session, jsonify, url_for
from flask_session import Session
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os
from functools import wraps

# -------------------------
# APP SETUP
# -------------------------
app = Flask(__name__)
app.secret_key = "supersecretkey"  # TODO: change to env var for production

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Allow frontend (GitHub Pages) to call this API
CORS(app)  # for now, allow all origins; you can restrict later if needed

# -------------------------
# DATABASE HELPER
# -------------------------
DB_FILE = "users.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist yet."""
    conn = get_db()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "username TEXT UNIQUE, "
        "hash TEXT)"
    )
    conn.execute(
        "CREATE TABLE IF NOT EXISTS friend_requests ("
        "sender TEXT, "
        "receiver TEXT)"
    )
    conn.execute(
        "CREATE TABLE IF NOT EXISTS friends ("
        "user1 TEXT, "
        "user2 TEXT)"
    )
    conn.commit()
    conn.close()

# Run this on import (works both locally and on Render/gunicorn)
init_db()

# -------------------------
# LOGIN REQUIRED DECORATOR
# -------------------------
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated

# -------------------------
# HOME / LANDING
# -------------------------
@app.route("/")
@login_required
def index():
    # If you only use this as backend API, you can remove render_template
    return render_template("map.html")  # or just return "OK"

# -------------------------
# REGISTER
# -------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return "Missing username or password"

        conn = get_db()
        existing = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()
        if existing:
            conn.close()
            return "Username already taken."

        hash_pw = generate_password_hash(password)
        conn.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?)",
            (username, hash_pw)
        )
        conn.commit()
        conn.close()

        return redirect("/login")

    return render_template("register.html")

# -------------------------
# LOGIN
# -------------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()
        conn.close()

        if not user or not check_password_hash(user["hash"], password):
            return "Invalid username or password"

        session["user_id"] = user["id"]
        return redirect("/")

    return render_template("login.html")

# -------------------------
# LOGOUT
# -------------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

# =====================================================
# FRIEND SYSTEM API ROUTES (USED BY friends.html / frontend)
# =====================================================

# ✔ GET all other registered users
@app.route("/api/users")
@login_required
def api_users():
    conn = get_db()
    current = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    rows = conn.execute(
        "SELECT username FROM users WHERE username != ?",
        (current,)
    ).fetchall()
    conn.close()

    return jsonify([row["username"] for row in rows])

# ✔ SEND request
@app.route("/api/send_request", methods=["POST"])
@login_required
def api_send_request():
    data = request.get_json()
    receiver = data["receiver"]

    conn = get_db()
    sender = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    # Check duplicate
    exists = conn.execute(
        "SELECT * FROM friend_requests WHERE sender = ? AND receiver = ?",
        (sender, receiver)
    ).fetchone()
    if exists:
        conn.close()
        return jsonify({"status": "exists"})

    conn.execute(
        "INSERT INTO friend_requests (sender, receiver) VALUES (?, ?)",
        (sender, receiver)
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

# ✔ GET incoming requests TO THE LOGGED IN USER
@app.route("/api/requests")
@login_required
def api_requests():
    conn = get_db()
    username = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    reqs = conn.execute(
        "SELECT sender FROM friend_requests WHERE receiver = ?",
        (username,)
    ).fetchall()
    conn.close()

    return jsonify([row["sender"] for row in reqs])

# ✔ ACCEPT request
@app.route("/api/accept_request", methods=["POST"])
@login_required
def api_accept():
    data = request.get_json()
    sender = data["sender"]

    conn = get_db()
    receiver = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    # Remove request
    conn.execute(
        "DELETE FROM friend_requests WHERE sender = ? AND receiver = ?",
        (sender, receiver)
    )

    # Add friendship
    conn.execute(
        "INSERT INTO friends (user1, user2) VALUES (?, ?)",
        (receiver, sender)
    )

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

# ✔ DECLINE request
@app.route("/api/decline_request", methods=["POST"])
@login_required
def api_decline():
    data = request.get_json()
    sender = data["sender"]

    conn = get_db()
    receiver = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    conn.execute(
        "DELETE FROM friend_requests WHERE sender = ? AND receiver = ?",
        (sender, receiver)
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

# ✔ GET FRIEND LIST
@app.route("/api/friends")
@login_required
def api_friends():
    conn = get_db()
    username = conn.execute(
        "SELECT username FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()["username"]

    rows = conn.execute(
        "SELECT user1, user2 FROM friends WHERE user1 = ? OR user2 = ?",
        (username, username)
    ).fetchall()
    conn.close()

    friends = []
    for row in rows:
        if row["user1"] == username:
            friends.append(row["user2"])
        else:
            friends.append(row["user1"])

    return jsonify(friends)

# -------------------------
# FRIENDS PAGE (if served by backend)
# -------------------------
@app.route("/friends")
@login_required
def friends_page():
    return render_template("friends.html")

# -------------------------
# MAP PAGE (if served by backend)
# -------------------------
@app.route("/map")
@login_required
def map_page():
    return render_template("map.html")

# -------------------------
# RUN SERVER LOCALLY ONLY
# -------------------------
if __name__ == "__main__":
    # local dev only; Render will use gunicorn
    app.run(debug=True)
