class StorageService {
  constructor() {
    this.prefix = "team_todo_"
  }

  
  setSecure(key, value) {
    try {
      const fullKey = this.prefix + key
      const dataToStore = JSON.stringify(value)

      if (this.isSessionData(key)) {
        sessionStorage.setItem(fullKey, dataToStore)
      } else {
        localStorage.setItem(fullKey, dataToStore)
      }
      return true
    } catch (error) {
      return false
    }
  }

  getSecure(key) {
    try {
      const fullKey = this.prefix + key
      let data

      if (this.isSessionData(key)) {
        data = sessionStorage.getItem(fullKey)
      } else {
        data = localStorage.getItem(fullKey)
      }

      if (!data) return null

      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  remove(key) {
    const fullKey = this.prefix + key
    localStorage.removeItem(fullKey)
    sessionStorage.removeItem(fullKey)
  }

  
  isSessionData(key) {
    const sessionKeys = ["auth_token", "csrf_token", "temp_data"]
    return sessionKeys.includes(key)
  }

  
  setCache(key, value, ttl = 3600000) {
    
    const cacheData = {
      value,
      timestamp: Date.now(),
      ttl,
    }
    this.setSecure(`cache_${key}`, cacheData)
  }

  getCache(key) {
    const cacheData = this.getSecure(`cache_${key}`)
    if (!cacheData) return null

    const { value, timestamp, ttl } = cacheData
    if (Date.now() - timestamp > ttl) {
      this.remove(`cache_${key}`)
      return null
    }

    return value
  }

  
  clearAll() {
    const keys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      }
    })
  }

  
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


const storageService = new StorageService()
export default storageService
