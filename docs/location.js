import { auth, rtdb, ref, set, update, onDisconnect, onValue, db, getDoc, doc } from "./firebase.js";

let currentUser = null;
let locationUpdateInterval = null;
let friendLocations = new Map();
let locationCallbacks = [];

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

function getRandomBuilding() {
  const buildings = Object.keys(buildingCoordinates);
  const randomIndex = Math.floor(Math.random() * buildings.length);
  return buildings[randomIndex];
}

export async function initLocationTracking() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Location tracking enabled for:", user.email);
      
      startLocationTracking();
      
      setupFriendLocationListener();
      
      setupFriendsListener();
    } else {
      stopLocationTracking();
      friendLocations.clear();
    }
  });
}

function startLocationTracking() {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
  }
  
  locationUpdateInterval = setInterval(() => {
    updateUserLocation();
  }, 5000);
  
  updateUserLocation();
  
  const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
  // onDisconnect(userLocationRef).remove();
}

async function updateUserLocation() {
  if (!currentUser) return;
  
  try {
    const currentBuilding = getRandomBuilding();
    const coords = buildingCoordinates[currentBuilding];
    
    const locationData = {
      userId: currentUser.uid,
      email: currentUser.email,
      username: await getUsername(currentUser.uid),
      building: currentBuilding,
      x: coords.x,
      y: coords.y,
      lastUpdate: Date.now(),
      isOnline: true
    };
    
    const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
    await update(userLocationRef, locationData);
    
    console.log(`Location updated: ${currentBuilding} (${coords.x}, ${coords.y})`);
    
  } catch (error) {
    console.error("Error updating location:", error);
  }
}

async function getUsername(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().username || "Unknown";
    }
    return "User";
  } catch (error) {
    return "User";
  }
}

function setupFriendLocationListener() {
  const locationsRef = ref(rtdb, 'locations');
  
  onValue(locationsRef, (snapshot) => {
    const locations = snapshot.val() || {};
    friendLocations.clear();
    
    Object.entries(locations).forEach(([userId, data]) => {
      if (userId === currentUser?.uid) return;
      
      const isOnline = data.lastUpdate && (Date.now() - data.lastUpdate) < 30000;
      
      friendLocations.set(userId, {
        ...data,
        isOnline
      });
    });
    
    notifyLocationCallbacks();
  });
}

async function setupFriendsListener() {
  if (!currentUser) return;
  
  const userDocRef = doc(db, "users", currentUser.uid);
  
  setInterval(async () => {
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friends = userData.friends || [];
        
        const filtered = new Map();
        
        friendLocations.forEach((location, userId) => {
          if (friends.includes(userId)) {
            filtered.set(userId, location);
          }
        });
        
        friendLocations = filtered;
        notifyLocationCallbacks();
      }
    } catch (error) {
      console.error("Error checking friends list:", error);
    }
  }, 10000);
}

export function onFriendLocationsUpdate(callback) {
  locationCallbacks.push(callback);
  
  return () => {
    const index = locationCallbacks.indexOf(callback);
    if (index > -1) {
      locationCallbacks.splice(index, 1);
    }
  };
}

export function getFriendLocations() {
  return Array.from(friendLocations.values());
}

export async function setManualLocation(buildingName) {
  if (!currentUser || !buildingCoordinates[buildingName]) return false;
  
  try {
    const coords = buildingCoordinates[buildingName];
    const locationData = {
      userId: currentUser.uid,
      email: currentUser.email,
      username: await getUsername(currentUser.uid),
      building: buildingName,
      x: coords.x,
      y: coords.y,
      lastUpdate: Date.now(),
      isOnline: true
    };
    
    const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
    await update(userLocationRef, locationData);
    
    return true;
  } catch (error) {
    console.error("Error setting manual location:", error);
    return false;
  }
}

function stopLocationTracking() {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
    locationUpdateInterval = null;
  }
  
  if (currentUser) {
    const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
    set(userLocationRef, null);
  }
}

function notifyLocationCallbacks() {
  const locations = getFriendLocations();
  locationCallbacks.forEach(callback => {
    try {
      callback(locations);
    } catch (error) {
      console.error("Error in location callback:", error);
    }
  });
}

export function getAvailableBuildings() {
  return Object.keys(buildingCoordinates).sort();
}

export function isAtBuilding(userId, buildingName) {
  const location = friendLocations.get(userId);
  return location && location.building === buildingName;
}