import { ToastService } from "../components/app-toast.js"
import ApiService from "../utils/api.js"
import AuthService from "../utils/auth.js"
import PermissionService from "../utils/permissions.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"

export default class UserManagementPage {
  static async render() {
    const currentUser = AuthService.getCurrentUser()
    if (!PermissionService.isSystemAdmin(currentUser)) {
      Router.navigate("/dashboard")
      ToastService.show("Access denied", "error")
      return
    }

    const app = document.getElementById("app")
    app.innerHTML = ""

    const layout = document.createElement("div")
    layout.className = "main-layout"

    
    const sidebar = document.createElement("aside")
    sidebar.setAttribute("role", "navigation")
    sidebar.setAttribute("aria-label", "Main navigation")
    const navigation = document.createElement("app-navigation")
    sidebar.appendChild(navigation)

    
    const content = document.createElement("div")
    content.className = "content-layout"

    
    const header = document.createElement("header")
    header.setAttribute("role", "banner")
    header.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="page-title">User Management</h1>
                    <p class="page-subtitle">Manage system users and their roles</p>
                </div>
            </div>
        `


    
    const main = document.createElement("main")
    main.setAttribute("role", "main")
    main.setAttribute("aria-label", "User management content")

    
    const searchContainer = document.createElement("div")
    searchContainer.className = "flex items-center justify-between mb-6"
    searchContainer.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="search" class="form-control" id="search-input" placeholder="Search users..." aria-label="Search users">
            </div>
        `

    const usersContainer = document.createElement("div")
    usersContainer.id = "users-container"

    
    main.appendChild(searchContainer)
    main.appendChild(usersContainer)
    content.appendChild(header)
    content.appendChild(main)
    layout.appendChild(sidebar)
    layout.appendChild(content)
    app.appendChild(layout)

    

    const searchInput = document.getElementById("search-input")

    searchInput.addEventListener("input", (e) => {
      this.filterUsers(e.target.value)
    })

    
    await this.loadUsers()
  }

  static async loadUsers() {
    const container = document.getElementById("users-container")
    container.innerHTML =
      '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading users...</div>'

    try {
      const response = await ApiService.get("/full-users")
        this.allUsers = response
        this.renderUsers(this.allUsers)
    } catch (error) {
      container.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: var(--error-color);">Failed to load users</div>'
      ToastService.show("Failed to load users", "error")
    }
  }

