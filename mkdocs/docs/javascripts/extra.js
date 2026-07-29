// TruSpace Documentation Custom JavaScript

// Add copy feedback
document.addEventListener('DOMContentLoaded', function() {
  // Enhanced copy button feedback
  document.querySelectorAll('.md-clipboard').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const icon = this.querySelector('.md-icon');
      if (icon) {
        icon.style.color = '#10b981';
        setTimeout(() => {
          icon.style.color = '';
        }, 1000);
      }
    });
  });
});

// Console welcome message
console.log('%c🚀 TruSpace Documentation', 'font-size: 20px; font-weight: bold; color: #7c3aed;');
console.log('%cContribute: https://github.com/openkfw/TruSpace', 'color: #06b6d4;');
