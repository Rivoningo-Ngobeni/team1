import ApiService from "./api.js"
import authService from "./auth.js"

export default class PermissionService {
  static hasSystemRole(user, role) {
    return user && user.systemRoles && user.systemRoles.includes(role)
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

    
    if (this.isSystemAdmin(currentUser)) return true

    
    return await this.isTeamLead(teamId, currentUser.id)
  }

  static canManageUsers(user = null) {
    return this.isSystemAdmin(user)
  }

  static async canEditTodo(todo, userId = null) {
    try {
      const currentUser = userId ? { id: userId } : authService.getCurrentUser()
      if (!currentUser) return false

      
      if (this.isSystemAdmin(currentUser)) return true

      
      if (todo.createdBy && todo.createdBy.id === currentUser.id) return true

      
      if (todo.team && todo.team.id) {
        try {
          
          const response = await ApiService.get(`/api/full-todos/can-edit/${todo.id}/user/${currentUser.id}`)
          return response === true
        } catch (error) {
          
          
          
          const teamId = todo.team.id
          const role = await this.getTeamRole(teamId, currentUser.id)
          return role !== null 
        }
      }
    } catch (error) {
    }

    return false
  }
}
