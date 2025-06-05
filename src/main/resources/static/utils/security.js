class SecurityUtils {
  // XSS Prevention
  static sanitizeText(text) {
    if (typeof text !== "string") return text

    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  static sanitizeHTML(html) {
    if (typeof html !== "string") return html

    // Basic HTML sanitization - remove script tags and event handlers
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "")
  }

  // Input Validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateUsername(username) {
    if (!username || typeof username !== "string") return false

    // Username should be 3-50 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
    return usernameRegex.test(username)
  }

  static validatePassword(password) {
    if (!password || typeof password !== "string") return false

    // Password should be at least 8 characters
    return password.length >= 8
  }

  // CSRF Protection
  static generateCSRFToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  static setCSRFToken(token) {
    sessionStorage.setItem("csrf_token", token)
  }

  static getCSRFToken() {
    return sessionStorage.getItem("csrf_token")
  }

  // Content Security
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  static truncateText(text, maxLength = 100) {
    if (!text || typeof text !== "string") return ""

    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + "..."
  }

  // URL Validation
  static isValidURL(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Rate Limiting Helper
  static createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map()

    return (identifier) => {
      const now = Date.now()
      const userAttempts = attempts.get(identifier) || []

      // Remove old attempts outside the window
      const validAttempts = userAttempts.filter((time) => now - time < windowMs)

      if (validAttempts.length >= maxAttempts) {
        return false // Rate limited
      }

      validAttempts.push(now)
      attempts.set(identifier, validAttempts)
      return true // Allow request
    }
  }
}

export default SecurityUtils
