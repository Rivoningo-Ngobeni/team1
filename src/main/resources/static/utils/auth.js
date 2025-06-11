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
    
    this.loadSession()

    
    this.startSessionMonitoring()

    
    this.setupCSRFProtection()
  }

  async login(username, password, totpCode) {
    
    if (!SecurityUtils.validateUsername(username)) {
      return { success: false, message: "Invalid username format" }
    }

    if (!SecurityUtils.validatePassword(password)) {
      return { success: false, message: "Password must be at least 8 characters" }
    }

    
    const response = await ApiService.login(username, password, totpCode)

    this.setSession(response.user, response.token, response.refreshToken)
    await ConfigService.loadConfig();
    return {
      success: true,
      message: response.message,
      token: response.token,
      systemRole: response.role,
      user: response.user,
    }

  }

  async register(username, password) {
    
    if (!SecurityUtils.validateUsername(username)) {
      throw new Error("Username must be 3-50 characters, letters, numbers, and underscores only")
    }

    if (!SecurityUtils.validatePassword(password)) {
      throw new Error("Password must be at least 8 characters")
    }

    return ApiService.register(username, password);
  }

  async verifyTwoFactor(username, code) {
    if (!code) {
      throw new Error("Verification code is required")
    } else if (!username) {
      throw new Error("Username is required")
    } else if (!/^\d{6}$/.test(code)) {
      throw new Error("Verification code must be 6 numeric digits")
    }

    return ApiService.verifyTwoFactor(username, code)
  }

  setSession(user, token, refreshToken = null) {
    this.currentUser = user
    this.authToken = token
    this.refreshToken = refreshToken

    
    StorageService.setSecure("current_user", user)
    StorageService.setSecure("auth_token", token)
    if (refreshToken) {
      StorageService.setSecure("refresh_token", refreshToken)
    }

    
    if (refreshToken) {
      this.scheduleTokenRefresh()
    }

    
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
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }

    
    this.currentUser = null
    this.authToken = null
    this.refreshToken = null

    
    StorageService.remove("current_user")
    StorageService.remove("auth_token")
    StorageService.remove("refresh_token")
    StorageService.remove("temp_auth")
    StorageService.remove("csrf_token")

    
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
      this.logout()
      return false
    }
  }

  scheduleTokenRefresh() {
    
    const refreshTime = 55 * 60 * 1000 

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
    }

    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshAuthToken()
    }, refreshTime)
  }

  startSessionMonitoring() {
    
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


const authService = new AuthService()
export default authService
