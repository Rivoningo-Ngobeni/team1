import { ToastService } from "../components/app-toast.js"
import AuthService from "../utils/auth.js"
import Router from "../utils/router.js"

class LoginPage {
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
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Sign in to your account to continue</p>
        `

    const form = document.createElement("form")
    form.setAttribute("novalidate", "")
    form.setAttribute("aria-label", "Login form")
    form.setAttribute("action", "javascript:void(0);")
    form.setAttribute("onsubmit", "return false;")
    form.innerHTML = `
            <div class="form-group">
                <label for="username" class="form-label">Username</label>
                <app-input 
                    id="username"
                    type="text" 
                    placeholder="Enter your username" 
                    required
                    autocomplete="username"
                    aria-describedby="username-error">
                </app-input>
                <div id="username-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <app-input 
                    id="password"
                    type="password" 
                    placeholder="Enter your password" 
                    required
                    autocomplete="current-password"
                    aria-describedby="password-error">
                </app-input>
                <div id="password-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <app-button id="login-button" type="submit" variant="primary" style="width: 100%;">
                    Sign In
                </app-button>
            </div>
        `

    const footer = document.createElement("footer")
    footer.className = "auth-footer"
    footer.innerHTML = `
            <p>Don't have an account? <a href="#/signup" class="auth-link">Sign up here</a></p>
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
    const usernameAppInput = form.querySelector("#username")
    const passwordAppInput = form.querySelector("#password")
    const usernameInput = usernameAppInput && usernameAppInput.shadowRoot ? usernameAppInput.shadowRoot.querySelector('.input') : null
    const passwordInput = passwordAppInput && passwordAppInput.shadowRoot ? passwordAppInput.shadowRoot.querySelector('.input') : null
    const submitButton = form.querySelector('app-button[type="submit"]')

    // Real-time validation
    if (usernameInput) {
      usernameInput.addEventListener("input", () => {
        this.validateUsername(usernameInput)
      })
    }
    if (passwordInput) {
      passwordInput.addEventListener("input", () => {
        this.validatePassword(passwordInput)
      })
    }

    // Form submission - use both capture and bubbling phase
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      e.stopPropagation()

      const isValid = this.validateForm(form)
      if (!isValid) return

      if (submitButton) {
        submitButton.setAttribute("loading", "")
      }

      try {
        const username = usernameInput ? usernameInput.value.trim() : ""
        const password = passwordInput ? passwordInput.value : ""

        const result = await AuthService.login(username, password)

        if (result.success) {
          if (result.requiresTwoFactor) {
            Router.navigate("/two-factor")
          } else {
            Router.navigate("/dashboard")
          }
          ToastService.show("Login successful", "success")
        } else {
          ToastService.show(result.message || "Login failed", "error")
        }
      } catch (error) {
        console.error("Login error:", error)
        ToastService.show("An error occurred during login", "error")
      } finally {
        if (submitButton) {
          submitButton.removeAttribute("loading")
        }
      }
    }, true) // Use capture phase for more reliable event handling

    // Add click handler directly to the submit button as a backup
    if (submitButton) {
      submitButton.addEventListener("click", (e) => {
        // If not already handling a form submission, trigger one
        if (!submitButton.hasAttribute("loading")) {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
        }
      })
    }
  }

  static validateUsername(input) {
    // Get the app-input element if we were passed the native input
    const appInput = input.tagName === 'INPUT' ? input.getRootNode().host : input;
    // Get the value from the appropriate element
    const value = input ? input.value.trim() : ""
    const errorElement = document.getElementById("username-error")

    if (!value) {
      this.showFieldError(appInput, errorElement, "Username is required")
      return false
    }

    if (value.length < 3) {
      this.showFieldError(appInput, errorElement, "Username must be at least 3 characters")
      return false
    }

    this.clearFieldError(appInput, errorElement)
    return true
  }

  static validatePassword(input) {
    // Get the app-input element if we were passed the native input
    const appInput = input.tagName === 'INPUT' ? input.getRootNode().host : input;
    // Get the value from the appropriate element
    const value = input ? input.value : ""
    const errorElement = document.getElementById("password-error")

    if (!value) {
      this.showFieldError(appInput, errorElement, "Password is required")
      return false
    }

    this.clearFieldError(appInput, errorElement)
    return true
  }

  static showFieldError(input, errorElement, message) {
    if (input) {
      input.setAttribute("aria-invalid", "true")
    }
    if (errorElement) {
      errorElement.textContent = message
      errorElement.style.display = "block"
    }
  }

  static clearFieldError(input, errorElement) {
    if (input) {
      input.setAttribute("aria-invalid", "false")
    }
    if (errorElement) {
      errorElement.textContent = ""
      errorElement.style.display = "none"
    }
  }

  static validateForm(form) {
    const usernameAppInput = form.querySelector("#username")
    const passwordAppInput = form.querySelector("#password")
    const usernameInput = usernameAppInput && usernameAppInput.shadowRoot ? usernameAppInput.shadowRoot.querySelector('.input') : null
    const passwordInput = passwordAppInput && passwordAppInput.shadowRoot ? passwordAppInput.shadowRoot.querySelector('.input') : null

    const isUsernameValid = this.validateUsername(usernameInput)
    const isPasswordValid = this.validatePassword(passwordInput)

    return isUsernameValid && isPasswordValid
  }
}

export default LoginPage
