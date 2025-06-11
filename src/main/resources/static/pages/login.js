import { ToastService } from "../components/app-toast.js"
import Router from "../utils/router.js"

class LoginPage {
  static username = null

  static render(payload) {
    const app = document.getElementById("app")
    app.innerHTML = ""

    if (payload && payload.username) {
      LoginPage.username = payload.username
    }

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
                <input 
                    id="username"
                    class="standard-input"
                    type="text" 
                    placeholder="Enter your username" 
                    required
                    autocomplete="username">
                <div id="username-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input
                    id="password"
                    class="standard-input"
                    type="password" 
                    placeholder="Enter your password" 
                    required
                    autocomplete="current-password">
                <div id="password-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    Sign In
                </button>
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
    const usernameInput = form.querySelector("#username")
    const passwordInput = form.querySelector("#password")
    const submitButton = form.querySelector("button[type='submit']")

    // Pre-fill username if we have one stored
    if (LoginPage.username && usernameInput) {
      usernameInput.value = LoginPage.username
    }

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

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const isValid = this.validateForm(form)
      if (!isValid) return

      if (submitButton) {
        submitButton.textContent = "Signing in..."
        submitButton.disabled = true
      }

      try {
        const username = usernameInput ? usernameInput.value.trim() : ""
        const password = passwordInput ? passwordInput.value : ""

        Router.navigate("/two-factor", { username: username, password: password })
      } catch (error) {
        ToastService.show("An error occurred during login", "error")
        if (submitButton) {
          submitButton.textContent = "Sign In"
          submitButton.disabled = false
        }
      }
    })
  }

  // Update the validation methods to work with standard inputs
  static validateUsername(input) {
    const value = input.value.trim()
    const errorElement = document.getElementById("username-error")
    
    // Clear previous error
    errorElement.textContent = ""
    errorElement.style.display = "none"
    input.setAttribute("aria-invalid", "false")

    if (!value) {
      errorElement.textContent = "Username is required"
      errorElement.style.display = "block"
      input.setAttribute("aria-invalid", "true")
      return false
    }

    if (value.length < 3) {
      errorElement.textContent = "Username must be at least 3 characters"
      errorElement.style.display = "block"
      input.setAttribute("aria-invalid", "true")
      return false
    }

    return true
  }

  static validatePassword(input) {
    const value = input.value
    const errorElement = document.getElementById("password-error")
    
    // Clear previous error
    errorElement.textContent = ""
    errorElement.style.display = "none"
    input.setAttribute("aria-invalid", "false")

    if (!value) {
      errorElement.textContent = "Password is required"
      errorElement.style.display = "block"
      input.setAttribute("aria-invalid", "true")
      return false
    }

    return true
  }

  // We can simplify these methods since we're using standard inputs
  static validateForm(form) {
    const usernameInput = form.querySelector("#username")
    const passwordInput = form.querySelector("#password")

    const isUsernameValid = this.validateUsername(usernameInput)
    const isPasswordValid = this.validatePassword(passwordInput)

    return isUsernameValid && isPasswordValid
  }
}

export default LoginPage
