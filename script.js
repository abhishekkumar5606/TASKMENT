// ===================================
// STATE MANAGEMENT
// ===================================
let tasks = [];
let currentFilter = 'all';
let currentCategory = 'all';

// DOM Elements (will be initialized after DOM loads)
let taskForm, taskInput, taskCategory, taskList, emptyState;
let totalTasksEl, completedTasksEl, pendingTasksEl, completionRateEl;
let progressFill, progressText, progressCompleted, progressRemaining;
let filterBtns, categoryBtns;

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    taskForm = document.getElementById('task-form');
    taskInput = document.getElementById('task-input');
    taskCategory = document.getElementById('task-category');
    taskList = document.getElementById('task-list');
    emptyState = document.getElementById('empty-state');

    // Statistics
    totalTasksEl = document.getElementById('total-tasks');
    completedTasksEl = document.getElementById('completed-tasks');
    pendingTasksEl = document.getElementById('pending-tasks');
    completionRateEl = document.getElementById('completion-rate');

    // Progress
    progressFill = document.getElementById('progress-fill');
    progressText = document.getElementById('progress-text');
    progressCompleted = document.getElementById('progress-completed');
    progressRemaining = document.getElementById('progress-remaining');

    // Filters
    filterBtns = document.querySelectorAll('.filter-btn');
    categoryBtns = document.querySelectorAll('.category-btn');

    // Add some sample tasks on first load (optional)
    if (tasks.length === 0 && !localStorage.getItem('taskment_tasks')) {
        tasks = [
            {
                id: Date.now() + 1,
                text: 'Welcome to Taskment! Click the checkbox to complete this task.',
                category: 'personal',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                text: 'Try adding your own tasks using the form above.',
                category: 'work',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                text: 'Drag and drop tasks to reorder them!',
                category: 'personal',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        saveTasksToStorage();
    }

    loadTasksFromStorage();
    renderTasks();
    updateStatistics();
    attachEventListeners();
});

// ===================================
// EVENT LISTENERS
// ===================================
function attachEventListeners() {
    // Form submission
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    // Category buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', handleCategoryChange);
    });

    // Event delegation for task actions (edit, delete, toggle)
    taskList.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const taskId = parseInt(target.dataset.taskId);

        if (action === 'toggle') {
            toggleTaskComplete(taskId);
        } else if (action === 'edit') {
            editTask(taskId);
        } else if (action === 'delete') {
            deleteTask(taskId);
        }
    });
}

// ===================================
// TASK MANAGEMENT
// ===================================
function handleTaskSubmit(e) {
    e.preventDefault();

    const taskText = taskInput.value.trim();
    const category = taskCategory.value;

    if (taskText === '') return;

    const newTask = {
        id: Date.now(),
        text: taskText,
        category: category,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasksToStorage();
    renderTasks();
    updateStatistics();

    // Reset form
    taskInput.value = '';
    taskInput.focus();

    // Add animation
    animateTaskAddition();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
        updateStatistics();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasksToStorage();
        renderTasks();
    }
}

// ===================================
// FILTERING
// ===================================
function handleFilterChange(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

function handleCategoryChange(e) {
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.category;
    renderTasks();
}

function getFilteredTasks() {
    let filtered = [...tasks];

    // Filter by status
    if (currentFilter === 'active') {
        filtered = filtered.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.completed);
    }

    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(task => task.category === currentCategory);
    }

    return filtered;
}

// ===================================
// RENDERING
// ===================================
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    // Show/hide empty state
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        // Remove all task cards
        const taskCards = taskList.querySelectorAll('.task-card');
        taskCards.forEach(card => card.remove());
        return;
    } else {
        emptyState.style.display = 'none';
    }

    // Clear existing tasks
    const taskCards = taskList.querySelectorAll('.task-card');
    taskCards.forEach(card => card.remove());

    // Render filtered tasks
    filteredTasks.forEach((task, index) => {
        const taskCard = createTaskCard(task, index);
        taskList.appendChild(taskCard);
    });

    // Attach drag and drop
    attachDragAndDrop();
}

function createTaskCard(task, index) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.id;
    card.draggable = true;
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
        <div class="task-checkbox" data-action="toggle" data-task-id="${task.id}"></div>
        <div class="task-content">
            <div class="task-text">${escapeHtml(task.text)}</div>
            <div class="task-meta">
                <span class="task-category-badge ${task.category}">${getCategoryIcon(task.category)} ${task.category}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-action-btn edit" data-action="edit" data-task-id="${task.id}" title="Edit task">✏️</button>
            <button class="task-action-btn delete" data-action="delete" data-task-id="${task.id}" title="Delete task">🗑️</button>
        </div>
    `;

    return card;
}

function getCategoryIcon(category) {
    const icons = {
        work: '💼',
        personal: '🏠',
        shopping: '🛒',
        health: '💪'
    };
    return icons[category] || '📋';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// STATISTICS
// ===================================
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update stats
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    completionRateEl.textContent = `${completionRate}%`;

    // Update progress bar
    progressFill.style.width = `${completionRate}%`;
    progressText.textContent = `${completionRate}% Complete`;
    progressCompleted.textContent = completed;
    progressRemaining.textContent = pending;

    // Animate numbers
    animateValue(totalTasksEl, 0, total, 500);
    animateValue(completedTasksEl, 0, completed, 500);
    animateValue(pendingTasksEl, 0, pending, 500);
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ===================================
// LOCAL STORAGE
// ===================================
function saveTasksToStorage() {
    localStorage.setItem('taskment_tasks', JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const stored = localStorage.getItem('taskment_tasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

// ===================================
// DRAG AND DROP
// ===================================
let draggedElement = null;

function attachDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');

    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');

    // Remove all drag-over classes
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== this) {
        // Get task IDs
        const draggedId = parseInt(draggedElement.dataset.taskId);
        const targetId = parseInt(this.dataset.taskId);

        // Find indices
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        // Reorder tasks
        const [removed] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, removed);

        // Save and re-render
        saveTasksToStorage();
        renderTasks();
    }

    return false;
}

// ===================================
// ANIMATIONS
// ===================================
function animateTaskAddition() {
    const firstCard = taskList.querySelector('.task-card');
    if (firstCard) {
        firstCard.style.animation = 'none';
        setTimeout(() => {
            firstCard.style.animation = 'slideIn 0.5s ease';
        }, 10);
    }
}
