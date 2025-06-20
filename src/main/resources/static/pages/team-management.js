import { ToastService } from "../components/app-toast.js"
import ApiService from "../utils/api.js"
import AuthService from "../utils/auth.js"
import PermissionService from "../utils/permissions.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"

class TeamManagementPage {
  static currentTeam = null

  static async render(teamId) {
    this.currentTeam = teamId ? Number.parseInt(teamId) : null


    if (!this.currentTeam) {
      Router.navigate("/teams")
      return
    }

    
    const canManage = await PermissionService.canManageTeam(this.currentTeam)
    
    if (!canManage) {
      Router.navigate("/teams")
      ToastService.show("Access denied", "error")
      return
    }

    const app = document.getElementById("app")
    app.innerHTML = ""

    const layout = document.createElement("div")
    layout.className = "main-layout"

    
    const sidebar = document.createElement("div")
    sidebar.className = "sidebar"
    const navigation = document.createElement("app-navigation")
    sidebar.appendChild(navigation)

    
    const content = document.createElement("div")
    content.className = "content"

    const header = document.createElement("div")
    header.className = "page-header"
    header.innerHTML = `
            <h1 class="page-title">Team Management</h1>
            <p class="page-subtitle">Manage team members and their roles</p>
        `

    const actions = document.createElement("div")
    actions.className = "flex items-center gap-2 mb-4"
    actions.innerHTML = `
            <app-button variant="primary" id="add-member-btn">Add Member</app-button>
            <app-button variant="secondary" id="back-btn">Back to Teams</app-button>
        `

    const membersContainer = document.createElement("div")
    membersContainer.id = "members-container"

    content.appendChild(header)
    content.appendChild(actions)
    content.appendChild(membersContainer)

    layout.appendChild(sidebar)
    layout.appendChild(content)
    app.appendChild(layout)

    

    const addMemberBtn = actions.querySelector('#add-member-btn')
    const backBtn = actions.querySelector('#back-btn')

    actions.addEventListener("click", (e) => {
      if (e.target.closest("#add-member-btn")) {
        this.showAddMemberForm()
      } else if (e.target.closest("#back-btn")) {
        Router.navigate("/teams")
      }
    })

    
    await this.loadTeamMembers()
    
    
    window.TeamManagementPage = this;
  }

  static async loadTeamMembers() {
    const container = document.getElementById("members-container")
    container.innerHTML =
      '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading team members...</div>'

    try {
      const response = await ApiService.get(`/teaminfo/${this.currentTeam}/members`)
        this.renderTeamMembers(response)
    } catch (error) {
      container.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: var(--error-color);">Failed to load team members</div>'
      ToastService.show("Failed to load team members", "error")
    }
  }

