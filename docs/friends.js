import {
  auth,
  db,
  rtdb,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  ref,
  onValue
} from "./firebase.js";

let currentUser = null;
let allUsers = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  currentUser = user;
  console.log("Friends page - User:", user.email);
  
  await loadAllUsers();
  await loadFriends();
  await loadRequests();
  setupSearchListener();
});

async function loadAllUsers() {
  try {
    console.log("Loading all users from Firestore...");
    const snapshot = await getDocs(collection(db, "users"));
    allUsers = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allUsers.push({
        id: docSnap.id,
        email: data.email || "No email",
        username: data.username || "No username"
      });
    });
    
    console.log(`Found ${allUsers.length} users`);
    
  } catch (error) {
    console.error("Error loading users:", error);
    showError("searchResults", "Error loading users");
  }
}

function setupSearchListener() {
  const searchBar = document.getElementById("searchBar");
  if (searchBar) {
    searchBar.addEventListener("input", searchUsers);
  }
}

async function searchUsers() {
  const searchInput = document.getElementById("searchBar");
  const resultsDiv = document.getElementById("searchResults");
  
  if (!searchInput || !resultsDiv) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  resultsDiv.innerHTML = "";
  
  let currentFriends = [];
  let currentRequests = [];
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      currentFriends = data.friends || [];
      currentRequests = data.requests || [];
    }
  } catch (error) {
    console.error("Error getting user data:", error);
  }
  
  const filteredUsers = allUsers.filter(user => {
    if (user.id === currentUser.uid) return false;
    
    if (currentFriends.includes(user.id)) return false;
    
    if (currentRequests.includes(user.id)) return false;
    
    if (searchTerm === "") return true;
    
    return user.username.toLowerCase().includes(searchTerm) ||
           user.email.toLowerCase().includes(searchTerm);
  });
  
  if (filteredUsers.length === 0) {
    resultsDiv.innerHTML = `
      <div class="empty-message">
        ${searchTerm ? `No users found for "${searchTerm}"` : "Start typing to search for friends"}
      </div>
    `;
    return;
  }
  
  filteredUsers.forEach(user => {
    const userDiv = document.createElement("div");
    userDiv.className = "user-row";
    
    userDiv.innerHTML = `
      <div class="user-info">
        <div class="username">${user.username}</div>
        <div class="email">${user.email}</div>
      </div>
      <button class="add-btn" data-userid="${user.id}">Add</button>
    `;
    
    const addBtn = userDiv.querySelector('.add-btn');
    addBtn.addEventListener('click', () => sendRequest(user.id));
    
    resultsDiv.appendChild(userDiv);
  });
}

async function loadFriends() {
  const friendsList = document.getElementById("friendsList");
  if (!friendsList) return;

  friendsList.innerHTML = "";

  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists()) {
      friendsList.innerHTML = '<div class="empty-message">No profile found</div>';
      return;
    }

    const friends = userDoc.data().friends || [];

    if (friends.length === 0) {
      friendsList.innerHTML = '<div class="empty-message">No friends yet</div>';
      return;
    }

    for (const friendUid of friends) {
      try {
        const friendDoc = await getDoc(doc(db, "users", friendUid));
        if (!friendDoc.exists()) continue;

        const friendData = friendDoc.data();

        const friendDiv = document.createElement("div");
        friendDiv.className = "user-row";
        friendDiv.dataset.userid = friendUid;

        friendDiv.innerHTML = `
          <div class="user-info">
            <div class="username">${friendData.username}</div>
            <div class="email">${friendData.email}</div>
            <div class="friend-status" id="status-${friendUid}">Checking status...</div>
            <div class="friend-location" id="location-${friendUid}" style="font-size: 0.9rem; color: #666;">
              📍 Location: Loading...
            </div>
          </div>
          <button class="remove-btn" data-userid="${friendUid}">Remove</button>
        `;

        friendsList.appendChild(friendDiv);

        checkFriendOnlineStatus(friendUid, friendDiv);
        checkFriendLocation(friendUid, friendDiv);

        friendDiv.querySelector('.remove-btn')
          .addEventListener('click', () => removeFriend(friendUid));

      } catch (error) {
        console.error(`Error loading friend ${friendUid}:`, error);
      }
    }

  } catch (error) {
    console.error("Error loading friends:", error);
    showError("friendsList", "Error loading friends");
  }
}


