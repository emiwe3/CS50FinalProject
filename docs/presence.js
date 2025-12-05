import { auth, rtdb, ref, update, onAuthStateChanged } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const userRef = ref(rtdb, `locations/${user.uid}`);

    setInterval(() => {
        update(userRef, { lastUpdate: Date.now() });
    }, 15000);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            update(userRef, { lastUpdate: Date.now() });
        }
    });
});
