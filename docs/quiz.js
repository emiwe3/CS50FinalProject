const buildingCoordinates = {
  "Annenberg": { x: 695, y: 93 },
  "Science Center": { x: 340, y: 79 },
  "Widener Library": { x: 508, y: 610 },
  "Memorial Church": { x: 504, y: 335 },
  "University Hall": { x: 304, y: 390 },
  "Emerson Hall": { x: 784, y: 536 },
  "Sever Hall": { x: 633, y: 395 },
  "Harvard Hall": { x: 121, y: 439 },
  "Lamont Library": { x: 803, y: 720 },
  "Houghton Library": { x: 682, y: 741 },
  "Harvard Art Museum": { x: 908, y: 330 },
  "Boylston Hall": { x: 337, y: 702 },
  "Holworthy Hall": { x: 285, y: 211 },
  "Hollis Hall": { x: 149, y: 359 },
  "Stoughton Hall": { x: 145, y: 238 },
  "Massachusetts Hall": { x: 88, y: 488 },
  "Pennypacker Hall": { x: 1208, y: 785 },
  "Hurlbut Hall": { x: 1113, y: 789 },
  "Morton Prince": { x: 1130, y: 721 },
  "Greenough Hall": { x: 1103, y: 544 },
  "Barker Center": { x: 990, y: 696 },
  "Warren": { x: 1015, y: 616 },
  "Faculty Club": { x: 990, y: 527 },
  "Dana Palmer": { x: 921, y: 624 },
  "Loeb House": { x: 747, y: 669 },
  "Robinson House": { x: 774, y: 290 },
  "Canaday Hall": { x: 519, y: 215 },
  "Thayer House": { x: 368, y: 235 },
  "Phillips Brooks House": { x: 85, y: 197 },
  "Mower House": { x: 33, y: 245 },
  "Holden": { x: 76, y: 311 },
  "Lionel House": { x: 37, y: 353 },
  "Strauss": { x: 43, y: 555 },
  "Matthews": { x: 136, y: 558 },
  "Lehman GSAS Center": { x: 149, y: 769 },
  "Wadsworth": { x: 209, y: 719 },
  "Grays Hall": { x: 262, y: 646 },
  "Wigglesworth": { x: 517, y: 762 },
  "Weld": { x: 377, y: 533 },
  "Carpenter Ctr": { x: 968, y: 430 }
};

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 832;

function pxToPercentX(x) { return (x / MAP_WIDTH) * 100; }
function pxToPercentY(y) { return (y / MAP_HEIGHT) * 100; }

const allBuildings = Object.keys(buildingCoordinates);
let quizOrder = [];
let currentIndex = 0;
let correct = 0;

const mapContainer = document.querySelector(".map-container");
const questionSpan = document.getElementById("quiz-building-name");
const popup = document.getElementById("quiz-popup");
const finalScoreText = document.getElementById("final-score");
const scoreBox = document.getElementById("quiz-score");

window.addEventListener("load", () => {
  document.getElementById("exit-quiz").onclick = () => {
    window.location.href = "map.html";   // ✅ back to map
  };

  document.getElementById("restart-quiz").onclick = () => {
    popup.classList.add("hidden");
    startQuiz();
  };

  startQuiz();
});

function startQuiz() {
  document.querySelectorAll(".quiz-marker").forEach(el => el.remove());
  quizOrder = [...allBuildings].sort(() => Math.random() - 0.5);
  currentIndex = 0;
  correct = 0;

  updateScore();
  placeMarkers();
  askQuestion();
}

function askQuestion() {
  const currentBuilding = quizOrder[currentIndex];
  questionSpan.textContent = currentBuilding;
}

function updateScore() {
  const pct = Math.round((correct / allBuildings.length) * 100);
  scoreBox.textContent = `Score: ${pct}%`;
}

function placeMarkers() {
  allBuildings.forEach(name => {
    const coords = buildingCoordinates[name];
    const marker = document.createElement("div");

    marker.className = "building-icon quiz-marker";
    marker.dataset.building = name;

    marker.style.position = "absolute";
    marker.style.left = pxToPercentX(coords.x) + "%";
    marker.style.top = pxToPercentY(coords.y) + "%";
    marker.style.width = "24px";
    marker.style.height = "24px";
    marker.style.background = "rgba(90, 29, 29, 0.7)";
    marker.style.border = "2px solid #5a1d1d";
    marker.style.borderRadius = "50%";
    marker.style.cursor = "pointer";
    marker.style.transform = "translate(-50%, -50%)";
    marker.style.transition = "all 0.2s ease";
    marker.style.zIndex = "50";

    const innerDot = document.createElement("div");
    innerDot.style.position = "absolute";
    innerDot.style.top = "50%";
    innerDot.style.left = "50%";
    innerDot.style.transform = "translate(-50%, -50%)";
    innerDot.style.width = "8px";
    innerDot.style.height = "8px";
    innerDot.style.background = "#fdf0ce";
    innerDot.style.borderRadius = "50%";
    marker.appendChild(innerDot);

    marker.addEventListener("click", () => handleAnswer(name, marker));
    mapContainer.appendChild(marker);
  });
}

function handleAnswer(selectedName, marker) {
  const correctName = quizOrder[currentIndex];

  if (selectedName === correctName) {
    marker.style.background = "#2e7d32";
    marker.style.borderColor = "#1b5e20";
    correct++;
  } else {
    marker.style.background = "#c62828";
    marker.style.borderColor = "#8e0000";
  }

  currentIndex++;
  updateScore();

  if (currentIndex >= allBuildings.length) {
    endQuiz();
  } else {
    askQuestion();
  }
}

function endQuiz() {
  const pct = Math.round((correct / allBuildings.length) * 100);
  finalScoreText.textContent = `Mischief managed! You scored ${pct}%.`;
  popup.classList.remove("hidden");
}
