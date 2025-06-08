import AuthService from "./auth.js";

export default class ApiService {
  // Enhanced mock data with more comprehensive structure
  static mockData = {
    config: {
      API_BASE_URL: "/api",
      APP_NAME: "Team Todo App",
      SESSION_TIMEOUT: 3600000,
      MAX_FILE_SIZE: 5242880,
      SUPPORTED_FILE_TYPES: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
      PAGINATION_SIZE: 20,
      PASSWORD_MIN_LENGTH: 8,
      USERNAME_MIN_LENGTH: 3,
      USERNAME_MAX_LENGTH: 50,
      TODO_TITLE_MAX_LENGTH: 128,
      TODO_DESCRIPTION_MAX_LENGTH: 512,
      TEAM_NAME_MAX_LENGTH: 100,
      TWO_FA_ISSUER: "Team Todo App",
      TOAST_DURATION: 5000,
      AUTO_LOGOUT_WARNING: 300000,
      THEME_OPTIONS: ["light", "dark", "auto"],
      DEFAULT_THEME: "light",
    },
    users: [
      {
        id: 1,
        username: "admin",
        password_hash: "hashed_password",
        password_salt: "salt123",
        two_fa_secret: "secret123",
        created_at: new Date().toISOString(),
        system_roles: ["system_admin", "todo_user"],
      },
      {
        id: 2,
        username: "teamlead1",
        password_hash: "hashed_password2",
        password_salt: "salt456",
        two_fa_secret: "secret456",
        created_at: new Date().toISOString(),
        system_roles: ["todo_user"],
      },
      {
        id: 3,
        username: "member1",
        password_hash: "hashed_password3",
        password_salt: "salt789",
        two_fa_secret: "secret789",
        created_at: new Date().toISOString(),
        system_roles: ["todo_user"],
      },
    ],
    systemRoles: [
      { id: 1, name: "system_admin" },
      { id: 2, name: "todo_user" },
    ],
    userSystemRoles: [
      { id: 1, user_id: 1, role_id: 1 },
      { id: 2, user_id: 1, role_id: 2 },
      { id: 3, user_id: 2, role_id: 2 },
      { id: 4, user_id: 3, role_id: 2 },
    ],
    teams: [
      {
        id: 1,
        name: "Development Team",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Design Team",
        created_at: new Date().toISOString(),
      },
    ],
    teamRoles: [
      { id: 1, name: "team_lead" },
      { id: 2, name: "team_member" },
    ],
    teamMembers: [
      { id: 1, team_id: 1, user_id: 1, team_role_id: 1 },
      { id: 2, team_id: 1, user_id: 2, team_role_id: 1 },
      { id: 3, team_id: 1, user_id: 3, team_role_id: 2 },
      { id: 4, team_id: 2, user_id: 2, team_role_id: 1 },
    ],
    todos: [
      {
        id: 1,
        title: "Implement user authentication",
        description: "Add login and signup functionality with 2FA support",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status_id: 1,
        status_name: "open",
        assigned_to_id: 1,
        assigned_to_username: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 1,
        team_id: 1,
      },
      {
        id: 2,
        title: "Design dashboard layout",
        description: "Create wireframes and mockups for the main dashboard",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status_id: 2,
        status_name: "in_progress",
        assigned_to_id: 2,
        assigned_to_username: "teamlead1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 2,
        team_id: 2,
      },
    ],
    todoStatus: [
      { id: 1, name: "open" },
      { id: 2, name: "in_progress" },
      { id: 3, name: "closed" },
    ],
  }

