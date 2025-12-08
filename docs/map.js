import {
    auth,
    rtdb,
    ref,
    set,
    update,
    onValue,
    onDisconnect,
    db,
    doc,
    getDoc,
    onAuthStateChanged,
    serverTimestamp
} from "./firebase.js";

// initialize variables
let currentUser = null;
let friendMarkers = new Map();
let userLocation = null;
let currentUserMarker = null;
let buildingMarkers = new Map();

// define the constants for the map width and height
const MAP_WIDTH = 1280;
const MAP_HEIGHT = 832;

function pxToPercentX(x) {
    return (x / MAP_WIDTH) * 100;
}

function pxToPercentY(y) {
    return (y / MAP_HEIGHT) * 100;
}

// pixel locations on map for each building
const buildingCoordinates = {
  "Annenberg": { x: 695, y: 93 },
  "Science Center": { x: 340, y: 79 },
  "Widener Library": { x: 508, y: 610 },
  "Memorial Hall": { x: 695, y: 93 },
  "Sanders Theater": { x: 695, y: 93 },
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
  "Pennypacker Hall":{ x: 1208, y: 785},
  "Hurlbut Hall":{ x: 1113, y: 789},
  "Morton Prince":{ x: 1130, y: 721},
  "Greenough Hall":{ x: 1103, y: 544},
  "Barker Center":{ x: 990, y: 696},
  "Warren":{ x: 1015, y: 616},
  "Faculty Club":{ x: 990, y: 527},
  "Dana Palmer":{ x: 921, y: 624},
  "Loeb House":{ x: 747, y: 669},
  "Robinson House":{ x: 774, y: 290},
  "Canaday Hall":{ x: 519, y: 215},
  "Thayer House":{ x: 368, y: 235},
  "Phillips Brooks House":{ x: 85, y: 197},
  "Mower House":{ x: 33, y: 245},
  "Holden":{ x: 76, y: 311},
  "Lionel House":{ x: 37, y: 353},
  "Strauss":{ x: 43, y: 555},
  "Matthews":{ x: 136, y: 558},
  "Lehman GSAS Center":{ x: 149, y: 769},
  "Wadsworth":{ x: 209, y: 719},
  "Grays Hall":{ x: 262, y: 646},
  "Wigglesworth":{ x: 517, y: 762},
  "Weld":{ x: 377, y: 533},
  "Carpenter Ctr":{ x: 968, y: 430},
};

document.addEventListener('DOMContentLoaded', () => {
     // check if logged in
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        
        currentUser = user;
        console.log("Map page - User:", user.email);
                
        setupBuildingIcons();
        
        setupLocationControls();
        
        setupFriendLocationListener();
        
        setupUserLocationListener();
        
        updateUserLocation("Harvard Yard");
    });
});

// navigates to quiz page
document.addEventListener('DOMContentLoaded', () => {
    const quizBtn = document.getElementById("quiz-button");
    if (quizBtn) {
        quizBtn.onclick = () => {
            window.location.href = "quiz.html";
        };
    }
});

// highlights building that has user location
function highlightMyBuilding(buildingName) {
    buildingMarkers.forEach((icon, name) => {
        if (name === buildingName) {
            icon.classList.add("my-location");
        } else {
            icon.classList.remove("my-location");
        }
    });
}

// creates the icons for the buildings on the map
function setupBuildingIcons() {
    const mapImg = document.querySelector('.map-img');
    if (!mapImg) return;
    
    mapImg.onload = () => {
        console.log(`Map loaded: ${mapImg.width} x ${mapImg.height}`);
        console.log(`Placing ${Object.keys(buildingCoordinates).length} building icons`);
        
        Object.entries(buildingCoordinates).forEach(([buildingName, coords]) => {
            createBuildingIcon(buildingName, coords.x, coords.y);
        });
    };
    
    if (mapImg.complete) {
        mapImg.onload();
    }
}

