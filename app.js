const STORAGE_KEY = 'todo.tasks.v1';

const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const clearCompletedButton = document.getElementById('clear-completed');

let tasks = loadTasks();

renderTasks();
updateCounter();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value);
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
  updateCounter();
});

function addTask(rawText) {
  const text = rawText.trim();
  if (!text) {
    taskInput.value = '';
    return;
  }

  tasks.push({
    id: generateTaskId(),
    text,
    completed: false,
  });

  taskInput.value = '';
  saveTasks();
  renderTasks();
  updateCounter();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
  updateCounter();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
  updateCounter();
}

function renderTasks() {
  taskList.textContent = '';

  tasks.forEach((task) => {
    const listItem = document.createElement('li');
    listItem.className = `task-item${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute(
      'aria-label',
      task.completed ? `Mark "${task.text}" as incomplete` : `Mark "${task.text}" as complete`
    );
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete "${task.text}"`);
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    listItem.append(checkbox, text, deleteButton);
    taskList.appendChild(listItem);
  });
}

function updateCounter() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  taskCounter.textContent = `${total} total · ${completed} completed`;
}

function generateTaskId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Keep the app usable even when storage is unavailable.
  }
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) {
      return [];
    }

    const parsed = JSON.parse(savedTasks);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (task) =>
        task &&
        typeof task.id === 'string' &&
        typeof task.text === 'string' &&
        typeof task.completed === 'boolean'
    );
  } catch {
    return [];
  }
}
