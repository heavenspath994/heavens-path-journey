document.addEventListener('DOMContentLoaded', async () => {
  let packagesData = [];

  // --- Fetch Packages from Backend ---
  const fetchPackages = async () => {
    try {
      // Use absolute URL or relative if hosted together. Assuming relative works.
      // E.g. http://localhost:3000/api/packages if frontend is on 5500 and backend on 3000
      // We'll use the API URL from window config if exists, else fallback to standard port
      const apiUrl = CONFIG.API_BASE + '/packages';
        
      const response = await fetch(apiUrl);
      if (response.ok) {
        packagesData = await response.json();
      } else {
        console.error('Failed to fetch packages:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  // Wait for packages to load
  await fetchPackages();

  // --- Fetch Wishlisted Packages on Load ---
  window.wishlistedPackages = new Set();
  const fetchUserWishlist = async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const apiUrl = CONFIG.API_BASE + '/user/wishlist/items';
        
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        data.forEach(id => window.wishlistedPackages.add(id));
      }
    } catch(err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  await fetchUserWishlist();

  // Function to render cards
  const renderPackages = (container, packages) => {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (packages.length === 0) {
      container.innerHTML = '<p class="text-center w-100 mt-4">No packages found for this category.</p>';
      return;
    }

    packages.forEach(pkg => {
      // Check if this package is in the global wishlisted set
      const isWishlisted = window.wishlistedPackages && window.wishlistedPackages.has(pkg.id);
      const heartClass = isWishlisted ? 'fas fa-heart' : 'far fa-heart';
      const activeClass = isWishlisted ? 'active' : '';
      
      // format price nicely if it's a number
      const priceStr = typeof pkg.price === 'number' ? `₹${pkg.price.toLocaleString('en-IN')}` : pkg.price;

      const categoryStr = pkg.category || 'general';
      const categoryBadge = categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1);
      
      const cardHTML = `
        <div class="card reveal">
          <div class="card-img-wrapper" style="position:relative;">
            <button class="wishlist-btn ${activeClass}" onclick="toggleWishlist('${pkg.id}', this)" title="Add to Wishlist">
              <i class="${heartClass}"></i>
            </button>
            <span class="card-badge">${categoryBadge}</span>
            <img src="${pkg.image}" alt="${pkg.title}" onerror="this.src='https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800';">
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span><i class="far fa-clock"></i> ${pkg.duration}</span>
            </div>
            <h3 class="card-title">${pkg.title}</h3>
            ${pkg.description ? `<p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 1rem;">${pkg.description}</p>` : ''}
            <div class="card-price">
              ${priceStr} <span>/ per person</span>
            </div>
            <a href="package-details.html?id=${pkg.id}" class="btn btn-outline w-100" style="display:block">View Itinerary</a>
          </div>
        </div>
      `;
      container.innerHTML += cardHTML;
    });

    // Re-initialize scroll reveal for new elements if loaded dynamically
    if (typeof ScrollReveal !== 'undefined') {
      ScrollReveal().reveal('.card', { interval: 100 });
    }
  };

  // --- Wishlist Toggle Logic ---
  window.toggleWishlist = async (pkgId, btnElement) => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (!token) {
      const loginModal = document.getElementById('global-auth-modal');
      if(loginModal) loginModal.classList.add('active');
      return;
    }

    const icon = btnElement.querySelector('i');
    
    // Toggle UI instantly for better UX
    btnElement.classList.toggle('active');
    if (btnElement.classList.contains('active')) {
      icon.classList.remove('far');
      icon.classList.add('fas');
    } else {
      icon.classList.remove('far');
      icon.classList.add('far');
      icon.classList.remove('fas');
    }

    // Call API
    try {
      const apiUrl = CONFIG.API_BASE + '/user/wishlist/toggle';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId: pkgId })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle wishlist');
      }
      
      const data = await response.json();
      
      // Update global state
      if (data.action === 'added') {
        window.wishlistedPackages.add(pkgId);
      } else {
        window.wishlistedPackages.delete(pkgId);
      }

    } catch (err) {
      console.error(err);
      // Revert UI on failure
      alert("Failed to update wishlist. Please try again.");
      btnElement.classList.toggle('active');
      if (btnElement.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
    }
  };

  // Render on Homepage (Featured only)
  const featuredContainer = document.getElementById('featured-packages-grid');
  if (featuredContainer) {
    const featured = packagesData.filter(p => p.featured).slice(0, 3);
    renderPackages(featuredContainer, featured);
  }

  // Render on Packages Page (All + Filtering)
  const allContainer = document.getElementById('all-packages-grid');
  if (allContainer) {
    renderPackages(allContainer, packagesData);

    // Filter logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Remove active class from all
        filterBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
        filterBtns.forEach(b => b.classList.add('btn-outline'));
        
        // Add active to clicked
        e.target.classList.remove('btn-outline');
        e.target.classList.add('active', 'btn-primary');

        const filterValue = e.target.getAttribute('data-filter');
        
        if (filterValue === 'all') {
          renderPackages(allContainer, packagesData);
        } else {
          const filtered = packagesData.filter(p => p.category === filterValue);
          renderPackages(allContainer, filtered);
        }
      });
    });
  }
});
