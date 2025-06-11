import BaseComponent from "./base-component.js"

class AppCard extends BaseComponent {
  static get observedAttributes() {
    return ["variant", "padding", "hoverable", "clickable"]
  }

  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  mount() {
    this.render()
    this.setupEventListeners()
  }

  render() {
    const variant = this.getAttribute("variant") || "default"
    const padding = this.getAttribute("padding") || "default"
    const hoverable = this.hasAttribute("hoverable")
    const clickable = this.hasAttribute("clickable")

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background-color: var(--surface-color, #ffffff);
          border-radius: var(--border-radius, 0.5rem);
          box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
          transition: all 0.2s;
          overflow: hidden;
        }

        .card--default {
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .card--elevated {
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
        }

        .card--outlined {
          border: 2px solid var(--border-color, #e5e7eb);
          box-shadow: none;
        }

        .card--filled {
          background-color: var(--background-color, #f9fafb);
          border: none;
        }

        .card--hoverable:hover {
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
          transform: translateY(-2px);
        }

        .card--clickable {
          cursor: pointer;
        }

        .card--clickable:hover {
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
        }

        .card--clickable:active {
          transform: translateY(1px);
        }

        .card-content {
          width: 100%;
          height: 100%;
        }

        .card-content--none {
          padding: 0;
        }

        .card-content--small {
          padding: 0.75rem;
        }

        .card-content--default {
          padding: 1.5rem;
        }

        .card-content--large {
          padding: 2rem;
        }

        
        .card--clickable:focus {
          outline: 2px solid var(--primary-color, #2563eb);
          outline-offset: 2px;
        }

        
        .card--clickable[role="button"] {
          user-select: none;
        }
      </style>
      <div class="card card--${variant} ${hoverable ? "card--hoverable" : ""} ${clickable ? "card--clickable" : ""}"
           ${clickable ? 'tabindex="0" role="button"' : ""}>
        <div class="card-content card-content--${padding}">
          <slot></slot>
        </div>
      </div>
    `
  }

  setupEventListeners() {
    const card = this.$(".card")

    if (this.hasAttribute("clickable")) {
      this.addEventListener(card, "click", (e) => {
        this.emit("click", { originalEvent: e })
      })

      this.addEventListener(card, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          this.emit("click", { originalEvent: e })
        }
      })
    }

    this.addEventListener(card, "mouseenter", (e) => {
      this.emit("mouseenter", { originalEvent: e })
    })

    this.addEventListener(card, "mouseleave", (e) => {
      this.emit("mouseleave", { originalEvent: e })
    })
  }

  onPropsChange(name, oldValue, newValue) {
    if (["variant", "padding", "hoverable", "clickable"].includes(name)) {
      this.render()
    }
  }

  focus() {
    const card = this.$(".card")
    if (card && this.hasAttribute("clickable")) {
      card.focus()
    }
  }

  
  get variant() {
    return this.getAttribute("variant") || "default"
  }

  set variant(val) {
    this.setAttribute("variant", val)
  }

  get padding() {
    return this.getAttribute("padding") || "default"
  }

  set padding(val) {
    this.setAttribute("padding", val)
  }

  get hoverable() {
    return this.hasAttribute("hoverable")
  }

  set hoverable(val) {
    this.setBooleanAttribute("hoverable", val)
  }

  get clickable() {
    return this.hasAttribute("clickable")
  }

  set clickable(val) {
    this.setBooleanAttribute("clickable", val)
  }
}

customElements.define("app-card", AppCard)
export default AppCard
