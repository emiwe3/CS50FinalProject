## Marauder's Map: Harvard Edition

## Table of Contents
1. Summary of Project
2. How to Use it
3. Features
4. Issues & Potential Improvements
6. Technologies Used

## Link to our Website:
https://emiwe3.github.io/CS50FinalProject/ 

## Summary of Project
The Marauder's Map: Harvard Edition is a fun website for first years to track the location of their new friends and explore Harvard Yard in an interactive quiz. You and your friends can set your location to one of the buildings on the map. When the user clicks on the friends tab, their status as well as their friends' status are shown. This makes meetings between friends much easier since instead of having to text your friend to ask for their location, you can easily see where they are based on the map. The map also includes an entertaining quiz where the user applies their knowledge of Harvard Yard's buildings. Outside of making the map more engaging, this quiz also helps first-year students recognize where buildings are located, which prevents them from getting lost easily. The website also lets users add or remove friends, view their current friends, and see where those friends are located on the Friends page. The Profile page displays each user’s personal information.

## How to use it
This website is very easy to use, and no downloads are required. The user simply has to go to this GitHub URL address: https://emiwe3.github.io/CS50FinalProject/ and then follow the instructions to go to the login and register page, as well as the map. The user must click the "I solemnly swear I am a First Year" button to take the Harvard Yard quiz. The menu of the website is very intuitive, and the user can simply view their friends and profile by clicking on the respective buttons. By clicking on the icons located on various Harvard buildings, the user is able to set their location and also see the relevant information. The location will be set once the "Set Location" button is clicked and the icon turns green. Chrome is the best browser to make full use of The Marauder's Map: Harvard Edition. 

## Features
1. Accepts user input (email and password) when logging in and registering.
2. This user information is stored using Firebase, which allows the user to view their profile information and their friends.
3. Allows adding friends and removing friends using the information stored in Firebase.
4. Icons are set onto various buildings on the map.png by using specific pixel coordinates.
5. We are able to ensure that user info stays secure through Firebase authentication, which only allows the user to access their data and change their data.
6. Firebase stores data in real-time, so when a user's input changes, their information is automatically updated.
7. All of the data in Firebase is stored using JSON formatting.
8. Firebase also expands as traffic increases, so the performance of our website is maintained.
9. Users are able to click on the map icons to set their location and display their location to friends.
10. User is able to view the location set by their friends, and their friends appear as an icon.
11. An engaging guessing quiz was also implemented that allows the user to memorize the locations of Harvard Yard buildings.

## Issues and Potential Improvements
1. Using geolocation to track the real-time location of friends instead of having friends set their location. This would make the location more accurate since the user's friend no longer has to manually set their location to a new building every time they move across the yard.
2. Implementing this as an app instead of a website. Currently, the Marauder's Map: Harvard Edition is a website that people can log into, but if this project were to be implemented as an app in the future, it would be more useful because users would not have to go through the hassle of googling a URL. 
3. Our website only displays friends as online if the friend has set a location on the map, so one improvement would be to display friends as online if they are logged in to the website instead. 
4. Another good improvement would be to include friend recommendations underneath the search bar to make it easier for first years to connect with other people. 

## Technologies Used
Various technological tools were utilized in the course of the project. We started off with Figma to create each page design and plan out the user interface. Then, we coded in Visual Studio Code to replicate the designs in CSS/HTML and added effects using JS. We utilized AI debugging throughout development to help identify issues and refine our code. Firebase was used to store our data, handle authentication, and manage real-time updates. This website was helpful in helping us plot the pixel locations onto our map image (made from figma): https://imageonline.io/find-coordinates-of-image/#google_vignette
