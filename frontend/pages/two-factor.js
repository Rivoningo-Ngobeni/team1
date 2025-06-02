import AuthService from "../utils/auth.js"
import Router from "../utils/router.js"
import { ToastService } from "../components/app-toast.js"

class TwoFactorPage {
  static render() {
    const app = document.getElementById("app")
    app.innerHTML = ""

    // Create semantic structure
    const layout = document.createElement("div")
    layout.className = "auth-layout"
    layout.setAttribute("role", "main")

    const card = document.createElement("article")
    card.className = "auth-card"

    const header = document.createElement("header")
    header.className = "auth-header"
    header.innerHTML = `
            <h1 class="auth-title">Two-Factor Authentication</h1>
            <p class="auth-subtitle">Enter the 6-digit code from your authenticator app</p>
        `

    const form = document.createElement("form")
    form.setAttribute("novalidate", "")
    form.setAttribute("aria-label", "Two-factor authentication form")
    form.innerHTML = `
            <div class="form-group">
                <label for="verification-code" class="form-label">Verification Code</label>
                <app-input 
                    id="verification-code"
                    type="text" 
                    placeholder="000000" 
                    required
                    maxlength="6"
                    pattern="[0-9]{6}"
                    autocomplete="one-time-code"
                    aria-describedby="code-error code-help">
                </app-input>
                <div id="code-help" class="form-help">Enter the 6-digit code from your authenticator app</div>
                <div id="code-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <app-button type="submit" variant="primary" style="width: 100%;">
                    Verify Code
                </app-button>
            </div>
        `

    const footer = document.createElement("footer")
    footer.className = "auth-footer"
    footer.innerHTML = `
            <p><a href="#/login" class="auth-link">← Back to login</a></p>
        `

    card.appendChild(header)
    card.appendChild(form)
    card.appendChild(footer)
    layout.appendChild(card)
    app.appendChild(layout)

    // Setup form handling
    this.setupFormHandling(form)
  }

  static setupFormHandling(form) {
    const codeInput = form.querySelector("#verification-code")
    const submitButton = form.querySelector('app-button[type="submit"]')

    // Auto-format input (numbers only)
    codeInput.addEventListener("input", (e) => {
      let value = e.detail.value.replace(/\D/g, "") // Remove non-digits
      if (value.length > 6) {
        value = value.slice(0, 6)
      }
      codeInput.value = value

      this.validateCode(codeInput)

      // Auto-submit when 6 digits are entered
      if (value.length === 6) {
        form.dispatchEvent(new Event("submit"))
      }
    })

    // Real-time validation
    codeInput.addEventListener("blur", () => {
      this.validateCode(codeInput)
    })

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const isValid = this.validateCode(codeInput)
      if (!isValid) return

      submitButton.setAttribute("loading", "")

      try {
        const code = codeInput.value.trim()
        const result = await AuthService.verifyTwoFactor(code)

        if (result.success) {
          ToastService.show("Authentication successful!", "success")
          Router.navigate("/dashboard")
        } else {
          ToastService.show(result.message || "Invalid verification code", "error")
          codeInput.value = ""
          codeInput.focus()
        }
      } catch (error) {
        ToastService.show("An error occurred during verification", "error")
      } finally {
        submitButton.removeAttribute("loading")
      }
    })

    // Focus the input on load
    setTimeout(() => codeInput.focus(), 100)
  }

  static validateCode(input) {
    const value = input.value.trim()
    const errorElement = document.getElementById("code-error")

    if (!value) {
      this.showFieldError(input, errorElement, "Verification code is required")
      return false
    }

    if (!/^\d{6}$/.test(value)) {
      this.showFieldError(input, errorElement, "Please enter a 6-digit code")
      return false
    }

    this.clearFieldError(input, errorElement)
    return true
  }

  static showFieldError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true")
    errorElement.textContent = message
    errorElement.style.display = "block"
  }

  static clearFieldError(input, errorElement) {
    input.setAttribute("aria-invalid", "false")
    errorElement.textContent = ""
    errorElement.style.display = "none"
  }
}

export default TwoFactorPage
