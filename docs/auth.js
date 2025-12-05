import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Auth.js loaded");
  
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    console.log("Register form found");
    registerForm.addEventListener("submit", handleRegister);
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    console.log("Login form found");
    loginForm.addEventListener("submit", handleLogin);
  }

  const goRegister = document.getElementById("go-register");
  if (goRegister) {
    console.log("Register link found");
    goRegister.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Going to register page");
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
  console.log("Starting registration...");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (!email || !password || !confirm) {
    alert("Please fill all fields!");
    return;
  }
  if (password !== confirm) {
    alert("Passwords don't match!");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters!");
    return;
  }

  try {
    console.log("Creating user in Firebase Auth...");
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("User UID:", uid);

    const userData = {
      email: email,
      username: email.split("@")[0],
      friends: [],
      requests: [],
      createdAt: new Date().toISOString()
    };
    
    console.log("Saving to Firestore:", userData);
    await setDoc(doc(db, "users", uid), userData);
    
    console.log("Registration complete!");
    alert("✅ Registration successful! Please login.");
    
    e.target.reset();
    
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

  } catch (err) {
    console.error("Registration error:", err);
    
    if (err.code === 'auth/email-already-in-use') {
      alert("Email already registered!");
    } else if (err.code === 'auth/invalid-email') {
      alert("Invalid email format!");
    } else if (err.code === 'auth/weak-password') {
      alert("Password too weak!");
    } else {
      alert("Error: " + err.message);
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  console.log("Logging in...");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password!");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful!");
    window.location.href = "map.html";
  } catch (err) {
    console.error("Login error:", err);
    
    if (err.code === 'auth/user-not-found') {
      alert("No account found with this email!");
    } else if (err.code === 'auth/wrong-password') {
      alert("Wrong password!");
    } else if (err.code === 'auth/invalid-email') {
      alert("Invalid email format!");
    } else {
      alert("Error: " + err.message);
    }
  }
}

export { handleRegister, handleLogin };