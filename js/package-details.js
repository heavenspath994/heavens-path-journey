// Package Details Page Logic
document.addEventListener('DOMContentLoaded', async () => {
  // Get package ID from URL
  const params = new URLSearchParams(window.location.search);
  const pkgId = params.get('id');

  if (!pkgId) return showError();

  let pkg;
  try {
    const apiUrl = CONFIG.API_BASE + `/packages/${pkgId}`;
        
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Package not found');
    pkg = await response.json();
  } catch (err) {
    console.error(err);
    return showError();
  }

  function showError() {
    document.querySelector('.pkg-main').innerHTML = `
      <div style="text-align:center; padding: 80px 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem; color: var(--color-accent); margin-bottom:20px;"></i>
        <h2>Package Not Found</h2>
        <p style="color: var(--color-text-light); margin: 16px 0 28px;">The tour package you're looking for doesn't exist or has been removed.</p>
        <a href="packages.html" class="btn btn-primary">Browse All Packages</a>
      </div>
    `;
  }

  // ===== Populate Hero =====
  const heroImg = document.getElementById('hero-img');
  heroImg.src = pkg.image;
  heroImg.alt = pkg.title;

  document.getElementById('hero-badge').textContent = pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1);
  document.getElementById('hero-title').textContent = pkg.title;
  document.getElementById('hero-duration').innerHTML = `<i class="far fa-clock"></i> ${pkg.duration}`;
  
  const priceStr = typeof pkg.price === 'number' ? `₹${pkg.price.toLocaleString('en-IN')}` : pkg.price;
  document.getElementById('hero-price').innerHTML = `<i class="fas fa-tag"></i> ${priceStr} / per person`;

  // Update page title
  document.title = `${pkg.title} | Heaven's Path Journey`;

  // Breadcrumb
  document.getElementById('breadcrumb-title').textContent = pkg.title;

  // ===== Sidebar =====
  document.getElementById('sidebar-price').innerHTML = `${priceStr} <span>/ person</span>`;
  document.getElementById('sidebar-duration').textContent = pkg.duration;
  document.getElementById('sidebar-category').textContent = pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1);

  // Book Now button
  const bookBtn = document.getElementById('book-now-btn');
  bookBtn.href = `contact.html?trip=${encodeURIComponent(pkg.title)}`;

  // CTA Contact button
  const ctaBtn = document.getElementById('cta-contact-btn');
  ctaBtn.href = `contact.html?trip=${encodeURIComponent(pkg.title)}`;

  // ===== Includes =====
  const includesList = document.getElementById('includes-list');
  if (pkg.highlights && pkg.highlights.length) {
    includesList.innerHTML = pkg.highlights.map(item =>
      `<li style="margin-bottom: 4px; padding-left: 18px; text-indent: -18px; line-height: 1.4;"><i class="fas fa-check-circle text-accent" style="margin-right: 5px; font-size: 0.75rem;"></i>${item}</li>`
    ).join('');
  }

  // ===== Gallery =====
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryImages = pkg.gallery || [pkg.image];

  galleryGrid.innerHTML = galleryImages.map((img, idx) =>
    `<div class="gallery-item" data-index="${idx}">
      <img src="${img}" alt="${pkg.title} - Photo ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800';">
    </div>`
  ).join('');

  // ===== Lightbox =====
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let currentLightboxIndex = 0;

  function openLightbox(index) {
    currentLightboxIndex = index;
    lightboxImg.src = galleryImages[index];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    currentLightboxIndex = (currentLightboxIndex + direction + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentLightboxIndex];
  }

  galleryGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (item) {
      openLightbox(parseInt(item.dataset.index));
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext.addEventListener('click', () => navigateLightbox(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // ===== Itinerary Timeline =====
  const timeline = document.getElementById('timeline');
  if (pkg.itinerary && pkg.itinerary.length) {
    timeline.innerHTML = pkg.itinerary.map(day => `
      <div class="timeline-item">
        <div class="timeline-dot">${day.day}</div>
        <div class="timeline-card">
          <img class="timeline-card-img" src="${day.image}" alt="Day ${day.day} - ${day.title}" onerror="this.src='https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600';">
          <div class="timeline-card-body">
            <span class="timeline-day-label">Day ${day.day}</span>
            <h3 class="timeline-card-title">${day.title}</h3>
            <p class="timeline-card-desc">${day.description}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ===== Location Map =====
  if (pkg.mapUrl) {
    document.getElementById('pkg-map').style.display = 'block';
    document.getElementById('map-iframe').src = pkg.mapUrl;
  }
});
