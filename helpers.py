import sqlite3

from datetime import datetime, timedelta
from flask import redirect, session
from functools import wraps


from datetime import datetime, timedelta

def calculate_streaks(dates):
    if not dates:
        return 0, 0

    # convert + sort
    dates = sorted(dates)

    # ---------- LONGEST ----------
    longest = temp = 1

    for i in range(1, len(dates)):
        if dates[i] == dates[i-1] + timedelta(days=1):
            temp += 1
        else:
            longest = max(longest, temp)
            temp = 1

    longest = max(longest, temp)

    # ---------- CURRENT ----------
    today = datetime.today().date()
    yesterday = today - timedelta(days=1)

    dates_set = set(dates)

    if today in dates_set:
        current = 1
        check = today
    elif yesterday in dates_set:
        current = 1
        check = yesterday
    else:
        return 0, longest

    while True:
        check -= timedelta(days=1)
        if check in dates_set:
            current += 1
        else:
            break

    return current, longest


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function