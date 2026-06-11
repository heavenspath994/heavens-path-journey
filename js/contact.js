document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    // Check if coming from a "Book Now" link with a pre-filled trip name
    const urlParams = new URLSearchParams(window.location.search);
    const tripParam = urlParams.get('trip');
    
    if (tripParam) {
      const interestSelect = document.getElementById('interest');
      if (interestSelect) {
        // Create an option if it doesn't exist to show the specific trip
        const optionExists = Array.from(interestSelect.options).some(opt => opt.value === tripParam);
        if (!optionExists) {
          const newOption = new Option(tripParam, tripParam, true, true);
          interestSelect.add(newOption);
        } else {
          interestSelect.value = tripParam;
        }
      }
    }

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      
      // Show loading state
      btn.innerText = 'Sending Request...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      // Gather data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        interest: document.getElementById('interest').value,
        dates: document.getElementById('dates').value,
        message: document.getElementById('message').value
      };

      // Add userId if logged in
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      if (userData && userData.id) {
        formData.userId = userData.id;
      }

      try {
        const apiUrl = CONFIG.API_BASE + '/auth/contact';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          // Show Success UI
          const successMsg = document.createElement('div');
          successMsg.className = 'form-success-msg mt-3';
          successMsg.innerHTML = `
            <div style="background-color: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; border: 1px solid #34d399; text-align: center;">
              <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
              <h4 style="margin-bottom: 5px;">Request Received!</h4>
              <p style="font-size: 0.9rem; margin: 0;">${data.message || "Thank you for reaching out to Heaven's Path Journey. We will contact you shortly."}</p>
            </div>
          `;
          
          contactForm.innerHTML = '';
          contactForm.appendChild(successMsg);
        } else {
          alert(data.message || 'Error submitting request. Please try again.');
          btn.innerText = originalText;
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      } catch (err) {
        console.error(err);
        alert('Failed to connect to the server.');
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  }
});
