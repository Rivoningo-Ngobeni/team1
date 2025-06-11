export default class BaseComponent extends HTMLElement {
  constructor() {
    super()
    this.eventListeners = new Map()
    this.state = {}
    this.props = {}
  }

  
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

  
  mount() {}
  unmount() {
    this.removeAllEventListeners()
  }
  onPropsChange(name, oldValue, newValue) {}

  
  setState(updates) {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }
    this.onStateChange(prevState, this.state)
  }

  onStateChange(prevState, newState) {
    
  }

  
  addEventListener(element, event, handler, options = {}) {
    
    if (!element || !event || typeof event !== 'string') {
      return;
    }

    const wrappedHandler = (e) => {
      try {
        handler.call(this, e);
      } catch (error) {
        this.handleError(error);
      }
    };

    try {
      
      if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, wrappedHandler, options);
        
        
        if (!this.eventListeners.has(element)) {
          this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({
          event,
          handler: wrappedHandler,
          options,
        });
      } else {
      }
    } catch (e) {
    }
  }

  removeEventListener(element, event, handler) {
    if (!element) return

    try {
      
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler)
      }
    } catch (e) {
    }

    
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
          
          if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options)
          }
        } catch (e) {
        }
      })
    })
    this.eventListeners.clear()
  }

  
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

  
  $(selector) {
    return this.shadowRoot ? this.shadowRoot.querySelector(selector) : this.querySelector(selector)
  }

  $$(selector) {
    return this.shadowRoot ? this.shadowRoot.querySelectorAll(selector) : this.querySelectorAll(selector)
  }

  
  render(template) {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template
    } else {
      this.innerHTML = template
    }
  }

  
  addCSS(css) {
    if (this.shadowRoot) {
      const style = document.createElement("style")
      style.textContent = css
      this.shadowRoot.appendChild(style)
    }
  }

  
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

  
  handleError(error) {
    this.emit("error", { error, component: this })
  }

  
  validate() {
    return true 
  }

  
  setLoading(loading) {
    this.setBooleanAttribute("loading", loading)
    this.emit("loading-change", { loading })
  }

  isLoading() {
    return this.getBooleanAttribute("loading")
  }

  
  setDisabled(disabled) {
    this.setBooleanAttribute("disabled", disabled)
    this.emit("disabled-change", { disabled })
  }

  isDisabled() {
    return this.getBooleanAttribute("disabled")
  }

  
  focus() {
    const focusable = this.$("[tabindex], input, button, select, textarea")
    if (focusable) {
      focusable.focus()
    } else {
      super.focus()
    }
  }

  
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