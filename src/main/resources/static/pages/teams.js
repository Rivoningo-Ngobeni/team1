import { ToastService } from "../components/app-toast.js"
import ApiService from "../utils/api.js"
import AuthService from "../utils/auth.js"
import PermissionService from "../utils/permissions.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"

class TeamsPage {
  static teamsList = []
  static currentSearchTerm = ""
  static showOnlyMyTeams = false

  static async render() {
    const app = document.getElementById("app")
    app.innerHTML = ""

    
    const style = document.createElement("style")
    style.textContent = `
      .user-team-card {
        border-left: 4px solid var(--primary-color) !important;
        background-color: var(--surface-color-hover) !important;
      }
      
      .user-team-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-color);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        margin-left: 8px;
        vertical-align: middle;
      }
    `
    document.head.appendChild(style)

    
    const layout = document.createElement("div")
    layout.className = "main-layout"

    
    const sidebar = document.createElement("aside")
    sidebar.setAttribute("role", "navigation")
    sidebar.setAttribute("aria-label", "Main navigation")
    const navigation = document.createElement("app-navigation")
    sidebar.appendChild(navigation)

    
    const content = document.createElement("div")
    content.className = "content"

    
    const header = document.createElement("header")
    header.setAttribute("role", "banner")
    header.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="page-title">Teams</h1>
                    <p class="page-subtitle">Manage your teams and collaborate with others</p>
                </div>
                <div>
                    <button type="button" class="btn btn-primary" id="create-team-btn">
                        <span aria-hidden="true">+</span> Create Team
                    </button>
                </div>
            </div>
        `

    
    const main = document.createElement("main")
    main.id = "main-content"
    main.setAttribute("role", "main")
    main.setAttribute("aria-label", "Teams content")

    
    const searchContainer = document.createElement("div")
    searchContainer.className = "flex items-center justify-between mb-4"
    searchContainer.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="search" class="form-control" id="search-input" placeholder="Search teams..." aria-label="Search teams">
            </div>
            <div class="flex items-center gap-2">
                <label for="my-teams-filter" class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="my-teams-filter" class="form-checkbox">
                    <span>Show my teams only</span>
                </label>
            </div>
        `

    
    const teamsContainer = document.createElement("div")
    teamsContainer.id = "teams-container"
    teamsContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    teamsContainer.setAttribute("role", "list")
    teamsContainer.setAttribute("aria-label", "Teams list")

    
    main.appendChild(searchContainer)
    main.appendChild(teamsContainer)
    content.appendChild(header)
    content.appendChild(main)
    layout.appendChild(sidebar)
    layout.appendChild(content)
    app.appendChild(layout)

    
    this.setupEventListeners()
    await this.loadTeams()
  }

  static setupEventListeners() {
    
    document
      .getElementById("create-team-btn")
      ?.addEventListener("click", () => this.showCreateTeamModal())

    
    document
      .getElementById("search-input")
      ?.addEventListener("input", (e) => this.filterTeams(e.target.value))
      
    
    document
      .getElementById("my-teams-filter")
      ?.addEventListener("change", (e) => this.filterMyTeams(e.target.checked))
  }

  static async loadTeams() {
    const teamsContainer = document.getElementById("teams-container")
    teamsContainer.innerHTML = `
            <div class="col-span-full flex items-center justify-center p-8">
                <div class="loading" aria-busy="true" aria-label="Loading teams">Loading...</div>
            </div>
        `

    try {
      const response = await ApiService.get("/teaminfo/all")
      const teams = response

        this.teamsList = teams
        if (this.teamsList.length === 0) {
          teamsContainer.innerHTML = `
                        <div class="col-span-full flex flex-col items-center justify-center p-8 text-center">
                            <h2>No teams found</h2>
                            <p class="text-secondary mb-4">Create a team to get started with collaborative todo management</p>
                            <button type="button" class="btn btn-primary" id="no-teams-create-btn">
                                Create Team
                            </button>
                        </div>
                    `
          document
            .getElementById("no-teams-create-btn")
            .addEventListener("click", () => this.showCreateTeamModal())
        } else {
          this.renderTeams(this.teamsList)
        }
    } catch (error) {
      teamsContainer.innerHTML = `
                <div class="col-span-full text-center p-8">
                    <div class="error-message">Error loading teams. Please try again later.</div>
                </div>
            `
      ToastService.show("Failed to load teams", "error")
    }
  }