  static async mockRequest(method, endpoint, data = null) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      return this.handleMockRequest(method, endpoint, data)
    } catch (error) {
      throw new Error(error.message || "API request failed")
    }
  }
  
  static async request(method, endpoint, data = undefined, queryParams = {}) {
    const urlSearchParams = new URLSearchParams(queryParams);
    const url = `${window.location.origin}/api${endpoint}?${urlSearchParams.toString()}`


    if (method.toString().toLowerCase() === "get" && data) {
      throw new Error("GET request cannot include a body")
    }

    try {
      return fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...(AuthService.getAuthToken() && { "Authorization": "Bearer " + AuthService.getAuthToken() })
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error(error.message || "API request failed")
    }
  }

  static async register(username, password) {
    const response = await this.request("POST", "/auth/register", {
      username: username,
      password: password,
    })

    return [await response.json(), response.ok];
  }

  static async verifyTwoFactor(username, code) {
    const response = await this.request("POST", "/auth/verify-2fa", {
      username: username,
      code: code,
    })
    return [await response.json(), response.ok];
  }

  static async login(username, password, totpCode) {
    const response = await this.request("POST", "/auth/login", {
      username: username,
      password: password,
      totpCode: totpCode,
    })
    return [await response.json(), response.ok];
  }

  static handleMockRequest(method, endpoint, data) {
    // Config endpoint
    if (endpoint === "/config") {
      return this.mockData.config
    }

    // Auth endpoints
    if (endpoint === "/auth/login") return this.mockLogin(data)
    if (endpoint === "/auth/signup") return this.mockSignup(data)
    if (endpoint === "/auth/verify-2fa") return this.mockVerifyTwoFactor(data)

    // User management endpoints
    if (endpoint === "/users") {
      if (method === "GET") return this.mockGetUsers()
      if (method === "POST") return this.mockCreateUser(data)
    }
    if (endpoint.startsWith("/users/") && method === "PUT") {
      const userId = Number.parseInt(endpoint.split("/")[2])
      return this.mockUpdateUser(userId, data)
    }
    if (endpoint.startsWith("/users/") && method === "DELETE") {
      const userId = Number.parseInt(endpoint.split("/")[2])
      return this.mockDeleteUser(userId)
    }

    // Team endpoints
    if (endpoint === "/teams") {
      if (method === "GET") return this.mockGetTeams()
      if (method === "POST") return this.mockCreateTeam(data)
    }
    if (endpoint.startsWith("/teams/") && endpoint.endsWith("/members")) {
      const teamId = Number.parseInt(endpoint.split("/")[2])
      if (method === "GET") return this.mockGetTeamMembers(teamId)
      if (method === "POST") return this.mockAddTeamMember(teamId, data)
    }
    if (endpoint.startsWith("/teams/") && endpoint.includes("/members/")) {
      const parts = endpoint.split("/")
      const teamId = Number.parseInt(parts[2])
      const userId = Number.parseInt(parts[4])
      if (method === "PUT") return this.mockUpdateTeamMember(teamId, userId, data)
      if (method === "DELETE") return this.mockRemoveTeamMember(teamId, userId)
    }

    // Todo endpoints
    if (endpoint === "/todos") {
      if (method === "GET") return this.mockGetTodos()
      if (method === "POST") return this.mockCreateTodo(data)
    }
    if (endpoint.startsWith("/todos/") && method === "PUT") {
      const todoId = Number.parseInt(endpoint.split("/")[2])
      return this.mockUpdateTodo(todoId, data)
    }

    throw new Error("Endpoint not found")
  }

  // Auth mock methods
  static mockLogin(data) {
    const user = this.mockData.users.find((u) => u.username === data.username)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    return {
      success: true,
      requiresTwoFactor: true,
      user: {
        id: user.id,
        username: user.username,
        system_roles: user.system_roles,
      },
      token: "generated_token",
    }
  }

  static mockSignup(data) {
    console.log("Processing signup request:", data);
    
    const existingUser = this.mockData.users.find((u) => u.username === data.username)
    if (existingUser) {
      console.log("Username already exists:", data.username);
      return { success: false, message: "Username already exists" }
    }

    // Create new user with a valid ID (ensure it's unique)
    const maxId = Math.max(...this.mockData.users.map(user => user.id), 0);
    const newId = maxId + 1;
    
    const newUser = {
      id: newId,
      username: data.username,
      password_hash: "hashed_" + data.password,
      password_salt: "generated_salt",
      two_fa_secret: "generated_secret",
      created_at: new Date().toISOString(),
      system_roles: ["todo_user"],
    }

    console.log("Creating new user:", newUser.username, "with ID:", newId);
    this.mockData.users.push(newUser)
    return { success: true, message: "Account created successfully" }
  }

  static mockVerifyTwoFactor(data) {
    if (data.code === "123456") {
      const user = this.mockData.users[0]
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          system_roles: user.system_roles,
        },
        token: "generated_token",
      }
    }
    return { success: false, message: "Invalid verification code" }
  }

  // User management mock methods
  static mockGetUsers() {
    const users = this.mockData.users.map((user) => ({
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      system_roles: user.system_roles,
    }))
    return { success: true, data: users }
  }

  static mockCreateUser(data) {
    const existingUser = this.mockData.users.find((u) => u.username === data.username)
    if (existingUser) {
      return { success: false, message: "Username already exists" }
    }

    const newUser = {
      id: this.mockData.users.length + 1,
      username: data.username,
      password_hash: "hashed_" + data.password,
      password_salt: "generated_salt",
      two_fa_secret: "generated_secret",
      created_at: new Date().toISOString(),
      system_roles: data.system_roles || ["todo_user"],
    }

    this.mockData.users.push(newUser)
    return {
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        created_at: newUser.created_at,
        system_roles: newUser.system_roles,
      },
    }
  }

  static mockUpdateUser(userId, data) {
    const userIndex = this.mockData.users.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      return { success: false, message: "User not found" }
    }

    if (data.username) {
      const existingUser = this.mockData.users.find((u) => u.username === data.username && u.id !== userId)
      if (existingUser) {
        return { success: false, message: "Username already exists" }
      }
    }

    this.mockData.users[userIndex] = {
      ...this.mockData.users[userIndex],
      ...data,
    }

    return {
      success: true,
      data: {
        id: this.mockData.users[userIndex].id,
        username: this.mockData.users[userIndex].username,
        created_at: this.mockData.users[userIndex].created_at,
        system_roles: this.mockData.users[userIndex].system_roles,
      },
    }
  }

  static mockDeleteUser(userId) {
    const userIndex = this.mockData.users.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      return { success: false, message: "User not found" }
    }

    // Remove user from teams
    this.mockData.teamMembers = this.mockData.teamMembers.filter((tm) => tm.user_id !== userId)

    // Remove user
    this.mockData.users.splice(userIndex, 1)

    return { success: true, message: "User deleted successfully" }
  }

  // Team member management mock methods
  static mockGetTeamMembers(teamId) {
    const teamMembers = this.mockData.teamMembers
      .filter((tm) => tm.team_id === teamId)
      .map((tm) => {
        const user = this.mockData.users.find((u) => u.id === tm.user_id)
        const role = this.mockData.teamRoles.find((r) => r.id === tm.team_role_id)
        return {
          id: tm.id,
          user_id: user.id,
          username: user.username,
          team_role_id: role.id,
          team_role_name: role.name,
          joined_at: user.created_at,
        }
      })

    return { success: true, data: teamMembers }
  }

  static mockAddTeamMember(teamId, data) {
    const user = this.mockData.users.find((u) => u.username === data.username)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    const existingMember = this.mockData.teamMembers.find((tm) => tm.team_id === teamId && tm.user_id === user.id)
    if (existingMember) {
      return { success: false, message: "User is already a team member" }
    }

    const roleId = data.team_role_id || 2 // Default to team_member
    const newMember = {
      id: this.mockData.teamMembers.length + 1,
      team_id: teamId,
      user_id: user.id,
      team_role_id: roleId,
    }

    this.mockData.teamMembers.push(newMember)

    const role = this.mockData.teamRoles.find((r) => r.id === roleId)
    return {
      success: true,
      data: {
        id: newMember.id,
        user_id: user.id,
        username: user.username,
        team_role_id: role.id,
        team_role_name: role.name,
        joined_at: user.created_at,
      },
    }
  }

  static mockUpdateTeamMember(teamId, userId, data) {
    const memberIndex = this.mockData.teamMembers.findIndex((tm) => tm.team_id === teamId && tm.user_id === userId)
    if (memberIndex === -1) {
      return { success: false, message: "Team member not found" }
    }

    this.mockData.teamMembers[memberIndex] = {
      ...this.mockData.teamMembers[memberIndex],
      ...data,
    }

    const member = this.mockData.teamMembers[memberIndex]
    const user = this.mockData.users.find((u) => u.id === member.user_id)
    const role = this.mockData.teamRoles.find((r) => r.id === member.team_role_id)

    return {
      success: true,
      data: {
        id: member.id,
        user_id: user.id,
        username: user.username,
        team_role_id: role.id,
        team_role_name: role.name,
        joined_at: user.created_at,
      },
    }
  }

  static mockRemoveTeamMember(teamId, userId) {
    const memberIndex = this.mockData.teamMembers.findIndex((tm) => tm.team_id === teamId && tm.user_id === userId)
    if (memberIndex === -1) {
      return { success: false, message: "Team member not found" }
    }

    this.mockData.teamMembers.splice(memberIndex, 1)
    return { success: true, message: "Team member removed successfully" }
  }

  // Enhanced team methods
  static mockGetTeams() {
    const currentUser = { id: 1 } // Placeholder for AuthService.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Not authenticated" }
    }

    const userTeams = this.mockData.teamMembers
      .filter((tm) => tm.user_id === currentUser.id)
      .map((tm) => {
        const team = this.mockData.teams.find((t) => t.id === tm.team_id)
        const role = this.mockData.teamRoles.find((r) => r.id === tm.team_role_id)
        return {
          ...team,
          role_name: role.name,
          member_count: this.mockData.teamMembers.filter((m) => m.team_id === team.id).length,
        }
      })

    return { success: true, data: userTeams }
  }

  static mockCreateTeam(data) {
    const currentUser = { id: 1 } // Placeholder for AuthService.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Not authenticated" }
    }

    const newTeam = {
      id: this.mockData.teams.length + 1,
      name: data.name,
      created_at: new Date().toISOString(),
    }

    this.mockData.teams.push(newTeam)

    // Add creator as team lead
    const newMember = {
      id: this.mockData.teamMembers.length + 1,
      team_id: newTeam.id,
      user_id: currentUser.id,
      team_role_id: 1, // team_lead
    }

    this.mockData.teamMembers.push(newMember)

    return {
      success: true,
      data: {
        ...newTeam,
        role_name: "team_lead",
        member_count: 1,
      },
    }
  }

  // Todo methods (unchanged)
  static mockGetTodos() {
    return { success: true, data: this.mockData.todos }
  }

  static mockCreateTodo(data) {
    const newTodo = {
      id: this.mockData.todos.length + 1,
      ...data,
      status_id: 1,
      status_name: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 1, // Placeholder for AuthService.getCurrentUser()?.id || 1
    }

    this.mockData.todos.push(newTodo)
    return { success: true, data: newTodo }
  }

  static mockUpdateTodo(todoId, data) {
    const todoIndex = this.mockData.todos.findIndex((t) => t.id === todoId)
    if (todoIndex === -1) {
      return { success: false, message: "Todo not found" }
    }

    this.mockData.todos[todoIndex] = {
      ...this.mockData.todos[todoIndex],
      ...data,
      updated_at: new Date().toISOString(),
    }

    return { success: true, data: this.mockData.todos[todoIndex] }
  }

  // API methods
  static async mockGet(endpoint) {
    return this.mockRequest("GET", endpoint)
  }

  static async get(endpoint, queryParams = {}) {
    return this.request("GET", endpoint, undefined, queryParams)
  }

  static async mockPost(endpoint, data) {
    return this.mockRequest("POST", endpoint, data)
  }

  static async post(endpoint, data, queryParams = {}) {
    return this.request("POST", endpoint, data, queryParams)
  }

  static async put(endpoint, data) {
    return this.mockRequest("PUT", endpoint, data)
  }

  static async delete(endpoint) {
    return this.mockRequest("DELETE", endpoint)
  }
}
