import ApiService from "./api.js"
import SecurityUtils from "./security.js"
import StorageService from "./storage.js"

class AuthService {
  constructor() {
    this.currentUser = null
    this.authToken = null
    this.refreshToken = null
    this.tokenRefreshTimer = null
    this.sessionCheckInterval = null

    this.init()
  }

  init() {
    // Load existing session
    this.loadSession()

    // Setup session monitoring
    this.startSessionMonitoring()

    // Setup CSRF protection
    this.setupCSRFProtection()
  }

  async login(username, password) {
    try {
      // Validate inputs
      if (!SecurityUtils.validateUsername(username)) {
        return { success: false, message: "Invalid username format" }
      }

      if (!SecurityUtils.validatePassword(password)) {
        return { success: false, message: "Password must be at least 8 characters" }
      }

      // Make login request
      const response = await ApiService.mockPost("/auth/login", {
        username: SecurityUtils.sanitizeText(username),
        password: password, // Don't sanitize password
      })

      if (response.success) {
        if (response.requiresTwoFactor) {
          // Store temporary auth data for 2FA
          StorageService.setSecure("temp_auth", {
            username,
            partialToken: response.partialToken,
          })
          return { success: true, requiresTwoFactor: true }
        } else {
          // Complete login
          this.setSession(response.user, response.token, response.refreshToken)
          return { success: true, user: response.user }
        }
      }

      return response
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Login failed. Please try again." }
    }
  }

  async signup(username, password) {
    try {
      // Validate inputs
      if (!SecurityUtils.validateUsername(username)) {
        return { success: false, message: "Username must be 3-50 characters, letters, numbers, and underscores only" }
      }

      if (!SecurityUtils.validatePassword(password)) {
        return { success: false, message: "Password must be at least 8 characters" }
      }

      // Make signup request
      const response = await ApiService.post("/auth/signup", {
        username: SecurityUtils.sanitizeText(username),
        password: password,
      })

      return response
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, message: "Signup failed. Please try again." }
    }
  }

  async verifyTwoFactor(code) {
    try {
      const tempAuth = StorageService.getSecure("temp_auth")
      if (!tempAuth) {
        return { success: false, message: "Session expired. Please login again." }
      }

      const response = await ApiService.mockPost("/auth/verify-2fa", {
        username: tempAuth.username,
        code: SecurityUtils.sanitizeText(code),
        partialToken: tempAuth.partialToken,
      })

      if (response.success) {
        // Clear temporary auth data
        StorageService.remove("temp_auth")

        // Set full session
        this.setSession(response.user, response.token, response.refreshToken)
      }

      return response
    } catch (error) {
      console.error("2FA verification error:", error)
      return { success: false, message: "Verification failed. Please try again." }
    }
  }

  setSession(user, token, refreshToken = null) {
    this.currentUser = user
    this.authToken = token
    this.refreshToken = refreshToken

    // Store in secure storage
    StorageService.setSecure("current_user", user)
    StorageService.setSecure("auth_token", token)
    if (refreshToken) {
      StorageService.setSecure("refresh_token", refreshToken)
    }

    // Setup token refresh if refresh token is available
    if (refreshToken) {
      this.scheduleTokenRefresh()
    }

    // Update CSRF token
    this.updateCSRFToken()
  }

  loadSession() {
    this.currentUser = StorageService.getSecure("current_user")
    this.authToken = StorageService.getSecure("auth_token")
    this.refreshToken = StorageService.getSecure("refresh_token")

    if (this.authToken && this.refreshToken) {
      this.scheduleTokenRefresh()
    }
  }

  logout() {
    // Clear timers
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }

    // Clear session data
    this.currentUser = null
    this.authToken = null
    this.refreshToken = null

    // Clear storage
    StorageService.remove("current_user")
    StorageService.remove("auth_token")
    StorageService.remove("refresh_token")
    StorageService.remove("temp_auth")
    StorageService.remove("csrf_token")

    // Clear any cached data
    const keys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    keys.forEach((key) => {
      if (key.includes("cache_")) {
        StorageService.remove(key.replace("team_todo_", ""))
      }
    })
  }

  isAuthenticated() {
    return !!(this.authToken && this.currentUser)
  }

  getCurrentUser() {
    return this.currentUser
  }

  getAuthToken() {
    return this.authToken
  }

  async refreshAuthToken() {
    if (!this.refreshToken) {
      this.logout()
      return false
    }

    try {
      const response = await ApiService.post("/auth/refresh", {
        refreshToken: this.refreshToken,
      })

      if (response.success) {
        this.authToken = response.token
        StorageService.setSecure("auth_token", response.token)

        if (response.refreshToken) {
          this.refreshToken = response.refreshToken
          StorageService.setSecure("refresh_token", response.refreshToken)
        }

        this.scheduleTokenRefresh()
        return true
      } else {
        this.logout()
        return false
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      this.logout()
      return false
    }
  }

  scheduleTokenRefresh() {
    // Refresh token 5 minutes before expiry (assuming 1 hour tokens)
    const refreshTime = 55 * 60 * 1000 // 55 minutes

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
    }

    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshAuthToken()
    }, refreshTime)
  }

  startSessionMonitoring() {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(
      () => {
        if (this.isAuthenticated()) {
          this.validateSession()
        }
      },
      5 * 60 * 1000,
    )
  }

  async validateSession() {
    try {
      const response = await ApiService.get("/auth/validate")
      if (!response.success) {
        this.logout()
        window.dispatchEvent(new CustomEvent("auth:session-expired"))
      }
    } catch (error) {
      console.error("Session validation error:", error)
    }
  }

  setupCSRFProtection() {
    this.updateCSRFToken()
  }

  updateCSRFToken() {
    const token = SecurityUtils.generateCSRFToken()
    SecurityUtils.setCSRFToken(token)
  }

  getCSRFToken() {
    return SecurityUtils.getCSRFToken()
  }

  // Password strength checker
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const score = Object.values(checks).filter(Boolean).length

    let strength = "weak"
    if (score >= 4) strength = "strong"
    else if (score >= 3) strength = "medium"

    return {
      score,
      strength,
      checks,
      suggestions: this.getPasswordSuggestions(checks),
    }
  }

  getPasswordSuggestions(checks) {
    const suggestions = []
    if (!checks.length) suggestions.push("Use at least 8 characters")
    if (!checks.lowercase) suggestions.push("Add lowercase letters")
    if (!checks.uppercase) suggestions.push("Add uppercase letters")
    if (!checks.numbers) suggestions.push("Add numbers")
    if (!checks.symbols) suggestions.push("Add special characters")
    return suggestions
  }
}

// Create singleton instance
const authService = new AuthService()
export default authService
