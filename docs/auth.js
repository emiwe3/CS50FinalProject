import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const goRegister = document.getElementById("go-register");
  if (goRegister) {
    goRegister.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "register.html";
    });
  }

  const goLogin = document.querySelector('a[href="login.html"]');
  if (goLogin) {
    goLogin.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "login.html";
    });
  }
});

async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (!email || !password || !confirm) {
    alert("Please fill all fields.");
    return;
  }
  if (password !== confirm) {
    alert("Passwords don't match.");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, "users", uid), {
      email: email,
      username: email.split("@")[0],
      friends: [],
      requests: [],
      createdAt: new Date().toISOString()
    });

    alert("Registration successful! Please login.");
    e.target.reset();
    window.location.href = "login.html";

  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      alert("Email already registered.");
    } else if (err.code === "auth/invalid-email") {
      alert("Invalid email format.");
    } else if (err.code === "auth/weak-password") {
      alert("Password too weak.");
    } else {
      alert("Error: " + err.message);
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "map.html";

  } catch (err) {
    if (err.code === "auth/user-not-found") {
      alert("No account found with this email.");
    } else if (err.code === "auth/wrong-password") {
      alert("Wrong password.");
    } else if (err.code === "auth/invalid-email") {
      alert("Invalid email format.");
    } else {
      alert("Error: " + err.message);
    }
  }
}

export { handleRegister, handleLogin };
