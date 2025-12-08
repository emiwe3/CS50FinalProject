import { auth, rtdb, ref, update, onValue, db, getDoc, doc } from "./firebase.js";

let currentUser = null;
let friendLocations = new Map();
let locationCallbacks = [];

// pixel locations of buildings on the map
export const buildingCoordinates = {
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

// listens to changes in authentication
auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  currentUser = user;
  setupFriendLocationListener();
});
// listens for any changes in friend location
function setupFriendLocationListener() {
  onValue(ref(rtdb, "locations"), (snapshot) => {
    friendLocations.clear();
    const data = snapshot.val() || {};

    // loops through the locations in the database
    Object.entries(data).forEach(([uid, loc]) => {
      if (uid !== currentUser?.uid) {
        friendLocations.set(uid, loc);
      }
    });

    notifyLocationCallbacks();
  });
}

export function onFriendLocationsUpdate(callback) {
  locationCallbacks.push(callback);
}

// registers location updates and issues a notifies changes
function notifyLocationCallbacks() {
  const arr = Array.from(friendLocations.values());
  locationCallbacks.forEach((cb) => cb(arr));
}

// allows user to set their current location
export async function setManualLocation(buildingName) {
  if (!currentUser || !buildingCoordinates[buildingName]) return;

  const coords = buildingCoordinates[buildingName];
  const username = await getUsername(currentUser.uid);

  // updates the user's location
  await update(ref(rtdb, `locations/${currentUser.uid}`), {
    userId: currentUser.uid,
    email: currentUser.email,
    username: username,
    building: buildingName,
    x: coords.x,
    y: coords.y,
    lastUpdate: Date.now()
  });
}

async function getUsername(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().username : "User";
}
