document.addEventListener('DOMContentLoaded', () => {
    // Select all navigation links and content sections
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    // Function to handle tab switching
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior

            // Remove 'active' class from all links
            navLinks.forEach(item => item.classList.remove('active'));
            // Add 'active' class to the clicked link
            this.classList.add('active');

            // Get the target section ID from data attribute
            const targetId = this.getAttribute('data-target');

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show the target section
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.classList.add('active');
            }

            // Special case to show checkout link in nav when clicked programmatically
            if(targetId === 'checkout') {
                document.getElementById('checkout-nav-link').style.display = 'block';
            }
        });
    });

    // Admin toggle for Price input based on Free/Paid selection
    const accessRadios = document.querySelectorAll('.access-radio');
    accessRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Find the closest price input container within the same form group
            const container = this.closest('.access-control');
            const priceInput = container.querySelector('.price-input-container');
            if (priceInput) {
                if (this.value === 'paid') {
                    priceInput.style.display = 'block';
                } else {
                    priceInput.style.display = 'none';
                }
            }
        });
    });
});
