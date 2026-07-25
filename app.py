from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

DATABASE = "student.db"


# -----------------------------
# Database Connection
# -----------------------------

def get_db():

    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row

    return conn


# -----------------------------
# Create Tables
# -----------------------------

def create_tables():

    conn = get_db()

    cur = conn.cursor()

    # -----------------------------
    # Students Table
    # -----------------------------

    cur.execute("""

    CREATE TABLE IF NOT EXISTS students(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT UNIQUE,

        name TEXT,

        roll_no TEXT UNIQUE,

        department TEXT,

        year TEXT,

        gender TEXT,

        dob TEXT,

        blood_group TEXT,

        mobile TEXT,

        parent_mobile TEXT,

        email TEXT,

        address TEXT,

        student_type TEXT,

        hostel_name TEXT,

        room_no TEXT

    )

    """)
    # -----------------------------
# Page Routes
# -----------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/students")
def students():
    return render_template("students.html")


@app.route("/addstudent")
def addstudent():
    return render_template("addstudent.html")


@app.route("/reports")
def reports():
    return render_template("reports.html")


    # -----------------------------
    # Fees Table
    # -----------------------------

    cur.execute("""

    CREATE TABLE IF NOT EXISTS fees(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT,

        total_fee REAL,

        paid_fee REAL,

        pending_fee REAL,

        payment_date TEXT,

        payment_mode TEXT,

        FOREIGN KEY(student_id)

        REFERENCES students(student_id)

    )

    """)

    conn.commit()

    conn.close()


create_tables()
# ==========================================
# Student Management APIs
# Part 3
# ==========================================

# -----------------------------
# Add Student
# -----------------------------
@app.route("/api/add_student", methods=["POST"])
def add_student():

    data = request.json

    conn = get_db()
    cur = conn.cursor()

    try:

        student_id = "STU" + datetime.now().strftime("%Y%m%d%H%M%S")

        total_fee = float(data["total_fee"])
        paid_fee = float(data["paid_fee"])
        pending_fee = total_fee - paid_fee

        # Students Table
        cur.execute("""

        INSERT INTO students(

        student_id,
        name,
        roll_no,
        department,
        year,
        gender,
        dob,
        blood_group,
        mobile,
        parent_mobile,
        email,
        address,
        student_type,
        hostel_name,
        room_no

        )

        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

        """,

        (

            student_id,

            data["name"],

            data["roll_no"],

            data["department"],

            data["year"],

            data["gender"],

            data["dob"],

            data["blood_group"],

            data["mobile"],

            data["parent_mobile"],

            data["email"],

            data["address"],

            data["student_type"],

            data["hostel_name"],

            data["room_no"]

        ))

        # Fees Table
        cur.execute("""

        INSERT INTO fees(

        student_id,
        total_fee,
        paid_fee,
        pending_fee,
        payment_date,
        payment_mode

        )

        VALUES(?,?,?,?,?,?)

        """,

        (

            student_id,

            total_fee,

            paid_fee,

            pending_fee,

            data["payment_date"],

            data["payment_mode"]

        ))

        conn.commit()

        return jsonify({

            "status":"success",

            "message":"Student Added Successfully"

        })

    except Exception as e:

        return jsonify({

            "status":"error",

            "message":str(e)

        })

    finally:

        conn.close()


# -----------------------------
# View Students
# -----------------------------
@app.route("/api/students")
def get_students():

    conn = get_db()

    cur = conn.cursor()

    cur.execute("""

    SELECT

    students.*,

    fees.total_fee,

    fees.paid_fee,

    fees.pending_fee

    FROM students

    LEFT JOIN fees

    ON students.student_id = fees.student_id

    ORDER BY students.id DESC

    """)

    students = [dict(row) for row in cur.fetchall()]

    conn.close()

    return jsonify(students)
# ==========================================
# Student CRUD - Part 4
# ==========================================

