const carousel = bulmaCarousel.attach('.carousel', {
  'autoplay': false, // Autoplay carousel
  'autoplaySpeed': 3000, // Time between each transition when autoplay is active (ms)
  'duration': 300, // Transition animation duration (in ms)
  'effect': 'translate', // Animation effect for item transition (translate|fade)
  'infinite': true, // Activate infinite display mode
  'initialSlide': 0, //Initial item index
  'loop': false, // Activate loop display mode
  'navigation': true, // Display navigation buttons
  'navigationKeys': true, // Enable navigation with arrow keys
  'navigationSwipe': true, // Enable swipe navigation
  'pagination': true, // Display pagination bullets
  'pauseOnHover': true, // Stop autoplay when cursor hover carousel
  'slidesToScroll': 1, // Slide to scroll on each step
  'slidesToShow': 1, // Slides to show at a time
  'timing': 'ease', // Transiation animation type
})

window.addEventListener('resize', () => {
  carousel[0].reset()
})
