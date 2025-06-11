import ApiService from "./api.js"

export default class ConfigService {
  static config = {}
  static publicConfigIsLoaded = false
  static isLoaded = false

  static async getConfig() {
    if (!this.isLoaded) {
      await this.loadPublicConfig()
      await this.loadConfig()
    }
    return this.config
  }

  static async loadPublicConfig() {
    if (this.publicConfigIsLoaded) {
      return this.config;
    }

    try {
      const config = await ApiService.get('/config/public');
      this.config = config
      this.publicConfigIsLoaded = true
      return this.config
    } catch (error) {
    }
  }

  static async loadConfig() {
    if (this.isLoaded) {
      return this.config
    }

    try {
      const config = await ApiService.get('/config')

      this.config = {
        ...this.config,
        ...config
      }
      this.isLoaded = true
      return this.config
    } catch (error) {
      
      this.config = this.getDefaultConfig()
      this.isLoaded = true
      return this.config
    }
  }

  static getDefaultConfig() {
    return {
      apiBaseUrl: `${window.location.origin}/api`,
      APP_NAME: "Team Todo App",
      SESSION_TIMEOUT: 3600000, 
      MAX_FILE_SIZE: 5242880, 
      SUPPORTED_FILE_TYPES: [],
      PAGINATION_SIZE: 20,
      PASSWORD_MIN_LENGTH: 8,
      USERNAME_MIN_LENGTH: 3,
      USERNAME_MAX_LENGTH: 50,
      TODO_TITLE_MAX_LENGTH: 128,
      TODO_DESCRIPTION_MAX_LENGTH: 512,
      TEAM_NAME_MAX_LENGTH: 100,
      TWO_FA_ISSUER: "Team Todo App",
      TOAST_DURATION: 5000,
      AUTO_LOGOUT_WARNING: 300000, 
      THEME_OPTIONS: ["light", "dark", "auto"],
      DEFAULT_THEME: "light",
    }
  }

  static get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue
  }

  static async refresh() {
    this.isLoaded = false
    return await this.loadConfig()
  }

  static getApiUrl(endpoint) {
    const baseUrl = this.get("API_BASE_URL", "/api")
    return `${baseUrl}${endpoint}`
  }
}