function createBuildingIcon(buildingName, x, y) {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    const existingMarker = buildingMarkers.get(buildingName);
    if (existingMarker && existingMarker.parentNode) {
        existingMarker.parentNode.removeChild(existingMarker);
    }
    
    const icon = document.createElement('div');
    icon.className = 'building-icon';
    icon.dataset.building = buildingName;
    icon.title = `📍 ${buildingName}\nClick to set your location here`;
    
    icon.style.cssText = `
        position: absolute;
        left: ${pxToPercentX(x)}%;
        top: ${pxToPercentY(y)}%;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        transform: translate(-50%, -50%);
        transition: all 0.2s ease;
        z-index: 50;
    `;
    
    icon.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 8px; height: 8px; background: #fdf0ce; border-radius: 50%;"></div>
    `;
    
    icon.addEventListener('mouseenter', () => {
        icon.classList.add("hovering");

         // show a tooltip when hovering
        const tooltip = document.createElement('div');
        tooltip.className = 'building-tooltip';
        tooltip.textContent = buildingName;
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 6px 10px;
            border-radius: 5px;
            font-size: 12px;
            white-space: nowrap;
            margin-bottom: 8px;
            font-family: "EB Garamond", serif;
            pointer-events: none;
        `;
        icon.appendChild(tooltip);
    });
     // remove the tooltip
    icon.addEventListener('mouseleave', () => {
        icon.classList.remove("hovering");
    
        
        const tooltip = icon.querySelector('.building-tooltip');
        if (tooltip) tooltip.remove();
    });
    
    // sets user location when icon is clicked
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        updateUserLocation(buildingName);
        highlightMyBuilding(buildingName);
        showBuildingInfo(buildingName, x, y);
    });
    
    mapContainer.appendChild(icon);
    buildingMarkers.set(buildingName, icon);
    
    console.log(`Icon placed: ${buildingName} at (${x}, ${y})`);
}
// building popup
function showBuildingInfo(buildingName, x, y) {
    let infoPopup = document.getElementById('building-info-popup');
    
    if (!infoPopup) {
        infoPopup = document.createElement('div');
        infoPopup.id = 'building-info-popup';
        infoPopup.className = 'building-info-popup hidden';
        infoPopup.innerHTML = `
            <div class="popup-content">
                <button class="close-btn" onclick="closeBuildingInfo()">&times;</button>
                <h2>Building Information</h2>
                <div class="building-details">
                    <p><strong>Name:</strong> <span id="building-info-name"></span></p>
                    <p><strong>Coordinates:</strong> <span id="building-info-coords"></span></p>
                    <p><strong>Status:</strong> <span id="building-info-status"></span></p>
                    <div id="building-friends"></div>
                </div>
                <button class="btn-set-location" onclick="setUserLocationHere()">Set My Location Here</button>
            </div>
        `;
        document.body.appendChild(infoPopup);

        // style of popup
        const style = document.createElement('style');
        style.textContent = `
            .building-info-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            .building-info-popup.hidden {
                display: none;
            }
            
            .building-info-content {
                background: #f1ddba;
                padding: 25px;
                border-radius: 15px;
                max-width: 350px;
                width: 90%;
                border: 3px solid #7d4a34;
                position: relative;
            }
            
            .building-info-content h3 {
                color: #5a1d1d;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .building-info-details p {
                margin: 8px 0;
                font-size: 1rem;
            }
            
            .building-info-details strong {
                color: #5a1d1d;
                min-width: 100px;
                display: inline-block;
            }
            
            .btn-set-location {
                width: 100%;
                padding: 10px;
                margin-top: 15px;
                background: #5a1d1d;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: inherit;
                font-size: 1rem;
            }
            
            .btn-set-location:hover {
                background: #8a0018;
            }
            
            .close-building-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #5a1d1d;
            }
            
            .close-building-btn:hover {
                color: #8a0018;
            }
        `;
        document.head.appendChild(style);
    }
    // update popup
    document.getElementById('building-info-name').textContent = buildingName;
    document.getElementById('building-info-coords').textContent = `(${x}, ${y})`;
    
    checkFriendsAtBuilding(buildingName);
    
    infoPopup.classList.remove('hidden');
    
    infoPopup.dataset.currentBuilding = buildingName;
    const setBtn = document.querySelector(".btn-set-location");
    if (setBtn) setBtn.style.display = "block"; 

}
// check to see if there are friends in a building
function checkFriendsAtBuilding(buildingName) {
    const friendsContainer = document.getElementById('building-friends');
    const statusElement = document.getElementById('building-info-status');
    if (!friendsContainer || !statusElement) return;

    friendsContainer.innerHTML = "";

    let friendsHere = [];

    friendMarkers.forEach((marker, userId) => {
        if (marker.location && marker.location.building === buildingName) {
            friendsHere.push(marker.location.username);
        }
    });

    // add user to list if at a building
if (userLocation && userLocation.building === buildingName) {
    friendsHere.push("You");
}

    // if there are no friends 
    if (friendsHere.length === 0) {
        statusElement.textContent = "No friends";
        statusElement.className = "offline";

        friendsContainer.innerHTML = `<p>No friends at this building</p>`;
        return;
    }

    statusElement.textContent = `${friendsHere.length} friend${friendsHere.length !== 1 ? "s" : ""} here`;
    statusElement.className = "online";

    let list = friendsHere.map(name => `<li>${name}</li>`).join("");

    friendsContainer.innerHTML = `
        <p><strong>Friends here:</strong></p>
        <ul style="margin-left:20px;">${list}</ul>
    `;
}
// close building popup
function closeBuildingInfo() {
    const infoPopup = document.getElementById('building-info-popup');
    if (infoPopup) {
        infoPopup.classList.add('hidden');
    }
}
// set user's location to the selected building
function setUserLocationHere() {
    const infoPopup = document.getElementById('building-info-popup');
    const buildingName = infoPopup?.dataset.currentBuilding;

    if (!buildingName) return;

    updateUserLocation(buildingName);
    highlightMyBuilding(buildingName);
    closeBuildingInfo();
}

