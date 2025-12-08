let lastX = null;
let lastY = null;
let lastAngle = null;
let swirlScore = 0;

const swirlThreshold = 3; 

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

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

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
    if (typeof enterMap === "function") {
      enterMap();
    } else {
      window.location.href = "login.html";
    }
  }, 1000);
}
