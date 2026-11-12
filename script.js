/**
 * Codrxs Coding Academy - Interactive Client Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking links
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // 2. FAQ Accordion Interaction
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      
      // Close all
      faqItems.forEach(i => i.classList.remove('active'));

      // If wasn't open, open current
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // Open first FAQ by default
  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
  }

  // 3. Candidate Interest Form Handling & Validation
  const form = document.getElementById('candidateInterestForm');
  const successBanner = document.getElementById('formSuccessMessage');
  const submittedNameEl = document.getElementById('submittedCandidateName');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;

      // Inputs to validate
      const fullNameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      const cityInput = document.getElementById('city');
      const educationSelect = document.getElementById('education');
      const experienceSelect = document.getElementById('experience');
      const timeSlotSelect = document.getElementById('timeSlot');
      const consentCheck = document.getElementById('consentCheck');

      // Helper function to validate field
      function checkField(input, condition, errorId) {
        const errorEl = document.getElementById(errorId);
        const parentField = input.closest('.form-field') || input.closest('.terms-field');
        if (!condition) {
          if (parentField) parentField.classList.add('has-error');
          if (errorEl) errorEl.style.display = 'block';
          isValid = false;
        } else {
          if (parentField) parentField.classList.remove('has-error');
          if (errorEl) errorEl.style.display = 'none';
        }
      }

      // 1. Full name
      checkField(fullNameInput, fullNameInput.value.trim().length >= 3, 'fullNameError');

      // 2. Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      checkField(emailInput, emailRegex.test(emailInput.value.trim()), 'emailError');

      // 3. Phone number
      checkField(phoneInput, phoneInput.value.trim().length >= 7, 'phoneError');

      // 4. City
      checkField(cityInput, cityInput.value.trim().length >= 2, 'cityError');

      // 5. Education
      checkField(educationSelect, educationSelect.value !== '', 'educationError');

      // 6. Experience
      checkField(experienceSelect, experienceSelect.value !== '', 'experienceError');

      // 7. Time slot
      checkField(timeSlotSelect, timeSlotSelect.value !== '', 'timeSlotError');

      // 8. Consent
      checkField(consentCheck, consentCheck.checked, 'consentError');

      if (isValid) {
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnHtml = submitBtn.innerHTML;

        // Button loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing & Generating Profile...';

        // Gather Selected Interests
        const selectedInterests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
          .map(cb => cb.value);

        // Prepare submission payload
        const candidatePayload = {
          fullName: fullNameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim(),
          city: cityInput.value.trim(),
          education: educationSelect.value,
          experience: experienceSelect.value,
          timeSlot: timeSlotSelect.value,
          startDate: document.getElementById('startDate').value,
          interests: selectedInterests,
          comments: document.getElementById('comments').value.trim()
        };

        // Send to backend REST API
        fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(candidatePayload)
        })
        .then(res => res.json())
        .then(result => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;

          // Store local backup as well
          try {
            const existing = JSON.parse(localStorage.getItem('codrxs_interest_submissions') || '[]');
            existing.push({ ...candidatePayload, candidateId: result.candidateId, submittedAt: new Date().toISOString() });
            localStorage.setItem('codrxs_interest_submissions', JSON.stringify(existing));
          } catch (err) {}

          // Show confirmation
          form.style.display = 'none';
          if (submittedNameEl) {
            submittedNameEl.textContent = candidatePayload.fullName;
          }
          if (successBanner) {
            successBanner.style.display = 'block';
            successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(err => {
          console.warn('Backend offline, fallback to client-side mode:', err);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;

          // Graceful fallback for static preview
          try {
            const existing = JSON.parse(localStorage.getItem('codrxs_interest_submissions') || '[]');
            existing.push({ ...candidatePayload, submittedAt: new Date().toISOString() });
            localStorage.setItem('codrxs_interest_submissions', JSON.stringify(existing));
          } catch (e) {}

          form.style.display = 'none';
          if (submittedNameEl) submittedNameEl.textContent = candidatePayload.fullName;
          if (successBanner) {
            successBanner.style.display = 'block';
            successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    });

    // Real-time error removal on input
    const allInputs = form.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
      input.addEventListener('input', () => {
        const parent = input.closest('.form-field') || input.closest('.terms-field');
        if (parent && parent.classList.contains('has-error')) {
          parent.classList.remove('has-error');
          const errorMsg = parent.querySelector('.error-msg');
          if (errorMsg) errorMsg.style.display = 'none';
        }
      });
    });
  }

  // Pre-fill full form from quick hero form
  const heroExpressForm = document.getElementById('heroExpressForm');
  if (heroExpressForm) {
    heroExpressForm.addEventListener('submit', () => {
      const quickName = document.getElementById('quickName').value;
      const quickPhone = document.getElementById('quickPhone').value;
      
      const fullFormName = document.getElementById('fullName');
      const fullFormPhone = document.getElementById('phone');

      if (fullFormName && quickName) fullFormName.value = quickName;
      if (fullFormPhone && quickPhone) fullFormPhone.value = quickPhone;
    });
  }
});

// Function to reset and submit another response
function resetInterestForm() {
  const form = document.getElementById('candidateInterestForm');
  const successBanner = document.getElementById('formSuccessMessage');

  if (form && successBanner) {
    form.reset();
    form.style.display = 'block';
    successBanner.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// -- Reviews drag-to-scroll ------------------------------
const reviewsGrid = document.querySelector('.reviews-grid');
if (reviewsGrid) {
  let isDown = false;
  let startX;
  let scrollLeft;

  reviewsGrid.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - reviewsGrid.offsetLeft;
    scrollLeft = reviewsGrid.scrollLeft;
  });
  reviewsGrid.addEventListener('mouseleave', () => { isDown = false; });
  reviewsGrid.addEventListener('mouseup', () => { isDown = false; });
  reviewsGrid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - reviewsGrid.offsetLeft;
    const walk = (x - startX) * 1.5;
    reviewsGrid.scrollLeft = scrollLeft - walk;
  });
}
