import { ToastService } from "../components/app-toast.js";
import Router from "../utils/router.js";

class TotpSetupPage {
  static currentStep = 1;
  static secretKey = null;
  static qrCodeSvg = null;
  static username = null;
  static qrCodeUrl = null;
  static qrCodeImage = null;
  static totpSecret = null

  static render(payload) {
    console.log("TOTP Setup Page initialized with payload:", payload);
    
    // Store payload data for use during setup
    if (payload) {
      TotpSetupPage.username = payload.username;
      TotpSetupPage.qrCodeUrl = payload.qrCodeUrl;
      TotpSetupPage.qrCodeImage = payload.qrCodeImage;
      TotpSetupPage.totpSecret = payload.totpSecret;
    }

    const app = document.getElementById("app");
    app.innerHTML = "";

    // Add hidden class definition if not defined globally
    const style = document.createElement('style');
    style.textContent = `
      .hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Create semantic structure
    const layout = document.createElement("div");
    layout.className = "auth-layout";
    layout.setAttribute("role", "main");

    const card = document.createElement("article");
    card.className = "auth-card";

    const header = document.createElement("header");
    header.className = "auth-header";
    header.innerHTML = `
      <h1 class="auth-title">Two-Factor Authentication</h1>
      <p class="auth-subtitle">Add an extra layer of security to your account</p>
    `;

    // Step 1: Generate QR Code
    const step1 = document.createElement("div");
    step1.id = "step-1";
    step1.className = "form-group";
    
    // If we already have QR code data from signup, show it directly
    step1.innerHTML = `
    <p class="mb-4">Your two-factor authentication is ready to set up.</p>
    <div class="flex justify-center">
        <button id="generate-qr-btn" class="btn btn-primary">
        Continue to QR Code
        </button>
    </div>
    `;


    // Step 2: Scan QR Code
    const step2 = document.createElement("div");
    step2.id = "step-2";
    step2.className = "form-group hidden";
    step2.innerHTML = `
      <div class="p-4 mb-4" style="background-color: var(--surface-color); border-radius: var(--border-radius);">
        <h4 class="mb-2" style="color: var(--text-primary);">Instructions:</h4>
        <ol style="margin-left: var(--spacing-lg);">
          <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
          <li>Scan the QR code below or manually enter the secret key</li>
          <li>Enter the 6-digit code from your app to verify</li>
        </ol>
      </div>

      <div class="flex justify-center mb-4">
        <div id="qr-code" style="width: 200px; height: 200px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; background-color: white;">
          <div style="color: var(--text-secondary);">QR Code will appear here</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Manual Entry Key (if you can't scan):</label>
        <div id="secret-key" style="background-color: var(--surface-color); padding: var(--spacing-md); border-radius: var(--border-radius); font-family: monospace; word-break: break-all;">
          Secret key will appear here
        </div>
      </div>

      <button id="continue-btn" class="btn btn-primary">
        Continue to Verification
      </button>
    `;

    // Step 3: Verify Code
    const step3 = document.createElement("div");
    step3.id = "step-3";
    step3.className = "form-group hidden";
    step3.innerHTML = `
      <p class="mb-4">Enter the 6-digit code from your authenticator app to complete the setup.</p>
      
      <div class="form-group">
        <label for="verification-code" class="form-label">Verification Code:</label>
        <input 
          id="verification-code" 
          class="form-control"
          type="text" 
          placeholder="000000"
          maxlength="6"
          pattern="[0-9]{6}"
          autocomplete="one-time-code"
          aria-describedby="code-error code-help">
        <div id="code-help" class="form-help">Enter the 6-digit code from your authenticator app</div>
        <div id="code-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>

      <div class="flex gap-2 justify-center mt-4">
        <button id="verify-btn" class="btn btn-primary">
          Verify TOTP Code
        </button>
        <button id="back-btn" class="btn btn-secondary">
          Back to QR Code
        </button>
      </div>
    `;

    // Step 4: Success
    const step4 = document.createElement("div");
    step4.id = "step-4";
    step4.className = "form-group hidden";
    step4.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">✅</div>
        <h2 class="mb-2">Two-Factor Authentication Enabled</h2>
        <p class="mb-4">Congratulations! Two-factor authentication has been successfully enabled for your account.</p>
        <p class="mb-4">From now on, you'll need to enter a code from your authenticator app when logging in.</p>
        
        <button id="done-btn" class="btn btn-primary">
          Done
        </button>
      </div>
    `;

    // Append all elements
    card.appendChild(header);
    card.appendChild(step1);
    card.appendChild(step2);
    card.appendChild(step3);
    card.appendChild(step4);
    layout.appendChild(card);
    app.appendChild(layout);

    TotpSetupPage.initialize();
  }

  static initialize() {
    // Make sure only step 1 is visible initially
    for (let i = 1; i <= 4; i++) {
      const step = document.getElementById(`step-${i}`);
      if (step) {
        if (i === 1) {
          step.style.display = '';
          step.classList.remove('hidden');
        } else {
          step.style.display = 'none';
          step.classList.add('hidden');
        }
      }
    }
    
    TotpSetupPage.initializeEventListeners();
    TotpSetupPage.currentStep = 1;
  }
  
  static initializeEventListeners() {    
    // Direct DOM button references
    const generateQrBtn = document.getElementById('generate-qr-btn');
    const continueBtn = document.getElementById('continue-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const backBtn = document.getElementById('back-btn');
    const doneBtn = document.getElementById('done-btn');
    
    // Use direct function references instead of arrow functions
    if (generateQrBtn) {
      generateQrBtn.onclick = function() {
        // If we already have QR code data from signup, skip generation
        if (TotpSetupPage.qrCodeImage || TotpSetupPage.qrCodeUrl) {
          TotpSetupPage.displayExistingQRCode();
        } else {
          ToastService.show("QR code not available", "error");
        }
      };
    }
    
    if (continueBtn) {
      continueBtn.onclick = function() {
        TotpSetupPage.showStep(3);
      };
    }

    
    if (verifyBtn) {
      verifyBtn.onclick = function() {
        TotpSetupPage.verifyCode();
      };
    }
    
    if (backBtn) {
      backBtn.onclick = function() {
        TotpSetupPage.showStep(2);
      };
    }
    
    if (doneBtn) {
      doneBtn.onclick = function() {
        TotpSetupPage.finish();
      };
    }
    
    // Auto-format verification code input
    const codeInput = document.getElementById('verification-code');
    if (codeInput) {
      // Handle input events for standard HTML input
      codeInput.addEventListener("input", (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, "") // Remove non-digits
        if (value.length > 6) {
          value = value.slice(0, 6);
        }
        
        // Update the value
        codeInput.value = value;
        
        // Validate the code
        TotpSetupPage.validateCode(codeInput);
        
        // Auto-submit when 6 digits are entered
        if (value.length === 6) {
          const verifyBtn = document.getElementById('verify-btn');
          if (verifyBtn) verifyBtn.click();
        }
      });
      
      // Also validate on blur
      codeInput.addEventListener("blur", () => {
        TotpSetupPage.validateCode(codeInput);
      });
    }
  }
  
  static displayExistingQRCode() {
    const qrCodeElement = document.getElementById('qr-code');
    const secretKeyElement = document.getElementById('secret-key');
    
    if (qrCodeElement) {
      if (TotpSetupPage.qrCodeImage) {
        // If we have an image, use it
        qrCodeElement.innerHTML = `<img id="qr-code-image" src="" alt="QR Code" style="width: 180px; height: 180px;">`;
        const qrCodeImage = document.getElementById('qr-code-image');
        qrCodeImage.src = `data:image/png;base64,${TotpSetupPage.qrCodeImage}`;
      } else if (TotpSetupPage.qrCodeUrl) {
        ToastService.show("QR code not available", "error");
      }
    }
    
    // Display secret key if available
    if (secretKeyElement && TotpSetupPage.totpSecret) {
      secretKeyElement.textContent = TotpSetupPage.totpSecret;
    }
    
    // Show step 2
    TotpSetupPage.showStep(2);
    ToastService.show("QR code ready for scanning", "success");
  }
  
  static async verifyCode() {
    const codeInput = document.getElementById('verification-code');
    if (!codeInput) {
      console.error("Verification code input not found");
      return;
    }
    
    // Validate the code first
    if (!TotpSetupPage.validateCode(codeInput)) {
      return;
    }
    
    // Get the code value
    const code = codeInput.value.trim();
    
    TotpSetupPage.showLoading('verify-btn', 'Verifying...');

    try {
      const [response, success] = await AuthService.verifyTwoFactor(TotpSetupPage.username, code);
      
      if (success) {
        TotpSetupPage.showStep(4);
        ToastService.show(response.message, "success");
      } else {
        ToastService.show(response.message, "error");
      }
      
    } catch (error) {
      TotpSetupPage.showError(codeInput, "Invalid verification code. Please check your authenticator app and try again.");
      console.error('Verification error:', error);
    } finally {
      TotpSetupPage.hideLoading('verify-btn', 'Enable Two-Factor Authentication');
    }
  }

  static showStep(stepNumber) { 
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
      const step = document.getElementById(`step-${i}`);
      if (step) {
        step.style.display = 'none';
        step.classList.add('hidden');
      }
    }
    
    // Show target step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.style.display = '';
      targetStep.classList.remove('hidden');
    } else {
      console.error(`Step ${stepNumber} element not found`);
    }
    
