import SecurityUtils from "../utils/security.js";
import BaseComponent from "./base-component.js";

class AppToast extends BaseComponent {
  static get observedAttributes() {
    return ["type", "duration", "dismissible"]
  }

  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.autoHideTimer = null
  }

  mount() {
    this.render()
    this.setupEventListeners()
    this.startAutoHide()
  }

  unmount() {
    super.unmount()
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
    }
  }

  render() {
    const type = this.getAttribute("type") || "info"
    const dismissible = this.hasAttribute("dismissible") !== false
    const message = this.getAttribute("message") || ""

    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22,4 12,14.01 9,11.01"></polyline>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`,
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          max-width: 400px;
          margin-bottom: 0.5rem;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--border-radius, 0.5rem);
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
          animation: slideIn 0.3s ease-out;
          position: relative;
          overflow: hidden;
        }

        .toast--success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .toast--error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .toast--warning {
          background-color: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
        }

        .toast--info {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }

        .toast-icon {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-message {
          font-size: 0.875rem;
          line-height: 1.25rem;
          margin: 0;
        }

        .toast-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: currentColor;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .toast-dismiss:hover {
          opacity: 1;
        }

        .toast-dismiss:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background-color: currentColor;
          opacity: 0.3;
          transition: width linear;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast--dismissing {
          animation: slideOut 0.3s ease-in forwards;
        }

        
        @media (prefers-reduced-motion: reduce) {
          .toast {
            animation: none;
          }
          
          .toast--dismissing {
            animation: none;
            opacity: 0;
          }
        }
      </style>
      <div class="toast toast--${type}" role="alert" aria-live="polite">
        <div class="toast-icon" aria-hidden="true">
          ${icons[type]}
        </div>
        <div class="toast-content">
          <p class="toast-message">${SecurityUtils.sanitizeText(message)}</p>
        </div>
        ${
          dismissible
            ? `
          <button class="toast-dismiss" type="button" aria-label="Dismiss notification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        `
            : ""
        }
        <div class="progress-bar" style="width: 100%;"></div>
      </div>
    `
  }

  setupEventListeners() {
    const dismissBtn = this.$(".toast-dismiss")
    if (dismissBtn) {
      this.addEventListener(dismissBtn, "click", () => {
        this.dismiss()
      })
    }

    
    const toast = this.$(".toast")
    this.addEventListener(toast, "mouseenter", () => {
      this.pauseAutoHide()
    })

    this.addEventListener(toast, "mouseleave", () => {
      this.resumeAutoHide()
    })
  }

  startAutoHide() {
    const duration = Number.parseInt(this.getAttribute("duration")) || 5000
    if (duration > 0) {
      this.startProgressBar(duration)
      this.autoHideTimer = setTimeout(() => {
        this.dismiss()
      }, duration)
    }
  }

  pauseAutoHide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
      this.autoHideTimer = null
    }
    this.pauseProgressBar()
  }

  resumeAutoHide() {
    const progressBar = this.$(".progress-bar")
    if (progressBar) {
      const currentWidth = Number.parseFloat(progressBar.style.width)
      const remainingTime = (currentWidth / 100) * (Number.parseInt(this.getAttribute("duration")) || 5000)

      if (remainingTime > 0) {
        this.resumeProgressBar(remainingTime)
        this.autoHideTimer = setTimeout(() => {
          this.dismiss()
        }, remainingTime)
      }
    }
  }

  startProgressBar(duration) {
    const progressBar = this.$(".progress-bar")
    if (progressBar) {
      progressBar.style.transition = `width ${duration}ms linear`
      
      setTimeout(() => {
        progressBar.style.width = "0%"
      }, 10)
    }
  }

  pauseProgressBar() {
    const progressBar = this.$(".progress-bar")
    if (progressBar) {
      const computedStyle = window.getComputedStyle(progressBar)
      const currentWidth = computedStyle.width
      progressBar.style.transition = "none"
      progressBar.style.width = currentWidth
    }
  }

  resumeProgressBar(remainingTime) {
    const progressBar = this.$(".progress-bar")
    if (progressBar) {
      progressBar.style.transition = `width ${remainingTime}ms linear`
      progressBar.style.width = "0%"
    }
  }

  dismiss() {
    const toast = this.$(".toast")
    if (toast) {
      toast.classList.add("toast--dismissing")

      
      setTimeout(() => {
        this.emit("dismiss")
        if (this.parentNode) {
          this.parentNode.removeChild(this)
        }
      }, 300)
    }
  }

  onPropsChange(name, oldValue, newValue) {
    if (name === "message") {
      const messageEl = this.$(".toast-message")
      if (messageEl) {
        messageEl.textContent = newValue
      }
    }
  }

  
  get message() {
    return this.getAttribute("message") || ""
  }

  set message(val) {
    this.setAttribute("message", val)
  }

  get type() {
    return this.getAttribute("type") || "info"
  }

  set type(val) {
    this.setAttribute("type", val)
  }

  get duration() {
    return Number.parseInt(this.getAttribute("duration")) || 5000
  }

  set duration(val) {
    this.setAttribute("duration", val.toString())
  }
}


class ToastService {
  static container = null

  static getContainer() {
    if (!this.container) {
      this.container = document.createElement("div")
      this.container.className = "toast-container"
      this.container.setAttribute("role", "alert")
      this.container.setAttribute("aria-live", "polite")
      document.body.appendChild(this.container)
    }
    return this.container
  }

  static show(message, type = "info", duration = 5000) {
    const container = this.getContainer()
    const toast = document.createElement("app-toast")

    toast.setAttribute("message", message)
    toast.setAttribute("type", type)
    toast.setAttribute("duration", duration.toString())
    toast.setAttribute("dismissible", "")

    container.appendChild(toast)

    
    
    HTMLElement.prototype.addEventListener.call(toast, "dismiss", () => {
      if (container.contains(toast)) {
        container.removeChild(toast)
      }
    })

    return toast
  }

  static success(message, duration) {
    return this.show(message, "success", duration)
  }

  static error(message, duration) {
    return this.show(message, "error", duration)
  }

  static warning(message, duration) {
    return this.show(message, "warning", duration)
  }

  static info(message, duration) {
    return this.show(message, "info", duration)
  }

  static clear() {
    const container = this.getContainer()
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
  }
}

customElements.define("app-toast", AppToast)


export { ToastService, AppToast as default };

