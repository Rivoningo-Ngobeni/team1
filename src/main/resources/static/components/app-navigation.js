import AuthService from "../utils/auth.js"
import PermissionService from "../utils/permissions.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"

class AppNavigation extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.render()
    this.updateActiveLink()

    
    window.addEventListener("popstate", () => {
      this.updateActiveLink()
    })
  }

  render() {
    const user = AuthService.getCurrentUser()
    const isSystemAdmin = PermissionService.isSystemAdmin(user)

    this.innerHTML = `
      <nav class="navigation" role="navigation" aria-label="Main navigation">
          <header class="user-info">
              <div class="username">${SecurityUtils.sanitizeText(user?.username || "User")}</div>
              <div class="user-roles">${SecurityUtils.sanitizeText(
                  ((user?.systemRoles || []).concat(user?.teamRoles || [])).join(", ") || "No roles"
              )}</div>
          </header>
          
          <section class="nav-section">
              <h2 class="nav-section-title">Main</h2>
              <ul class="nav-menu" role="menubar">
                  <li class="nav-item" role="none">
                      <a href="#/dashboard" 
                         class="nav-link" 
                         data-route="/dashboard"
                         role="menuitem"
                         aria-label="Go to Dashboard">
                          <svg class="nav-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                          </svg>
                          Dashboard
                      </a>
                  </li>
                  <li class="nav-item" role="none">
                      <a href="#/teams" 
                         class="nav-link" 
                         data-route="/teams"
                         role="menuitem"
                         aria-label="Go to Teams">
                          <svg class="nav-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                          </svg>
                          Teams
                      </a>
                  </li>
              </ul>
          </section>
          
          ${
            isSystemAdmin
              ? `
              <section class="nav-section">
                  <h2 class="nav-section-title">Administration</h2>
                  <ul class="nav-menu" role="menubar">
                      <li class="nav-item" role="none">
                          <a href="#/admin/users" 
                             class="nav-link" 
                             data-route="/admin/users"
                             role="menuitem"
                             aria-label="Go to User Management">
                              <svg class="nav-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                              </svg>
                              User Management
                          </a>
                      </li>
                  </ul>
              </section>
          `
              : ""
          }
          
          <section class="logout-section">
              <button class="logout-btn" 
                      type="button"
                      aria-label="Sign out of your account">
                  <svg class="nav-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
                  </svg>
                  Sign Out
              </button>
          </section>
      </nav>
    `

    
    this.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const route = link.getAttribute("data-route")
        Router.navigate(route)
      })
    })

    const logoutBtn = this.querySelector(".logout-btn")
    logoutBtn.addEventListener("click", () => {
      AuthService.logout()
      Router.navigate("/login")
    })
  }

  updateActiveLink() {
    const currentPath = Router.getCurrentPath()
    this.querySelectorAll(".nav-link").forEach((link) => {
      const route = link.getAttribute("data-route")
      link.classList.toggle("active", currentPath === route)
    })
  }
}

customElements.define("app-navigation", AppNavigation)
export default AppNavigation
