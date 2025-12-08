// import functions from firebase
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "./firebase.js";

// declare global variables
let currentUser = null;
let allUsers = [];
let currentFriends = [];
let currentRequests = [];

// if no user is logged in go to the login page
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  // load all users, friends, and requests
  await loadAllUsers();
  await loadUserData();
  loadFriends();
  loadRequests();
  setupSearchListener();
});

async function loadAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  allUsers = snapshot.docs.map((d) => ({
    id: d.id,
    email: d.data().email || "",
    username: d.data().username || ""
  }));
}

async function loadUserData() {
  // fetch current friends and pending requests
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (!userDoc.exists()) return;

  const data = userDoc.data();
  currentFriends = data.friends || [];
  currentRequests = data.requests || [];
}

function setupSearchListener() {
  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.addEventListener("input", searchUsers);
}

// search for users
function searchUsers() {
  const searchInput = document.getElementById("searchBar");
  const resultsDiv = document.getElementById("searchResults");
  if (!searchInput || !resultsDiv) return;

  const term = searchInput.value.toLowerCase().trim();
  resultsDiv.innerHTML = "";

  // filter users 
  const filtered = allUsers.filter((user) => {
    if (user.id === currentUser.uid) return false;
    if (currentFriends.includes(user.id)) return false;
    if (currentRequests.includes(user.id)) return false;

    // match users by username 
    if (term === "") return true;
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  if (filtered.length === 0) {
    resultsDiv.innerHTML = `
      <div class="empty-message">
        ${term ? `No users found for "${term}"` : "Start typing to search for friends"}
      </div>`;
    return;
  }

  // display filtered users
  filtered.forEach((user) => {
    const div = document.createElement("div");
    div.className = "user-row";

    div.innerHTML = `
      <div class="user-info">
        <div class="username">${user.username}</div>
        <div class="email">${user.email}</div>
      </div>
      <button class="add-btn" data-id="${user.id}">Add</button>
    `;

    div.querySelector("button").onclick = () => sendRequest(user.id);
    resultsDiv.appendChild(div);
  });
}

// display current friends
async function loadFriends() {
  const friendsList = document.getElementById("friendsList");
  if (!friendsList) return;

  friendsList.innerHTML = "";

  if (currentFriends.length === 0) {
    friendsList.innerHTML = '<div class="empty-message">No friends yet</div>';
    return;
  }

   // display friends' info
  for (const uid of currentFriends) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) continue;

    const data = snap.data();

    const div = document.createElement("div");
    div.className = "user-row";

    div.innerHTML = `
      <div class="user-info">
        <div class="username">${data.username}</div>
        <div class="email">${data.email}</div>
      </div>
      <button class="remove-btn" data-id="${uid}">Remove</button>
    `;

    div.querySelector("button").onclick = () => removeFriend(uid);
    friendsList.appendChild(div);
  }
}

// load friend requests
async function loadRequests() {
  const requestList = document.getElementById("requestList");
  if (!requestList) return;

  requestList.innerHTML = "";

  if (currentRequests.length === 0) {
    requestList.innerHTML = '<div class="empty-message">No pending requests</div>';
    return;
  }

  for (const uid of currentRequests) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) continue;

    const data = snap.data();

    const div = document.createElement("div");
    div.className = "user-row";

    div.innerHTML = `
      <div class="user-info">
        <div class="username">${data.username}</div>
        <div class="email">${data.email}</div>
      </div>
      <div class="request-buttons">
        <button class="accept-btn">✔</button>
        <button class="decline-btn">✖</button>
      </div>
    `;

    div.querySelector(".accept-btn").onclick = () => acceptRequest(uid);
    div.querySelector(".decline-btn").onclick = () => declineRequest(uid);

    requestList.appendChild(div);
  }
}

// send a friend request
async function sendRequest(receiverId) {
  await updateDoc(doc(db, "users", receiverId), {
    requests: arrayUnion(currentUser.uid)
  });

  await loadUserData();
  searchUsers();
  loadRequests();
}

// accept a friend request
async function acceptRequest(senderId) {
  await updateDoc(doc(db, "users", currentUser.uid), {
    friends: arrayUnion(senderId),
    requests: arrayRemove(senderId)
  });

  await updateDoc(doc(db, "users", senderId), {
    friends: arrayUnion(currentUser.uid)
  });

  await loadUserData();
  loadFriends();
  loadRequests();
  searchUsers();
}

// decline a friend request
async function declineRequest(senderId) {
  await updateDoc(doc(db, "users", currentUser.uid), {
    requests: arrayRemove(senderId)
  });

  await loadUserData();
  loadRequests();
  searchUsers();
}

// remove a friend
async function removeFriend(friendId) {
  await updateDoc(doc(db, "users", currentUser.uid), {
    friends: arrayRemove(friendId)
  });

  await updateDoc(doc(db, "users", friendId), {
    friends: arrayRemove(currentUser.uid)
  });

  await loadUserData();
  loadFriends();
  searchUsers();
}
