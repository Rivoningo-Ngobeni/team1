import AuthService from "../utils/auth.js"
import PermissionService from "../utils/permissions.js"
import SecurityUtils from "../utils/security.js"
import BaseComponent from "./base-component.js"

const statusMap = {
  open: "Start Work",
  in_progress: "Complete",
  closed: "Reopen",
}

class TodoCard extends BaseComponent {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.isDragging = false
    this.keyboardMode = false
  }

  setTodo(todo) {
    this.todo = todo
    this.render()
  }

  async render() {
    if (!this.todo) return

    const currentUser = AuthService.getCurrentUser()
    const canEdit = await PermissionService.canEditTodo(this.todo, currentUser?.id)
    
    // Only make draggable in kanban view (check if it has the draggable-todo class)
    const isKanbanView = this.classList.contains('draggable-todo')

    const statusColors = {
      open: "var(--info-color)",
      in_progress: "var(--warning-color)",
      closed: "var(--success-color)",
    }

    const dueDate = this.todo.dueDate ? new Date(this.todo.dueDate) : null
    const isOverdue = dueDate && dueDate < new Date() && this.todo.status.name !== "closed"

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .todo-card {
                    background: var(--surface-color);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    padding: var(--spacing-lg);
                    transition: all 0.2s;
                    border-left: 4px solid ${statusColors[this.todo.status_name]};
                    position: relative;
                    cursor: grab;
                    margin-block: var(--spacing-md);
                }
                
                .todo-card:hover {
                    box-shadow: var(--shadow-lg);
                }
                
                .todo-card.overdue {
                    border-left-color: var(--error-color);
                }
                
                .todo-card.dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                    cursor: grabbing;
                    z-index: 1000;
                }
                
                .todo-card:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .drag-handle {
                    position: absolute;
                    top: var(--spacing-sm);
                    right: var(--spacing-sm);
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--background-color);
                    border-radius: var(--border-radius-sm);
                    cursor: grab;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .todo-card:hover .drag-handle,
                .todo-card:focus .drag-handle {
                    opacity: 1;
                }
                
                .drag-handle:active {
                    cursor: grabbing;
                }
                
                .todo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: var(--spacing-md);
                    padding-right: var(--spacing-xl);
                }
                
                .todo-title {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                    flex: 1;
                    margin-right: var(--spacing-md);
                }
                
                .todo-status {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 9999px;
                    font-size: var(--font-size-xs);
                    font-weight: 500;
                    background-color: rgba(37, 99, 235, 0.1);
                    color: ${statusColors[this.todo.status_name]};
                    text-transform: capitalize;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: currentColor;
                }
                
                .todo-description {
                    color: var(--text-secondary);
                    margin-bottom: var(--spacing-md);
                    line-height: 1.5;
                }
                
                .todo-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                    font-size: var(--font-size-sm);
                    color: var(--text-secondary);
                }
                
                .todo-assignee {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                
                .todo-due-date {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                }
                
                .todo-due-date.overdue {
                    color: var(--error-color);
                    font-weight: 500;
                }
                
                .todo-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                    flex-wrap: wrap;
                }
                
                .action-btn {
                    background: none;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-sm);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    transition: all 0.2s;
                    color: var(--text-secondary);
                }
                
                .action-btn:hover {
                    background-color: var(--background-color);
                    color: var(--text-primary);
                }
                
                .action-btn:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .action-btn.primary {
                    background-color: var(--primary-color);
                    color: var(--text-on-primary);
                    border-color: var(--primary-color);
                }
                
                .action-btn.primary:hover {
                    background-color: var(--primary-hover);
                }
                
                /* Specific status button colors */
                .action-btn[data-action="toggle-status"].open {
                    background-color: var(--info-color);
                    color: var(--text-on-primary);
                    border-color: var(--info-color);
                }
                
                .action-btn[data-action="toggle-status"].in_progress {
                    background-color: var(--success-color);
                    color: var(--text-on-primary);
                    border-color: var(--success-color);
                }
                
                .action-btn[data-action="toggle-status"].closed {
                    background-color: var(--info-color);
                    color: var(--text-on-primary);
                    border-color: var(--info-color);
                }
                
                .action-btn.danger {
                    color: var(--error-color);
                    border-color: var(--error-color);
                }
                
                .action-btn.danger:hover {
                    background-color: var(--error-color);
                    color: white;
                }
                
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                
                .keyboard-hint {
                    position: absolute;
                    bottom: var(--spacing-sm);
                    left: var(--spacing-sm);
                    font-size: var(--font-size-xs);
                    color: var(--text-secondary);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .todo-card:focus .keyboard-hint {
                    opacity: 1;
                }
                
                @media (max-width: 768px) {
                    .drag-handle {
                        opacity: 1;
                        position: static;
                        margin-left: auto;
                    }
                    
                    .todo-header {
                        padding-right: 0;
                    }
                }
            </style>
            <article class="todo-card ${isOverdue ? "overdue" : ""}" 
                     role="article" 
                     tabindex="0"
                     draggable="${canEdit && isKanbanView}"
                     aria-labelledby="todo-title-${this.todo.id}"
                     aria-describedby="todo-description-${this.todo.id}"
                     data-todo-id="${this.todo.id}"
                     data-status="${this.todo.status_name}">
                
                ${
                  canEdit && isKanbanView
                    ? `
                    <div class="drag-handle" 
                         role="button" 
                         tabindex="0"
                         aria-label="Drag to move task"
                         title="Drag to move task">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <circle cx="3" cy="3" r="1"/>
                            <circle cx="9" cy="3" r="1"/>
                            <circle cx="3" cy="6" r="1"/>
                            <circle cx="9" cy="6" r="1"/>
                            <circle cx="3" cy="9" r="1"/>
                            <circle cx="9" cy="9" r="1"/>
                        </svg>
                    </div>
                `
                    : ""
                }
                
                <header class="todo-header">
                    <h3 id="todo-title-${this.todo.id}" class="todo-title">
                        ${SecurityUtils.sanitizeText(this.todo.title)}
                    </h3>
                    <div class="todo-status" role="status" aria-label="Task status: ${SecurityUtils.sanitizeText(this.todo.status.name)}">
                        <span class="status-dot" aria-hidden="true"></span>
                        ${SecurityUtils.sanitizeText(this.todo.status.name)}
                    </div>
                </header>
                
                <div id="todo-description-${this.todo.id}" class="todo-description">
                    ${SecurityUtils.sanitizeText(this.todo.description || "No description provided")}
                </div>
                
                <div class="todo-meta">
                    <div>
                        Assigned to: <span class="todo-assignee">${SecurityUtils.sanitizeText(this.todo.assignedTo?.username || "Unassigned")}</span>
                    </div>
                    ${
                      dueDate
                        ? `<div class="todo-due-date ${isOverdue ? "overdue" : ""}" 
                               role="status" 
                               aria-label="${isOverdue ? "Overdue" : "Due date"}">
                               <span aria-hidden="true">📅</span>
                               Due: ${dueDate.toLocaleDateString()}
                               ${isOverdue ? '<span class="sr-only">(Overdue)</span>' : ""}
                           </div>`
                        : ""
                    }
                </div>
                ${
                  canEdit
                    ? `<footer class="todo-actions">
                        <button class="action-btn primary ${SecurityUtils.sanitizeText(this.todo.status.name)}" 
                                data-action="toggle-status" 
                                aria-label="Change status to ${SecurityUtils.sanitizeText(this.todo.status.name) || "next status"}">
                            ${SecurityUtils.sanitizeText(this.getStatusButtonText())}
                        </button>
                        <button class="action-btn" 
                                data-action="edit"
                                aria-label="Edit task">
                            Edit
                        </button>
                        <button class="action-btn danger" 
                                data-action="delete"
                                aria-label="Delete task">
                            Delete
                        </button>
                    </footer>`
                    : ""
                }
            </article>
        `

    this.setupDragAndDrop()
    this.setupKeyboardNavigation()
    this.setupActionHandlers()
  }

  setupDragAndDrop() {
    const card = this.shadowRoot.querySelector(".todo-card")
    if (!card) return

    // Mouse/touch drag events
    card.addEventListener("dragstart", (e) => {
      this.isDragging = true
      card.classList.add("dragging")

      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          todoId: this.todo.id,
          currentStatus: this.todo.status.name,
        }),
      )

      // Create custom drag image
      const dragImage = card.cloneNode(true)
      dragImage.style.transform = "rotate(5deg)"
      dragImage.style.opacity = "0.8"
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY)

      setTimeout(() => document.body.removeChild(dragImage), 0)

      this.emit("drag-start", { todoId: this.todo.id, status: this.todo.status.name })
    })

    card.addEventListener("dragend", (e) => {
      this.isDragging = false
      card.classList.remove("dragging")
      this.emit("drag-end", { todoId: this.todo.id })
    })

    // Prevent default drag behavior on action buttons
    this.shadowRoot.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("dragstart", (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
    })
  }

  setupKeyboardNavigation() {
    const card = this.shadowRoot.querySelector(".todo-card")
    if (!card) return

    card.addEventListener("keydown", (e) => {
      if (!card.hasAttribute("draggable") || card.getAttribute("draggable") === "false") return

      switch (e.key) {
        case " ":
          e.preventDefault()
          this.keyboardMode = !this.keyboardMode
          if (this.keyboardMode) {
            card.setAttribute("aria-grabbed", "true")
            this.emit("keyboard-select", { todoId: this.todo.id, status: this.todo.status.name })
          } else {
            card.setAttribute("aria-grabbed", "false")
            this.emit("keyboard-deselect", { todoId: this.todo.id })
          }
          break

        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          if (this.keyboardMode) {
            e.preventDefault()
            this.emit("keyboard-move", {
              todoId: this.todo.id,
              direction: e.key.replace("Arrow", "").toLowerCase(),
              currentStatus: this.todo.status.name,
            })
          }
          break

        case "Escape":
          if (this.keyboardMode) {
            e.preventDefault()
            this.keyboardMode = false
            card.setAttribute("aria-grabbed", "false")
            this.emit("keyboard-deselect", { todoId: this.todo.id })
          }
          break
      }
    })
  }

  setupActionHandlers() {
    // Add action handlers for buttons with improved event handling
    const actionButtons = this.shadowRoot.querySelectorAll(".action-btn");
    
    if (!actionButtons || actionButtons.length === 0) {
      return;
    }
    
    actionButtons.forEach((btn) => {
      // Remove any existing event listeners to avoid duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add the event listener to the new button - using a simpler approach
      // to avoid multiple triggers
      const action = newBtn.getAttribute("data-action");
      
      newBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drag events
        
        
        // Use only one approach - the most reliable one - direct global call
        if (window.DashboardPage) {
          switch(action) {
            case "toggle-status":
              window.DashboardPage.toggleTodoStatus(this.todo.id);
              break;
            case "edit":
              window.DashboardPage.showEditTodoForm(this.todo.id);
              break;
            case "delete":
              window.DashboardPage.showDeleteTodoConfirm(this.todo.id);
              break;
          }
        }
      });
    });
  }

  getStatusButtonText() {
    return statusMap[this.todo.status.name] || "Update Status"
  }

  setKeyboardMode(enabled) {
    this.keyboardMode = enabled
    const card = this.shadowRoot.querySelector(".todo-card")
    if (card) {
      card.setAttribute("aria-grabbed", enabled ? "true" : "false")
    }
  }
}

customElements.define("todo-card", TodoCard)

export default TodoCard
