## auth.js
This script handles everything for both the login and register pages. When the page loads, it checks which form is on the screen and adds the right event listeners. The register function checks the inputs first, then creates a new user in Firebase and also makes a matching profile in Firestore so every user has the same basic data stored. The login function signs the user in and sends them to the map page if successful. The file also includes clickable links to switch between login and register pages. Overall, this script connects your forms to Firebase in a clear way and gives helpful messages if something goes wrong.

## firebase.js
This file sets up Firebase for the whole project. It connects to the Firebase account and turns on the three main services you need: Authentication for logging users in, Firestore for saving user profiles and friend data, and the Realtime Database for fast updates like locations and online status. It also exports all the Firebase functions in one place, so other files can just import from firebase.js instead of setting up Firebase again. This keeps the project organized and makes it easy to update in the future. Without this file, none of the other pages would be able to communicate with Firebase.

## friends.html
This page is the user interface for everything related to friends. It shows three main sections side-by-side: a search panel for adding new friends, a list of your current friends, and a list of any pending friend requests. At the top, there’s a navigation menu so users can move between Profile, Map, and Friends. The layout is styled with friends.css, and all of the interactive behavior (searching, adding, removing, checking location/status) comes from the JavaScript files at the bottom: firebase.js gives Firebase access, friends.js controls all friend actions, and presence.js tracks whether friends are online.

## friends.js
This file controls all the logic for searching users, sending and receiving friend requests, and displaying online status + location of existing friends. When the page loads, it first checks whether someone is logged in; if not, it redirects to the login page. It downloads all users from Firestore so the search bar can filter through them in real time. It also loads three sets of information from the current user’s Firestore document: friends, incoming requests, and outgoing requests. Buttons allow sending requests to new users, accepting or declining requests from others, and removing people from the friend list. The file also listens to the Realtime Database so it can show each friend’s current building and whether they are online, updating live as they move around. Everything that changes is reflected immediately on screen without needing to refresh the page.

## index.html
It loads some special fonts and a swirling animation (from swirl.js) for style. When the user performs the gesture to proceed, the small script at the bottom checks Firebase authentication: if the user is already logged in, it sends them straight to the map page; otherwise, it redirects them to the login page.

## location.js
This file controls the live location system using Firebase Realtime Database. When a user signs in, it starts automatically updating their location every few seconds. It stores the building name along with x/y coordinates so friends can appear on the map. It also listens for updates about other users’ locations, but filters them so you only see your friends on the map. It tracks whether each friend is “online” by checking how recently they updated their location. The file provides helper functions so the map page can subscribe to updates and place markers visually whenever a friend moves. When the user signs out or closes the site, the file stops updating and can even remove their location so they don’t falsely appear online.

## login.html
This page contains the form where users type their email and password to sign in. It uses Firebase to secure the entry point of the app so no one can access maps, friends, or profiles unless they successfully log in.

## map.html
This file is the main screen users see once they log in. It sets up the layout: a fullscreen map in the background and simple navigation buttons on top so users can go to profile, friends, or log out. The page loads the Google Maps script and the map.js logic so it can display friends’ locations in real time. It also includes Firebase authentication checks to make sure only logged-in users can access this page — if someone isn’t signed in, the page automatically sends them back to login.

## map.js
This script controls everything happening on the map. Once the user is signed in, it grabs their current location and updates it constantly in Firebase so friends can see where they are. It listens to the location data of all approved friends, placing map markers for each one and updating them live as they move. It also checks presence data so offline users appear differently, keeping the map accurate. If the user leaves the page, stops sharing, or loses internet, their dot automatically goes offline.

## presence.js
This script keeps track of whether a logged-in user is active on the app. As soon as Firebase confirms someone is signed in, it regularly updates a lastUpdate timestamp in the Realtime Database. It also updates the time immediately whenever the user returns to the tab after being away.

## profile.html
This page shows the user’s account information in a clean layout: username, email, number of friends, and their last known map location. It includes buttons for logging out and changing password, with pop-up modals that appear when needed. The navigation bar at the top lets users move between the Profile, Map, and Friends pages. The page loads JavaScript that fills in the real profile data from Firebase so everything starts as “Loading…” and then updates to the user’s personal info. This page is focused on the user’s identity and control over their account.

## profile.js
This file makes the profile page actually work by filling in personal data and giving the user control over their account. When the user is logged in, it grabs their info from Firestore and shows their username, email, number of friends, and their last known location on campus. It also listens in real time for location changes and updates the display so they can see if any friends are currently online. The script controls buttons on the page, like changing password and logging out, and shows animated pop-up modals for those actions.

## quiz.html
This file turns the location system into a game where players guess buildings in Harvard Yard. There’s a button to exit back to the main map, and a restart button after finishing. The building icons appear on top of the image, and quiz.js handles the behavior.

## quiz.js
This script runs the entire quiz experience. It has preset coordinates for many Harvard buildings and places clickable markers at those locations on the Yard map image. When the quiz starts, it randomizes the order of buildings, asks “Where is ...?”, and waits for the player to click a marker. Correct clicks turn green, wrong ones turn red, and the score updates as a percentage. When all buildings are guessed, a pop-up shows the final results and gives the option to restart.

## register.html
This is the webpage where a new user creates their account. It shows a clean form asking for email, password, and a password confirmation to help prevent mistakes. There’s also a link to the login page if the person already has an account. The page includes Firebase and auth.js scripts so that when the user submits the form, the app creates their account and saves their profile in Firebase.

## swirl.js
This script runs on the home screen and looks for the user to move their mouse in a swirling motion. It measures how much the cursor rotates and builds up a “swirl score.” Once the motion is big enough, it triggers a fade-out animation and automatically continues to the next page.

## CSS designs
The designs for the website were created using Figma. These designs were than replicated through css and used in our code through several separate files like style.css, friends.css, menu.css, etc. The Marauder's Map: Harvard Edition is reminiscent of the marauder's map design in Harry Potter and is many element of the website are meant to replicate the nostalgia of this classic map. A tan color was used for the background to create the aesthetic of a vinatge map. 
