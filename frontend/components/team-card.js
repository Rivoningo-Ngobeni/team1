import SecurityUtils from "../utils/security.js"
import BaseComponent from "./base-component.js"

class TeamCard extends BaseComponent {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  setTeam(team) {
    this.team = team
    this.render()
  }

  render() {
    if (!this.team) return

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .team-card {
                    background: var(--surface-color);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    padding: 1.5rem;
                    transition: all 0.2s;
                }
                
                .team-card:hover {
                    box-shadow: var(--shadow-lg);
                }
                
                .team-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                
                .team-name {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                
                .team-role {
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    background-color: rgba(37, 99, 235, 0.1);
                    color: var(--primary-color);
                    text-transform: capitalize;
                }
                
                .team-meta {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                }
                
                .team-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                .action-btn {
                    background: none;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                
                .action-btn:hover {
                    background-color: var(--background-color);
                }
                
                .action-btn.primary {
                    background-color: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                
                .action-btn.primary:hover {
                    background-color: var(--primary-hover);
                }
            </style>
            <div class="team-card">
                <div class="team-header">
                    <h3 class="team-name">${SecurityUtils.sanitizeText(this.team.name)}</h3>
                    <span class="team-role">${SecurityUtils.sanitizeText(this.team.role_name?.replace("_", " ") || "member")}</span>
                </div>
                <div class="team-meta">
                    <span>Created: ${SecurityUtils.sanitizeText(new Date(this.team.created_at).toLocaleDateString())}</span>
                    <span>Members: ${this.team.member_count || 0}</span>
                </div>
                <div class="team-actions">
                    <button class="action-btn primary" data-action="view">View Todos</button>
                    ${this.team.role_name === "team_lead" ? '<button class="action-btn" data-action="manage">Manage Members</button>' : ""}
                </div>
            </div>
        `

    // Add action handlers
    this.shadowRoot.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action")
        this.emit("team-action", { action, teamId: this.team.id })
        
        // Add direct global call for better reliability
        if (window.TeamsPage) {
          try {
            window.TeamsPage.handleTeamAction(action, this.team.id);
          } catch (error) {
            console.error('Error calling TeamsPage handler:', error);
          }
        }
      })
    })
  }
}

customElements.define("team-card", TeamCard)
