document.addEventListener('DOMContentLoaded', () => {
  // Hero Slider Initialization (Custom fade slider)
  const heroSlides = document.querySelectorAll('.hero-slide');
  let currentSlide = 0;
  
  if (heroSlides.length > 0) {
    // Show first slide
    heroSlides[0].classList.add('active');
    
    // Auto cycle slides
    setInterval(() => {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }, 5000); // Change image every 5 seconds
  }

  // Testimonial Swiper Initialization
  if (typeof Swiper !== 'undefined' && document.querySelector('.testimonials-slider')) {
    new Swiper('.testimonials-slider', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        }
      }
    });
  }
});
