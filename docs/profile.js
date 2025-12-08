import {
  auth,
  db,
  rtdb,
  onAuthStateChanged,
  doc,
  getDoc,
  ref,
  onValue,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "./firebase.js";

// holds authenticated users
let currentUser = null;
// holds user location
let userLocationData = null;

// listens for changes in authentication
onAuthStateChanged(auth, async (user) => {
  // redirects user to login page in not logged in
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await loadUserProfile();
  setupLocationTracking();
  setupEventListeners();
});

// loads user profile from firebase
async function loadUserProfile() {
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const username = userDoc.exists()
      ? (userDoc.data().username || currentUser.email.split('@')[0])
      : currentUser.email.split('@')[0];

    // retrieves the list of the user's friends
    const friends = userDoc.exists() ? (userDoc.data().friends || []) : [];

    const welcomeMsg = document.getElementById("welcome-message");
    const usernameDisplay = document.getElementById("username-display");
    const userEmail = document.getElementById("user-email");
    const friendCount = document.getElementById("friend-count");

    if (welcomeMsg) welcomeMsg.textContent = `Hello ${username}!`;
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (userEmail) userEmail.textContent = currentUser.email;
    if (friendCount) friendCount.textContent = `${friends.length} friend${friends.length !== 1 ? 's' : ''}`;
  } catch {
    // use email as username if user data not found
    const emailName = currentUser.email.split('@')[0];

    const welcomeMsg = document.getElementById("welcome-message");
    const usernameDisplay = document.getElementById("username-display");
    const userEmail = document.getElementById("user-email");

    if (welcomeMsg) welcomeMsg.textContent = `Hello ${emailName}!`;
    if (usernameDisplay) usernameDisplay.textContent = emailName;
    if (userEmail) userEmail.textContent = currentUser.email;
  }
}

function setupLocationTracking() {
  const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
  onValue(userLocationRef, (snapshot) => {
    userLocationData = snapshot.val();
    updateLocationDisplay();
  });

  const allLocationsRef = ref(rtdb, 'locations');
  onValue(allLocationsRef, (snapshot) => {
    updateFriendsOnline(snapshot.val() || {});
  });
}

// update the UI with current user location
function updateLocationDisplay() {
  const el = document.getElementById("current-location");
  if (!el) return;

  if (userLocationData) {
    const building = userLocationData.building || 'Unknown Building';
    const lastUpdate = userLocationData.lastUpdate
      ? formatTime(userLocationData.lastUpdate)
      : 'Unknown';

    // display user location details 
    el.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">📍</div>
        <strong style="font-size:1.3rem;color:#5a1d1d;">${building}</strong><br>
        <small style="color:#7d4a34;">Last updated: ${lastUpdate}</small><br>
        <small style="color:#7d4a34;font-size:0.9rem;">Position: (${userLocationData.x || '?'}, ${userLocationData.y || '?'})</small>
      </div>
    `;
    el.className = "location-card location-active";
  } else {
    // if no location is available show a message
    el.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">📍</div>
        <span style="color:#888;">No location set</span><br>
        <small>Go to the Map page to set your location</small>
      </div>
    `;
    el.className = "location-card location-inactive";
  }
}

// update UI to show online friends
async function updateFriendsOnline(locations) {
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (!userDoc.exists()) return;

  // get the list of user friends
  const friends = userDoc.data().friends || [];
  // filter online friends
  const onlineFriends = friends.filter(id => {
    const loc = locations[id];
    return loc && loc.lastUpdate && (Date.now() - loc.lastUpdate) < 30000;
  });

  // update UI to show number friends online
  const el = document.getElementById("online-friends");
  if (!el) return;

  if (onlineFriends.length === 0) {
    el.innerHTML = `<div class="empty-message">No friends online</div>`;
  } else {
    el.innerHTML = `
      <div class="online-status">
        <span class="online-indicator">●</span>
        <span class="online-count">${onlineFriends.length} online</span>
      </div>
    `;
  }
}

// format the timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function setupEventListeners() {
  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) changePasswordBtn.addEventListener("click", showPasswordModal);

  // listener for logging out
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", showLogoutConfirmation);

  // listener for changing password
  const passwordForm = document.getElementById("password-form");
  if (passwordForm) passwordForm.addEventListener("submit", handlePasswordChange);

  // confirming the logout button
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  if (confirmLogoutBtn) confirmLogoutBtn.addEventListener("click", performLogout);

  // cancel logut button
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  if (cancelLogoutBtn) cancelLogoutBtn.addEventListener("click", hideLogoutConfirmation);

  const closeModalBtns = document.querySelectorAll(".close-modal");
  closeModalBtns.forEach(btn =>
    btn.addEventListener("click", () => {
      hidePasswordModal();
      hideLogoutConfirmation();
    })
  );

  // listener for updating locations
  const updateLocationBtn = document.getElementById("update-location-btn");
  if (updateLocationBtn) updateLocationBtn.addEventListener("click", () => {
    window.location.href = "map.html";
  });
}

// shows password change modal
function showPasswordModal() {
  const form = document.getElementById("password-form");
  if (form) form.reset();
  const modal = document.getElementById("password-modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
  }
}

// hides password change modal
function hidePasswordModal() {
  const modal = document.getElementById("password-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  }
}
// shows logout confirmation
function showLogoutConfirmation() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
  }
}
// hides logout confirmation
function hideLogoutConfirmation() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  }
}

// handles changing the password
async function handlePasswordChange(e) {
  e.preventDefault();

  const currentPassword = document.getElementById("current-password")?.value;
  const newPassword = document.getElementById("new-password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all password fields");
    return;
  }
  if (newPassword.length < 6) {
    alert("New password must be at least 6 characters");
    return;
  }
  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);

    alert("Password updated!");
    hidePasswordModal();
    e.target.reset();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// logs the user out
async function performLogout() {
  try {
    const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
    const { set } = await import("./firebase.js");
    await set(userLocationRef, null);

    // signs the user out and redirects them to the logout page
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    alert("Logout error: " + error.message);
  }
}
