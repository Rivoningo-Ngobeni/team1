class Router {
  constructor() {
    this.routes = {}
    this.regexRoutes = []
    this.currentPath = "/"
    this.beforeRouteChange = null
    this.afterRouteChange = null
  }

  init() {
    
    window.addEventListener("hashchange", () => {
      this.handleRoute()
    })

    
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

    
    if (this.beforeRouteChange) {
      const shouldContinue = this.beforeRouteChange(this.currentPath, path)
      if (shouldContinue === false) return
    }

    this.currentPath = path
    
    
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    
    const newURL = window.location.pathname + window.location.search + '#' + path;
    
    if (replace) {
      history.replaceState(null, "", '#' + path)
    } else {
      history.pushState(null, "", '#' + path)
    }

    this.handleRoute(payload)
  }

  handleRoute(payload = undefined) {
    
    const hash = window.location.hash.replace(/^#\/?/, "/") || "/"
    this.currentPath = hash

    
    this.updateDocumentTitle(hash)

    
    const protectedRoutes = ["/dashboard", "/teams", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => hash.startsWith(route))

    if (isProtectedRoute && !window.AuthService?.isAuthenticated()) {
      this.navigate("/login")
      return
    }

    
    const authRoutes = ["/login", "/signup", "/two-factor", "/totp-setup"]
    const isAuthRoute = authRoutes.includes(hash)

    if (isAuthRoute && window.AuthService?.isAuthenticated()) {
      this.navigate("/dashboard")
      return
    }

    
    let handler = this.routes[hash]

    
    if (!handler) {
      for (const route of this.regexRoutes) {
        const match = hash.match(route.pattern)
        if (match) {
          handler = (payload) => route.handler(match, payload)
          break
        }
      }
    }

    
    if (!handler) {
      handler = this.routes["/404"]
    }

    if (handler) {
      try {
        handler(payload)

        
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


const router = new Router()
export default router
