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
        const response = await ApiService.get(`/full-todos/${todoId}`);
        todo = response;
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
        <input 
          id="todo-title"
          type="text"
          class="form-control"
          placeholder="Enter task title"
          required
          value="${isEdit ? SecurityUtils.sanitizeText(todo.title) : ""}"
          aria-describedby="title-error">
        <div id="title-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-description" class="form-label">Description</label>
        <textarea 
          id="todo-description"
          placeholder="Enter task description"
          rows="5"
          class="form-control"
          style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); font-family: inherit;"
          aria-describedby="description-error">${isEdit ? SecurityUtils.sanitizeText(todo.description) : ""}</textarea>
        <div id="description-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-due-date" class="form-label">Due Date</label>
        <input 
          id="todo-due-date"
          type="date"
          class="form-control"
          value="${isEdit && todo.due_date ? todo.dueDate.split("T")[0] : ""}"
          aria-describedby="due-date-error">
        <div id="due-date-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-group">
        <label for="todo-team" class="form-label">Team</label>
        <select id="todo-team" class="form-control" required aria-describedby="team-error">
          <option value="">Select a team</option>
        </select>
        <div id="team-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>

      <div class="form-group" id="assigned-to-group" style="display: none;">
        <label for="todo-assigned-to" class="form-label">Assigned To</label>
        <select id="todo-assigned-to" class="form-control" required aria-describedby="assigned-to-error">
          <option value="">Select a team member</option>
        </select>
        <div id="assigned-to-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div class="form-actions">
        <a href="#/dashboard" class="cancel-link">
          <button type="button" class="btn btn-secondary" id="cancel-btn">
            Cancel
          </button>
        </a>
        <button type="submit" class="btn btn-primary" id="submit-btn">
          ${isEdit ? "Update" : "Create"} Task
        </button>
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
    await this.loadUserOptions(form, isEdit ? todoId : null);
    
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
        const todoData = this.collectFormData(form);
        console.log(todoData)
        let response;
        
        if (isEdit) {
          response = await ApiService.put(`/full-todos/${todoId}`, todoData);
        } else {
          console.log(todoData)
          response = await ApiService.post("/full-todos", todoData);
        }

        ToastService.show(`Task ${isEdit ? "updated" : "created"} successfully`, "success");
        Router.navigate("/dashboard");
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
      const response = await ApiService.get("/teams");
      const teams = response._embedded.teams
        
      const teamSelect = form.querySelector("#todo-team");
      if (!teamSelect) {
        console.error("Team select element not found");
        return;
      }
      
      // Format options for the select
      teams.forEach(team => {
        const option = document.createElement("option");
        option.value = team.id.toString();
        option.textContent = SecurityUtils.sanitizeText(team.name);
        teamSelect.appendChild(option);
      });
      
      console.log("Setting team options");
      
      // For edit mode, set the team
      if (todoId) {
        console.log(`Fetching todo ${todoId} for editing`);
        const todoResponse = await ApiService.get(`/todos/${todoId}`);
        if (todoResponse.success && todoResponse.data && todoResponse.data.team_id) {
          const teamId = todoResponse.data.team_id.toString();
          console.log(`Setting selected team to: ${teamId}`);
          teamSelect.value = teamId;
          
          // Load team members for the selected team
          await this.loadTeamMembers(form, teamId);
          
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
          
          // Load team members for the selected team
          await this.loadTeamMembers(form, currentTeam);
        }
      }
      
      // Add event listener to load team members when team selection changes
      teamSelect.addEventListener('change', async (event) => {
        const selectedTeamId = event.target.value;
        if (selectedTeamId) {
          await this.loadTeamMembers(form, selectedTeamId);
        } else {
          // Hide the assigned to dropdown if no team is selected
          const assignedToGroup = form.querySelector("#assigned-to-group");
          if (assignedToGroup) {
            assignedToGroup.style.display = "none";
          }
        }
      });
    } catch (error) {
      console.error("Error loading teams:", error);
      ToastService.show("Failed to load teams", "error");
    }
  }

  static async loadTeamMembers(form, teamId) {
    try {
      // Show the assigned-to field group
      const assignedToGroup = form.querySelector("#assigned-to-group");
      if (assignedToGroup) {
        assignedToGroup.style.display = "block";
      }
      
      // Load team members for the selected team
      const response = await ApiService.get(`/teaminfo/${teamId}/members`);
      const teamMembers = response;
      
      const userSelect = form.querySelector("#todo-assigned-to");
      if (!userSelect) {
        console.error("User select element not found");
        return;
      }
      
      // Clear existing options except the first placeholder option
      while (userSelect.options.length > 1) {
        userSelect.remove(1);
      }
      
      // Add new options
      teamMembers.forEach(member => {
        const option = document.createElement("option");
        option.value = member.userId.toString();
        option.textContent = SecurityUtils.sanitizeText(member.username);
        userSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading team members:", error);
      ToastService.show("Failed to load team members", "error");
    }
  }

  static async loadUserOptions(form, todoId) {
    // This method is no longer needed as we'll load team members based on selected team
    // We'll keep it for backward compatibility
    if (todoId) {
      try {
        const todoResponse = await ApiService.get(`/todos/${todoId}`);
        if (todoResponse && todoResponse.team_id) {
          await this.loadTeamMembers(form, todoResponse.team_id);
        }
      } catch (error) {
        console.error("Error loading todo for assigned user:", error);
      }
    }
  }
  
  static validateForm(form) {
    const titleInput = form.querySelector("#todo-title");
    const teamSelect = form.querySelector("#todo-team");
    
    const title = titleInput ? titleInput.value.trim() : "";
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
    const descriptionInput = form.querySelector("#todo-description");
    const dueDateInput = form.querySelector("#todo-due-date");
    const teamSelect = form.querySelector("#todo-team");
    const assignedToSelect = form.querySelector("#todo-assigned-to");
    
    // Get values
    const title = titleInput ? titleInput.value.trim() : "";
    const description = descriptionInput ? descriptionInput.value.trim() : "";
    let dueDate = dueDateInput ? dueDateInput.value : "";
    const teamId = teamSelect ? teamSelect.value : "";
    const assignedToId = assignedToSelect ? assignedToSelect.value : "";
    
    dueDate = (new Date(dueDate)).toISOString();
    
    return {
      title,
      description,
      teamId: parseInt(teamId),
      dueDate: dueDate || null,
      assignedToId: assignedToId ? parseInt(assignedToId) : null,
      statusId: 1,
      createdById: 1
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