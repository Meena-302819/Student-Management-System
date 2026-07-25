/* =====================================================
   STUDENT MANAGEMENT SYSTEM
   script.js (Part 1)
===================================================== */

// ----------------------------
// Login
// ----------------------------
function login() {

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const message = document.getElementById("message");

    if (username === "admin" && password === "admin123") {
        window.location.href = "/dashboard";
    } else {
        if (message) {
            message.innerHTML = "❌ Invalid Username or Password";
            message.style.color = "red";
        }
    }
}


// ----------------------------
// Student Type
// ----------------------------
function toggleStudentType() {

    const type = document.getElementById("student_type")?.value;
    const hostelFields = document.getElementById("hostelFields");

    if (!hostelFields) return;

    if (type === "Hosteller") {
        hostelFields.style.display = "block";
    } else {
        hostelFields.style.display = "none";
    }

}


// ----------------------------
// Calculate Pending Fee
// ----------------------------
function calculatePending() {

    let total = parseFloat(document.getElementById("total_fee")?.value) || 0;
    let paid = parseFloat(document.getElementById("paid_fee")?.value) || 0;

    let pending = total - paid;

    if (pending < 0)
        pending = 0;

    const pendingBox = document.getElementById("pending_fee");

    if (pendingBox)
        pendingBox.value = pending;

}


// ----------------------------
// Save Student
// ----------------------------
async function saveStudent() {

    const data = {

        name: document.getElementById("name").value,
        roll_no: document.getElementById("roll_no").value,
        department: document.getElementById("department").value,
        year: document.getElementById("year").value,
        gender: document.getElementById("gender").value,
        dob: document.getElementById("dob").value,
        blood_group: document.getElementById("blood_group").value,
        mobile: document.getElementById("mobile").value,
        parent_mobile: document.getElementById("parent_mobile").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        student_type: document.getElementById("student_type").value,
        hostel_name: document.getElementById("hostel_name").value,
        room_no: document.getElementById("room_no").value,

        total_fee: document.getElementById("total_fee").value,
        paid_fee: document.getElementById("paid_fee").value,
        payment_date: document.getElementById("payment_date").value,
        payment_mode: document.getElementById("payment_mode").value

    };

    try {

        const response = await fetch("/api/add_student", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });

        const result = await response.json();

        alert(result.message);

        if (result.status === "success") {

            document.getElementById("studentForm").reset();

            const pendingBox = document.getElementById("pending_fee");

            if (pendingBox)
                pendingBox.value = "";

            toggleStudentType();

        }

    } catch (err) {

        alert("Error : " + err);

    }

}
/* =====================================================
   script.js (Part 2)
   Dashboard + Students + Reports
===================================================== */

// ----------------------------
// Dashboard
// ----------------------------
async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");
        const data = await response.json();

        if (document.getElementById("totalStudents"))
            document.getElementById("totalStudents").innerHTML = data.totalStudents;

        if (document.getElementById("boys"))
            document.getElementById("boys").innerHTML = data.boys;

        if (document.getElementById("girls"))
            document.getElementById("girls").innerHTML = data.girls;

        if (document.getElementById("hostellers"))
            document.getElementById("hostellers").innerHTML = data.hostellers;

        if (document.getElementById("dayScholars"))
            document.getElementById("dayScholars").innerHTML = data.dayScholars;

        if (document.getElementById("totalFees"))
            document.getElementById("totalFees").innerHTML = "₹" + data.totalFees;

        if (document.getElementById("feesCollected"))
            document.getElementById("feesCollected").innerHTML = "₹" + data.feesCollected;

        if (document.getElementById("pendingFees"))
            document.getElementById("pendingFees").innerHTML = "₹" + data.pendingFees;

    }

    catch (err) {

        console.log(err);

    }

}

