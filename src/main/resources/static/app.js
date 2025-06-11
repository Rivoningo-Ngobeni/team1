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

// Initialize the application
class App {
  static async init() {
    try {
      // Load configuration first
      await ConfigService.loadPublicConfig()

      // Setup routes with payload support
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

      // Add new todo form routes
      Router.addRoute("/todos/create", () => TodoFormPage.render())
      Router.addRoute(/^\/todos\/(\d+)\/edit$/, (match) => {
        const todoId = match[1]
        TodoFormPage.render(todoId)
      })

      // Add dynamic team management routes
      Router.addRoute(/^\/teams\/(\d+)\/manage$/, (match) => {
        const teamId = match[1]
        TeamManagementPage.render(teamId)
      })

      // Make services globally available
      window.AuthService = AuthService
      window.Router = Router
      window.ToastService = ToastService

      // Initialize router
      Router.init()

      // Global error handling
      window.addEventListener("error", (e) => {
        console.error("Global error:", e.error)
        ToastService.show("An unexpected error occurred", "error")
      })

      // Global unhandled promise rejection handling
      window.addEventListener("unhandledrejection", (e) => {
        console.error("Unhandled promise rejection:", e.reason)
        ToastService.show("An unexpected error occurred", "error")
      })

      // Auto-logout warning
      this.setupAutoLogoutWarning()

      // Setup accessibility features
      this.setupAccessibility()

      // Setup session monitoring
      this.setupSessionMonitoring()
    } catch (error) {
      console.error("App initialization failed:", error)
      ToastService.show("Failed to initialize application", "error")
    }
  }

  static setupAutoLogoutWarning() {
    const warningTime = ConfigService.get("AUTO_LOGOUT_WARNING", 300000) // 5 minutes
    const sessionTimeout = ConfigService.get("SESSION_TIMEOUT", 3600000) // 1 hour

    if (AuthService.isAuthenticated()) {
      // Show warning before auto-logout
      setTimeout(() => {
        if (AuthService.isAuthenticated()) {
          ToastService.show("Your session will expire soon. Please save your work.", "warning", 10000)
        }
      }, sessionTimeout - warningTime)

      // Auto-logout
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
    // Keyboard navigation for modals
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

    // Focus management for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Auto-focus first interactive element in modals
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

    // Announce route changes to screen readers
    Router.setAfterRouteChange((path) => {
      const pageTitle = document.querySelector("h1")?.textContent || "Page"
      this.announceToScreenReader(`Navigated to ${pageTitle}`)
    })
  }

  static setupSessionMonitoring() {
    // Listen for session expiry events
    window.addEventListener("auth:session-expired", () => {
      ToastService.show("Your session has expired. Please log in again.", "warning")
      Router.navigate("/login")
    })

    // Monitor authentication state changes
    let wasAuthenticated = AuthService.isAuthenticated()
    setInterval(() => {
      const isAuthenticated = AuthService.isAuthenticated()
      if (wasAuthenticated && !isAuthenticated) {
        // User was logged out
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

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  App.init()
})

export default App
