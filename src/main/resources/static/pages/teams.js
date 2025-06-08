import { ToastService } from "../components/app-toast.js"
import ApiService from "../utils/api.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"
import PermissionService from "../utils/permissions.js"

class TeamsPage {
  static teamsList = []

  static async render() {
    const app = document.getElementById("app")
    app.innerHTML = ""

    // Create main layout
    const layout = document.createElement("div")
    layout.className = "main-layout"

    // Sidebar navigation
    const sidebar = document.createElement("aside")
    sidebar.setAttribute("role", "navigation")
    sidebar.setAttribute("aria-label", "Main navigation")
    const navigation = document.createElement("app-navigation")
    sidebar.appendChild(navigation)

    // Main content
    const content = document.createElement("div")
    content.className = "content"

    // Header
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

    // Main content area
    const main = document.createElement("main")
    main.id = "main-content"
    main.setAttribute("role", "main")
    main.setAttribute("aria-label", "Teams content")

    // Search and filter
    const searchContainer = document.createElement("div")
    searchContainer.className = "flex items-center justify-between mb-4"
    searchContainer.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="search" class="form-control" id="search-input" placeholder="Search teams..." aria-label="Search teams">
            </div>
        `

    // Teams container
    const teamsContainer = document.createElement("div")
    teamsContainer.id = "teams-container"
    teamsContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    teamsContainer.setAttribute("role", "list")
    teamsContainer.setAttribute("aria-label", "Teams list")

    // Assemble the page
    main.appendChild(searchContainer)
    main.appendChild(teamsContainer)
    content.appendChild(header)
    content.appendChild(main)
    layout.appendChild(sidebar)
    layout.appendChild(content)
    app.appendChild(layout)

    // Setup listeners and load data
    this.setupEventListeners()
    await this.loadTeams()
  }

  static setupEventListeners() {
    const createTeamBtn = document.getElementById("create-team-btn")
    const searchInput = document.getElementById("search-input")

    createTeamBtn.addEventListener("click", () => this.showCreateTeamModal())

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filterTeams(e.target.value)
      })
    }
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
        console.log(error)
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

    teams.forEach(async (team) => {
       const isTeamLead = await PermissionService.isTeamLead(team.teamId)
      const teamCard = document.createElement("div")
      teamCard.className = "team-card"
      teamCard.setAttribute("role", "listitem")
      teamCard.innerHTML = `
                <article class="bg-surface p-4 rounded shadow border-left">
                    <h3 class="mb-2">${SecurityUtils.sanitizeText(team.teamName)}</h3>
                    <div class="flex items-center text-secondary mb-4">
                        <span>Role: ${isTeamLead ? "Team Lead" : "Team Member"}</span>
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

      // Event listeners
      const viewBtn = teamCard.querySelector(".view-team-btn")
      if (viewBtn) {
        viewBtn.addEventListener("click", (e) => {
          const teamId = e.target.getAttribute("data-id")
          Router.navigate(`/teams/${teamId}/todos`)
        })
      }

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

  static filterTeams(searchValue) {
    if (!this.teamsList) return

    const filteredTeams = this.teamsList.filter((team) =>
      team.name.toLowerCase().includes(searchValue.toLowerCase()),
    )

    this.renderTeams(filteredTeams)
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

    // Event listeners
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

      // Validate
      if (teamName.length < 3) {
        teamNameError.textContent = "Team name must be at least 3 characters"
        return
      } else {
        teamNameError.textContent = ""
      }

      createBtn.disabled = true
      createBtn.textContent = "Creating..."

      try {
        const response = await ApiService.post("/teams", { name: teamName })

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