// ----------------------------
// Load Students
// ----------------------------
async function loadStudents() {

    const response = await fetch("/api/students");
    const students = await response.json();

    let table =
        document.getElementById("studentTable") ||
        document.getElementById("reportTable");

    if (!table) return;

    table.innerHTML = "";

    students.forEach(student => {

        let status =
            Number(student.pending_fee) === 0
            ? "<span class='paid'>Paid</span>"
            : "<span class='pending'>Pending</span>";

        table.innerHTML += `

<tr>

<td>${student.student_id}</td>

<td>${student.name}</td>

<td>${student.roll_no}</td>

<td>${student.department}</td>

<td>${student.year}</td>

<td>${student.gender}</td>

<td>${student.student_type}</td>

<td>₹${student.total_fee}</td>

<td>₹${student.paid_fee}</td>

<td>₹${student.pending_fee}</td>

<td>${status}</td>

<td>

<button class="edit-btn"
onclick="editStudent(${student.id})">

Edit

</button>

<button class="delete-btn"
onclick="deleteStudent(${student.id})">

Delete

</button>

</td>

</tr>

`;

    });

}

// ----------------------------
// Recent Students
// ----------------------------
async function loadRecentStudents() {

    const tbody = document.getElementById("recentStudents");

    if (!tbody) return;

    const response = await fetch("/api/students");
    const students = await response.json();

    tbody.innerHTML = "";

    students.slice(0, 5).forEach(student => {

        tbody.innerHTML += `

<tr>

<td>${student.student_id}</td>

<td>${student.name}</td>

<td>${student.roll_no}</td>

<td>${student.department}</td>

<td>${student.year}</td>

<td>${student.student_type}</td>

</tr>

`;

    });

}

