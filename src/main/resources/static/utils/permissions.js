import authService from "./auth.js"
import ApiService from "./api.js"

export default class PermissionService {
  static hasSystemRole(user, role) {
    return user && user.system_roles && user.system_roles.includes(role)
  }

  static isSystemAdmin(user = null) {
    const currentUser = user || authService.getCurrentUser()
    return this.hasSystemRole(currentUser, "system_admin")
  }

  static async getTeamRole(teamId, userId = null) {
    const currentUser = userId ? { id: userId } : authService.getCurrentUser()
    if (!currentUser) return null

    try {
      const response = await ApiService.get(`/teaminfo/${teamId}/members`)
        const member = response.find((m) => m.userId === currentUser.id)
        return member ? member.roleName : null
    } catch (error) {
      console.error("Error getting team role:", error)
    }
    return null
  }

  static async isTeamLead(teamId, userId = null) {
    const role = await this.getTeamRole(teamId, userId)
    return role === "team_lead"
  }

  static async canManageTeam(teamId, userId = null) {
    const currentUser = userId ? { id: userId } : authService.getCurrentUser()
    if (!currentUser) return false

    // System admins can manage any team
    if (this.isSystemAdmin(currentUser)) return true

    // Team leads can manage their teams
    return await this.isTeamLead(teamId, currentUser.id)
  }

  static canManageUsers(user = null) {
    return this.isSystemAdmin(user)
  }

  static async canEditTodo(todo, userId = null) {
    const currentUser = userId ? { id: userId } : authService.getCurrentUser()
    if (!currentUser) return false

    // System admins can edit any todo
    if (this.isSystemAdmin(currentUser)) return true

    // Todo creator can edit
    if (todo.createdBy.id === currentUser.id) return true

    // Team leads can edit team todos
    return await this.isTeamLead(todo.team.id, currentUser.id)
  }
}
