export default class BaseComponent extends HTMLElement {
  constructor() {
    super()
    this.eventListeners = new Map()
    this.state = {}
    this.props = {}
  }

  // Lifecycle methods
  connectedCallback() {
    this.mount()
  }

  disconnectedCallback() {
    this.unmount()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.props[name] = newValue
    this.onPropsChange(name, oldValue, newValue)
  }

  // Override in subclasses
  mount() {}
  unmount() {
    this.removeAllEventListeners()
  }
  onPropsChange(name, oldValue, newValue) {}

  // State management
  setState(updates) {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }
    this.onStateChange(prevState, this.state)
  }

  onStateChange(prevState, newState) {
    // Override in subclasses for state-based re-rendering
  }

  // Event handling
  addEventListener(element, event, handler, options = {}) {
    // Exit early if either element or event is invalid
    if (!element || !event || typeof event !== 'string') {
      console.warn('Invalid parameters for addEventListener:', { element, event });
      return;
    }

    const wrappedHandler = (e) => {
      try {
        handler.call(this, e);
      } catch (error) {
        console.error("Event handler error:", error);
        this.handleError(error);
      }
    };

    try {
      // Check if element is a valid DOM element with addEventListener method
      if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, wrappedHandler, options);
        
        // Store for cleanup
        if (!this.eventListeners.has(element)) {
          this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({
          event,
          handler: wrappedHandler,
          options,
        });
      } else {
        console.warn('Invalid element for addEventListener:', element);
      }
    } catch (e) {
      console.error("Error adding event listener:", e);
    }
  }

  removeEventListener(element, event, handler) {
    if (!element) return

    try {
      // Check if element is a valid DOM element with removeEventListener method
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler)
      } else {
        console.warn('Invalid element for removeEventListener:', element)
      }
    } catch (e) {
      console.error("Error removing event listener:", e)
    }

    // Remove from tracking
    if (this.eventListeners.has(element)) {
      const listeners = this.eventListeners.get(element)
      const index = listeners.findIndex((l) => l.event === event && l.handler === handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  removeAllEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler, options }) => {
        try {
          // Check if element is a valid DOM element with removeEventListener method
          if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options)
          }
        } catch (e) {
          console.error("Error removing event listener during cleanup:", e)
        }
      })
    })
    this.eventListeners.clear()
  }

  // Custom event emission
  emit(eventName, detail = {}, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed !== false,
    })

    this.dispatchEvent(event)
    return event
  }

  // DOM utilities
  $(selector) {
    return this.shadowRoot ? this.shadowRoot.querySelector(selector) : this.querySelector(selector)
  }

  $$(selector) {
    return this.shadowRoot ? this.shadowRoot.querySelectorAll(selector) : this.querySelectorAll(selector)
  }

  // Template rendering
  render(template) {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template
    } else {
      this.innerHTML = template
    }
  }

  // CSS utilities
  addCSS(css) {
    if (this.shadowRoot) {
      const style = document.createElement("style")
      style.textContent = css
      this.shadowRoot.appendChild(style)
    }
  }

  // Attribute helpers
  getBooleanAttribute(name) {
    return this.hasAttribute(name)
  }

  setBooleanAttribute(name, value) {
    if (value) {
      this.setAttribute(name, "")
    } else {
      this.removeAttribute(name)
    }
  }

  getNumberAttribute(name, defaultValue = 0) {
    const value = this.getAttribute(name)
    return value !== null ? Number(value) : defaultValue
  }

  setNumberAttribute(name, value) {
    this.setAttribute(name, String(value))
  }

  // Error handling
  handleError(error) {
    console.error(`Error in ${this.constructor.name}:`, error)
    this.emit("error", { error, component: this })
  }

  // Validation
  validate() {
    return true // Override in subclasses
  }

  // Loading state
  setLoading(loading) {
    this.setBooleanAttribute("loading", loading)
    this.emit("loading-change", { loading })
  }

  isLoading() {
    return this.getBooleanAttribute("loading")
  }

  // Disabled state
  setDisabled(disabled) {
    this.setBooleanAttribute("disabled", disabled)
    this.emit("disabled-change", { disabled })
  }

  isDisabled() {
    return this.getBooleanAttribute("disabled")
  }

  // Focus management
  focus() {
    const focusable = this.$("[tabindex], input, button, select, textarea")
    if (focusable) {
      focusable.focus()
    } else {
      super.focus()
    }
  }

  // Accessibility helpers
  setAriaLabel(label) {
    this.setAttribute("aria-label", label)
  }

  setAriaDescribedBy(id) {
    this.setAttribute("aria-describedby", id)
  }

  announceToScreenReader(message) {
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}