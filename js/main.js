document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      mobileMenuBtn.innerHTML = isExpanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  // Sticky Header on Scroll
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Active Link Highlighting based on current URL
  const currentPath = window.location.pathname.split('/').pop();
  const navItems = document.querySelectorAll('.nav-link');
  
  navItems.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ==========================================================================
  // Global Auth Modal Logic
  // ==========================================================================
  
  // 1. Inject Modal HTML into the body
  if (!document.getElementById('global-auth-modal')) {
    const modalHTML = `
      <div class="auth-modal-overlay" id="global-auth-modal">
        <div class="auth-modal">
          <button class="auth-modal-close" id="auth-modal-close"><i class="fas fa-times"></i></button>
          
          <div class="auth-modal-logo">
            <h2>HEAVEN'S PATH <span>JOURNEY</span></h2>
          </div>
          
          <div class="auth-modal-tabs" id="auth-modal-tabs">
            <button class="auth-modal-tab active" data-tab="login">Login</button>
            <button class="auth-modal-tab" data-tab="register">Register</button>
          </div>
          
          <div id="auth-alert" class="auth-modal-alert"></div>

          <!-- Login Form -->
          <form id="auth-form-login" class="auth-modal-form active">
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="login-email" style="font-size: 0.9rem;">Email Address</label>
              <input type="email" id="login-email" class="form-control" required placeholder="user@example.com">
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="login-password" style="font-size: 0.9rem;">Password</label>
              <div style="position: relative;">
                <input type="password" id="login-password" class="form-control" required placeholder="••••••••" style="padding-right: 40px;">
                <i class="fas fa-eye toggle-password" data-target="login-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94A3B8;"></i>
              </div>
            </div>
            <a class="auth-forgot-link" id="show-forgot-btn">Forgot Password?</a>
            <button type="submit" class="btn btn-primary" style="width: 100%; border-radius: 8px;" id="btn-login-submit">Sign In</button>
          </form>

          <!-- Register Form -->
          <form id="auth-form-register" class="auth-modal-form">
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="reg-name" style="font-size: 0.9rem;">Full Name</label>
              <input type="text" id="reg-name" class="form-control" required placeholder="John Doe">
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="reg-email" style="font-size: 0.9rem;">Email Address</label>
              <input type="email" id="reg-email" class="form-control" required placeholder="john@example.com">
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="reg-phone" style="font-size: 0.9rem;">Phone Number</label>
              <input type="tel" id="reg-phone" class="form-control" required placeholder="9876543210">
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="reg-password" style="font-size: 0.9rem;">Password</label>
              <div style="position: relative;">
                <input type="password" id="reg-password" class="form-control" required placeholder="••••••••" style="padding-right: 40px;">
                <i class="fas fa-eye toggle-password" data-target="reg-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94A3B8;"></i>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; border-radius: 8px;" id="btn-reg-submit">Create Account</button>
          </form>

          <!-- Forgot Password Form -->
          <form id="auth-form-forgot" class="auth-modal-form">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="color: var(--color-primary); font-family: var(--font-heading); font-size: 1.2rem;">Reset Password</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-light);">Enter your email and new password.</p>
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="forgot-email" style="font-size: 0.9rem;">Email Address</label>
              <input type="email" id="forgot-email" class="form-control" required placeholder="user@example.com">
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="forgot-password" style="font-size: 0.9rem;">New Password</label>
              <div style="position: relative;">
                <input type="password" id="forgot-password" class="form-control" required placeholder="••••••••" style="padding-right: 40px;">
                <i class="fas fa-eye toggle-password" data-target="forgot-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94A3B8;"></i>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; border-radius: 8px;" id="btn-forgot-submit">Save New Password</button>
            <div style="text-align: center; margin-top: 15px;">
              <a class="auth-forgot-link" id="back-to-login-btn" style="float: none; display: inline-block;">Back to Login</a>
            </div>
          </form>

        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 2. Auth State & Navigation Injection
  let currentUserToken = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
  let currentUserData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('adminUser'));

  if (navLinks) {
    const authContainer = document.createElement('div');
    authContainer.style.display = 'inline-flex';
    authContainer.style.alignItems = 'center';
    authContainer.style.gap = '15px';
    authContainer.style.marginLeft = '15px';

    if (currentUserToken && currentUserData) {
      const dashUrl = currentUserData.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
      const icon = currentUserData.role === 'admin' ? 'fa-shield-alt' : 'fa-user-circle';
      const text = 'My Account';
      
      authContainer.innerHTML = `
        <a href="${dashUrl}" class="nav-link" style="font-weight:600; color:var(--color-accent);"><i class="fas ${icon}"></i> ${text}</a>
      `;
    } else {
      authContainer.innerHTML = `
        <a href="#" class="nav-link" id="nav-login-btn" style="font-weight:600;"><i class="fas fa-sign-in-alt"></i> Login / Register</a>
      `;
    }
    navLinks.appendChild(authContainer);
  }

  // 3. Modal Toggling Logic
  const modal = document.getElementById('global-auth-modal');
  const closeBtn = document.getElementById('auth-modal-close');
  const navLoginBtn = document.getElementById('nav-login-btn');
  const alertBox = document.getElementById('auth-alert');
  
  const forms = {
    login: document.getElementById('auth-form-login'),
    register: document.getElementById('auth-form-register'),
    forgot: document.getElementById('auth-form-forgot')
  };
  
  const tabs = document.querySelectorAll('.auth-modal-tab');
  const tabsContainer = document.getElementById('auth-modal-tabs');

  const openModal = (view = 'login') => {
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      switchView(view);
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      alertBox.style.display = 'none';
    }
  };

  if (navLoginBtn) navLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  
  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const switchView = (view) => {
    alertBox.style.display = 'none';
    // Hide all forms
    Object.values(forms).forEach(f => f.classList.remove('active'));
    // Deactivate tabs
    tabs.forEach(t => t.classList.remove('active'));
    
    if (view === 'forgot') {
      tabsContainer.style.display = 'none';
      forms.forgot.classList.add('active');
    } else {
      tabsContainer.style.display = 'flex';
      forms[view].classList.add('active');
      document.querySelector(`.auth-modal-tab[data-tab="${view}"]`).classList.add('active');
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.tab));
  });

  document.getElementById('show-forgot-btn').addEventListener('click', () => switchView('forgot'));
  document.getElementById('back-to-login-btn').addEventListener('click', () => switchView('login'));

  // 4. API Handlers
  const handleAuthApi = async (url, bodyData, btnId, defaultText, isReset = false) => {
    const btn = document.getElementById(btnId);
    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      btn.disabled = true;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alertBox.className = 'auth-modal-alert success';
        alertBox.textContent = data.message || 'Success!';
        alertBox.style.display = 'block';
        
        if (isReset) {
          // Stay on modal, show login after 2 seconds
          setTimeout(() => switchView('login'), 2000);
        } else {
          // Save tokens based on role returned
          if (data.role === 'admin') {
            localStorage.setItem('adminToken', data.accessToken);
            localStorage.setItem('adminUser', JSON.stringify(data));
          } else {
            localStorage.setItem('userToken', data.accessToken);
            localStorage.setItem('userData', JSON.stringify(data));
          }
          
          alertBox.textContent += ' Redirecting...';
          setTimeout(() => {
            window.location.href = data.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
          }, 1000);
        }
      } else {
        alertBox.className = 'auth-modal-alert error';
        alertBox.textContent = data.message || 'Action failed.';
        alertBox.style.display = 'block';
      }
    } catch (error) {
      alertBox.className = 'auth-modal-alert error';
      alertBox.textContent = 'Network error. Make sure backend server is running.';
      alertBox.style.display = 'block';
    } finally {
      btn.innerHTML = defaultText;
      btn.disabled = false;
    }
  };

  const getApiUrl = (endpoint) => {
    return CONFIG.API_BASE + endpoint.replace('/api', '');
  };

  forms.login.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAuthApi(getApiUrl('/api/auth/login'), {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    }, 'btn-login-submit', 'Sign In');
  });

  forms.register.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAuthApi(getApiUrl('/api/auth/user-register'), {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      password: document.getElementById('reg-password').value
    }, 'btn-reg-submit', 'Create Account');
  });

  forms.forgot.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAuthApi(getApiUrl('/api/auth/reset-password'), {
      email: document.getElementById('forgot-email').value,
      newPassword: document.getElementById('forgot-password').value
    }, 'btn-forgot-submit', 'Save New Password', true);
  });

  // Password Visibility Toggle Logic
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      
      if (input.type === 'password') {
        input.type = 'text';
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
    });
  });

  // 5. Intercept Protected Links
  // Attach event listener to body to catch all clicks
  document.body.addEventListener('click', (e) => {
    // Check if clicked element or its parent is a protected link
    const targetLink = e.target.closest('.btn-primary[href="contact.html"], a[href="package-details.html"]');
    
    // We want to intercept "Book Now" buttons which link to contact.html right now
    if (targetLink && targetLink.textContent.trim().toLowerCase().includes('book now')) {
      if (!currentUserToken) {
        e.preventDefault();
        openModal('login');
      }
    }
  });

  // Initialize ScrollReveal
  if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
      origin: 'bottom',
      distance: '50px',
      duration: 1000,
      delay: 200,
      reset: false
    });

    sr.reveal('.section-header');
    sr.reveal('.card', { interval: 100 });
    sr.reveal('.service-icon-box', { interval: 100 });
    sr.reveal('.about-snippet-img', { origin: 'left' });
    sr.reveal('.about-snippet-text', { origin: 'right' });
    sr.reveal('.contact-info-item', { interval: 100, origin: 'left' });
    sr.reveal('.contact-form-card', { origin: 'right' });
  }

  // Number Counter Animation for Stats
  const counters = document.querySelectorAll('.stat-number');
  const speed = 200; // The lower the slower

  const animateCounters = () => {
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const inc = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 10);
        } else {
          counter.innerText = target + (counter.hasAttribute('data-plus') ? '+' : '');
        }
      };
      
      // Simple intersection observer to start animation when visible
      const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) {
          updateCount();
          observer.disconnect();
        }
      });
      observer.observe(counter);
    });
  }
  
  if(counters.length > 0) {
    animateCounters();
  }

});
