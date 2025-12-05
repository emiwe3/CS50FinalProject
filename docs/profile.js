// profile.js - FIXED LOCATION TRACKING
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

let currentUser = null;
let userLocationData = null;

// Wait for authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // No user logged in, redirect to login
    window.location.href = "login.html";
    return;
  }
  
  currentUser = user;
  console.log("Profile page - User:", user.email);
  
  // Load user data
  await loadUserProfile();
  
  // Start location tracking listener
  setupLocationTracking();
  
  // Setup event listeners
  setupEventListeners();
});

// LOAD USER PROFILE DATA
async function loadUserProfile() {
  try {
    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Update welcome message
      const welcomeMsg = document.getElementById("welcome-message");
      if (welcomeMsg) {
        welcomeMsg.textContent = `Hello ${userData.username || userData.email.split('@')[0]}!`;
      }
      
      // Update profile info
      const usernameDisplay = document.getElementById("username-display");
      const userEmail = document.getElementById("user-email");
      const friendCount = document.getElementById("friend-count");
      
      if (usernameDisplay) {
        usernameDisplay.textContent = userData.username || userData.email.split('@')[0];
      }
      
      if (userEmail) {
        userEmail.textContent = currentUser.email;
      }
      
      if (friendCount) {
        const friends = userData.friends || [];
        friendCount.textContent = `${friends.length} friend${friends.length !== 1 ? 's' : ''}`;
      }
      
    } else {
      // If no Firestore document, use email username
      const welcomeMsg = document.getElementById("welcome-message");
      const usernameDisplay = document.getElementById("username-display");
      const userEmail = document.getElementById("user-email");
      
      if (welcomeMsg) welcomeMsg.textContent = `Hello ${currentUser.email.split('@')[0]}!`;
      if (usernameDisplay) usernameDisplay.textContent = currentUser.email.split('@')[0];
      if (userEmail) userEmail.textContent = currentUser.email;
    }
    
  } catch (error) {
    console.error("Error loading profile:", error);
    // Still show something even if there's an error
    const welcomeMsg = document.getElementById("welcome-message");
    const usernameDisplay = document.getElementById("username-display");
    const userEmail = document.getElementById("user-email");
    
    if (welcomeMsg) welcomeMsg.textContent = "Hello User!";
    if (usernameDisplay) usernameDisplay.textContent = currentUser.email.split('@')[0];
    if (userEmail) userEmail.textContent = currentUser.email;
  }
}

// SETUP LOCATION TRACKING
function setupLocationTracking() {
  // Listen to user's own location
  const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
  
  onValue(userLocationRef, (snapshot) => {
    userLocationData = snapshot.val();
    updateLocationDisplay();
  });
  
  // Listen for friends' locations
  const allLocationsRef = ref(rtdb, 'locations');
  
  onValue(allLocationsRef, (snapshot) => {
    const locations = snapshot.val() || {};
    updateFriendsOnline(locations);
  });
}

// UPDATE LOCATION DISPLAY
// In profile.js - Update the location display function
// UPDATE LOCATION DISPLAY
function updateLocationDisplay() {
  const locationElement = document.getElementById("current-location");
  if (!locationElement) return;
  
  if (userLocationData) {
    const buildingName = userLocationData.building || 'Unknown Building';
    const lastUpdate = userLocationData.lastUpdate ? formatTime(userLocationData.lastUpdate) : 'Unknown';
    
    locationElement.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 10px;">📍</div>
        <strong style="font-size: 1.3rem; color: #5a1d1d;">${buildingName}</strong><br>
        <small style="color: #7d4a34;">Last updated: ${lastUpdate}</small><br>
        <small style="color: #7d4a34; font-size: 0.9rem;">Position: (${userLocationData.x || '?'}, ${userLocationData.y || '?'})</small>
      </div>
    `;
    locationElement.className = "location-card location-active";
  } else {
    locationElement.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 10px;">📍</div>
        <span style="color: #888;">No location set</span><br>
        <small>Go to the Map page to set your location</small>
      </div>
    `;
    locationElement.className = "location-card location-inactive";
  }
}