// for displaying and selecting locations
function setupLocationControls() {
    const locationControls = document.createElement('div');
    locationControls.id = 'location-controls';
    locationControls.className = 'location-controls'; 

    locationControls.innerHTML = `
        <h3>📍 Your Location</h3>
        <div id="current-location-display">
            Click a building icon on the map
        </div>
        <select id="building-select">
            <option value="">Or select from list...</option>
        </select>
        <div id="location-legend">
            <div><div style="background:#8a0018"></div><span>You</span></div>
            <div><div style="background:#2e7d32"></div><span>Friends</span></div>
        </div>
    `;
    
    // add building options to the dropdown
    const select = locationControls.querySelector('#building-select');
    Object.keys(buildingCoordinates).sort().forEach(building => {
        const option = document.createElement('option');
        option.value = building;
        option.textContent = building;
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        if (e.target.value) {
            updateUserLocation(e.target.value);
            const coords = buildingCoordinates[e.target.value];
            showBuildingInfo(e.target.value, coords.x, coords.y);
            e.target.value = '';
        }
    });

    document.getElementById("location-controls-wrapper").appendChild(locationControls);
}


function setupUserLocationListener() {
    const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
    
    onValue(userLocationRef, (snapshot) => {
        const location = snapshot.val();
        if (location) {
            userLocation = location;
            updateUserMarker(location);
            highlightMyBuilding(location.building);
        }
    });
}

// update user's location in the realtime database
async function updateUserLocation(buildingName) {
    if (!currentUser || !buildingCoordinates[buildingName]) return;

    const coords = buildingCoordinates[buildingName];

    const username = currentUser.email.split('@')[0];

    // data saved
    const locationData = {
        username,
        building: buildingName,
        x: coords.x,
        y: coords.y,
        lastUpdate: Date.now()
    };
    
    // save the data of the location
    await set(ref(rtdb, `locations/${currentUser.uid}`), locationData);

    console.log("Saved location to RTDB:", locationData);
}

