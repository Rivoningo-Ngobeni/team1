import { ToastService } from "../components/app-toast.js";
import ApiService from "../utils/api.js";
import Router from "../utils/router.js";
import SecurityUtils from "../utils/security.js";
import StateManager from "../utils/state.js";

class TodoFormPage {
  static async render(todoId = null) {
    const isEdit = !!todoId;
    let todo = null;
    
    // For edit mode, fetch the todo data
    if (isEdit) {
      try {
        const response = await ApiService.get(`/todos/${todoId}`);
        if (!response.success) {
          ToastService.show("Failed to load task data", "error");
          Router.navigate("/dashboard");
          return;
        }
        todo = response.data;
      } catch (error) {
        console.error("Error fetching todo:", error);
        ToastService.show("Could not load task data", "error");
        Router.navigate("/dashboard");
        return;
      }
    }
    
    const app = document.getElementById("app");
    app.innerHTML = "";
    
    // Create semantic structure
    const layout = document.createElement("div");
    layout.className = "content-layout";
    
    // Header
    const header = document.createElement("header");
    header.setAttribute("role", "banner");
    header.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">${isEdit ? "Edit Task" : "Create New Task"}</h1>
          <p class="page-subtitle">${isEdit ? "Update task details" : "Add a new task to your list"}</p>
        </div>
        <div>
          <app-button type="button" variant="secondary" id="back-to-dashboard" onclick="window.Router.navigate('/dashboard')">
            Back to Dashboard
          </app-button>
        </div>
      </div>
    `;
    
    // Main content
    const main = document.createElement("main");
    main.id = "main-content";
    main.setAttribute("role", "main");
    
    // Form container
    const formContainer = document.createElement("div");
    formContainer.className = "todo-page-form";
    
    // Create the form
    const form = document.createElement("form");
    form.className = "form-container";
    form.setAttribute("novalidate", "");
    form.innerHTML = `
      <div class="form-group">
        <label for="todo-title" class="form-label">Title</label>
        <app-input 
          id="todo-title"
          type="text" 
          placeholder="Enter task title" 
          required
          value="${isEdit ? SecurityUtils.sanitizeText(todo.title) : ""}"
          aria-describedby="title-error">
        </app-input>
        <div id="title-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-description" class="form-label">Description</label>
        <textarea 
          id="todo-description"
          placeholder="Enter task description"
          rows="5"
          style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); font-family: inherit;"
          aria-describedby="description-error">${isEdit ? SecurityUtils.sanitizeText(todo.description) : ""}</textarea>
        <div id="description-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-due-date" class="form-label">Due Date</label>
        <app-input 
          id="todo-due-date"
          type="date" 
          value="${isEdit && todo.due_date ? todo.due_date.split("T")[0] : ""}"
          aria-describedby="due-date-error">
        </app-input>
        <div id="due-date-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-team" class="form-label">Team</label>
        <app-select id="todo-team" required aria-describedby="team-error"></app-select>
        <div id="team-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-actions">
        <a href="#/dashboard" class="cancel-link">
          <app-button type="button" variant="secondary" id="cancel-btn">
            Cancel
          </app-button>
        </a>
        <app-button type="submit" variant="primary" id="submit-btn">
          ${isEdit ? "Update" : "Create"} Task
        </app-button>
      </div>
    `;
    
    formContainer.appendChild(form);
    main.appendChild(formContainer);
    
    layout.appendChild(header);
    layout.appendChild(main);
    app.appendChild(layout);
    
    // Setup form handlers
    this.setupFormHandlers(form, todoId);
  }
  
  static async setupFormHandlers(form, todoId) {
    const isEdit = !!todoId;
    
    // Load teams for selector
    await this.loadTeamOptions(form, isEdit ? todoId : null);
    
    // Setup event handlers
    const submitBtn = form.querySelector("#submit-btn");
    const cancelBtn = form.querySelector("#cancel-btn");
    
    // Handle cancel button
    if (cancelBtn) {
      // Direct click handler on the app-button element
      cancelBtn.addEventListener("click", (e) => {
        console.log("Cancel button clicked");
        window.location.href = "#/dashboard";
      });
    }
    
    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!this.validateForm(form)) {
        return;
      }
      
      submitBtn.setAttribute("loading", "");
      
      try {
        const formData = this.collectFormData(form);
        let response;
        
        if (isEdit) {
          response = await ApiService.put(`/todos/${todoId}`, formData);
        } else {
          response = await ApiService.post("/todos", formData);
        }
        
        if (response.success) {
          ToastService.show(`Task ${isEdit ? "updated" : "created"} successfully`, "success");
          Router.navigate("/dashboard");
        } else {
          ToastService.show(response.message || `Failed to ${isEdit ? "update" : "create"} task`, "error");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        ToastService.show(`An error occurred while ${isEdit ? "updating" : "creating"} the task`, "error");
      } finally {
        submitBtn.removeAttribute("loading");
      }
    });
    
    // Focus on the title input
    setTimeout(() => {
      const titleInput = form.querySelector("#todo-title");
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }
  
  static async loadTeamOptions(form, todoId) {
    try {
      console.log("Loading team options for todo form");
      const response = await ApiService.get("/teams");
      
      if (response.success && response.data) {
        console.log(`Received ${response.data.length} teams from API`);
        
        const teamSelect = form.querySelector("#todo-team");
        if (!teamSelect) {
          console.error("Team select element not found");
          return;
        }
        
        // Format options for the select
        const options = response.data.map((team) => ({
          value: team.id.toString(),
          label: SecurityUtils.sanitizeText(team.name),
        }));
        
        console.log("Setting team options:", options);
        
        // Try multiple approaches to set options and values
        if (typeof teamSelect.setOptions === 'function') {
          teamSelect.setOptions(options);
          
          // For edit mode, set the team
          if (todoId) {
            console.log(`Fetching todo ${todoId} for editing`);
            const todoResponse = await ApiService.get(`/todos/${todoId}`);
            if (todoResponse.success && todoResponse.data && todoResponse.data.team_id) {
              const teamId = todoResponse.data.team_id.toString();
              console.log(`Setting selected team to: ${teamId}`);
              teamSelect.value = teamId;
              
              // Double-check that the value was set
              setTimeout(() => {
                console.log(`Current team value: ${teamSelect.value}`);
              }, 100);
            }
          } else {
            // For create mode, use the current team from state if available
            const currentTeam = StateManager.getState().currentTeam;
            if (currentTeam) {
              console.log(`Setting team from current state: ${currentTeam}`);
              teamSelect.value = currentTeam;
            }
          }
        } else {
          console.error("setOptions method not available on team select");
        }
      } else {
        console.error("Failed to load teams:", response);
        ToastService.show("Failed to load teams", "error");
      }
    } catch (error) {
      console.error("Error loading teams:", error);
      ToastService.show("Failed to load teams", "error");
    }
  }
  
  static validateForm(form) {
    const titleInput = form.querySelector("#todo-title");
    const titleShadowInput = titleInput && titleInput.shadowRoot ? 
      titleInput.shadowRoot.querySelector('.input') : null;
    const teamSelect = form.querySelector("#todo-team");
    
    const title = titleShadowInput ? titleShadowInput.value.trim() : 
      (titleInput ? titleInput.value.trim() : "");
    const teamId = teamSelect ? teamSelect.value : "";
    
    let isValid = true;
    
    // Validate title
    if (!title) {
      this.showFieldError(titleInput, "title-error", "Title is required");
      isValid = false;
    } else {
      this.clearFieldError(titleInput, "title-error");
    }
    
    // Validate team
    if (!teamId) {
      this.showFieldError(teamSelect, "team-error", "Please select a team");
      isValid = false;
    } else {
      this.clearFieldError(teamSelect, "team-error");
    }
    
    return isValid;
  }
  
  static collectFormData(form) {
    const titleInput = form.querySelector("#todo-title");
    const titleShadowInput = titleInput && titleInput.shadowRoot ? 
      titleInput.shadowRoot.querySelector('.input') : null;
    const descriptionInput = form.querySelector("#todo-description");
    const dueDateInput = form.querySelector("#todo-due-date");
    const dueDateShadowInput = dueDateInput && dueDateInput.shadowRoot ? 
      dueDateInput.shadowRoot.querySelector('.input') : null;
    const teamSelect = form.querySelector("#todo-team");
    
    // Get values, checking both direct and shadow DOM
    const title = titleShadowInput ? titleShadowInput.value.trim() : 
      (titleInput ? titleInput.value.trim() : "");
    const description = descriptionInput ? descriptionInput.value.trim() : "";
    const dueDate = dueDateShadowInput ? dueDateShadowInput.value : 
      (dueDateInput ? dueDateInput.value : "");
    const teamId = teamSelect ? teamSelect.value : "";
    
    return {
      title,
      description,
      team_id: parseInt(teamId),
      due_date: dueDate || null,
    };
  }
  
  static showFieldError(input, errorId, message) {
    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
    
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }
  
  static clearFieldError(input, errorId) {
    if (input) {
      input.setAttribute("aria-invalid", "false");
    }
    
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  }
}

export default TodoFormPage; 