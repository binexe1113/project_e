document.addEventListener('DOMContentLoaded', function() {
    
    // Select elements for carousel 2
    const prevBtn2 = document.getElementById('backwardArrow');
    const nextBtn2 = document.getElementById('forwardArrow');
    const carouselTrack2 = document.getElementById('feedbackTrack');
    const carouselItems2 = document.querySelectorAll('.feedback-item');
    
    let currentIndex2 = 0;
    const totalItems2 = carouselItems2.length;  

    // Function to update carousel position based on current index
    function updateCarouselPosition2() {
        const itemWidth = carouselItems2[0].offsetWidth;  // Get the width of each item
        carouselTrack2.style.transform = `translateX(-${currentIndex2 * itemWidth}px)`;  // Move the carousel track
    }

    // Previous button event listener
    prevBtn2.addEventListener('click', function() {
        if (currentIndex2 > 0) {
            currentIndex2--;  
        } else {
            currentIndex2 = totalItems2 - 1;  // Go to the last item if we're at the start
        }
        updateCarouselPosition2();  // Update carousel position
    });

    // Next button event listener
    nextBtn2.addEventListener('click', function() {
        if (currentIndex2 < totalItems2 - 1) {
            currentIndex2++; 
        } else {
            currentIndex2 = 0;  // Go to the first item if we're at the end
        }
        updateCarouselPosition2();  // Update carousel position
    });

    // Initialize the carousel position when the page loads
    updateCarouselPosition2();
});
