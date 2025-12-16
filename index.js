// Хранилище пользователей и задач
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
let currentTaskId = null;

// Элементы DOM
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const authMessage = document.getElementById("auth-message");
const welcomeMessage = document.getElementById("welcome-message");
const logoutBtn = document.getElementById("logout-btn");
const taskForm = document.getElementById("task-form");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const cancelEditBtn = document.getElementById("cancel-edit");

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем, есть ли сохраненный пользователь
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    loginUser(savedUser);
  }

  // Обработчики событий
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    registerUser();
  });

  loginBtn.addEventListener("click", login);
  logoutBtn.addEventListener("click", logout);
  taskForm.addEventListener("submit", addTask);
  editForm.addEventListener("submit", saveTaskEdit);
  cancelEditBtn.addEventListener("click", () =>
    editModal.classList.add("hidden")
  );

  // Обработчики для вкладок
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Убираем активный класс у всех кнопок и контента
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Добавляем активный класс текущей кнопке и соответствующему контенту
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab") + "-task-tab";
      document.getElementById(tabId).classList.add("active");
    });
  });
});

// Регистрация нового пользователя
function registerUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showAuthMessage("Заполните все поля", "error");
    return;
  }

  if (users[username]) {
    showAuthMessage("Пользователь уже существует", "error");
    return;
  }

  users[username] = { password };
  tasks[username] = [];

  saveToLocalStorage();
  showAuthMessage("Регистрация успешна! Теперь войдите", "success");

  // Очищаем поля
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Вход пользователя
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showAuthMessage("Заполните все поля", "error");
    return;
  }

  const user = users[username];

  if (!user || user.password !== password) {
    showAuthMessage("Неверный логин или пароль", "error");
    return;
  }

  loginUser(username);
}

// Логика входа
function loginUser(username) {
  currentUser = username;
  localStorage.setItem("currentUser", username);

  // Показываем основное приложение
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");

  // Обновляем приветствие
  welcomeMessage.textContent = `Добро пожаловать, ${username}!`;

  // Загружаем задачи пользователя
  loadTasks();

  // Очищаем форму авторизации
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  authMessage.textContent = "";
}

// Выход
function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

// Добавление новой задачи
function addTask(e) {
  e.preventDefault();

  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-description").value.trim();
  const tags = document
    .getElementById("task-tags")
    .value.split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  if (!title) {
    alert("Введите название задачи");
    return;
  }

  const task = {
    id: Date.now(),
    title,
    description,
    tags,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks[currentUser].push(task);
  saveToLocalStorage();
  loadTasks();

  // Очищаем форму
  taskForm.reset();

  // Переключаемся на вкладку активных задач
  document.querySelector('.tab-btn[data-tab="active"]').click();
}

// Загрузка и отображение задач
function loadTasks() {
  const userTasks = tasks[currentUser] || [];

  const activeTasks = userTasks.filter((task) => !task.completed);
  const completedTasks = userTasks.filter((task) => task.completed);

  // Отображаем активные задачи
  const activeList = document.getElementById("active-tasks-list");
  activeList.innerHTML = activeTasks
    .map((task) => createTaskHTML(task))
    .join("");

  // Отображаем выполненные задачи
  const completedList = document.getElementById("completed-tasks-list");
  completedList.innerHTML = completedTasks
    .map((task) => createTaskHTML(task))
    .join("");

  // Добавляем обработчики событий для кнопок
  attachTaskEventHandlers();
}

// Создание HTML для задачи
function createTaskHTML(task) {
  const tagsHTML = task.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  return `
        <div class="task-item ${task.completed ? "completed" : ""}" data-id="${
    task.id
  }">
            <h3>${task.title}</h3>
            <p>${task.description || "Без описания"}</p>
            <div class="tags">${tagsHTML}</div>
            <div class="task-actions">
                ${
                  !task.completed
                    ? `
                    <button class="edit-btn">Редактировать</button>
                    <button class="complete-btn">Выполнено</button>
                `
                    : ""
                }
                <button class="delete-btn">Удалить</button>
            </div>
        </div>
    `;
}

// Прикрепление обработчиков событий для кнопок задач
function attachTaskEventHandlers() {
  // Кнопка "Редактировать"
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(e.target.closest(".task-item").dataset.id);
      openEditModal(taskId);
    });
  });

  // Кнопка "Выполнено"
  document.querySelectorAll(".complete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(e.target.closest(".task-item").dataset.id);
      toggleTaskCompletion(taskId);
    });
  });

  // Кнопка "Удалить"
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(e.target.closest(".task-item").dataset.id);
      deleteTask(taskId);
    });
  });
}

// Открытие модального окна для редактирования
function openEditModal(taskId) {
  const task = tasks[currentUser].find((t) => t.id === taskId);
  if (!task) return;

  currentTaskId = taskId;

  document.getElementById("edit-title").value = task.title;
  document.getElementById("edit-description").value = task.description || "";
  document.getElementById("edit-tags").value = task.tags.join(", ");

  editModal.classList.remove("hidden");
}

// Сохранение изменений задачи
function saveTaskEdit(e) {
  e.preventDefault();

  const title = document.getElementById("edit-title").value.trim();
  const description = document.getElementById("edit-description").value.trim();
  const tags = document
    .getElementById("edit-tags")
    .value.split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  if (!title) {
    alert("Введите название задачи");
    return;
  }

  const taskIndex = tasks[currentUser].findIndex((t) => t.id === currentTaskId);
  if (taskIndex !== -1) {
    tasks[currentUser][taskIndex].title = title;
    tasks[currentUser][taskIndex].description = description;
    tasks[currentUser][taskIndex].tags = tags;

    saveToLocalStorage();
    loadTasks();
  }

  editModal.classList.add("hidden");
  currentTaskId = null;
}

// Изменение статуса выполнения задачи
function toggleTaskCompletion(taskId) {
  const taskIndex = tasks[currentUser].findIndex((t) => t.id === taskId);
  if (taskIndex !== -1) {
    tasks[currentUser][taskIndex].completed = true;
    saveToLocalStorage();
    loadTasks();
  }
}

// Удаление задачи
function deleteTask(taskId) {
  if (!confirm("Удалить задачу?")) return;

  tasks[currentUser] = tasks[currentUser].filter((t) => t.id !== taskId);
  saveToLocalStorage();
  loadTasks();
}

// Сохранение данных в localStorage
function saveToLocalStorage() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Отображение сообщений об авторизации
function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.style.color = type === "error" ? "#f44336" : "#4CAF50";
}
