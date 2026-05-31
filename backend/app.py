import os, sqlite3, datetime, bcrypt, jwt
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from functools import wraps

app = Flask(__name__, static_folder=None)
CORS(app, supports_credentials=True)

JWT_SECRET    = "snorkel-auth-secret-2024"
JWT_ALGORITHM = "HS256"
DB_PATH       = os.path.join(os.path.dirname(__file__), "auth.db")
FRONTEND_OUT  = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db: db.close()

def init_db():
    with sqlite3.connect(DB_PATH) as c:
        c.execute("""CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user')""")
        c.execute("""CREATE TABLE IF NOT EXISTS audit_logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER, username TEXT,
            action TEXT NOT NULL, ip_address TEXT,
            timestamp TEXT NOT NULL)""")
        if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            h = bcrypt.hashpw(b"Admin1234!", bcrypt.gensalt()).decode()
            c.execute("INSERT INTO users(username,password,role) VALUES(?,?,?)",
                      ("admin", h, "admin"))
        c.commit()

def log_action(user_id, username, action, ip=None):
    db = get_db()
    ts = datetime.datetime.utcnow().isoformat()
    db.execute("INSERT INTO audit_logs(user_id,username,action,ip_address,timestamp)"
               " VALUES(?,?,?,?,?)", (user_id, username, action, ip, ts))
    db.commit()

def make_token(uid, username, role):
    return jwt.encode({"sub":str(uid),"username":username,"role":role,
        "exp":datetime.datetime.utcnow()+datetime.timedelta(hours=1)},
        JWT_SECRET, algorithm=JWT_ALGORITHM)

def require_auth(role=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization","")
            token = auth[7:] if auth.startswith("Bearer ") else None
            if not token:
                return jsonify({"error":"Missing token"}), 401
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            except jwt.ExpiredSignatureError:
                return jsonify({"error":"Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error":"Invalid token"}), 401
            except Exception as e:
                return jsonify({"error": str(e)}), 401
            if role and payload.get("role") != role:
                return jsonify({"error":"Forbidden"}), 403
            request.current_user = payload
            return f(*args, **kwargs)
        return wrapper
    return decorator

@app.route("/api/health")
def health(): return jsonify({"status":"ok"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json() or {}
    username, password = d.get("username","").strip(), d.get("password","")
    ip = request.remote_addr
    row = get_db().execute(
        "SELECT id,username,password,role FROM users WHERE username=?",
        (username,)).fetchone()
    if not row or not bcrypt.checkpw(password.encode(), row["password"].encode()):
        log_action(None, username, "LOGIN_FAILED", ip)
        return jsonify({"error":"Invalid credentials"}), 401
    token = make_token(row["id"], row["username"], row["role"])
    log_action(row["id"], row["username"], "LOGIN_SUCCESS", ip)
    return jsonify({"token":token,"role":row["role"],"username":row["username"]})

@app.route("/api/auth/logout", methods=["POST"])
@require_auth()
def logout():
    u = request.current_user
    log_action(u["sub"], u["username"], "LOGOUT", request.remote_addr)
    return jsonify({"message":"Logged out"})

@app.route("/api/users", methods=["GET"])
@require_auth(role="admin")
def list_users():
    rows = get_db().execute("SELECT id,username,role FROM users").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/users", methods=["POST"])
@require_auth(role="admin")
def create_user():
    d = request.get_json() or {}
    username, password, role = d.get("username","").strip(), d.get("password",""), d.get("role","user")
    if role not in ("user","admin"): return jsonify({"error":"Invalid role"}), 400
    if not username or not password: return jsonify({"error":"username and password required"}), 400
    h = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    db = get_db()
    try:
        cur = db.execute("INSERT INTO users(username,password,role) VALUES(?,?,?)", (username,h,role))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error":"Username already exists"}), 409
    u = request.current_user
    log_action(u["sub"], u["username"], "USER_CREATED", request.remote_addr)
    return jsonify({"id":cur.lastrowid,"username":username,"role":role}), 201

@app.route("/api/users/<int:uid>", methods=["DELETE"])
@require_auth(role="admin")
def delete_user(uid):
    db = get_db()
    if not db.execute("SELECT id FROM users WHERE id=?", (uid,)).fetchone():
        return jsonify({"error":"User not found"}), 404
    db.execute("DELETE FROM users WHERE id=?", (uid,)); db.commit()
    u = request.current_user
    log_action(u["sub"], u["username"], "USER_DELETED", request.remote_addr)
    return jsonify({"message":"User deleted"})
@app.route("/debug/users")
def debug_users():
    rows = get_db().execute(
        "SELECT id, username, role FROM users"
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/audit", methods=["GET"])
@require_auth(role="admin")
def audit_logs():
    rows = get_db().execute(
        "SELECT id,username,action,ip_address,timestamp FROM audit_logs ORDER BY id DESC"
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def spa(path):
    full = os.path.join(FRONTEND_OUT, path)
    if path and os.path.exists(full):
        return send_from_directory(FRONTEND_OUT, path)
    idx = os.path.join(FRONTEND_OUT, "index.html")
    if os.path.exists(idx):
        return send_from_directory(FRONTEND_OUT, "index.html")
    return jsonify({"error":"Frontend not built"}), 404

with app.app_context():
    init_db()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
