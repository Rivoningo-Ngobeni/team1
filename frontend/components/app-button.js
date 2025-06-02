import BaseComponent from "./base-component.js"

class AppButton extends BaseComponent {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "loading", "type"]
  }

  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  mount() {
    this.render()
    this.setupEventListeners()
    // Forward click on custom element or any of its light DOM children to internal button for form submission
    HTMLElement.prototype.addEventListener.call(this, "click", (e) => {
      const button = this.$(".button")
      // Only forward if the click did not originate from the internal button
      if (button && !button.contains(e.target)) {
        button.click()
      }
    })
  }

  render() {
    const variant = this.getAttribute("variant") || "primary"
    const size = this.getAttribute("size") || "default"
    const disabled = this.hasAttribute("disabled")
    const loading = this.hasAttribute("loading")
    const type = this.getAttribute("type") || "button"

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: var(--border-radius, 0.5rem);
          font-family: inherit;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .button:focus {
          outline: 2px solid var(--primary-color, #2563eb);
          outline-offset: 2px;
        }

        .button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Variants */
        .button--primary {
          background-color: var(--primary-color, #2563eb);
          color: var(--text-on-primary);
        }

        .button--primary:hover:not(:disabled) {
          background-color: var(--primary-hover, #1d4ed8);
        }

        .button--secondary {
          background-color: var(--background-color, #f9fafb);
          color: var(--text-primary, #1f2937);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .button--secondary:hover:not(:disabled) {
          background-color: var(--surface-color, #ffffff);
          border-color: var(--text-secondary, #6b7280);
        }

        .button--danger {
          background-color: var(--error-color, #dc2626);
          color: white;
        }

        .button--danger:hover:not(:disabled) {
          background-color: #b91c1c;
        }

        .button--ghost {
          background-color: transparent;
          color: var(--text-primary, #1f2937);
        }

        .button--ghost:hover:not(:disabled) {
          background-color: var(--background-color, #f9fafb);
        }

        /* Sizes */
        .button--small {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }

        .button--default {
          padding: 0.75rem 1rem;
          font-size: 1rem;
        }

        .button--large {
          padding: 1rem 1.5rem;
          font-size: 1.125rem;
        }

        /* Loading state */
        .button--loading {
          color: transparent;
        }

        .button--loading::after {
          content: '';
          position: absolute;
          width: 1rem;
          height: 1rem;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .button--loading.button--primary::after,
        .button--loading.button--danger::after {
          border-top-color: white;
        }

        .button--loading.button--secondary::after,
        .button--loading.button--ghost::after {
          border-top-color: var(--text-primary, #1f2937);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Icon support */
        .button ::slotted(svg) {
          width: 1em;
          height: 1em;
        }

        /* Ripple effect */
        .button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }

        .button:active::before {
          width: 100%;
          height: 100%;
        }

        .button--secondary:active::before,
        .button--ghost:active::before {
          background-color: rgba(0, 0, 0, 0.1);
        }
      </style>
      <button 
        class="button button--${variant} button--${size} ${loading ? "button--loading" : ""}"
        type="${type}"
        ${disabled || loading ? "disabled" : ""}
        aria-busy="${loading}"
      >
        <slot></slot>
      </button>
    `
  }

  setupEventListeners() {
    const button = this.$(".button")
    if (!button) return;

    button.addEventListener("click", (e) => {
      if (this.disabled || this.loading) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      
      // For submit buttons, find the closest form and handle the form submission
      if (this.getAttribute("type") === "submit") {
        const form = this.closest("form")
        if (form) {
          e.preventDefault() // Prevent any default navigation
          
          // Dispatch a submit event that our handlers can catch
          const submitEvent = new Event("submit", { 
            bubbles: true, 
            cancelable: true,
            composed: true // Ensure it crosses shadow DOM boundaries
          })
          
          // Dispatch the event and check if it was cancelled
          const wasSubmitted = form.dispatchEvent(submitEvent)
          
          // Only try form.submit() as a fallback if the event wasn't handled
          // This helps avoid interfering with hash-based routing
          if (wasSubmitted) {
            try {
              // This is our last resort if custom event handlers didn't work
              form.requestSubmit() // Modern API that triggers submit handlers
            } catch (err) {
              // Fallback for older browsers, but may cause page navigation
              try {
                form.submit()
              } catch (submitErr) {
                console.error("Form submission error:", submitErr)
              }
            }
          }
        }
      }
      
      // Always dispatch a native click event from the custom element
      const nativeClick = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true, 
        view: window
      })
      this.dispatchEvent(nativeClick)
      
      // Emit custom event
      this.emit("click", { originalEvent: e })
    })

    button.addEventListener("focus", (e) => {
      this.emit("focus", { originalEvent: e })
    })

    button.addEventListener("blur", (e) => {
      this.emit("blur", { originalEvent: e })
    })
  }

  onPropsChange(name, oldValue, newValue) {
    if (name === "loading" || name === "disabled" || name === "variant" || name === "size") {
      this.render()
    }
  }

  focus() {
    const button = this.$(".button")
    if (button) button.focus()
  }

  click() {
    const button = this.$(".button")
    if (button && !this.disabled && !this.loading) {
      button.click()
    }
  }

  // Getters and setters
  get disabled() {
    return this.hasAttribute("disabled")
  }

  set disabled(val) {
    this.setBooleanAttribute("disabled", val)
  }

  get loading() {
    return this.hasAttribute("loading")
  }

  set loading(val) {
    this.setBooleanAttribute("loading", val)
  }

  get variant() {
    return this.getAttribute("variant") || "primary"
  }

  set variant(val) {
    this.setAttribute("variant", val)
  }

  get size() {
    return this.getAttribute("size") || "default"
  }

  set size(val) {
    this.setAttribute("size", val)
  }
}

customElements.define("app-button", AppButton)
export default AppButton
