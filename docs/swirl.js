// tracks position of mouse 
let lastX = null;
let lastY = null;
let lastAngle = null;
let swirlScore = 0;

// threshould value for the entrance
const swirlThreshold = 3; 

// listens for mouse movements
document.addEventListener("mousemove", (e) => {
  if (lastX === null) {
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }

  // calculates difference in position from previous mouse movement
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  // calculates the angle of mouse 
  const angle = Math.atan2(dy, dx);

  if (lastAngle !== null) {
    let delta = angle - lastAngle;

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    // if the mouse angle difference is greate than 0.5 then it is a swirl
    if (Math.abs(delta) > 0.5) {
      swirlScore += 1;
    }
  }

  // updates the last recorded mouse position
  lastAngle = angle;
  lastX = e.clientX;
  lastY = e.clientY;

  if (swirlScore >= swirlThreshold) {
    triggerEntrance();
  }
});

// triggers the effect for the entrance
function triggerEntrance() {
  document.body.classList.add("fade-out");

  setTimeout(() => {
    if (typeof enterMap === "function") {
      enterMap();
    } else {
      window.location.href = "login.html";
    }
  }, 1000);
}
