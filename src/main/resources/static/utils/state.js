class StateManager {
  constructor() {
    this.state = {}
    this.subscribers = new Map()
    this.middleware = []
  }

  
  getState() {
    return { ...this.state }
  }

  
  setState(updates, path = null) {
    const prevState = { ...this.state }

    if (path) {
      this.setNestedState(updates, path)
    } else {
      this.state = { ...this.state, ...updates }
    }

    
    this.applyMiddleware(prevState, this.state, updates)

    
    this.notifySubscribers(prevState, this.state, updates)
  }

  
  setNestedState(value, path) {
    const keys = path.split(".")
    let current = this.state

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {}
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = value
  }

  
  getNestedState(path) {
    const keys = path.split(".")
    let current = this.state

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  
  subscribe(callback, path = null) {
    const id = Date.now() + Math.random()

    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Map())
    }

    this.subscribers.get(path).set(id, callback)

    
    return () => {
      if (this.subscribers.has(path)) {
        this.subscribers.get(path).delete(id)
        if (this.subscribers.get(path).size === 0) {
          this.subscribers.delete(path)
        }
      }
    }
  }

  
  notifySubscribers(prevState, newState, updates) {
    
    if (this.subscribers.has(null)) {
      this.subscribers.get(null).forEach((callback) => {
        try {
          callback(newState, prevState, updates)
        } catch (error) {
        }
      })
    }

    
    this.subscribers.forEach((pathSubscribers, path) => {
      if (path && this.hasPathChanged(prevState, newState, path)) {
        const currentValue = this.getNestedState(path)
        pathSubscribers.forEach((callback) => {
          try {
            callback(currentValue, newState, prevState)
          } catch (error) {
          }
        })
      }
    })
  }

  
  hasPathChanged(prevState, newState, path) {
    const prevValue = this.getValueFromState(prevState, path)
    const newValue = this.getValueFromState(newState, path)
    return JSON.stringify(prevValue) !== JSON.stringify(newValue)
  }

  getValueFromState(state, path) {
    const keys = path.split(".")
    let current = state

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  
  addMiddleware(middleware) {
    this.middleware.push(middleware)
  }

  
  applyMiddleware(prevState, newState, updates) {
    this.middleware.forEach((middleware) => {
      try {
        middleware(prevState, newState, updates)
      } catch (error) {
      }
    })
  }

  
  reset() {
    const prevState = { ...this.state }
    this.state = {}
    this.notifySubscribers(prevState, this.state, {})
  }

  
  batch(updateFn) {
    const prevState = { ...this.state }
    updateFn((updates) => {
      this.state = { ...this.state, ...updates }
    })
    this.notifySubscribers(prevState, this.state, {})
  }

  
  computed(computeFn, dependencies = []) {
    let cachedValue
    let cachedDeps

    return () => {
      const currentDeps = dependencies.map((dep) => this.getNestedState(dep))

      if (!cachedDeps || !this.arraysEqual(cachedDeps, currentDeps)) {
        cachedValue = computeFn(this.state)
        cachedDeps = currentDeps
      }

      return cachedValue
    }
  }

  arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  
  persist(key = "app_state") {
    try {
      localStorage.setItem(key, JSON.stringify(this.state))
    } catch (error) {
    }
  }

  restore(key = "app_state") {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        this.state = JSON.parse(saved)
        this.notifySubscribers({}, this.state, this.state)
      }
    } catch (error) {
    }
  }
}


const stateManager = new StateManager()

export default stateManager
