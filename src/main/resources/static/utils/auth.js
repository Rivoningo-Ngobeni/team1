import ApiService from "./api.js"
import ConfigService from "./config.js"
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

  async login(username, password, totpCode) {
    try {
      // Validate inputs
      if (!SecurityUtils.validateUsername(username)) {
        return { success: false, message: "Invalid username format" }
      }

      if (!SecurityUtils.validatePassword(password)) {
        return { success: false, message: "Password must be at least 8 characters" }
      }

      // Make login request
      const [response, success] = await ApiService.login(username, password, totpCode)

      if (success) {
        this.setSession(response.user, response.token, response.refreshToken)
        await ConfigService.loadConfig();
      }
      return {
        success,
        message: response.message,
        token: response.token,
        role: response.role,
        user: response.user,
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Login failed. Please try again." }
    }
  }

  async register(username, password) {
    try {
      // Validate inputs
      if (!SecurityUtils.validateUsername(username)) {
        return { success: false, message: "Username must be 3-50 characters, letters, numbers, and underscores only" }
      }

      if (!SecurityUtils.validatePassword(password)) {
        return { success: false, message: "Password must be at least 8 characters" }
      }

      // Make register request
      const [registerResponse, success] = await ApiService.register(username, password);

      return [registerResponse, success]
    } catch (error) {
      console.error("Signup error:", error)
      return [
        {
          message: "Signup failed. Please try again.",
        },
        false,
      ]
    }
  }

  async verifyTwoFactor(username, code) {
    try {
      if (!code) {
        return [
          {
            message: "Verification code is required",
          },
          false,
        ]
      } else if (!username) {
        return [
          {
            message: "Username is required",
          },
          false,
        ]
      } else if (!/^\d{6}$/.test(code)) {
        return [
          {
            message: "Verification code must be 6 numeric digits",
          },
          false,
        ]
      }

      const [response, success] = await ApiService.verifyTwoFactor(username, code)
      return [response, success]
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

  async loadSession() {
    this.currentUser = StorageService.getSecure("current_user")
    this.authToken = StorageService.getSecure("auth_token")
    this.refreshToken = StorageService.getSecure("refresh_token")

    if (this.authToken && this.refreshToken) {
      await ConfigService.loadConfig();
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
      const response = await ApiService.mockPost("/auth/refresh", {
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
      const response = await ApiService.mockGet("/auth/validate")
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
