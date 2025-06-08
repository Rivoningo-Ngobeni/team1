import { ToastService } from "../components/app-toast.js"
import AuthService from "../utils/auth.js"
import Router from "../utils/router.js"
import SecurityUtils from "../utils/security.js"

class SignupPage {
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
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Sign up to get started with Team Todo</p>
        `

    const form = document.createElement("form")
    form.setAttribute("novalidate", "")
    form.setAttribute("aria-label", "Sign up form")
    form.innerHTML = `
            <div class="form-group">
                <label for="username" class="form-label">Username</label>
                <input 
                    id="username"
                    class="standard-input"
                    type="text" 
                    placeholder="Choose a username" 
                    required
                    autocomplete="username">
                <div id="username-help" class="form-help">3-50 characters, letters, numbers, and underscores only</div>
                <div id="username-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input
                    id="password"
                    class="standard-input"
                    type="password" 
                    placeholder="Create a password" 
                    required
                    autocomplete="new-password">
                <div id="password-help" class="form-help">At least 8 characters</div>
                <div id="password-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <label for="confirm-password" class="form-label">Confirm Password</label>
                <input
                    id="confirm-password"
                    class="standard-input"
                    type="password" 
                    placeholder="Confirm your password" 
                    required
                    autocomplete="new-password">
                <div id="confirm-password-error" class="form-error" role="alert" aria-live="polite"></div>
            </div>
            <div class="form-group">
                <button type="submit" class="danger-button" style="width: 100%;">
                    Create Account
                </button>
            </div>
        `

    const footer = document.createElement("footer")
    footer.className = "auth-footer"
    footer.innerHTML = `
            <p>Already have an account? <a href="#/login" class="auth-link">Sign in here</a></p>
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
    const confirmPasswordInput = form.querySelector("#confirm-password")
    const submitButton = form.querySelector("button[type='submit']")

    const usernameError = form.querySelector("#username-error")
    const passwordError = form.querySelector("#password-error")
    const confirmPasswordError = form.querySelector("#confirm-password-error")

    // Validate username while typing
    usernameInput.addEventListener("input", () => {
      this.validateUsername(usernameInput)
    })

    // Validate password while typing
    passwordInput.addEventListener("input", () => {
      this.validatePassword(passwordInput)

      // Also check confirm password if it has content
      if (confirmPasswordInput.value) {
        this.validateConfirmPassword(passwordInput, confirmPasswordInput)
      }
    })

    // Validate confirm password while typing
    confirmPasswordInput.addEventListener("input", () => {
      this.validateConfirmPassword(passwordInput, confirmPasswordInput)
    })

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const isValid = this.validateForm(form)
      if (!isValid) return

      submitButton.textContent = "Creating Account..."
      submitButton.disabled = true

      try {
        const username = usernameInput.value.trim()
        const password = passwordInput.value
        
        const [result, success] = await AuthService.register(username, password)

        if (success) {
          ToastService.show("Account created successfully!", "success")
          console.log("Register result:", result)
          const payload = {
            username: username,
            qrCodeUrl: result.qrCodeUrl,
            qrCodeImage: result.qrCodeImage,
            totpSecret: result.totpSecret
          }
          Router.navigate("/totp-setup", payload)
        } else {
          ToastService.show(result.message || "Signup failed", "error")
          submitButton.textContent = "Create Account"
          submitButton.disabled = false
        }
      } catch (error) {
        ToastService.show("An error occurred during signup", "error")
        submitButton.textContent = "Create Account"
        submitButton.disabled = false
      }
    })
  }

  static validateUsername(usernameInput) {
    const username = usernameInput.value.trim()
    const errorElement = document.getElementById("username-error")
    
    // Clear previous error
    errorElement.textContent = ""
    errorElement.style.display = "none"
    usernameInput.setAttribute("aria-invalid", "false")

    if (!username) {
      errorElement.textContent = "Username is required"
      errorElement.style.display = "block"
      usernameInput.setAttribute("aria-invalid", "true")
      return false
    }

    if (!SecurityUtils.validateUsername(username)) {
      errorElement.textContent = "Username must be 3-50 characters, containing letters, numbers, and underscores only"
      errorElement.style.display = "block"
      usernameInput.setAttribute("aria-invalid", "true")
      return false
    }

    return true
  }

  static validatePassword(passwordInput) {
    const password = passwordInput.value
    const errorElement = document.getElementById("password-error")
    
    // Clear previous error
    errorElement.textContent = ""
    errorElement.style.display = "none"
    passwordInput.setAttribute("aria-invalid", "false")

    if (!password) {
      errorElement.textContent = "Password is required"
      errorElement.style.display = "block"
      passwordInput.setAttribute("aria-invalid", "true")
      return false
    }

    if (!SecurityUtils.validatePassword(password)) {
      errorElement.textContent = "Password must be at least 8 characters"
      errorElement.style.display = "block"
      passwordInput.setAttribute("aria-invalid", "true")
      return false
    }

    return true
  }

  static validateConfirmPassword(passwordInput, confirmPasswordInput) {
    const password = passwordInput.value
    const confirmPassword = confirmPasswordInput.value
    const errorElement = document.getElementById("confirm-password-error")
    
    // Clear previous error
    errorElement.textContent = ""
    errorElement.style.display = "none"
    confirmPasswordInput.setAttribute("aria-invalid", "false")

    if (!confirmPassword) {
      errorElement.textContent = "Please confirm your password"
      errorElement.style.display = "block"
      confirmPasswordInput.setAttribute("aria-invalid", "true")
      return false
    }

    if (password !== confirmPassword) {
      errorElement.textContent = "Passwords do not match"
      errorElement.style.display = "block"
      confirmPasswordInput.setAttribute("aria-invalid", "true")
      return false
    }

    return true
  }

  static validateForm(form) {
    const usernameInput = form.querySelector("#username")
    const passwordInput = form.querySelector("#password")
    const confirmPasswordInput = form.querySelector("#confirm-password")

    const isUsernameValid = this.validateUsername(usernameInput)
    const isPasswordValid = this.validatePassword(passwordInput)
    const isConfirmPasswordValid = this.validateConfirmPassword(passwordInput, confirmPasswordInput)

    return isUsernameValid && isPasswordValid && isConfirmPasswordValid
  }
}

// Make SignupPage available globally for direct function calls
window.SignupPage = SignupPage

export default SignupPage
