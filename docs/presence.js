import { auth, rtdb, ref, update, onAuthStateChanged } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const userRef = ref(rtdb, `locations/${user.uid}`);

    // Update online status every 15 seconds
    setInterval(() => {
        update(userRef, { lastUpdate: Date.now() });
    }, 15000);

    // When tab becomes active again
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            update(userRef, { lastUpdate: Date.now() });
        }
    });
});