// update the marker
function updateUserMarker(location) {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    // remove the old marker
    if (currentUserMarker && currentUserMarker.parentNode) {
        currentUserMarker.parentNode.removeChild(currentUserMarker);
    }
    
    // create a new marker
    currentUserMarker = document.createElement('div');
    currentUserMarker.className = 'user-marker';
    currentUserMarker.title = `You are at ${location.building}`;
    currentUserMarker.style.cssText = `
        position: absolute;
        left: ${pxToPercentX(location.x)}%;
        top: ${pxToPercentY(location.y)}%;
        width: 36px;
        height: 36px;
        background: #8a0018;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: white;
        cursor: default;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        transform: translate(-50%, -50%);
        z-index: 150;
        animation: userMarkerPulse 2s infinite;
    `;
    
    
    const displayText = location.username ? location.username.charAt(0).toUpperCase() : 'ME';
    currentUserMarker.textContent = displayText;
    
    
    currentUserMarker.addEventListener('mouseenter', () => {
        currentUserMarker.style.transform = 'translate(-50%, -50%) scale(1.2)';
        currentUserMarker.style.zIndex = '151';
        
        // shows a tooltip when hovering
        const tooltip = document.createElement('div');
        tooltip.className = 'user-tooltip';
        tooltip.innerHTML = `
            <strong>You</strong><br>
            <small>📍 ${location.building || 'Unknown'}</small>
        `;
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(138, 0, 24, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            margin-bottom: 8px;
            text-align: center;
            min-width: 120px;
            font-family: "EB Garamond", serif;
        `;
        
        currentUserMarker.appendChild(tooltip);
    });
    // removes tooltip
    currentUserMarker.addEventListener('mouseleave', () => {
        currentUserMarker.style.transform = 'translate(-50%, -50%) scale(1)';
        currentUserMarker.style.zIndex = '150';
        
        const tooltip = currentUserMarker.querySelector('.user-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    });
    
    mapContainer.appendChild(currentUserMarker);
}

// popup when updating user's location
function showLocationConfirmation(buildingName) {
    const confirmation = document.createElement('div');
    confirmation.id = 'location-confirmation';
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(138, 0, 24, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 2000;
        font-size: 1.2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: fadeInOut 2s ease;
    `;
    
    confirmation.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">📍</span>
            <span>You're now at <strong>${buildingName}</strong></span>
        </div>
    `;
    
    document.body.appendChild(confirmation);
    
    
    setTimeout(() => {
        if (confirmation.parentNode) {
            confirmation.parentNode.removeChild(confirmation);
        }
    }, 2000);
}


function setupFriendLocationListener() {
    const locationsRef = ref(rtdb, 'locations');
    
    onValue(locationsRef, (snapshot) => {
        const locations = snapshot.val() || {};
        updateFriendMarkers(locations);
    });
}

// include updated friend markers on the map
async function updateFriendMarkers(locations) {
    
    friendMarkers.forEach((markerObj) => {
        if (markerObj.element && markerObj.element.parentNode) {
            markerObj.element.parentNode.removeChild(markerObj.element);
        }
    });
    
    let friendsList = [];
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            friendsList = userDoc.data().friends || [];
        }
    } catch (error) {
        console.error("Error getting friends list:", error);
    }
    
     // loop through the location of each friend and create a marker for them
    Object.entries(locations).forEach(([userId, location]) => {
        
        if (userId === currentUser.uid) return;
        
        
        if (!friendsList.includes(userId)) return;
        
        
        const isOnline = location.lastUpdate && (Date.now() - location.lastUpdate) < 30000;
        createFriendMarker(userId, location, isOnline);
    });
}
// create a friend marker
function createFriendMarker(userId, location, isOnline) {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    // remove existing friend markers
    const existingMarker = friendMarkers.get(userId);
    if (existingMarker && existingMarker.element) {
        if (existingMarker.element.parentNode) {
            existingMarker.element.parentNode.removeChild(existingMarker.element);
        }
    }

    const colors = ['#2e7d32', '#1976d2', '#7b1fa2', '#f57c00', '#0288d1', '#c2185b'];
    const colorIndex = parseInt(userId.slice(-2), 16) % colors.length;

    const marker = document.createElement('div');
    marker.className = 'friend-marker';
    marker.style.cssText = `
        position: absolute;
        left: ${pxToPercentX(location.x)}%;
        top: ${pxToPercentY(location.y)}%;

        width: 32px;
        height: 32px;
        background: ${colors[colorIndex]};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: white;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
        transition: all 0.3s ease;
        z-index: 100;
        animation: friendPulse 2s infinite;
    `;

    const initial = location.username ? location.username.charAt(0).toUpperCase() : 'F';
    marker.textContent = initial;

    // if the friend is no longer online change the marker appearance
    if (!isOnline) {
        marker.style.opacity = "0.45";
        marker.style.filter = "grayscale(100%)";
        marker.title = `${location.username} (Offline — last seen at ${location.building})`;
    }
    marker.dataset.userId = userId;
    marker.dataset.username = location.username || 'Friend';
    marker.dataset.building = location.building || 'Unknown';

    marker.addEventListener('mouseenter', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1.2)';
        marker.style.zIndex = '101';

        const tooltip = document.createElement('div');
        tooltip.className = 'friend-tooltip';
        tooltip.innerHTML = `
            <strong>${location.username}</strong><br>
            <small>📍 ${location.building || 'Unknown'}</small>
            ${!isOnline ? "<br><small>(Offline)</small>" : ""}
        `;
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            margin-bottom: 8px;
            text-align: center;
            min-width: 120px;
            font-family: "EB Garamond", serif;
        `;

        marker.appendChild(tooltip);
    });

    marker.addEventListener('mouseleave', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1)';
        marker.style.zIndex = '100';
        const tooltip = marker.querySelector('.friend-tooltip');
        if (tooltip) tooltip.remove();
    });

    marker.addEventListener('click', (e) => {
    e.stopPropagation();

    const buildingName = location.building;

    const coords = buildingCoordinates[buildingName];
    if (!coords) return;

    showBuildingInfo(buildingName, coords.x, coords.y);

    const status = document.getElementById('building-info-status');
    if (status) {
        status.textContent = `${location.username} is here`;
        status.className = "online";
    }
});


    mapContainer.appendChild(marker);
    friendMarkers.set(userId, {
        element: marker,
        location: location  
    });
}

