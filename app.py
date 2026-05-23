import os
import re

import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template, request, redirect, session, url_for
from database import db, User, Task, StreakLog, Config
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import login_required, calculate_streaks

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = os.urandom(51)

app.permanent_session_lifetime = timedelta(days=3650)

uri = os.getenv("DATABASE_URL")
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = uri

db.init_app(app)

with app.app_context():
    db.create_all()


def get_task_for_current_user(task_id):
    try:
        task_id = int(task_id)
    except (TypeError, ValueError):
        return None

    return Task.query.filter_by(id=task_id, user_id=session.get("user_id")).first()


def parse_date_value(value):
    if isinstance(value, datetime):
        return value.date()

    if not value or not str(value).strip():
        return None

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


@app.before_request
def check_user_exists():
    user_id = session.get("user_id")

    if not user_id:
        return

    user = User.query.filter_by(id=user_id).first()

    if not user:
        session.clear()
        return redirect(url_for("login"))


@app.route("/about")
def about():
    return render_template("about.html", page="about")


@app.route("/add-date", methods=["POST"])
@login_required
def add_date():
    data = request.get_json(silent=True) or {}
    date_value = data.get("date")
    task_id = data.get("task_id")

    if not task_id or str(task_id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400

    task = get_task_for_current_user(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    parsed_date = parse_date_value(date_value)
    if parsed_date is None:
        return jsonify({"error": "Invalid date format"}), 400

    try:
        streak_log = StreakLog(task_id=task.id, date=parsed_date)
        db.session.add(streak_log)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Date already exists"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to add date"}), 500

    return jsonify({"success": True})


@app.route("/add-task", methods=["POST"])
@login_required
def add_task():
    taskName = request.form.get("taskName")
    taskDescription = request.form.get("taskDescription")

    if not taskName or not taskName.strip():
        return jsonify({"error": "Task title can't be empty or just spaces"}), 400
    elif len(taskName) > 100:
        return jsonify({"error": "Task title can't be longer than 100 characters"}), 400
    
    if taskDescription and len(taskDescription) > 1000:
        return jsonify({"error": "Task description can't be longer than 1000 characters"}), 400

    next_position = (
        db.session.query(
            func.coalesce(func.max(Task.position), 0) + 1
        )
        .filter(Task.user_id == session["user_id"])
        .scalar()
    )

    task = Task(user_id=session["user_id"],
                task_name=taskName,
                position=next_position,
                description=taskDescription)
    db.session.add(task)
    db.session.commit()
    
    return jsonify({"success": True}), 200


@app.route("/delete-account", methods=["POST"])
@login_required
def delete_account():
    user_id = session["user_id"]

    tasks = Task.query.filter_by(user_id=user_id).all()

    for task in tasks:
        StreakLog.query.filter_by(task_id=task.id).delete()

    Task.query.filter_by(user_id=user_id).delete()
    User.query.filter_by(id=user_id).delete()

    db.session.commit()
    session.clear()

    return redirect("/login")


