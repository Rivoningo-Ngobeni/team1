class StorageService {
  constructor() {
    this.prefix = "team_todo_"
    this.encryptionKey = this.getOrCreateEncryptionKey()
  }

  // Encryption key management
  getOrCreateEncryptionKey() {
    let key = localStorage.getItem(this.prefix + "enc_key")
    if (!key) {
      key = this.generateEncryptionKey()
      localStorage.setItem(this.prefix + "enc_key", key)
    }
    return key
  }

  generateEncryptionKey() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  // Simple encryption/decryption (for demo purposes)
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data)
      // Simple XOR encryption for demo
      let encrypted = ""
      for (let i = 0; i < jsonString.length; i++) {
        encrypted += String.fromCharCode(
          jsonString.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
        )
      }
      return btoa(encrypted)
    } catch (error) {
      console.error("Encryption error:", error)
      return null
    }
  }

  decrypt(encryptedData) {
    try {
      const encrypted = atob(encryptedData)
      let decrypted = ""
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
        )
      }
      return JSON.parse(decrypted)
    } catch (error) {
      console.error("Decryption error:", error)
      return null
    }
  }

  // Secure storage methods
  setSecure(key, value, encrypt = true) {
    try {
      const fullKey = this.prefix + key
      const dataToStore = encrypt ? this.encrypt(value) : JSON.stringify(value)

      if (this.isSessionData(key)) {
        sessionStorage.setItem(fullKey, dataToStore)
      } else {
        localStorage.setItem(fullKey, dataToStore)
      }
      return true
    } catch (error) {
      console.error("Storage error:", error)
      return false
    }
  }

  getSecure(key, decrypt = true) {
    try {
      const fullKey = this.prefix + key
      let data

      if (this.isSessionData(key)) {
        data = sessionStorage.getItem(fullKey)
      } else {
        data = localStorage.getItem(fullKey)
      }

      if (!data) return null

      return decrypt ? this.decrypt(data) : JSON.parse(data)
    } catch (error) {
      console.error("Retrieval error:", error)
      return null
    }
  }

  remove(key) {
    const fullKey = this.prefix + key
    localStorage.removeItem(fullKey)
    sessionStorage.removeItem(fullKey)
  }

  // Determine if data should be stored in session vs local storage
  isSessionData(key) {
    const sessionKeys = ["auth_token", "csrf_token", "temp_data"]
    return sessionKeys.includes(key)
  }

  // Cache management
  setCache(key, value, ttl = 3600000) {
    // Default 1 hour TTL
    const cacheData = {
      value,
      timestamp: Date.now(),
      ttl,
    }
    this.setSecure(`cache_${key}`, cacheData, false)
  }

  getCache(key) {
    const cacheData = this.getSecure(`cache_${key}`, false)
    if (!cacheData) return null

    const { value, timestamp, ttl } = cacheData
    if (Date.now() - timestamp > ttl) {
      this.remove(`cache_${key}`)
      return null
    }

    return value
  }

  // Clear all app data
  clearAll() {
    const keys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      }
    })
  }

  // Storage quota management
  getStorageUsage() {
    let totalSize = 0
    const keys = Object.keys(localStorage).concat(Object.keys(sessionStorage))

    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key)
        totalSize += key.length + (value ? value.length : 0)
      }
    })

    return {
      used: totalSize,
      usedMB: (totalSize / 1024 / 1024).toFixed(2),
    }
  }
}

// Create singleton instance
const storageService = new StorageService()
export default storageService