  static renderUsers(users) {
    const container = document.getElementById("users-container")
    container.innerHTML = ""

    if (users.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 text-secondary">No users found</div>
      `
      return
    }

    const table = document.createElement("div")
    table.className = "table"

    const header = document.createElement("div")
    header.className = "table-header"
    header.style.gridTemplateColumns = "1fr 1fr 1fr auto"
    
    header.innerHTML = `
        <div>Username</div>
        <div>System Roles</div>
        <div>Created</div>
        <div>Actions</div>
    `

    table.appendChild(header)

    users.forEach((user) => {
      const row = document.createElement("div")
      row.className = "table-row"
      row.style.gridTemplateColumns = "1fr 1fr 1fr auto"

      const roles = user.systemRoles
        .map(
          (role) =>
            `<span class="badge badge-primary">${SecurityUtils.sanitizeText(role)}</span>`
        )
        .join(" ")

      row.innerHTML = `
          <div class="table-cell" data-label="Username">
            <span class="font-medium">${SecurityUtils.sanitizeText(user.username)}</span>
          </div>
          <div class="table-cell" data-label="System Roles">
            ${roles}
          </div>
          <div class="table-cell" data-label="Created">
            <span class="text-secondary text-sm">
              ${SecurityUtils.sanitizeText(new Date(user.createdAt).toLocaleDateString())}
            </span>
          </div>
          <div class="table-cell" data-label="Actions">
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" data-action="edit" data-user-id="${user.id}">Edit</button>
              ${
                user.id !== AuthService.getCurrentUser()?.id
                  ? `<button class="btn btn-danger btn-sm" data-action="delete" data-user-id="${user.id}">Delete</button>`
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
        this.handleUserAction(action, userId)
      })
    })
  }

  static filterUsers(searchTerm) {
    if (!this.allUsers) return

    const filtered = this.allUsers.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    this.renderUsers(filtered)
  }

  static async handleUserAction(action, userId) {
    switch (action) {
      case "edit":
        this.showEditUserForm(userId)
        break
      case "delete":
        this.showDeleteUserConfirm(userId)
        break
    }
  }

  static showCreateUserForm() {
    this.showUserForm()
  }

  static showEditUserForm(userId) {
    const user = this.allUsers.find((u) => u.id === userId)
    if (user) {
      this.showUserForm(user)
    }
  }

  static showUserForm(user = null) {
    const isEdit = !!user
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-modal", "true")
    modal.setAttribute("aria-labelledby", "user-form-title")

    const form = document.createElement("div")
    form.className = "modal-content"

    form.innerHTML = `
      <div class="modal-header">
        <h2 id="user-form-title">
            ${isEdit ? "Edit User" : "Create New User"}
        </h2>
      </div>
      <div class="modal-body">
        <form id="user-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input type="text" id="username" class="form-control" placeholder="Enter username" required 
                value="${isEdit ? SecurityUtils.sanitizeText(user.username) : ""}">
            <div class="form-error" id="username-error"></div>
          </div>
          ${
            !isEdit
              ? `<div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input type="password" id="password" class="form-control" placeholder="Enter password" required>
                <div class="form-error" id="password-error"></div>
              </div>`
              : ""
          }
          <div class="form-group">
            <label class="form-label">System Roles</label>
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="role-admin" class="form-checkbox" 
                    ${isEdit && user.systemRoles.includes("system_admin") ? "checked" : ""}>
                <span>System Admin</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" id="role-user" class="form-checkbox" 
                    ${isEdit && user.systemRoles.includes("todo_user") ? "checked" : ""}>
                <span>Todo User</span>
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-btn">
            ${isEdit ? "Save Changes" : "Create User"}
        </button>
      </div>
    `
    modal.appendChild(form)
    document.body.appendChild(modal)

    
    const cancelBtn = form.querySelector("#cancel-btn")
    const saveBtn = form.querySelector("#save-btn")
    const usernameField = form.querySelector("#username")
    const passwordField = form.querySelector("#password")
    const roleAdminField = form.querySelector("#role-admin")
    const roleUserField = form.querySelector("#role-user")

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })

    saveBtn.addEventListener("click", async () => {
      
      const username = usernameField.value.trim()
      const password = passwordField ? passwordField.value : null

      const usernameError = form.querySelector("#username-error")
      const passwordError = passwordField ? form.querySelector("#password-error") : null

      
      usernameError.textContent = ""
      if (passwordError) passwordError.textContent = ""

      
      let isValid = true
      if (username.length < 3) {
        usernameError.textContent = "Username must be at least 3 characters"
        isValid = false
      }

      if (!isEdit && password.length < 8) {
        passwordError.textContent = "Password must be at least 8 characters"
        isValid = false
      }

      if (!isValid) return

      const roles = []
      if (roleAdminField.checked) roles.push("system_admin")
      if (roleUserField.checked) roles.push("todo_user")

      if (roles.length === 0) {
        ToastService.show("User must have at least one role", "error")
        return
      }

      saveBtn.disabled = true
      saveBtn.textContent = isEdit ? "Saving..." : "Creating..."

      try {
        const userData = {
          roleNames: roles,
        }
        if (!isEdit) {
          userData.password = password
        }

        let response
        if (isEdit) {
          response = await ApiService.patch(`/user-roles/${user.id}`, userData.roleNames)
        }
          ToastService.show(`User ${isEdit ? "updated" : "created"} successfully`, "success")
          document.body.removeChild(modal)
          this.loadUsers()
      } catch (error) {
        ToastService.show(`An error occurred: ${error.message}`, "error")
        saveBtn.disabled = false
        saveBtn.textContent = isEdit ? "Save Changes" : "Create User"
      }
    })

    usernameField.focus()
  }

  static showDeleteUserConfirm(userId) {
    const user = this.allUsers.find((u) => u.id === userId)
    if (!user) return

    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-modal", "true")
    modal.setAttribute("aria-labelledby", "delete-user-title")

    const content = document.createElement("div")
    content.className = "modal-content"

    content.innerHTML = `
      <div class="modal-header">
        <h2 id="delete-user-title">Delete User</h2>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete the user <strong>${SecurityUtils.sanitizeText(user.username)}</strong>?</p>
        <p class="text-error">This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        <button type="button" class="btn btn-danger" id="delete-btn">Delete User</button>
      </div>
    `

    document.body.appendChild(modal)
    modal.appendChild(content)

    const cancelBtn = content.querySelector("#cancel-btn")
    const deleteBtn = content.querySelector("#delete-btn")

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })

    deleteBtn.addEventListener("click", async () => {
      deleteBtn.disabled = true
      deleteBtn.textContent = "Deleting..."

      try {
        const response = await ApiService.delete(`/users/${userId}`)
          ToastService.show("User deleted successfully", "success")
          document.body.removeChild(modal)
          this.loadUsers()
      } catch (error) {
        ToastService.show(`An error occurred: deleting user`, "error")
        deleteBtn.disabled = false
        deleteBtn.textContent = "Delete User"
      }
    })
  }
}