@app.route("/delete_task/<int:id>", methods=["POST"])
@login_required
def delete_task(id):
    if not id or str(id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400
    
    task = get_task_for_current_user(id)
    if not task:
        return jsonify({"error": "Invalid task_id"}), 400

    StreakLog.query.filter_by(task_id=task.id).delete()
    Task.query.filter_by(id=task.id, user_id=session["user_id"]).delete()
    db.session.commit()
    
    return redirect("/")


@app.route("/get-dates")
@login_required
def get_dates():
    task_id = request.args.get("task_id")

    if not task_id or str(task_id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400

    task = get_task_for_current_user(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    rows = StreakLog.query.filter_by(task_id=task.id).all()
    dates = [row.date for row in rows]

    return jsonify(dates)


@app.route("/get-streaks")
@login_required
def get_streaks():
    task_id = request.args.get("task_id")

    if not task_id or str(task_id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400

    task = get_task_for_current_user(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    rows = StreakLog.query.filter_by(task_id=task.id).all()
    dates = [row.date for row in rows]

    current, longest = calculate_streaks(dates)

    return jsonify({
        "current": current,
        "longest": longest
    })


@app.route("/")
@login_required
def index():
    tasks = Task.query.filter_by(user_id=session["user_id"]).order_by(Task.position).all()
    
    result = []

    tasks = list(tasks)
    sort = User.query.filter_by(id=session["user_id"]).first().sort_preference
    if not sort:
        sort = "date_asc"

    if sort == "date_desc":
        tasks.sort(key=lambda x: x.created_at, reverse=True)
    elif sort == "date_asc":
        tasks.sort(key=lambda x: x.created_at)
    elif sort == "name_asc":
        tasks.sort(key=lambda x: x.task_name.lower())
    elif sort == "name_desc":
        tasks.sort(key=lambda x: x.task_name.lower(), reverse=True)
    elif sort == "custom":
        tasks.sort(key=lambda x: x.position)

    for task in tasks:
        rows = StreakLog.query.filter_by(task_id=task.id).all()
        dates = [row.date for row in rows]
        date_strings = [d.strftime("%Y-%m-%d") for d in dates]

        current, longest = calculate_streaks(dates)

        today_str = datetime.today().strftime("%Y-%m-%d")
        is_today_done = today_str in date_strings

        if longest > 0:
            best_exists = True
        else:
            best_exists = False

        if current > 0:
            current_exists = True
        else:
            current_exists = False
        
        iso = task.created_at.isoformat() + "Z"

        result.append({
            "id": task.id,
            "task_name": task.task_name,
            "current": current,
            "longest": longest,
            "created_at": iso,
            "is_today_done": is_today_done,
            "best_exists": best_exists,
            "current_exists": current_exists,
            "position": task.position
        })

    return render_template("index.html", page="index", tasks=result, is_index_page=True, sort=sort)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username").lower()
        password = request.form.get("password")
        remember = request.form.get("remember")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        user = User.query.filter_by(username=username).first()

        if user is None or not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid username or password"}), 400
        
        session["user_id"] = user.id
        session["username"] = user.username
        session["name"] = user.name

        if remember:
            session.permanent = True
        else:
            session.permanent = False
    
        return jsonify({"success": True}), 200
    else:
        return render_template("login.html" if not session.get("user_id") else "index.html", page="login", is_auth_page=True)
    

@app.route("/logout")
@login_required
def logout():
    session.clear()
    return redirect("/login")


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    if request.method == "POST":
        name = request.form.get("name")
        username = request.form.get("username")
        currentPassword = request.form.get("current_password")
        newPassword = request.form.get("new_password")
        user = User.query.filter_by(id=session["user_id"]).first()

        if (not name and not username and not newPassword) or (name == user.name and username == user.username and 
           (not newPassword or check_password_hash(user.password, newPassword))):
           return jsonify({"success": True}), 200
        
        if name and name != user.name:
            nameWithoutSpaces = name.strip()
            if not nameWithoutSpaces:
                return jsonify({"error": "Name cannot be empty or just spaces"}), 400
            elif not currentPassword:
                return jsonify({"error": "Current password is required to make changes"}), 400
            elif not check_password_hash(user.password, currentPassword):
                return jsonify({"error": "Current password is incorrect"}), 400

            user = User.query.get(session["user_id"])
            user.name = name
            db.session.commit()
            session["name"] = name

        if username and username != user.username:
            if " " in username:
                return jsonify({"error": "Username cannot contain spaces"}), 400
            elif len(username) < 3 or len(username) > 20:
                return jsonify({"error": "Username must be between 3 and 20 characters"}), 400
            elif not re.match("^[a-zA-Z0-9_]+$", username):
                return jsonify({"error": "Username can only contain letters, numbers, and underscores"}), 400
            elif not currentPassword:
                return jsonify({"error": "Current password is required to make changes"}), 400
            elif not check_password_hash(user.password, currentPassword):
                return jsonify({"error": "Current password is incorrect"}), 400
            
            user = User.query.get(session["user_id"])
            try:
                user.username = username

                db.session.commit()

                session["username"] = username
            except Exception:
                db.session.rollback()
                return jsonify({"error": "Username already exists"}), 400
        
        if newPassword:
            if len(newPassword) < 8:
                return jsonify({"error": "New password must be at least 8 characters long"}), 400
            elif not currentPassword:
                return jsonify({"error": "Current password is required to make new changes"}), 400
            elif not check_password_hash(user.password, currentPassword):
                return jsonify({"error": "Current password is incorrect"}), 400
            
            user = User.query.filter_by(id=session["user_id"]).first()
            user.password = generate_password_hash(newPassword)
            db.session.commit()
        
        return jsonify({"success": True}), 200
    else:
        user = User.query.filter_by(id=session["user_id"]).first()
        return render_template("profile.html", page="profile", user=user, is_profile_page=True)


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        username = request.form.get("username").lower()
        password = request.form.get("password")
        nameWithoutSpaces = name.strip()

        if not name or not username or not password:
            return jsonify({"error": "All fields are required"}), 400
        elif " " in username:
            return jsonify({"error": "Username cannot contain spaces"}), 400
        elif len(username) < 3 or len(username) > 20:
            return jsonify({"error": "Username must be between 3 and 20 characters"}), 400
        elif not re.match("^[a-zA-Z0-9_]+$", username):
            return jsonify({"error": "Username can only contain letters, numbers, and underscores"}), 400
        elif len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        elif not nameWithoutSpaces:
            return jsonify({"error": "Name cannot be empty or just spaces"}), 400
        
        try:
            user = User(
                name=name,
                username=username,
                password=generate_password_hash(password)
            )

            db.session.add(user)
            db.session.commit()

        except Exception:
            db.session.rollback()
            return jsonify({"error": "Username already exists"}), 400

        session["user_id"] = user.id
        session["username"] = username
        session["name"] = name
        session.permanent = True
        
        return jsonify({"success": True}), 200
    else:
        return render_template("register.html", page="register", is_auth_page=True)
    

@app.route("/remove-date", methods=["POST"])
@login_required
def remove_date():
    data = request.get_json(silent=True) or {}
    date_value = data.get("date")
    task_id = data.get("task_id")

    if not task_id or str(task_id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400

    task = get_task_for_current_user(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    parsed_date = parse_date_value(date_value)
    if parsed_date is None:
        return jsonify({"error": "Invalid date format"}), 400

    row = StreakLog.query.filter_by(task_id=task.id, date=parsed_date).first()
    if not row:
        return jsonify({"error": "Date not found"}), 404

    try:
        db.session.delete(row)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to remove date"}), 500

    return jsonify({"success": True})


@app.route("/set-sort", methods=["POST"])
@login_required
def set_sort():
    data = request.get_json(silent=True) or {}
    sort = data.get("sort")

    if sort not in ["date_desc", "date_asc", "name_asc", "name_desc", "custom"]:
        return jsonify({"error": "Invalid sort"}), 400

    user = User.query.filter_by(id=session["user_id"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.sort_preference = sort
    db.session.commit()

    return jsonify({"success": True})


@app.route("/task/<int:task_id>")
@login_required
def task(task_id):
    if not task_id or str(task_id).strip() == "":
        return jsonify({"error": "Invalid task_id"}), 400
    
    task = Task.query.filter_by(id=task_id, user_id=session["user_id"]).first()

    if not task:
        return redirect("/")

    rows = StreakLog.query.filter_by(task_id=task.id).all()
    dates = [row.date for row in rows]
    date_strings = [d.strftime("%Y-%m-%d") for d in dates]

    current, longest = calculate_streaks(dates)
    today_str = datetime.today().strftime("%Y-%m-%d")
    is_today_done = today_str in date_strings
    iso = task.created_at.isoformat()

    return render_template(
        "task.html",
        page="task",
        task=task,
        iso=iso,
        is_task_page=True,
        current=current,
        longest=longest,
        is_today_done=is_today_done,
        initial_marked_dates=json.dumps(date_strings)
    )


@app.route("/update_description/<int:id>", methods=["POST"])
@login_required
def update_description(id):
    description = request.form.get("taskDescription")

    if description is not None and len(description) > 1000:
        return jsonify({"error": "Description can't be longer than 1000 characters"}), 400

    task = get_task_for_current_user(id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    task.description = description
    db.session.commit()

    return jsonify({"success": True, "message": "Description updated successfully!"})


@app.route("/update_task_name/<int:id>", methods=["POST"])
@login_required
def update_task_name(id):
    data = request.get_json(silent=True) or {}
    taskName = data.get("name")

    if not taskName or not taskName.strip():
        return jsonify({"error": "Task title can't be empty or just spaces"}), 400
    elif len(taskName) > 100:
        return jsonify({"error": "Task title can't be longer than 100 characters"}), 400

    task = get_task_for_current_user(id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    task.task_name = taskName
    db.session.commit()

    return jsonify({"success": True, "name": taskName})


@app.route("/update-task-order", methods=["POST"])
@login_required
def update_task_order():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"error": "Invalid payload"}), 400

    for item in data:
        task_id = item.get("id")
        position = item.get("position")
        if task_id is None or position is None:
            continue

        task = get_task_for_current_user(task_id)
        if not task:
            continue

        try:
            task.position = int(position)
        except (TypeError, ValueError):
            continue

    db.session.commit()

    return jsonify({"success": True})