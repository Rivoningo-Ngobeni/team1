import SecurityUtils from "../utils/security.js";
import BaseComponent from "./base-component.js";

class AppInput extends BaseComponent {
  static get observedAttributes() {
    return ["type", "placeholder", "value", "required", "disabled", "readonly"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    
  }

  mount() {
    this.render();
    this.setupEventListeners();

    
    if (this.attachInternals && typeof this.attachInternals === "function") {
      this.internals = this.attachInternals();
    }
  }

  render() {
    const type = SecurityUtils.sanitizeText(
      this.getAttribute("type") || "text"
    );
    const placeholder = SecurityUtils.sanitizeText(
      this.getAttribute("placeholder") || ""
    );
    const value = SecurityUtils.sanitizeText(this.getAttribute("value") || "");
    const required = this.hasAttribute("required");
    const disabled = this.hasAttribute("disabled");
    const readonly = this.hasAttribute("readonly");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .input-container {
          position: relative;
          width: 100%;
        }

        .input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: var(--border-radius, 0.5rem);
          font-size: var(--font-size-base, 1rem);
          font-family: inherit;
          background-color: var(--surface-color, #ffffff);
          color: var(--text-primary, #1f2937);
          transition: all 0.2s;
        }

        .input:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .input:disabled {
          background-color: var(--background-color, #f9fafb);
          color: var(--text-muted, #9ca3af);
          cursor: not-allowed;
        }

        .input:readonly {
          background-color: var(--background-color, #f9fafb);
        }

        .input[aria-invalid="true"] {
          border-color: var(--error-color, #dc2626);
        }

        .input[aria-invalid="true"]:focus {
          border-color: var(--error-color, #dc2626);
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .input::placeholder {
          color: var(--text-muted, #9ca3af);
        }

        
        :host([loading]) .input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 11-6.219-8.56'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        
        .input[type="search"] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 0.75rem center;
          background-size: 1rem;
          padding-left: 2.5rem;
        }

        .input[type="search"]::-webkit-search-cancel-button {
          -webkit-appearance: none;
          appearance: none;
          height: 1rem;
          width: 1rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E");
          background-size: 1rem;
          cursor: pointer;
        }
      </style>
      <div class="input-container">
        <input 
          class="input"
          type="${type}"
          placeholder="${placeholder}"
          value="${value}"
          ${required ? "required" : ""}
          ${disabled ? "disabled" : ""}
          ${readonly ? "readonly" : ""}
          aria-invalid="false"
        />
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.$(".input");
    if (!input) return;

    
    input.addEventListener("input", (e) => {
      this.value = e.target.value;
      this.emit("input", { value: this.value });

      
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });

    input.addEventListener("change", (e) => {
      this.value = e.target.value;
      this.emit("change", { value: this.value });

      
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
    });

    input.addEventListener("focus", (e) => {
      this.emit("focus", { value: this.value });
    });

    input.addEventListener("blur", (e) => {
      this.emit("blur", { value: this.value });
      this.validate();
    });

    input.addEventListener("keydown", (e) => {
      
      if (e.key === "Enter" && this.closest("form")) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        this.closest("form").dispatchEvent(submitEvent);
      }
      this.emit("keydown", { key: e.key, value: this.value });
    });
  }

  onPropsChange(name, oldValue, newValue) {
    const input = this.$(".input");
    if (!input) return;

    switch (name) {
      case "value":
        if (input.value !== newValue) {
          input.value = newValue || "";
          this.value = newValue || "";
        }
        break;
      case "disabled":
        input.disabled = this.hasAttribute("disabled");
        break;
      case "readonly":
        input.readOnly = this.hasAttribute("readonly");
        break;
      case "required":
        input.required = this.hasAttribute("required");
        break;
      case "placeholder":
        input.placeholder = newValue || "";
        break;
      case "type":
        input.type = newValue || "text";
        break;
    }
  }

  validate() {
    const input = this.$(".input");
    if (!input) return true;

    const isValid = input.checkValidity();
    input.setAttribute("aria-invalid", !isValid);

    if (!isValid) {
      this.emit("invalid", {
        validity: input.validity,
        validationMessage: input.validationMessage,
      });
    } else {
      this.emit("valid", { value: this.value });
    }

    return isValid;
  }

  focus() {
    const input = this.$(".input");
    if (input) input.focus();
  }

  blur() {
    const input = this.$(".input");
    if (input) input.blur();
  }

  select() {
    const input = this.$(".input");
    if (input) input.select();
  }

  
  get value() {
    return this._value || "";
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    const input = this.$(".input");
    if (input && input.value !== val) {
      input.value = val;
    }
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(val) {
    this.setBooleanAttribute("disabled", val);
  }

  get required() {
    return this.hasAttribute("required");
  }

  set required(val) {
    this.setBooleanAttribute("required", val);
  }

  get readonly() {
    return this.hasAttribute("readonly");
  }

  set readonly(val) {
    this.setBooleanAttribute("readonly", val);
  }
}

customElements.define("app-input", AppInput);
export default AppInput;
