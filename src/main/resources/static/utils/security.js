class SecurityUtils {
  
  static sanitizeText(text) {
    if (typeof text !== "string") return text

    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  static sanitizeHTML(html) {
    if (typeof html !== "string") return html

    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "")
  }

  
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateUsername(username) {
    if (!username || typeof username !== "string") return false

    
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
    return usernameRegex.test(username)
  }

  static validatePassword(password) {
    if (!password || typeof password !== "string") return false

    
    return password.length >= 8
  }

  
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

  
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  static truncateText(text, maxLength = 100) {
    if (!text || typeof text !== "string") return ""

    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + "..."
  }

  
  static isValidURL(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  
  static createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map()

    return (identifier) => {
      const now = Date.now()
      const userAttempts = attempts.get(identifier) || []

      
      const validAttempts = userAttempts.filter((time) => now - time < windowMs)

      if (validAttempts.length >= maxAttempts) {
        return false 
      }

      validAttempts.push(now)
      attempts.set(identifier, validAttempts)
      return true 
    }
  }
}

export default SecurityUtils