// UPDATE FRIENDS ONLINE STATUS
async function updateFriendsOnline(locations) {
  try {
    // Get user's friends list
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const friends = userData.friends || [];
    
    // Count online friends (updated in last 30 seconds)
    const onlineFriends = friends.filter(friendId => {
      const friendLocation = locations[friendId];
      if (!friendLocation) return false;
      
      const isOnline = friendLocation.lastUpdate && 
                      (Date.now() - friendLocation.lastUpdate) < 30000;
      return isOnline;
    });
    
    // Update display
    const onlineFriendsElement = document.getElementById("online-friends");
    if (onlineFriendsElement) {
      if (onlineFriends.length === 0) {
        onlineFriendsElement.innerHTML = '<div class="empty-message">No friends online</div>';
      } else {
        onlineFriendsElement.innerHTML = `
          <div class="online-status">
            <span class="online-indicator">●</span>
            <span class="online-count">${onlineFriends.length} online</span>
          </div>
        `;
      }
    }
    
  } catch (error) {
    console.error("Error updating online friends:", error);
  }
}

// FORMAT TIME
function formatTime(timestamp) {
  if (!timestamp) return "Unknown";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// SETUP EVENT LISTENERS
function setupEventListeners() {
  console.log("Setting up event listeners...");
  
  // Change Password Button
  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      console.log("Change password clicked");
      showPasswordModal();
    });
  }
  
  // Logout Button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log("Logout clicked");
      showLogoutConfirmation();
    });
  }
  
  // Password Modal
  const passwordModal = document.getElementById("password-modal");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  
  // Close modal buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      hidePasswordModal();
      hideLogoutConfirmation();
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === passwordModal) {
      hidePasswordModal();
    }
    
    const confirmModal = document.getElementById("confirm-modal");
    if (event.target === confirmModal) {
      hideLogoutConfirmation();
    }
  });
  
  // Password form submission
  const passwordForm = document.getElementById("password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordChange);
  }
  
  // Logout confirmation buttons
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", performLogout);
  }
  
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", hideLogoutConfirmation);
  }
  
  // Update Location Button (if exists)
  const updateLocationBtn = document.getElementById("update-location-btn");
  if (updateLocationBtn) {
    updateLocationBtn.addEventListener("click", () => {
      window.location.href = "map.html";
    });
  }
}

// PASSWORD MODAL FUNCTIONS
function showPasswordModal() {
  // Reset form
  const passwordForm = document.getElementById("password-form");
  if (passwordForm) passwordForm.reset();
  
  // Show modal
  const modal = document.getElementById("password-modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
  }
}

function hidePasswordModal() {
  const modal = document.getElementById("password-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  }
}

// LOGOUT CONFIRMATION FUNCTIONS
function showLogoutConfirmation() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
  }
}

function hideLogoutConfirmation() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  }
}

// HANDLE PASSWORD CHANGE
async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById("current-password")?.value;
  const newPassword = document.getElementById("new-password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;
  
  // Validate
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all password fields");
    return;
  }
  
  if (newPassword.length < 6) {
    alert("New password must be at least 6 characters long");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert("New passwords do not match");
    return;
  }
  
  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update password
    await updatePassword(currentUser, newPassword);
    
    // Success
    alert("✅ Password updated successfully!");
    
    // Clear form and close modal
    e.target.reset();
    hidePasswordModal();
    
  } catch (error) {
    console.error("Password change error:", error);
    
    if (error.code === 'auth/wrong-password') {
      alert("❌ Current password is incorrect");
    } else if (error.code === 'auth/weak-password') {
      alert("❌ New password is too weak");
    } else if (error.code === 'auth/requires-recent-login') {
      alert("⚠️ Session expired. Please log out and log back in to change password.");
    } else {
      alert("❌ Error changing password: " + error.message);
    }
  }
}

// PERFORM LOGOUT
async function performLogout() {
  try {
    // Clean up location data before logout
    if (currentUser) {
      const userLocationRef = ref(rtdb, `locations/${currentUser.uid}`);
      const { set } = await import("./firebase.js");
      await set(userLocationRef, null);
    }
    
    await signOut(auth);
    console.log("User logged out successfully");
    
    // Redirect to login page
    window.location.href = "login.html";
    
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error logging out: " + error.message);
  }
}

// Debug: Make functions available globally
window.debugProfile = {
  showPasswordModal: showPasswordModal,
  showLogoutConfirmation: showLogoutConfirmation,
  loadProfile: loadUserProfile
};