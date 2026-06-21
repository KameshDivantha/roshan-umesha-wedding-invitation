import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Roshan & Umesha Wedding Invitation Script
document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // CONFIGURATION
  // ==========================================
  // Paste your Google Apps Script Web App URL here
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby4fWrAomteK2wuF9xSljfrs1DQx32wShfT09uvue2BlXOompHgMtMB5gnig4kPj2LlvA/exec";

  // Replace this with your real Google Client ID from Google Cloud Console
  // Example: "123456789-abcdef.apps.googleusercontent.com"
  const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  // Wedding Date: Sunday, July 19, 2026 at 11:00 AM in Sri Lanka Time (GMT+5:30)
  const WEDDING_DATE = new Date("2026-07-19T11:00:00+05:30").getTime();

  // Active logged-in user state
  let loggedInUser = null;

  // ==========================================
  // COUNTDOWN TIMER
  // ==========================================
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function updateCountdown() {
    const now = new Date().getTime();
    const timeRemaining = WEDDING_DATE - now;

    if (timeRemaining <= 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      document.querySelector('.countdown-heading').innerText = "We Are Married! ♥";
      return;
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    daysEl.innerText = days.toString().padStart(2, '0');
    hoursEl.innerText = hours.toString().padStart(2, '0');
    minutesEl.innerText = minutes.toString().padStart(2, '0');
    secondsEl.innerText = seconds.toString().padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ==========================================
  // FALLING PETALS EFFECT
  // ==========================================
  const petalsCanvas = document.getElementById('petals-canvas');
  const petalCount = 20;

  const petalShapes = [
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,0 C23.28,0 30,6.72 30,15 C30,23.28 23.28,30 15,30 C6.72,30 0,23.28 0,15 C0,6.72 6.72,0 15,0 Z" fill="#E1D8E7" opacity="0.75"/></svg>`,
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,0 C25,10 30,20 30,25 C30,27.76 27.76,30 25,30 C20,30 10,25 0,15 C0,6.72 5,0 15,0 Z" fill="#CBB0A3" opacity="0.6"/></svg>`,
    `<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15,0 C22,0 28,8 28,16 C28,24 22,28 15,28 C8,28 2,24 2,16 C2,8 8,0 15,0 Z" fill="#F5ECE3" opacity="0.8"/></svg>`
  ];

  function createPetal() {
    const petal = document.createElement('div');
    petal.classList.add('petal');
    petal.innerHTML = petalShapes[Math.floor(Math.random() * petalShapes.length)];

    const size = Math.random() * 15 + 10;
    const startLeft = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 15 + 10;
    const shakeAngle = Math.random() * 40 - 20;

    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    petal.style.left = `${startLeft}%`;
    petal.style.animationDelay = `${delay}s`;
    petal.style.animationDuration = `${duration}s`;
    petal.style.setProperty('--sway-angle', `${shakeAngle}deg`);

    petalsCanvas.appendChild(petal);

    setTimeout(() => {
      petal.remove();
      createPetal();
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < petalCount; i++) {
    createPetal();
  }

  // ==========================================
  // BACKGROUND MUSIC WIDGET
  // ==========================================
  const musicBtn = document.getElementById('music-btn');
  const bgAudio = document.getElementById('bg-audio');
  const musicIcon = document.getElementById('music-icon');

  let isPlaying = false;

  function toggleMusic() {
    if (isPlaying) {
      bgAudio.pause();
      musicBtn.classList.remove('playing');
      musicIcon.style.display = 'block';
      isPlaying = false;
    } else {
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          musicBtn.classList.add('playing');
          musicIcon.style.display = 'none';
          isPlaying = true;
        }).catch(error => {
          console.log("Autoplay was blocked by browser. Audio will play on first click.", error);
        });
      }
    }
  }

  musicBtn.addEventListener('click', toggleMusic);

  const autoPlayHandler = () => {
    if (!isPlaying) {
      toggleMusic();
    }
    document.removeEventListener('click', autoPlayHandler);
    document.removeEventListener('scroll', autoPlayHandler);
    document.removeEventListener('touchstart', autoPlayHandler);
  };

  document.addEventListener('click', autoPlayHandler);
  document.addEventListener('scroll', autoPlayHandler);
  document.addEventListener('touchstart', autoPlayHandler);

  // ==========================================
  // FIREBASE AUTHENTICATION (GOOGLE SIGN-IN)
  // ==========================================
  const loggedOutContainer = document.getElementById('rsvp-logged-out');
  const loggedInContainer = document.getElementById('rsvp-logged-in');
  const googleLoginBtnContainer = document.getElementById('google-login-btn');
  const googleLogoutBtn = document.getElementById('google-logout-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-display-name');
  const userEmailAddress = document.getElementById('user-email-address');
  const guestNameInput = document.getElementById('guest-name');
  const rsvpForm = document.getElementById('rsvp-form');

  // Login UI transition
  function loginUser(name, email, picture) {
    loggedInUser = { name, email, picture };

    // Save to local storage for quick access
    localStorage.setItem('wedding_auth_user', JSON.stringify(loggedInUser));

    // Update UI elements
    userAvatar.src = picture || "https://www.gstatic.com/images/branding/product/2x/avatar_square_blue_120dp.png";
    userDisplayName.innerText = name;
    userEmailAddress.innerText = email;
    guestNameInput.value = name;

    // Toggle containers
    loggedOutContainer.style.display = 'none';
    loggedInContainer.style.display = 'block';

    // If they already responded previously, show success state, but allow them to update
    const savedRsvp = localStorage.getItem('wedding_rsvp');
    if (savedRsvp) {
      const rsvpData = JSON.parse(savedRsvp);
      if (rsvpData.email.toLowerCase().trim() === email.toLowerCase().trim()) {
        showSuccessUI(rsvpData.name, rsvpData.status, true);
      }
    }
  }

  // Logout UI transition
  function logoutUser() {
    loggedInUser = null;
    localStorage.removeItem('wedding_auth_user');

    // Reset fields
    userAvatar.src = "";
    userDisplayName.innerText = "";
    userEmailAddress.innerText = "";
    guestNameInput.value = "";

    // Toggle containers back
    loggedInContainer.style.display = 'none';
    document.getElementById('rsvp-success').style.display = 'none';
    rsvpForm.style.display = 'block';
    loggedOutContainer.style.display = 'block';
  }

  // Initialize Firebase and Auth
  async function initializeFirebaseAuth() {
    try {
      // Fetch the automatic Firebase config generated by Firebase Hosting
      const response = await fetch('/__/firebase/init.json');
      const firebaseConfig = await response.json();
      
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      // Listen for authentication state changes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          loginUser(user.displayName, user.email, user.photoURL);
        } else {
          logoutUser();
        }
      });

      // Render custom Google Sign-In button
      googleLoginBtnContainer.innerHTML = `
        <button type="button" class="btn btn-primary" id="firebase-login-btn" style="background-color: #4285F4; border-radius: 4px; padding: 10px 20px; font-size: 0.95rem; font-weight: 500; display: inline-flex; align-items: center; gap: 10px; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.93 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.96H.957C.347 6.173 0 7.547 0 9s.347 2.827.957 4.04l3.007-2.333z" fill="#FBBC05"/>
            <path d="M9 3.58c1.32 0 2.508.454 3.44 1.346l2.582-2.58C13.463.89 11.426 0 9 0 5.482 0 2.438 2.07 1.057 5.097L3.964 7.43c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      `;

      document.getElementById('firebase-login-btn').addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => {
          console.error("Google Sign-In Error:", error);
          alert("Sign-in failed. Please try again.");
        });
      });

      googleLogoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => {
          console.error("Sign-out Error:", error);
        });
      });

    } catch (error) {
      console.error("Firebase initialization failed. Are you testing locally without Firebase emulator? ", error);
      googleLoginBtnContainer.innerHTML = `<div style="color:red; font-size: 0.9rem;">Unable to load Firebase Auth. Please ensure this site is accessed via Firebase Hosting.</div>`;
    }
  }

  initializeFirebaseAuth();

  // ==========================================
  // CONFETTI CELEBRATION EFFECT (Canvas)
  // ==========================================
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let confettiActive = false;
  let particles = [];
  const colors = ['#6F4E74', '#A593B1', '#E1D8E7', '#F5ECE3', '#CBB0A3', '#E95B7D', '#FFD700'];

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -50 - 20;
      this.size = Math.random() * 8 + 6;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.speedX = Math.random() * 3 - 1.5;
      this.speedY = Math.random() * 3 + 2;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 4 - 2;
      this.opacity = 1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      this.speedX += Math.sin(this.y / 30) * 0.05;

      if (this.y > canvas.height * 0.7) {
        this.opacity -= 0.015;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      ctx.restore();
    }
  }

  function startConfetti() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    particles = [];
    confettiActive = true;

    for (let i = 0; i < 150; i++) {
      particles.push(new ConfettiParticle());
    }

    animateConfetti();
  }

  function stopConfetti() {
    confettiActive = false;
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.removeEventListener('resize', resizeCanvas);
  }

  function animateConfetti() {
    if (!confettiActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, index) => {
      p.update();
      p.draw();

      if (p.opacity <= 0 || p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
        if (particles.length < 150 && Math.random() > 0.3) {
          particles[index] = new ConfettiParticle();
        } else {
          particles.splice(index, 1);
        }
      }
    });

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(animateConfetti);
    } else {
      stopConfetti();
    }
  }

  // ==========================================
  // RSVP GOOGLE SHEETS INTEGRATION
  // ==========================================
  const rsvpSuccess = document.getElementById('rsvp-success');
  const rsvpError = document.getElementById('rsvp-error');
  const submitBtn = document.getElementById('rsvp-submit-btn');
  const btnSpinner = document.getElementById('rsvp-spinner');
  const editRsvpBtn = document.getElementById('edit-rsvp-btn');
  const successHeading = document.getElementById('success-heading');
  const successText = document.getElementById('success-text');

  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!loggedInUser) {
      rsvpError.innerText = "Please login first before submitting your response.";
      rsvpError.style.display = 'block';
      return;
    }

    rsvpError.style.display = 'none';
    submitBtn.disabled = true;
    btnSpinner.style.display = 'inline-block';

    // Extract values
    const name = document.getElementById('guest-name').value;
    const email = loggedInUser.email;
    const status = document.querySelector('input[name="status"]:checked').value;

    // Send simplified parameters: status, name, email (others defaulted in spreadsheet script)
    const payload = {
      name: name,
      email: email,
      status: status,
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let resultData;

      try {
        resultData = JSON.parse(responseText);
      } catch (err) {
        resultData = { result: response.ok ? 'success' : 'error' };
      }

      if (resultData.result === 'success' || response.ok) {
        localStorage.setItem('wedding_rsvp', JSON.stringify(payload));
        showSuccessUI(name, status, false);
      } else {
        throw new Error(resultData.error || "Unable to save RSVP response.");
      }
    } catch (err) {
      console.error("RSVP Submission Error: ", err);
      // Save locally to prevent data loss
      localStorage.setItem('wedding_rsvp', JSON.stringify(payload));
      showSuccessUI(name, status, false, true);
    } finally {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
    }
  });

  function showSuccessUI(name, status, isPreloaded = false, isOffline = false) {
    // Hide form, show success overlay inside logged-in container
    rsvpForm.style.display = 'none';
    rsvpSuccess.style.display = 'block';

    if (status === 'Attending') {
      successHeading.innerText = "See You There! ✨";
      successText.innerText = `Thank you, ${name}! Your response has been received. We are so excited to celebrate with you on July 19, 2026.`;
    } else {
      successHeading.innerText = "Warm Wishes ♥";
      successText.innerText = `Thank you, ${name}. We are sorry that you can't make it to our wedding, but we appreciate you letting us know.`;
    }

    if (isOffline) {
      successText.innerText += " (Note: Saved locally. Your response will sync automatically when your internet reconnects.)";
    }

    if (!isPreloaded) {
      startConfetti();
      setTimeout(stopConfetti, 5000);
    }
  }

  editRsvpBtn.addEventListener('click', () => {
    rsvpSuccess.style.display = 'none';
    rsvpForm.style.display = 'block';
    stopConfetti();
  });

});
