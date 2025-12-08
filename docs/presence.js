import { auth, rtdb, ref, update, onAuthStateChanged } from "./firebase.js";

// listens for changes in authentication
onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const userRef = ref(rtdb, `locations/${user.uid}`);

    // updates online status every 15 seconds
    setInterval(() => {
        update(userRef, { lastUpdate: Date.now() });
    }, 15000);

    document.addEventListener("visibilitychange", () => {
        // if the document becomes visible update the timestamp
        if (!document.hidden) {
            update(userRef, { lastUpdate: Date.now() });
        }
    });
});