// show more info about friend
function showFriendInfo(location) {
    alert(`${location.username} is at ${location.building}`);
}


window.closeBuildingInfo = closeBuildingInfo;
window.setUserLocationHere = setUserLocationHere;

const style = document.createElement('style');
style.textContent = `
    @keyframes friendPulse {
        0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
        100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
    }
    
    @keyframes userMarkerPulse {
        0% { box-shadow: 0 0 0 0 rgba(138, 0, 24, 0.7); }
        70% { box-shadow: 0 0 0 8px rgba(138, 0, 24, 0); }
        100% { box-shadow: 0 0 0 0 rgba(138, 0, 24, 0); }
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -40%); }
        20% { opacity: 1; transform: translate(-50%, -50%); }
        80% { opacity: 1; transform: translate(-50%, -50%); }
        100% { opacity: 0; transform: translate(-50%, -60%); }
    }
    
    .user-marker {
        cursor: default;
    }
    
    .friend-marker {
        cursor: pointer;
    }
    
    .building-icon {
        cursor: pointer;
    }
    
    .friend-marker:hover {
        animation: friendPulse 0.5s ease infinite;
    }
    
    .user-marker:hover {
        animation: userMarkerPulse 0.5s ease infinite;
    }
    
    .building-icon:hover {
        animation: userMarkerPulse 0.5s ease infinite;
    }
`;
document.head.appendChild(style);
