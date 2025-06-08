import { ToastService } from "../components/app-toast.js"
import ApiService from "../utils/api.js"
import DragDropManager from "../utils/drag-drop-manager.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"
import StateManager from "../utils/state.js"

class DashboardPage {
  static currentView = "list" // 'list' or 'kanban'
  static dragDropManager = null
  statuses = null

  static async render() {
    const app = document.getElementById("app")
    app.innerHTML = "";

    // Main layout structure
    const layout = document.createElement("div")
    layout.className = "app-layout"

    // Sidebar navigation
    const sidebar = document.createElement("aside")
    sidebar.setAttribute("role", "navigation")
    sidebar.setAttribute("aria-label", "Main navigation")
    const navigation = document.createElement("app-navigation")
    sidebar.appendChild(navigation)

    // Main content area
    const contentLayout = document.createElement("div")
    contentLayout.className = "content-layout"

    // Header
    const header = document.createElement("header")
    header.setAttribute("role", "banner")
    header.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">Overview of your tasks and team activity</p>
                </div>
                <div class="flex items-center gap-4">
                    <app-select id="team-selector" aria-label="Select team"></app-select>
                    <app-button variant="primary" id="create-todo-btn">
                        <span aria-hidden="true">+</span>
                        Create Todo
                    </app-button>
                </div>
            </div>
        `

    // Main content
    const main = document.createElement("main")
    main.id = "main-content"
    main.setAttribute("role", "main")
    main.setAttribute("aria-label", "Dashboard content")

    // Stats section
    const statsSection = document.createElement("section")
    statsSection.setAttribute("aria-labelledby", "stats-heading")
    statsSection.innerHTML = `
            <h2 id="stats-heading" class="sr-only">Task Statistics</h2>
            <div class="grid grid-cols-4 gap-4 mb-6" id="stats-container">
                <!-- Stats cards will be rendered here -->
            </div>
        `

    // View controls section
    const controlsSection = document.createElement("section")
    controlsSection.setAttribute("aria-labelledby", "controls-heading")
    controlsSection.innerHTML = `
            <h2 id="controls-heading" class="sr-only">Task View Controls</h2>
            <div class="flex items-center justify-between mb-4">
                <div class="view-toggle" role="tablist" aria-label="View options">
                    <button type="button" 
                            class="active" 
                            id="list-view-btn"
                            role="tab"
                            aria-selected="true"
                            aria-controls="todos-container">
                        📋 List View
                    </button>
                    <button type="button" 
                            id="kanban-view-btn"
                            role="tab"
                            aria-selected="false"
                            aria-controls="todos-container">
                        📊 Kanban Board
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <app-select id="status-filter" aria-label="Filter by status">
                    </app-select>
                    <app-input 
                        type="search" 
                        placeholder="Search tasks..." 
                        id="search-input"
                        aria-label="Search tasks">
                    </app-input>
                </div>
            </div>
        `

    // Todos section
    const todosSection = document.createElement("section")
    todosSection.setAttribute("aria-labelledby", "todos-heading")
    todosSection.innerHTML = `
            <h2 id="todos-heading">Tasks</h2>
            <div id="todos-container" 
                 role="region" 
                 aria-label="Task list" 
                 aria-live="polite"
                 tabpanel>
                <!-- Todos will be rendered here -->
            </div>
        `

    main.appendChild(statsSection)
    main.appendChild(controlsSection)
    main.appendChild(todosSection)

    contentLayout.appendChild(header)
    contentLayout.appendChild(main)

    layout.appendChild(sidebar)
    layout.appendChild(contentLayout)

    app.appendChild(layout)

    // Setup event listeners and load data
    await this.setupDashboard()
  }

  static async setupDashboard() {
    // Load teams for selector
    await this.loadTeams()

    // Load statuses
    this.statuses = await this.loadStatues()

    // Load initial data
    await this.loadStats()
    await this.loadTodos()

    // Setup event listeners
    this.setupEventListeners()
  }

  static async loadStatues(){
    try {
          const response = await ApiService.get("/todoStatuses")
          console.log(response)
            const statusFilter = document.getElementById("status-filter")
            const statuses = response._embedded.todoStatuses

            const options = [{ value: "", label: "All" }]
            statuses.forEach((status) => {
              options.push({
                value: status.id.toString(),
                label: SecurityUtils.sanitizeText(status.name),
              })
            })

            statusFilter.setOptions(options)
            return statuses
        } catch (error) {
        console.log(error)
          ToastService.show("Failed to load statuses", "error")
        }
  }

  static async loadTeams() {
    try {
      const response = await ApiService.get("/teams")
        const teamSelector = document.getElementById("team-selector")
        const teams = response._embedded.teams

        const options = [{ value: "", label: "All Teams" }]
        teams.forEach((team) => {
          options.push({
            value: team.id.toString(),
            label: SecurityUtils.sanitizeText(team.name),
          })
        })

        teamSelector.setOptions(options)

        // Set current team if exists
        const currentTeam = StateManager.getState().currentTeam
        if (currentTeam) {
          teamSelector.value = currentTeam
        }
    } catch (error) {
    console.log(error)
      ToastService.show("Failed to load teams", "error")
    }
  }

  static async loadStats() {
    const container = document.getElementById("stats-container")
    container.innerHTML = `
            <article class="stats-card">
                <header>
                    <h3>Total Tasks</h3>
                </header>
                <div class="stats-value" id="total-tasks">-</div>
            </article>
            <article class="stats-card">
                <header>
                    <h3>Open Tasks</h3>
                </header>
                <div class="stats-value" id="open-tasks">-</div>
            </article>
            <article class="stats-card">
                <header>
                    <h3>In Progress</h3>
                </header>
                <div class="stats-value" id="progress-tasks">-</div>
            </article>
            <article class="stats-card">
                <header>
                    <h3>Completed</h3>
                </header>
                <div class="stats-value" id="completed-tasks">-</div>
            </article>
        `

    try {
      const response = await ApiService.get("/full-todos")
        const stats = this.calculateStats(response)

        document.getElementById("total-tasks").textContent = stats.total
        document.getElementById("open-tasks").textContent = stats.open
        document.getElementById("progress-tasks").textContent = stats.inProgress
        document.getElementById("completed-tasks").textContent = stats.completed
    } catch (error) {
      ToastService.show("Failed to load statistics", "error")
    }
  }

  static calculateStats(todos) {
    return {
      total: todos.length,
      open: todos.filter((t) => t.status.name === "Open").length,
      inProgress: todos.filter((t) => t.status.name === "In Progress").length,
      completed: todos.filter((t) => t.status.name === "Closed").length,
    }
  }

  static async loadTodos() {
    const container = document.getElementById("todos-container")
    container.innerHTML = '<div class="loading-message">Loading tasks...</div>'

    try {
      const response = await ApiService.get("/full-todos")
        this.allTodos = response
        this.renderTodos(response)
    } catch (error) {
      container.innerHTML = '<div class="error-message">Failed to load tasks</div>'
      ToastService.show("Failed to load tasks", "error")
    }
  }

  static renderTodos(todos) {
    if (this.currentView === "kanban") {
      this.renderKanbanBoard(todos)
    } else {
      this.renderListView(todos)
    }
  }

  static renderListView(todos) {
    const container = document.getElementById("todos-container")
    container.innerHTML = ""
    container.className = "todos-list-container"

    if (todos.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks found</h3>
                    <p>Create your first task to get started!</p>
                    <app-button variant="primary" onclick="DashboardPage.showCreateTodoForm()">
                        Create Task
                    </app-button>
                </div>
            `
      return
    }

