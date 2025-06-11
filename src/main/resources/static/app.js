import { ToastService } from "./components/app-toast.js"
import DashboardPage from "./pages/dashboard.js"
import LoginPage from "./pages/login.js"
import SignupPage from "./pages/signup.js"
import TeamManagementPage from "./pages/team-management.js"
import TeamsPage from "./pages/teams.js"
import TodoFormPage from "./pages/todo-form.js"
import TotpSetupPage from "./pages/totp-setup.js"
import TwoFactorPage from "./pages/two-factor.js"
import UserManagementPage from "./pages/user-management.js"
import AuthService from "./utils/auth.js"
import ConfigService from "./utils/config.js"
import Router from "./utils/router.js"


class App {
  static async init() {
    try {
      
      await ConfigService.loadPublicConfig()

      
      Router.addRoute("/login", (payload) => LoginPage.render(payload))
      Router.addRoute("/signup", (payload) => SignupPage.render(payload))
      Router.addRoute("/totp-setup", (payload) => TotpSetupPage.render(payload))
      Router.addRoute("/two-factor", (payload) => TwoFactorPage.render(payload))
      Router.addRoute("/dashboard", (payload) => DashboardPage.render(payload))
      Router.addRoute("/teams", (payload) => TeamsPage.render(payload))
      Router.addRoute("/admin/users", (payload) => UserManagementPage.render(payload))
      Router.addRoute("/404", () => this.render404())
      Router.addRoute("/", () => {
        if (AuthService.isAuthenticated()) {
          Router.navigate("/dashboard")
        } else {
          Router.navigate("/login")
        }
      })

      
      Router.addRoute("/todos/create", () => TodoFormPage.render())
      Router.addRoute(/^\/todos\/(\d+)\/edit$/, (match) => {
        const todoId = match[1]
        TodoFormPage.render(todoId)
      })

      
      Router.addRoute(/^\/teams\/(\d+)\/manage$/, (match) => {
        const teamId = match[1]
        TeamManagementPage.render(teamId)
      })

      
      window.AuthService = AuthService
      window.Router = Router
      window.ToastService = ToastService

      
      Router.init()

      
      window.addEventListener("error", (e) => {
        ToastService.show("An unexpected error occurred", "error")
      })

      
      window.addEventListener("unhandledrejection", (e) => {
        ToastService.show("An unexpected error occurred", "error")
      })

      
      this.setupAutoLogoutWarning()

      
      this.setupAccessibility()

      
      this.setupSessionMonitoring()
    } catch (error) {
      ToastService.show("Failed to initialize application", "error")
    }
  }

  static setupAutoLogoutWarning() {
    const warningTime = ConfigService.get("AUTO_LOGOUT_WARNING", 300000) 
    const sessionTimeout = ConfigService.get("SESSION_TIMEOUT", 3600000) 

    if (AuthService.isAuthenticated()) {
      
      setTimeout(() => {
        if (AuthService.isAuthenticated()) {
          ToastService.show("Your session will expire soon. Please save your work.", "warning", 10000)
        }
      }, sessionTimeout - warningTime)

      
      setTimeout(() => {
        if (AuthService.isAuthenticated()) {
          AuthService.logout()
          Router.navigate("/login")
          ToastService.show("Session expired. Please log in again.", "info")
        }
      }, sessionTimeout)
    }
  }

  static setupAccessibility() {
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.querySelector(".modal-overlay")
        if (modal) {
          const closeBtn = modal.querySelector('[aria-label*="Cancel"], [aria-label*="Close"]')
          if (closeBtn) {
            closeBtn.click()
          }
        }
      }
    })

    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              
              if (node.classList?.contains("modal-overlay")) {
                const firstInput = node.querySelector("input, button, select, textarea")
                if (firstInput) {
                  setTimeout(() => firstInput.focus(), 100)
                }
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    
    Router.setAfterRouteChange((path) => {
      const pageTitle = document.querySelector("h1")?.textContent || "Page"
      this.announceToScreenReader(`Navigated to ${pageTitle}`)
    })
  }

  static setupSessionMonitoring() {
    
    window.addEventListener("auth:session-expired", () => {
      ToastService.show("Your session has expired. Please log in again.", "warning")
      Router.navigate("/login")
    })

    
    let wasAuthenticated = AuthService.isAuthenticated()
    setInterval(() => {
      const isAuthenticated = AuthService.isAuthenticated()
      if (wasAuthenticated && !isAuthenticated) {
        
        Router.navigate("/login")
        ToastService.show("You have been logged out.", "info")
      }
      wasAuthenticated = isAuthenticated
    }, 5000)
  }

  static announceToScreenReader(message) {
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement)
      }
    }, 1000)
  }

  static render404() {
    const app = document.getElementById("app")
    app.innerHTML = `
            <main class="error-page" role="main">
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: var(--spacing-lg);">
                    <article>
                        <header>
                            <h1 style="font-size: 4rem; color: var(--text-primary); margin-bottom: var(--spacing-md);">404</h1>
                            <h2 style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">Page Not Found</h2>
                        </header>
                        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl); max-width: 400px;">
                            The page you're looking for doesn't exist or has been moved.
                        </p>
                        <footer>
                        </footer>
                    </article>
                </div>
            </main>
        `
  }
}


document.addEventListener("DOMContentLoaded", () => {
  App.init()
})

export default App
