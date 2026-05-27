const API = "";



async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }

    try {

        const res = await fetch(`${API}/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await res.json();

        if (res.ok) {

            localStorage.setItem("username", data.username);

            window.location.href = "/dashboard";

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

        alert("Login failed");

    }

}




async function register() {

    const username = document.getElementById("username").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!username || !email || !password || !confirmPassword) {

        alert("Please fill all fields");
        return;

    }

    if (password !== confirmPassword) {

        alert("Passwords do not match");
        return;

    }

    try {

        const res = await fetch(`${API}/api/register`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const data = await res.json();

        if (res.ok) {

            alert("Registration successful");

            window.location.href = "/login-page";

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

        alert("Registration failed");

    }

}




async function logout() {

    await fetch(`${API}/logout`, {
        credentials: "include"
    });

    localStorage.removeItem("username");

    window.location.href = "/login-page";

}



let editingExpenseId = null;
const expenseForm = document.getElementById("expenseForm");

if (expenseForm) {

    expenseForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const title = document.getElementById("title").value;
        const amount = document.getElementById("amount").value;
        const category = document.getElementById("category").value;
        const date = document.getElementById("date").value;
        const note = document.getElementById("note").value;

        if (!title || !amount || !date) {

            alert("Please fill required fields");
            return;

        }

        try {

            const url = editingExpenseId
                ? `${API}/expenses/${editingExpenseId}`
                : `${API}/expenses`;

            const method = editingExpenseId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    amount,
                    category,
                    date,
                    note
                })
            });

            const data = await res.json();

            if (res.ok) {

                if(editingExpenseId) {

                    alert("Expense Updated Successfully");
                
                } else {

                    alert("Expense Added Successfully");

            } 

            expenseForm.reset();

            editingExpenseId = null;
            
            document.querySelector("#expenseForm button").innerText = "Save Expense";

            loadExpenses();

            loadSummary();

            }

        } catch (err) {

            console.log(err);

            alert("Error saving expense");

        }

    });

}




async function loadExpenses() {

    const table = document.getElementById("expenseTable");

    if (!table) return;

    try {

        const res = await fetch(`${API}/expenses`, {
            credentials: "include"
        });

        const expenses = await res.json();

        table.innerHTML = "";

        expenses.forEach(exp => {

            const formattedDate =
                new Date(exp.date).toISOString().split("T")[0];

            table.innerHTML += `
                <tr>
                    <td><b>${exp.title}</b></td>
                    <td>₹${exp.amount}</td>
                    <td>${exp.category}</td>
                    <td>${exp.date}</td>

                    <td class="action-buttons">

                        <button 
                            class="edit-btn"
                            onclick="editExpense(
                                ${exp.id},
                                '${exp.title}',
                                '${exp.amount}',
                                '${exp.category}',
                                '${formattedDate}',
                                \`${exp.note || ""}\`
                            )">
                            Edit
                        </button>

                        <button 
                            class="delete-btn"
                            onclick="deleteExpense(${exp.id})">
                            Delete
                        </button>

                    </td>
                </tr>
            `;

        });

    } catch (err) {

        console.log(err);

    }

}




async function deleteExpense(id) {

    const confirmDelete = confirm("Delete this expense?");

    if (!confirmDelete) return;

    try {

        const res = await fetch(`${API}/expenses/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {

            alert("Expense Deleted Successfully");

            loadExpenses();

            loadSummary();

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

        alert("Delete failed");

    }

}


function editExpense(id, title, amount, category, date, note) {

    document.getElementById("title").value = title;

    document.getElementById("amount").value = amount;

    document.getElementById("category").value = category;

    document.getElementById("date").value = date;

    document.getElementById("note").value = note;

    editingExpenseId = id;

    document.querySelector("#expenseForm button").innerText =
        "Update Expense";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}




async function loadSummary() {

    const totalSpent = document.getElementById("totalSpent");
    const expenseCount = document.getElementById("expenseCount");
    const highestExpense = document.getElementById("highestExpense");
    const categoryBreakdown = document.getElementById("categoryBreakdown");
    const welcome = document.getElementById("welcome");

    if (!totalSpent) return;

    try {

        const res = await fetch(`${API}/expenses/summary`, {
            credentials: "include"
        });

        const data = await res.json();

        welcome.innerText =
            "Welcome " + localStorage.getItem("username");

        totalSpent.innerText =
            "₹" + data.total_spent;

        expenseCount.innerText =
            data.expense_count;

        highestExpense.innerText =
            "₹" + data.highest_expense;

        categoryBreakdown.innerHTML = "<h3>Category Breakdown</h3>";

        data.categories.forEach(cat => {

            categoryBreakdown.innerHTML += `
                <p>
                    <strong>${cat.category}:</strong> ₹${cat.total}
                </p>
            `;

        });

    } catch (err) {

        console.log(err);

    }

}



async function filterExpenses(category, fromDate, toDate) {

    let url = `${API}/expenses/filter?`;

    if (category) {

        url += `category=${category}&`;

    }

    if (fromDate && toDate) {

        url += `from=${fromDate}&to=${toDate}`;

    }

    try {

        const res = await fetch(url, {
            credentials: "include"
        });

        const expenses = await res.json();

        const table = document.getElementById("expenseTable");

        table.innerHTML = "";

        expenses.forEach(exp => {

            const formattedDate =
                new Date(exp.date).toISOString().split("T")[0];

            table.innerHTML += `
                <tr>

                    <td><b>${exp.title}</b></td>

                    <td>₹${exp.amount}</td>

                    <td>${exp.category}</td>

                    <td>${exp.date}</td>

                    <td class="action-buttons">

                        <button
                            class="edit-btn"
                            onclick="editExpense(
                                ${exp.id},
                                '${exp.title}',
                                '${exp.amount}',
                                '${exp.category}',
                                '${exp.date}',
                                \`${exp.note || ""}\`
                            )">
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteExpense(${exp.id})">
                            Delete
                        </button>

                    </td>

                </tr>
            `;

        });

    } catch (err) {

        console.log(err);

    }

}

function goToDashboard() {

    window.location.href = "/dashboard";

}


function applyFilters() {

    const category =
        document.getElementById("filterCategory").value;

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    filterExpenses(category, fromDate, toDate);

}



function resetFilters() {

    document.getElementById("filterCategory").value = "";

    document.getElementById("fromDate").value = "";

    document.getElementById("toDate").value = "";

    loadExpenses();

}

loadExpenses();

loadSummary();