// ----------------------------
// Auto Load
// ----------------------------
window.addEventListener("load", () => {

    loadDashboard();

    loadStudents();

    loadRecentStudents();

});
/* =====================================================
   script.js (Part 3)
   Search + Edit + Delete + Refresh
===================================================== */
// ----------------------------
// Search Student
// ----------------------------
async function searchStudent() {

    const keyword =
        document.getElementById("search")?.value.trim() ||
        document.getElementById("searchStudent")?.value.trim() ||
        "";

    // Dashboard Recent Students Table
    const recentTable = document.getElementById("recentStudents");

    if (recentTable) {

        // Search box empty -> load recent students
        if (keyword === "") {
            loadRecentStudents();
            return;
        }

        const response = await fetch("/api/search/" + encodeURIComponent(keyword));
        const students = await response.json();

        recentTable.innerHTML = "";

        if (students.length === 0) {
            recentTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:red;">
                    No Student Found
                </td>
            </tr>`;
            return;
        }

        students.forEach(student => {

            recentTable.innerHTML += `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.roll_no}</td>
                <td>${student.department}</td>
                <td>${student.year}</td>
                <td>${student.student_type}</td>
            </tr>
            `;

        });

        return;
    }

    // Students / Reports Page
    if (keyword === "") {
        loadStudents();
        return;
    }

    const response = await fetch("/api/search/" + encodeURIComponent(keyword));
    const students = await response.json();

    const table =
        document.getElementById("studentTable") ||
        document.getElementById("reportTable");

    if (!table) return;

    table.innerHTML = "";

    students.forEach(student => {

        const status =
            Number(student.pending_fee) === 0
                ? "<span class='paid'>Paid</span>"
                : "<span class='pending'>Pending</span>";

        table.innerHTML += `
        <tr>
            <td>${student.student_id}</td>
            <td>${student.name}</td>
            <td>${student.roll_no}</td>
            <td>${student.department}</td>
            <td>${student.year}</td>
            <td>${student.gender}</td>
            <td>${student.student_type}</td>
            <td>₹${student.total_fee}</td>
            <td>₹${student.paid_fee}</td>
            <td>₹${student.pending_fee}</td>
            <td>${status}</td>
            <td>
                <button class="edit-btn" onclick="editStudent(${student.id})">
                    Edit
                </button>

                <button class="delete-btn" onclick="deleteStudent(${student.id})">
                    Delete
                </button>
            </td>
        </tr>
        `;
    });

}
// ----------------------------
// Delete Student
// ----------------------------
async function deleteStudent(id) {

    if (!confirm("Are you sure you want to delete this student?"))
        return;

    const response = await fetch("/api/delete_student/" + id, {
        method: "DELETE"
    });

    const result = await response.json();

    alert(result.message);

    loadStudents();
    loadDashboard();
    loadRecentStudents();

}

// ----------------------------
// Edit Student
// ----------------------------
async function editStudent(id) {

    const response = await fetch("/api/student/" + id);
    const student = await response.json();

    localStorage.setItem("editStudent", JSON.stringify(student));

    window.location.href = "/addstudent";

}

// ----------------------------
// Refresh Students
// ----------------------------
function refreshStudents() {

    const searchBox = document.getElementById("search");

    if (searchBox)
        searchBox.value = "";

    loadStudents();

}
/* =====================================================
   script.js (Part 4 - Final)
   Update + Edit + Export + Logout
===================================================== */

// ----------------------------
// Auto Fill Edit Form
// ----------------------------
window.addEventListener("load", () => {

    const student = JSON.parse(localStorage.getItem("editStudent"));

    if (!student) return;

    if (!document.getElementById("name")) return;

    document.getElementById("name").value = student.name;
    document.getElementById("roll_no").value = student.roll_no;
    document.getElementById("department").value = student.department;
    document.getElementById("year").value = student.year;
    document.getElementById("gender").value = student.gender;
    document.getElementById("dob").value = student.dob;
    document.getElementById("blood_group").value = student.blood_group;
    document.getElementById("mobile").value = student.mobile;
    document.getElementById("parent_mobile").value = student.parent_mobile;
    document.getElementById("email").value = student.email;
    document.getElementById("address").value = student.address;
    document.getElementById("student_type").value = student.student_type;
    document.getElementById("hostel_name").value = student.hostel_name;
    document.getElementById("room_no").value = student.room_no;

    document.getElementById("total_fee").value = student.total_fee;
    document.getElementById("paid_fee").value = student.paid_fee;
    document.getElementById("pending_fee").value = student.pending_fee;
    document.getElementById("payment_date").value = student.payment_date;
    document.getElementById("payment_mode").value = student.payment_mode;

    toggleStudentType();

    const saveBtn = document.querySelector(".buttons button");

    if (saveBtn) {
        saveBtn.innerHTML = "Update Student";
        saveBtn.onclick = () => updateStudent(student.id, student.student_id);
    }

});

// ----------------------------
// Update Student
// ----------------------------
async function updateStudent(id, studentId) {

    const data = {

        student_id: studentId,

        name: document.getElementById("name").value,
        roll_no: document.getElementById("roll_no").value,
        department: document.getElementById("department").value,
        year: document.getElementById("year").value,
        gender: document.getElementById("gender").value,
        dob: document.getElementById("dob").value,
        blood_group: document.getElementById("blood_group").value,
        mobile: document.getElementById("mobile").value,
        parent_mobile: document.getElementById("parent_mobile").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        student_type: document.getElementById("student_type").value,
        hostel_name: document.getElementById("hostel_name").value,
        room_no: document.getElementById("room_no").value,

        total_fee: document.getElementById("total_fee").value,
        paid_fee: document.getElementById("paid_fee").value,
        payment_date: document.getElementById("payment_date").value,
        payment_mode: document.getElementById("payment_mode").value

    };

    const response = await fetch("/api/update_student/" + id, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)

    });

    const result = await response.json();

    alert(result.message);

    localStorage.removeItem("editStudent");

    window.location.href = "/students";

}

// ----------------------------
// Export Excel
// ----------------------------
function exportExcel() {

    alert("Excel Export feature will be connected in backend.");

}

// ----------------------------
// Export PDF
// ----------------------------
function exportPDF() {

    window.print();

}

// ----------------------------
// Logout
// ----------------------------
function logout() {

    localStorage.removeItem("editStudent");

    window.location.href = "/";

}