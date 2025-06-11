class Router {
  constructor() {
    this.routes = {}
    this.regexRoutes = []
    this.currentPath = "/"
    this.beforeRouteChange = null
    this.afterRouteChange = null
  }

  init() {
    // Handle hash changes in the URL
    window.addEventListener("hashchange", () => {
      this.handleRoute()
    })

    // Handle initial route
    this.handleRoute()
  }

  addRoute(path, handler) {
    if (path instanceof RegExp) {
      this.regexRoutes.push({ pattern: path, handler })
    } else {
      this.routes[path] = handler
    }
  }

  navigate(path, payload = undefined, replace = false) {
    if (path === this.currentPath) return;

    // Call before route change hook
    if (this.beforeRouteChange) {
      const shouldContinue = this.beforeRouteChange(this.currentPath, path)
      if (shouldContinue === false) return
    }

    this.currentPath = path
    
    // Ensure path starts with "/" if not already
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Correctly format the hash URL (prevent ?# issue)
    const newURL = window.location.pathname + window.location.search + '#' + path;
    
    if (replace) {
      history.replaceState(null, "", '#' + path)
    } else {
      history.pushState(null, "", '#' + path)
    }

    this.handleRoute(payload)
  }

  handleRoute(payload = undefined) {
    // Extract path from hash without the "#" prefix
    const hash = window.location.hash.replace(/^#\/?/, "/") || "/"
    this.currentPath = hash

    // Update document title based on route
    this.updateDocumentTitle(hash)

    // Check authentication for protected routes
    const protectedRoutes = ["/dashboard", "/teams", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => hash.startsWith(route))

    if (isProtectedRoute && !window.AuthService?.isAuthenticated()) {
      this.navigate("/login")
      return
    }

    // Redirect authenticated users away from auth pages
    const authRoutes = ["/login", "/signup", "/two-factor", "/totp-setup"]
    const isAuthRoute = authRoutes.includes(hash)

    if (isAuthRoute && window.AuthService?.isAuthenticated()) {
      this.navigate("/dashboard")
      return
    }

    // Try exact match first
    let handler = this.routes[hash]

    // Try regex routes if no exact match
    if (!handler) {
      for (const route of this.regexRoutes) {
        const match = hash.match(route.pattern)
        if (match) {
          handler = (payload) => route.handler(match, payload)
          break
        }
      }
    }

    // Fallback to 404
    if (!handler) {
      handler = this.routes["/404"]
    }

    if (handler) {
      try {
        handler(payload)

        // Call after route change hook
        if (this.afterRouteChange) {
          this.afterRouteChange(hash)
        }
      } catch (error) {
        this.navigate("/404")
      }
    }
  }

  updateDocumentTitle(path) {
    const titles = {
      "/": "Team Todo App",
      "/login": "Sign In - Team Todo App",
      "/signup": "Sign Up - Team Todo App",
      "/two-factor": "Two-Factor Authentication - Team Todo App",
      "/dashboard": "Dashboard - Team Todo App",
      "/teams": "Teams - Team Todo App",
      "/admin/users": "User Management - Team Todo App",
      "/todos/create": "Create Task - Team Todo App",
    }

    let title = titles[path]

    // Handle dynamic routes
    if (!title) {
      if (path.includes("/teams/") && path.includes("/manage")) {
        title = "Team Management - Team Todo App"
      } else if (path.match(/^\/todos\/\d+\/edit$/)) {
        title = "Edit Task - Team Todo App" 
      } else {
        title = "Team Todo App"
      }
    }

    document.title = title
  }

  getCurrentPath() {
    return this.currentPath
  }

  setBeforeRouteChange(callback) {
    this.beforeRouteChange = callback
  }

  setAfterRouteChange(callback) {
    this.afterRouteChange = callback
  }

  // Utility methods
  getQueryParams() {
    const params = new URLSearchParams(window.location.search)
    const result = {}
    for (const [key, value] of params) {
      result[key] = value
    }
    return result
  }

  setQueryParams(params) {
    const url = new URL(window.location)
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key])
      } else {
        url.searchParams.delete(key)
      }
    })
    history.replaceState({}, "", url)
  }
}

// Create singleton instance
const router = new Router()
export default router