    TotpSetupPage.currentStep = stepNumber;
  }

  static generateSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static mockVerifyCode(code) {
    // Mock verification - in real implementation, this would verify against TOTP algorithm
    // For demo purposes, accept any 6-digit code that isn't "000000"
    return code !== '000000' && /^\d{6}$/.test(code);
  }

  static showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.error(`Button with id ${buttonId} not found`);
      return;
    }
    
    button.disabled = true;
    button.textContent = text;
  }

  static hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.error(`Button with id ${buttonId} not found`);
      return;
    }
    
    button.disabled = false;
    button.textContent = originalText;
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static finish() {
    // Create a payload with the data you want to pass back
    const payload = {
      setupComplete: true,
      username: TotpSetupPage.username,
    };
    
    // Show success message
    ToastService.show("Two-factor authentication setup complete! Please login.", "success");
    
    // Navigate to login with the payload
    Router.navigate("/login", payload);
  }

  // Add these validation methods to match the two-factor page
  static validateCode(input) {
    const value = input.value ? input.value.trim() : "";
    const errorElement = document.getElementById("code-error");
    
    if (!value) {
      TotpSetupPage.showError(input, errorElement, "Verification code is required");
      return false;
    }
    
    if (!/^\d{6}$/.test(value)) {
      TotpSetupPage.showError(input, errorElement, "Please enter a 6-digit code");
      return false;
    }
    
    TotpSetupPage.clearError(input, errorElement);
    return true;
  }
  
  static showError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true");
    input.classList.add("is-invalid");
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    } else {
      // Fallback to toast if no error element
      ToastService.show(message, "error");
    }
  }
  
  static clearError(input, errorElement) {
    input.removeAttribute("aria-invalid");
    input.classList.remove("is-invalid");
    
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  }
}

export default TotpSetupPage;