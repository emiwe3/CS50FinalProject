// swirl.js

// Swirl detection variables
let lastX = null;
let lastY = null;
let lastAngle = null;
let swirlScore = 0;

// How much swirling is needed
const swirlThreshold = 3;  // change this to make it easier/harder

document.addEventListener("mousemove", (e) => {
  if (lastX === null) {
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  const angle = Math.atan2(dy, dx);

  if (lastAngle !== null) {
    let delta = angle - lastAngle;

    // Normalize delta to [-π, π]
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    // If there's a significant rotation, increase swirl score
    if (Math.abs(delta) > 0.5) {
      swirlScore += 1;
    }
  }

  lastAngle = angle;
  lastX = e.clientX;
  lastY = e.clientY;

  if (swirlScore >= swirlThreshold) {
    triggerEntrance();
  }
});

function triggerEntrance() {
  document.body.classList.add("fade-out");

  setTimeout(() => {
    // ✅ Use the global enterMap() defined in index.html
    if (typeof enterMap === "function") {
      enterMap();
    } else {
      // Fallback if something goes wrong
      window.location.href = "login.html";
    }
  }, 1000);
}