# -----------------------------
# Search Student
# -----------------------------
@app.route("/api/search/<keyword>")
def search_student(keyword):

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""

    SELECT

    students.*,

    fees.total_fee,

    fees.paid_fee,

    fees.pending_fee

    FROM students

    LEFT JOIN fees

    ON students.student_id = fees.student_id

    WHERE

    students.name LIKE ?

    OR students.roll_no LIKE ?

    OR students.department LIKE ?

    """,

    (

        "%" + keyword + "%",

        "%" + keyword + "%",

        "%" + keyword + "%"

    ))

    students = [dict(row) for row in cur.fetchall()]

    conn.close()

    return jsonify(students)


# -----------------------------
# Get Single Student
# -----------------------------
@app.route("/api/student/<int:id>")
def get_student(id):

    conn = get_db()

    cur = conn.cursor()

    cur.execute("""

    SELECT

    students.*,

    fees.total_fee,

    fees.paid_fee,

    fees.pending_fee,

    fees.payment_mode,

    fees.payment_date

    FROM students

    LEFT JOIN fees

    ON students.student_id = fees.student_id

    WHERE students.id=?

    """,(id,))

    student = cur.fetchone()

    conn.close()

    return jsonify(dict(student))


# -----------------------------
# Delete Student
# -----------------------------
@app.route("/api/delete_student/<int:id>",methods=["DELETE"])
def delete_student(id):

    conn = get_db()

    cur = conn.cursor()

    cur.execute(

        "SELECT student_id FROM students WHERE id=?",

        (id,)

    )

    row = cur.fetchone()

    if row:

        sid = row["student_id"]

        cur.execute(

            "DELETE FROM fees WHERE student_id=?",

            (sid,)

        )

        cur.execute(

            "DELETE FROM students WHERE id=?",

            (id,)

        )

        conn.commit()

    conn.close()

    return jsonify({

        "message":"Student Deleted Successfully"

    })


# -----------------------------
# Update Student
# -----------------------------
@app.route("/api/update_student/<int:id>",methods=["PUT"])
def update_student(id):

    data=request.json

    conn=get_db()

    cur=conn.cursor()

    total=float(data["total_fee"])

    paid=float(data["paid_fee"])

    pending=total-paid

    cur.execute("""

    UPDATE students SET

    name=?,
    roll_no=?,
    department=?,
    year=?,
    gender=?,
    dob=?,
    blood_group=?,
    mobile=?,
    parent_mobile=?,
    email=?,
    address=?,
    student_type=?,
    hostel_name=?,
    room_no=?

    WHERE id=?

    """,

    (

        data["name"],
        data["roll_no"],
        data["department"],
        data["year"],
        data["gender"],
        data["dob"],
        data["blood_group"],
        data["mobile"],
        data["parent_mobile"],
        data["email"],
        data["address"],
        data["student_type"],
        data["hostel_name"],
        data["room_no"],
        id

    ))

    cur.execute("""

    UPDATE fees

    SET

    total_fee=?,

    paid_fee=?,

    pending_fee=?,

    payment_date=?,

    payment_mode=?

    WHERE student_id=?

    """,

    (

        total,

        paid,

        pending,

        data["payment_date"],

        data["payment_mode"],

        data["student_id"]

    ))

    conn.commit()

    conn.close()

    return jsonify({

        "message":"Student Updated Successfully"

    })


# -----------------------------
# Dashboard API
# -----------------------------
@app.route("/api/dashboard")
def dashboard_api():

    conn=get_db()

    cur=conn.cursor()

    cur.execute("SELECT COUNT(*) FROM students")
    total_students=cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM students WHERE gender='Male'")
    boys=cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM students WHERE gender='Female'")
    girls=cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM students WHERE student_type='Hosteller'")
    hostellers=cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM students WHERE student_type='Day Scholar'")
    day_scholars=cur.fetchone()[0]

    cur.execute("SELECT IFNULL(SUM(total_fee),0) FROM fees")
    total_fees=cur.fetchone()[0]

    cur.execute("SELECT IFNULL(SUM(paid_fee),0) FROM fees")
    collected=cur.fetchone()[0]

    cur.execute("SELECT IFNULL(SUM(pending_fee),0) FROM fees")
    pending=cur.fetchone()[0]

    conn.close()

    return jsonify({

        "totalStudents":total_students,

        "boys":boys,

        "girls":girls,

        "hostellers":hostellers,

        "dayScholars":day_scholars,

        "totalFees":total_fees,

        "feesCollected":collected,

        "pendingFees":pending

    })
# -----------------------------
# Run Flask App
# -----------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
