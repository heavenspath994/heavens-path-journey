document.addEventListener('DOMContentLoaded', () => {
  const bookingModal = document.getElementById('booking-modal');
  const bookingForm = document.getElementById('booking-form');
  const bookBtn = document.getElementById('book-now-btn');
  const modalClose = document.getElementById('booking-modal-close');
  const alertBox = document.getElementById('booking-alert');
  const submitBtn = document.getElementById('btn-booking-submit');

  if (!bookingModal || !bookingForm) return;

  // Open modal when clicking "Book This Tour"
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Check if user is logged in
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');

      if (!token || !userData) {
        alert('Please login to book a tour.');
        // Optionally trigger login modal if available
        if (document.getElementById('global-auth-modal')) {
          document.getElementById('global-auth-modal').classList.add('active');
        }
        return;
      }

      // Pre-fill user data
      document.getElementById('booking-name').value = userData.name || '';
      document.getElementById('booking-email').value = userData.email || '';
      
      // Get package ID from URL
      const params = new URLSearchParams(window.location.search);
      const pkgId = params.get('id');
      document.getElementById('booking-pkg-id').value = pkgId || '';
      
      const pkgTitle = document.getElementById('hero-title') ? document.getElementById('hero-title').textContent : 'This Tour';
      document.getElementById('booking-pkg-title').textContent = pkgTitle;
      
      alertBox.style.display = 'none';
      bookingModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  const closeModal = () => {
    bookingModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal();
  });

  // Submit Booking
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('userToken');
    if (!token) return alert('You must be logged in.');

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    const formData = {
      packageId: document.getElementById('booking-pkg-id').value,
      travelerName: document.getElementById('booking-name').value,
      email: document.getElementById('booking-email').value,
      phone: document.getElementById('booking-phone').value,
      travelDate: document.getElementById('booking-date').value,
      numberOfPersons: document.getElementById('booking-persons').value
    };

    try {
      const apiUrl = CONFIG.API_BASE + '/user/bookings';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alertBox.className = 'auth-modal-alert success';
        alertBox.textContent = data.message || 'Booking successful!';
        alertBox.style.display = 'block';
        
        // Clear form
        bookingForm.reset();
        
        setTimeout(() => {
          closeModal();
          // Optionally redirect to user dashboard
          // window.location.href = 'user-dashboard.html';
        }, 2500);
      } else {
        alertBox.className = 'auth-modal-alert error';
        alertBox.textContent = data.message || 'Error creating booking.';
        alertBox.style.display = 'block';
        submitBtn.innerHTML = 'Submit Booking Request';
        submitBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      alertBox.className = 'auth-modal-alert error';
      alertBox.textContent = 'Failed to connect to the server.';
      alertBox.style.display = 'block';
      submitBtn.innerHTML = 'Submit Booking Request';
      submitBtn.disabled = false;
    }
  });
});
