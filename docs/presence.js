import { auth, rtdb, ref, update, onAuthStateChanged } from "./firebase.js";

// listens for changes in authentication
onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const userRef = ref(rtdb, `locations/${user.uid}`);

    // update online status every 15 seconds
    setInterval(() => {
        update(userRef, { lastUpdate: Date.now() });
    }, 15000);

    // tab becomes active again
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            update(userRef, { lastUpdate: Date.now() });
        }
    });
});