  static renderTeams(teams) {
    const teamsContainer = document.getElementById("teams-container")
    teamsContainer.innerHTML = ""
    
    
    const currentUser = AuthService.getCurrentUser()
    
    teams.forEach(async (team) => {
      
      const isUserMember = team.members.some(member => member.userId === currentUser?.id)
      const isTeamLead = await PermissionService.isTeamLead(team.teamId)
      
      const teamCard = document.createElement("div")
      teamCard.className = "team-card"
      teamCard.setAttribute("role", "listitem")
      
      
      if (isUserMember) {
        teamCard.classList.add("user-team")
      }
      
      teamCard.innerHTML = `
                <article class="bg-surface p-4 rounded shadow border-left ${isUserMember ? 'user-team-card' : ''}">
                    <h3 class="mb-2">${SecurityUtils.sanitizeText(team.teamName)} 
                      ${isUserMember ? '<span class="user-team-badge" title="You are a member of this team">👤</span>' : ''}
                    </h3>
                    <div class="flex items-center text-secondary mb-4">
                        <span>${isUserMember ? `Role: ${isTeamLead ? "Team Lead" : "Team Member"}` : 'Not a member'}</span>
                        <span class="mx-2">•</span>
                        <span>${team.members.length} member${team.members.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div class="team-actions flex gap-2 mt-4">
                        <button type="button" class="btn btn-primary btn-sm view-team-btn" data-id="${team.teamId}">
                            View Todos
                        </button>
                        ${
                          isTeamLead
                            ? `<button type="button" class="btn btn-secondary btn-sm manage-team-btn" data-id="${team.teamId}">
                                Manage Team
                            </button>`
                            : ""
                        }
                    </div>
                </article>
            `

      const manageBtn = teamCard.querySelector(".manage-team-btn")
      if (manageBtn) {
        manageBtn.addEventListener("click", (e) => {
          const teamId = e.target.getAttribute("data-id")
          Router.navigate(`/teams/${teamId}/manage`)
        })
      }

      teamsContainer.appendChild(teamCard)
    })
  }

  static filterTeams(searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase()
    this.applyFilters()
  }
  
  static filterMyTeams(showOnlyMyTeams) {
    this.showOnlyMyTeams = showOnlyMyTeams
    this.applyFilters()
  }
  
  static applyFilters() {
    const teamCards = document.querySelectorAll(".team-card")
    
    teamCards.forEach((card) => {
      const teamName = card
        .querySelector("h3")
        ?.textContent?.toLowerCase()
      
      const matchesSearch = !this.currentSearchTerm || 
        (teamName && teamName.includes(this.currentSearchTerm))
      
      const isUserTeam = card.classList.contains('user-team')
      const matchesTeamFilter = !this.showOnlyMyTeams || isUserTeam
      
      
      const isVisible = matchesSearch && matchesTeamFilter
      card.style.display = isVisible ? "" : "none"
    })
  }

  static showCreateTeamModal() {
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.setAttribute("role", "dialog")
    modal.setAttribute("aria-modal", "true")
    modal.setAttribute("aria-labelledby", "create-team-title")

    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="create-team-title">Create New Team</h2>
                </div>
                <div class="modal-body">
                    <form id="create-team-form">
                        <div class="form-group">
                            <label for="team-name" class="form-label">Team Name</label>
                            <input type="text" id="team-name" class="form-control" placeholder="Enter team name" required>
                            <div id="team-name-error" class="form-error"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="create-btn">Create Team</button>
                </div>
            </div>
        `

    document.body.appendChild(modal)

    
    const createForm = document.getElementById("create-team-form")
    const teamNameInput = document.getElementById("team-name")
    const cancelBtn = document.getElementById("cancel-btn")
    const createBtn = document.getElementById("create-btn")
    const teamNameError = document.getElementById("team-name-error")

    teamNameInput.focus()

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })

    createBtn.addEventListener("click", async () => {
      const teamName = teamNameInput.value.trim()

      
      if (teamName.length < 3) {
        teamNameError.textContent = "Team name must be at least 3 characters"
        return
      } else {
        teamNameError.textContent = ""
      }

      createBtn.disabled = true
      createBtn.textContent = "Creating..."

      try {
        const response = await ApiService.post("/teams-updates", { name: teamName })

          ToastService.show("Team created successfully", "success")
          document.body.removeChild(modal)
          this.loadTeams()
      } catch (error) {
        teamNameError.textContent = "An error occurred. Please try again."
        createBtn.disabled = false
        createBtn.textContent = "Create Team"
      }
    })

    createForm.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        createBtn.click()
      }
    })
  }
}

export default TeamsPage
