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
        });
    });
});
