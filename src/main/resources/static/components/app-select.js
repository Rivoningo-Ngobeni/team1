import SecurityUtils from "../utils/security.js";
import BaseComponent from "./base-component.js";

class AppSelect extends BaseComponent {
  static get observedAttributes() {
    return ["disabled", "required", "multiple", "value", "placeholder"]
  }

  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.options = []
    this._value = ""
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()

    
    const slotOptions = Array.from(this.querySelectorAll("option"))
    if (slotOptions.length > 0) {
      this.options = slotOptions.map((option) => ({
        value: option.value,
        label: option.textContent,
        disabled: option.disabled,
      }))
      this.render()
    }
  }

  render() {
    const disabled = this.hasAttribute("disabled")
    const required = this.hasAttribute("required")
    const multiple = this.hasAttribute("multiple")
    const placeholder = this.getAttribute("placeholder") || "Select..."

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .select-container {
          position: relative;
        }
        
        .select {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          line-height: 1.5;
          color: var(--text-primary);
          background-color: var(--background-color);
          background-clip: padding-box;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          transition: border-color 0.15s ease-in-out;
          cursor: pointer;
          appearance: none;
        }
        
        .select:focus {
          border-color: var(--primary-color);
          outline: 0;
        }
        
        .select:disabled {
          background-color: var(--surface-color);
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .select[aria-invalid="true"] {
          border-color: var(--error-color);
        }
        
        .select-arrow {
          position: absolute;
          top: 50%;
          right: 0.75rem;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        .select-arrow svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
        
        option {
          font-size: 1rem;
          padding: 0.5rem;
        }
      </style>
      
      <div class="select-container">
        <select 
          class="select" 
          ${disabled ? "disabled" : ""}
          ${required ? "required" : ""}
          ${multiple ? "multiple" : ""}
          aria-invalid="false"
        >
          ${this.renderOptions()}
        </select>
        
        <div class="select-arrow" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>
      </div>
    `
  }

renderOptions() {
  let optionsHtml = ""

  
  if (!this.hasAttribute("multiple") && this.getAttribute("placeholder")) {
    const placeholder = this.getAttribute("placeholder") || "Select..."
    optionsHtml += `<option value="" ${!this._value ? "selected" : ""} disabled>${SecurityUtils.sanitizeText(placeholder)}</option>`
  }

  
  if (this.options && this.options.length > 0) {
    this.options.forEach((option) => {
      const selected = Array.isArray(this._value)
        ? this._value.includes(option.value)
        : this._value === option.value
      optionsHtml += `
        <option 
          value="${SecurityUtils.sanitizeText(option.value)}" 
          ${selected ? "selected" : ""} 
          ${option.disabled ? "disabled" : ""}
        >
          ${SecurityUtils.sanitizeText(option.label)}
        </option>
      `
    })
  }

  return optionsHtml
}

  setupEventListeners() {
    this.addEventListener("input", this.handleInput.bind(this))
    this.addEventListener("change", this.handleChange.bind(this))
  }

  handleInput(event) {
    
    const select = this.$(".select")
    if (select) {
      if (this.hasAttribute("multiple")) {
        this._value = Array.from(select.selectedOptions).map((option) => option.value)
      } else {
        this._value = select.value
      }
    }
    
    
    this.emit("input", { value: this._value })
  }

  handleChange(event) {
    
    const select = this.$(".select")
    if (select) {
      if (this.hasAttribute("multiple")) {
        this._value = Array.from(select.selectedOptions).map((option) => option.value)
      } else {
        this._value = select.value
      }
    }
    
    
    this.emit("change", { value: this._value })
    
    
    
    
    this.validate()
    
    
    if (typeof this.onValueChange === 'function') {
      this.onValueChange(this._value);
    }
  }

  onPropsChange(name, oldValue, newValue) {
    
    if (["disabled", "required", "multiple", "placeholder"].includes(name)) {
      this.render()
    }
    
    if (name === "value") {
      this._value = newValue || "";
      this.render();
    }
  }

  setOptions(options) {
    if (!Array.isArray(options)) {
      return;
    }
    
    this.options = options.map((option) => {
      if (typeof option === "string") {
        return { value: option, label: option }
      }
      return {
        value: option.value,
        label: option.label || option.value,
        disabled: option.disabled || false,
      }
    })

    
    this.render()
    
    
    const select = this.$(".select")
    if (select && this._value) {
      if (this.hasAttribute("multiple")) {
        Array.from(select.options).forEach((option) => {
          option.selected = Array.isArray(this._value) && this._value.includes(option.value)
        })
      } else {
        select.value = this._value
      }
    }
    
  }

  $(selector) {
    return this.shadowRoot && this.shadowRoot.querySelector(selector)
  }

  $$(selector) {
    return this.shadowRoot && this.shadowRoot.querySelectorAll(selector)
  }

  setValue(value) {
    this._value = value;
    const select = this.$(".select");
    
    if (select) {
      if (this.hasAttribute("multiple")) {
        Array.from(select.options).forEach((option) => {
          option.selected = Array.isArray(this._value) 
            ? this._value.includes(option.value)
            : this._value === option.value;
        });
      } else {
        select.value = this._value;
      }
      
      
      this.emit("change", { value: this._value });
      
      
      const changeEvent = new Event("change", { bubbles: true });
      select.dispatchEvent(changeEvent);
      
      
    }
  }

  validate() {
    const select = this.$(".select")
    if (!select) return true

    const isValid = select.checkValidity()
    select.setAttribute("aria-invalid", !isValid)

    if (!isValid) {
      this.emit("invalid", {
        validity: select.validity,
        validationMessage: select.validationMessage,
      })
    } else {
      this.emit("valid", { value: this._value })
    }

    return isValid
  }

  focus() {
    const select = this.$(".select")
    if (select) select.focus()
  }

  reset() {
    const select = this.$(".select")
    if (select) select.selectedIndex = 0
    this._value = select ? select.value : ""
  }

  get value() {
    const select = this.$(".select")
    if (select) {
      if (this.hasAttribute("multiple")) {
        return Array.from(select.selectedOptions).map((option) => option.value)
      } else {
        return select.value
      }
    }
    return this._value
  }

  set value(val) {
    this._value = val
    this.setAttribute("value", val);
    const select = this.$(".select")

    if (select) {
      if (this.hasAttribute("multiple")) {
        Array.from(select.options).forEach((option) => {
          option.selected = Array.isArray(val) && val.includes(option.value)
        })
      } else {
        select.value = val
      }
    }
    
  }

  get disabled() {
    return this.hasAttribute("disabled")
  }

  set disabled(val) {
    this.setBooleanAttribute("disabled", val)
  }

  get required() {
    return this.hasAttribute("required")
  }

  set required(val) {
    this.setBooleanAttribute("required", val)
  }

  get multiple() {
    return this.hasAttribute("multiple")
  }

  set multiple(val) {
    this.setBooleanAttribute("multiple", val)
  }
}

customElements.define("app-select", AppSelect)
export default AppSelect