  static renderTeamMembers(members) {
    const container = document.getElementById("members-container")
    container.innerHTML = ""

    if (members.length === 0) {
      container.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No team members found</div>'
      return
    }

    const table = document.createElement("div")
    table.classList.add("table")

    const header = document.createElement("div")
    header.classList.add("table-header")
    header.style.gridTemplateColumns = "1fr 1fr 1fr auto";
    header.innerHTML = `
            <div>Username</div>
            <div>Role</div>
            <div>Actions</div>
        `

    table.appendChild(header)

    const currentUser = AuthService.getCurrentUser();

    members.forEach((member) => {
      const row = document.createElement("div")
      row.classList.add("table-row")
      row.style.gridTemplateColumns = "1fr 1fr 1fr auto";

      const roleColor = member.roleName === "team_lead" ? "var(--warning-color)" : "var(--primary-color)"

      row.innerHTML = `
                <div class="table-cell" data-label="Username">
                  <span style="font-weight: 500;">${SecurityUtils.sanitizeText(member.username)}</span>
                </div>
                <div class="table-cell" data-label="Role">
                    <span style="
                        background: rgba(37, 99, 235, 0.1);
                        color: ${roleColor};
                        padding: 0.25rem 0.75rem;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        text-transform: capitalize;
                    ">${SecurityUtils.sanitizeText(member.roleName.replace("_", " "))}</span>
                </div>

                <div class="table-cell" data-label="Actions">
                    <div class="flex gap-2">
                        <button class="standard-button" 
                                data-action="change-role" 
                                data-user-id="${member.userId}">Change Role</button>
                        ${
                          member.userId !== currentUser?.id
                            ? `<button class="danger-button" 
                                data-action="remove" 
                                data-user-id="${member.userId}">Remove</button>`
                            : ""
                        }
                    </div>
                </div>
            `

      table.appendChild(row)
    })

    container.appendChild(table)

    
    container.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action")
        const userId = Number.parseInt(e.target.getAttribute("data-user-id"))
        this.handleMemberAction(action, userId)
      })
    })
  }

  static async handleMemberAction(action, userId) {
    if (!userId) {
      return;
    }
    
    
    switch (action) {
      case "change-role":
        this.showChangeRoleForm(userId)
        break
      case "remove":
        this.showRemoveMemberConfirm(userId)
        break
    }
  }

  static showAddMemberForm() {
    removeModal()
    
    const modal = document.createElement("div")
    modal.id = "add-member-modal";
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const form = document.createElement("div")
    form.className = "modal-content";
    form.style.maxWidth = "400px";

    form.innerHTML = `
            <header class="modal-header">
                <h2>Add Team Member</h2>
            </header>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label" for="username-input">Username</label>
                    <input type="text" id="username-input" class="standard-input" placeholder="Enter username" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="role-select">Role</label>
                    <select id="role-select" class="standard-input" required>
                        <option value="team_member">Team Member</option>
                        <option value="team_lead">Team Lead</option>
                    </select>
                </div>
            </div>
            <footer class="modal-footer">
                <button class="standard-button" id="cancel-btn" type="button">Cancel</button>
                <button class="danger-button" id="add-member-submit-btn" type="button">Add Member</button>
            </footer>
        `

    modal.appendChild(form)
    document.body.appendChild(modal)
    
    
    const input = form.querySelector("#username-input");
    if (input) {
      input.focus();
    }
    
    
    function removeModal() {
      const modal = document.getElementById("add-member-modal");
      if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }

    
    const cancelBtn = form.querySelector("#cancel-btn");
    const submitBtn = form.querySelector("#add-member-submit-btn");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        removeModal();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const usernameInput = form.querySelector("#username-input");
        const roleSelect = form.querySelector("#role-select");
        
        const username = usernameInput ? usernameInput.value.trim() : "";
        const roleName = roleSelect ? roleSelect.value : null;

        if (!username || !roleName) {
          ToastService.show("Please fill in all fields", "error")
          return;
        }

        submitBtn.textContent = "Adding...";
        submitBtn.disabled = true;

        try {
          const response = await ApiService.post(`/teaminfo/${this.currentTeam}/add-member`, {
            username,
            roleName,
          })

            ToastService.show("Team member added successfully", "success");
            removeModal();
            await TeamManagementPage.loadTeamMembers();
        } catch (error) {
          ToastService.show("Failed to add team member", "error");
          submitBtn.textContent = "Add Member";
          submitBtn.disabled = false;
        }
      })
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        removeModal();
      }
    })
  }

  static showChangeRoleForm(userId) {
    
    const modal = document.createElement("div")
    modal.id = "change-role-modal";
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const form = document.createElement("div")
    form.className = "modal-content";
    form.style.maxWidth = "400px";

    form.innerHTML = `
            <header class="modal-header">
                <h2>Change Member Role</h2>
            </header>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label" for="role-select">New Role</label>
                    <select id="role-select" class="standard-input" required>
                        <option value="team_member">Team Member</option>
                        <option value="team_lead">Team Lead</option>
                    </select>
                </div>
            </div>
            <footer class="modal-footer">
                <button class="standard-button" id="cancel-btn" type="button">Cancel</button>
                <button class="danger-button" id="update-role-btn" type="button">Update Role</button>
            </footer>
        `

    modal.appendChild(form)
    document.body.appendChild(modal)
    
    
    function removeModal() {
      const modal = document.getElementById("change-role-modal");
      if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }

    
    const cancelBtn = form.querySelector("#cancel-btn");
    const submitBtn = form.querySelector("#update-role-btn");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        removeModal();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const roleSelect = form.querySelector("#role-select");
        const roleName = roleSelect ? roleSelect.value : null;

        if (!roleName) {
          ToastService.show("Please select a role", "error");
          return;
        }

        submitBtn.textContent = "Updating...";
        submitBtn.disabled = true;

        try {
          const response = await ApiService.put(`/teaminfo/${this.currentTeam}/update-role`, {
            roleName,
            userId
          })

            ToastService.show("Member role updated successfully", "success");
            removeModal();
            await TeamManagementPage.loadTeamMembers();
        } catch (error) {
          ToastService.show("Failed to update member role", "error");
          submitBtn.textContent = "Update Role";
          submitBtn.disabled = false;
        }
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        removeModal();
      }
    });
  }

  static showRemoveMemberConfirm(userId) {
    
    const modal = document.createElement("div")
    modal.id = "remove-member-modal";
    modal.className = "modal-overlay";
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "confirm-title");
    modal.setAttribute("aria-describedby", "confirm-description");

    const dialog = document.createElement("div")
    dialog.className = "modal-content";
    dialog.style.maxWidth = "400px";

    dialog.innerHTML = `
            <header class="modal-header">
                <h2 id="confirm-title">Remove Team Member</h2>
            </header>
            <div class="modal-body">
                <p id="confirm-description">
                    Are you sure you want to remove this member from the team?
                    This action cannot be undone.
                </p>
            </div>
            <footer class="modal-footer">
                <button class="standard-button" id="cancel-btn" type="button">Cancel</button>
                <button class="danger-button" id="confirm-remove-btn" type="button">Remove Member</button>
            </footer>
        `

    modal.appendChild(dialog)
    document.body.appendChild(modal)
    
    
    function removeModal() {
      const modal = document.getElementById("remove-member-modal");
      if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }

    const cancelBtn = dialog.querySelector("#cancel-btn");
    const confirmBtn = dialog.querySelector("#confirm-remove-btn");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        removeModal();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        confirmBtn.textContent = "Removing...";
        confirmBtn.disabled = true;

        try {
          const response = await ApiService.delete(`/teaminfo/${this.currentTeam}/members/${userId}`);

            removeModal();
            ToastService.show("Team member removed successfully", "success");
            await TeamManagementPage.loadTeamMembers();
        } catch (error) {
          ToastService.show("Failed to remove team member", "error");
          confirmBtn.textContent = "Remove Member";
          confirmBtn.disabled = false;
        }
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        removeModal();
      }
    });
    
    
    if (cancelBtn) {
      cancelBtn.focus();
    }
  }
}


window.TeamManagementPage = TeamManagementPage;

export default TeamManagementPage