    const todosList = document.createElement("div")
    todosList.className = "todos-list"
    todosList.setAttribute("role", "list")

    todos.forEach((todo) => {
      const todoCard = document.createElement("todo-card")
      todoCard.setAttribute("role", "listitem")
      todoCard.setTodo(todo)
      
      // Add event listener using multiple approaches for better reliability
      todoCard.addEventListener("todo-action", (e) => {
        console.log('Todo action event received in dashboard:', e.detail);
        this.handleTodoAction(e.detail.action, e.detail.todoId);
      });
      
      // Direct function property assignment as another approach
      todoCard.onTodoAction = (action, todoId) => {
        console.log('Direct todo action called:', action, todoId);
        this.handleTodoAction(action, todoId);
      };

      todosList.appendChild(todoCard)
    })
    
    // Add additional delegated event handler at the container level
    todosList.addEventListener('todo-action', (e) => {
      if (e.detail && e.detail.action && e.detail.todoId) {
        console.log('Delegated todo action event received:', e.detail);
        this.handleTodoAction(e.detail.action, e.detail.todoId);
      }
    });

    container.appendChild(todosList)
  }

  static renderKanbanBoard(todos) {
    const container = document.getElementById("todos-container")
    container.innerHTML = ""
    container.className = "kanban-container"

    const board = document.createElement("div")
    board.className = "kanban-board"
    board.setAttribute("role", "application")
    board.setAttribute("aria-label", "Kanban board for task management")

    const statuses = [
      { key: "Open", label: "Open", color: "var(--info-color)" },
      { key: "In Progress", label: "In Progress", color: "var(--warning-color)" },
      { key: "Completed", label: "Completed", color: "var(--success-color)" },
    ]

    statuses.forEach((status) => {
      const statusTodos = todos.filter((todo) => todo.status.name === status.label)

      const column = document.createElement("div")
      column.className = "kanban-column"
      column.dataset.status = status.key
      column.setAttribute("role", "region")
      column.setAttribute("aria-labelledby", `column-${status.key}-title`)

      const header = document.createElement("header")
      header.className = "kanban-header"
      header.innerHTML = `
                <h3 id="column-${status.key}-title" class="kanban-title">
                    <span class="status-dot" style="background-color: ${status.color};" aria-hidden="true"></span>
                    ${status.label}
                    <span class="kanban-count">${statusTodos.length}</span>
                </h3>
            `

      const body = document.createElement("div")
      body.className = "kanban-body"

      const dropZone = document.createElement("div")
      dropZone.className = "drop-zone"
      dropZone.setAttribute("role", "region")
      dropZone.setAttribute("aria-label", `${status.label} tasks drop zone`)
      dropZone.setAttribute("aria-dropeffect", "move")

      if (statusTodos.length === 0) {
        dropZone.innerHTML = `
                    <div class="empty-column">
                        No ${status.label.toLowerCase()} tasks
                    </div>
                `
      } else {
        statusTodos.forEach((todo) => {
          const todoCard = document.createElement("todo-card")
          todoCard.className = "draggable-todo"
          todoCard.setAttribute("role", "listitem")
          todoCard.setAttribute("aria-grabbed", "false")
          todoCard.setTodo(todo)

          // Enhanced event handling with multiple approaches
          todoCard.addEventListener("todo-action", (e) => {
            console.log('Kanban todo-action received:', e.detail);
            e.stopPropagation();
            this.handleTodoAction(e.detail.action, e.detail.todoId);
          });
          
          // Direct property assignment for redundancy
          todoCard.onTodoAction = (action, todoId) => {
            console.log('Direct kanban todo action called:', action, todoId);
            this.handleTodoAction(action, todoId);
          };

          todoCard.addEventListener("keyboard-select", (e) => {
            this.dragDropManager?.handleKeyboardSelect(e.detail.todoId, e.detail.status)
          })

          todoCard.addEventListener("keyboard-deselect", (e) => {
            this.dragDropManager?.handleKeyboardDeselect()
          })

          todoCard.addEventListener("keyboard-move", (e) => {
            this.dragDropManager?.handleKeyboardMove(e.detail.direction, e.detail.currentStatus)
          })

          dropZone.appendChild(todoCard)
        })
        
        // Add delegated event handler to the drop zone
        dropZone.addEventListener('todo-action', (e) => {
          if (e.detail && e.detail.action && e.detail.todoId) {
            console.log('Delegated kanban todo-action received:', e.detail);
            e.stopPropagation();
            this.handleTodoAction(e.detail.action, e.detail.todoId);
          }
        });
      }

      body.appendChild(dropZone)
      column.appendChild(header)
      column.appendChild(body)
      board.appendChild(column)
    })

    container.appendChild(board)

    // Initialize drag and drop manager
    if (this.dragDropManager) {
      this.dragDropManager.destroy()
    }

    this.dragDropManager = new DragDropManager()
    this.dragDropManager.init(board)

    // Listen for status changes from drag and drop
    board.addEventListener("todo-status-change", async (e) => {
      const { todoId, fromStatus, toStatus } = e.detail
      if(this.statuses){
            const toStatusId = this.statuses.find((status) => status.name === toStatus)
          toStatusId?.id && await this.updateTodoStatus(todoId, toStatusId)
      }

    })
  }

  static setupEventListeners() {
    // View toggle buttons
    const listViewBtn = document.getElementById("list-view-btn")
    const kanbanViewBtn = document.getElementById("kanban-view-btn")

    listViewBtn.addEventListener("click", () => {
      this.currentView = "list"
      listViewBtn.classList.add("active")
      kanbanViewBtn.classList.remove("active")
      listViewBtn.setAttribute("aria-selected", "true")
      kanbanViewBtn.setAttribute("aria-selected", "false")
      this.renderTodos(this.allTodos || [])

      if (this.dragDropManager) {
        this.dragDropManager.destroy()
        this.dragDropManager = null
      }
    })

    kanbanViewBtn.addEventListener("click", () => {
      this.currentView = "kanban"
      kanbanViewBtn.classList.add("active")
      listViewBtn.classList.remove("active")
      kanbanViewBtn.setAttribute("aria-selected", "true")
      listViewBtn.setAttribute("aria-selected", "false")
      this.renderTodos(this.allTodos || [])
    })

    // Team selector
    const teamSelector = document.getElementById("team-selector")
    if (teamSelector) {
      teamSelector.addEventListener("change", (e) => {
        console.log('Team selector changed:', e.detail);
        const selectedTeam = e.detail.value;
        StateManager.setState({ currentTeam: selectedTeam })
        this.filterTodos()
      })
    }

    // Status filter
    const statusFilter = document.getElementById("status-filter")
    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        console.log('Status filter changed:', e.detail);
        this.filterTodos()
      })
    }

    // Search input
    const searchInput = document.getElementById("search-input")
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filterTodos()
      })
    }

    // Create todo button - Enhanced debugging
    console.log("Setting up Create Todo button event listener");
    const createTodoBtn = document.getElementById("create-todo-btn")
    
    if (!createTodoBtn) {
      console.error("Create Todo button not found in DOM")
      return
    }
    
    createTodoBtn.onclick = (e) => {
      console.log("Create Todo button clicked via onclick property")
      this.showCreateTodoForm()
    }
  }

  static filterTodos() {
    if (!this.allTodos) {
      console.log('No todos to filter');
      return;
    }

    const teamSelector = document.getElementById("team-selector")
    const statusFilter = document.getElementById("status-filter")
    const searchInput = document.getElementById("search-input")

    // Get values, ensuring we handle null/undefined correctly
    const selectedTeam = teamSelector ? teamSelector.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const searchTerm = searchInput && searchInput.value ? searchInput.value.toLowerCase() : '';
    
    console.log('Filtering todos with:', { 
      selectedTeam, 
      selectedStatus,
      searchTerm,
      totalTodos: this.allTodos.length
    });

    let filtered = this.allTodos;

    if (selectedTeam) {
      filtered = filtered.filter((todo) => {
        const result = todo.team.id && todo.team.id.toString() === selectedTeam;
        return result;
      });
      console.log(`After team filter: ${filtered.length} todos`);
    }

    if (selectedStatus) {
      filtered = filtered.filter((todo) => {
        const result = todo.status.name === selectedStatus;
        return result; 
      });
      console.log(`After status filter: ${filtered.length} todos`);
    }

    if (searchTerm) {
      filtered = filtered.filter((todo) => {
        const titleMatch = todo.title && todo.title.toLowerCase().includes(searchTerm);
        const descMatch = todo.description && todo.description.toLowerCase().includes(searchTerm);
        return titleMatch || descMatch;
      });
      console.log(`After search filter: ${filtered.length} todos`);
    }

    this.renderTodos(filtered)
  }

  static async updateTodoStatus(todoId, newStatus) {
    try {
      const response = await ApiService.patch(`/todos/${todoId}`, {
        status: 'api/todoStatuses/' + newStatus.id,
      })
        // Update local data
        const todoIndex = this.allTodos.findIndex((t) => t.id === todoId)
        if (todoIndex !== -1) {
          this.allTodos[todoIndex].status.name = newStatus.name
        }

        ToastService.show("Task status updated", "success")
        await this.loadStats()

        // Re-render current view
        this.renderTodos(this.allTodos)
    } catch (error) {
      ToastService.show("Failed to update task status", "error")
      // Revert the UI change
      this.renderTodos(this.allTodos)
    }
  }

  static async handleTodoAction(action, todoId) {
    console.log(`Handling todo action: ${action} for todo ${todoId}`);
    
    if (!action || !todoId) {
      console.error('Invalid action or todoId:', { action, todoId });
      return;
    }
    
    switch (action) {
      case "edit":
        console.log(`Navigating to edit todo: ${todoId}`);
        this.showEditTodoForm(todoId);
        break;
      case "delete":
        console.log(`Showing delete confirmation for todo: ${todoId}`);
        this.showDeleteTodoConfirm(todoId);
        break;
      case "toggle-status":
        console.log(`Toggling status for todo: ${todoId}`);
        await this.toggleTodoStatus(todoId);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  static showCreateTodoForm() {
    Router.navigate("/todos/create");
  }

  static showEditTodoForm(todoId) {
    Router.navigate(`/todos/${todoId}/edit`);
  }

  static showDeleteTodoConfirm(todoId) {
    console.log(`Showing delete confirmation for todo ID: ${todoId}`);
    
    const todo = this.allTodos.find((t) => t.id === todoId);
    if (!todo) {
      console.error(`Todo with ID ${todoId} not found`);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "delete-confirm-modal";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "confirm-title");
    overlay.setAttribute("aria-describedby", "confirm-description");

    const modal = document.createElement("div");
    modal.className = "modal-content";
    modal.style.maxWidth = "400px";

    modal.innerHTML = `
            <header class="modal-header">
                <h2 id="confirm-title">Delete Task</h2>
            </header>
            <div class="modal-body">
                <p id="confirm-description">
                    Are you sure you want to delete "${SecurityUtils.sanitizeText(todo.title)}"? 
                    This action cannot be undone.
                </p>
            </div>
            <footer class="modal-footer">
                <button class="standard-button" id="cancel-delete-btn" type="button">Cancel</button>
                <button class="danger-button" id="confirm-delete-btn" type="button">Delete Task</button>
            </footer>
        `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function removeModal() {
      const modal = document.getElementById("delete-confirm-modal");
      if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }
    
    // Get direct DOM references to standard buttons instead of using custom components
    const cancelBtn = modal.querySelector("#cancel-delete-btn");
    const deleteBtn = modal.querySelector("#confirm-delete-btn");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        console.log("Cancel delete clicked");
        removeModal();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        console.log("Confirm delete clicked");
        deleteBtn.textContent = "Deleting...";
        deleteBtn.disabled = true;

        try {
          console.log(`Sending delete request for todo ${todoId}`);
          const response = await ApiService.delete(`/todos/${todoId}`);
            // Always remove the modal first
            removeModal();
            
            // Then show confirmation and reload data
            ToastService.show("Task deleted successfully", "success");
            await this.loadTodos();
            await this.loadStats();
        } catch (error) {
          console.error("Error deleting todo:", error);
          ToastService.show("Failed to delete task", "error");
          removeModal();
        }
      });
    } else {
      console.error("Delete button not found in modal");
    }

    // Focus management
    if (deleteBtn) {
      deleteBtn.focus();
    }

    // Add additional close methods
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        removeModal();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        removeModal();
      }
    });
  }

  static async toggleTodoStatus(todoId) {
    const todo = this.allTodos.find((t) => t.id === todoId)
    if (!todo) return

    const statusMap = {
      "Open": "In Progress",
      "In Progress": "Completed",
      "Completed": "Open",
    }

    if(this.statuses){
        const toStatusId = this.statuses.find((status) => status.name ===  statusMap[todo.status.name])
        toStatusId?.id && await this.updateTodoStatus(todoId, toStatusId)
      }
  }
}

// Make it globally available for inline event handlers
window.DashboardPage = DashboardPage

export default DashboardPage