async function checkFriendLocation(friendUid, element) {
  try {
    const locationRef = ref(rtdb, `locations/${friendUid}`);

    onValue(locationRef, (snapshot) => {
      const location = snapshot.val();
      const locationElement = element.querySelector(`#location-${friendUid}`);

      if (!locationElement) return;

      if (location && location.building) {
        locationElement.textContent = `📍 ${location.building}`;
        locationElement.style.color = '#2e7d32';
        locationElement.style.fontWeight = 'bold';
      } else {
        locationElement.textContent = '📍 No location set';
        locationElement.style.color = '#888';
      }
    });

  } catch (error) {
    console.error("Error checking friend location:", error);
  }
}


async function checkFriendOnlineStatus(friendUid, element) {
  try {
    const locationRef = ref(rtdb, `locations/${friendUid}`);

    onValue(locationRef, (snapshot) => {
      const location = snapshot.val();
      const isOnline = location && location.lastUpdate &&
                       (Date.now() - location.lastUpdate) < 30000;

      const statusElement = element.querySelector(`#status-${friendUid}`);

      if (!statusElement) return;

      if (isOnline) {
        statusElement.textContent = `● Online at ${location.building}`;
        statusElement.style.color = '#2e7d32';
        statusElement.style.fontWeight = 'bold';
      } else {
        statusElement.textContent = "○ Offline";
        statusElement.style.color = "#888";
      }
    });

  } catch (error) {
    console.error("Error checking friend status:", error);
  }
}


async function loadRequests() {
  const requestList = document.getElementById("requestList");
  if (!requestList) return;
  
  requestList.innerHTML = "";
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists()) {
      requestList.innerHTML = '<div class="empty-message">No profile found</div>';
      return;
    }
    
    const data = userDoc.data();
    const requests = data.requests || [];
    
    if (requests.length === 0) {
      requestList.innerHTML = '<div class="empty-message">No pending requests</div>';
      return;
    }
    
    for (const requesterId of requests) {
      try {
        const requesterDoc = await getDoc(doc(db, "users", requesterId));
        if (requesterDoc.exists()) {
          const requesterData = requesterDoc.data();
          
          const requestDiv = document.createElement("div");
          requestDiv.className = "user-row";
          requestDiv.innerHTML = `
            <div class="user-info">
              <div class="username">${requesterData.username}</div>
              <div class="email">${requesterData.email}</div>
            </div>
            <div class="request-buttons">
              <button class="accept-btn" data-userid="${requesterId}">✔</button>
              <button class="decline-btn" data-userid="${requesterId}">✖</button>
            </div>
          `;
          
          requestList.appendChild(requestDiv);
          
          const acceptBtn = requestDiv.querySelector('.accept-btn');
          const declineBtn = requestDiv.querySelector('.decline-btn');
          
          acceptBtn.addEventListener('click', () => acceptRequest(requesterId));
          declineBtn.addEventListener('click', () => declineRequest(requesterId));
        }
      } catch (error) {
        console.error(`Error loading requester ${requesterId}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error loading requests:", error);
    showError("requestList", "Error loading requests");
  }
}

async function sendRequest(receiverId) {
  try {
    await updateDoc(doc(db, "users", receiverId), {
      requests: arrayUnion(currentUser.uid)
    });
    
    alert("Friend request sent!");
    searchUsers(); 
    loadRequests(); 
    
  } catch (error) {
    console.error("Error sending request:", error);
    alert("Failed to send request!");
  }
}

async function acceptRequest(senderId) {
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      friends: arrayUnion(senderId),
      requests: arrayRemove(senderId)
    });
    
    await updateDoc(doc(db, "users", senderId), {
      friends: arrayUnion(currentUser.uid)
    });
    
    alert("Friend request accepted!");
    loadFriends();
    loadRequests();
    searchUsers();
    
  } catch (error) {
    console.error("Error accepting request:", error);
    alert("Failed to accept request!");
  }
}

async function declineRequest(senderId) {
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      requests: arrayRemove(senderId)
    });
    
    alert("Request declined");
    loadRequests();
    searchUsers();
    
  } catch (error) {
    console.error("Error declining request:", error);
    alert("Failed to decline request!");
  }
}

async function removeFriend(friendId) {
  if (!confirm("Remove this friend?")) return;
  
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      friends: arrayRemove(friendId)
    });
    
    await updateDoc(doc(db, "users", friendId), {
      friends: arrayRemove(currentUser.uid)
    });
    
    alert("Friend removed");
    loadFriends();
    searchUsers();
    
  } catch (error) {
    console.error("Error removing friend:", error);
    alert("Failed to remove friend!");
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="error-message">${message}</div>`;
  }
}

window.sendRequest = sendRequest;
window.acceptRequest = acceptRequest;
window.declineRequest = declineRequest;
window.removeFriend = removeFriend;
