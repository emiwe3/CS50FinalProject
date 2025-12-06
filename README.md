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
The Marauder's Map: Harvard Edition is meant to be able to track the location of friends. The user's friends can set their location to one of the buildings on the map which displays their location when the user clicks on the friends tab. The user can also set their own location and display it to their friends. This makes meetings between friends much easier since instead of having to text your friend to ask for their location you can easily see where they are based on the map. The map also includes an entertaining quiz where the user guesses where Harvard buildings are located on the map. Outside of making the map more engaging this quiz also helps first year students recognize where buildings are located which prevents them from getting lost easily. The website also allows the user to add and remove friends and displays their current friends and their locations in the friends page. The profile includes the users personal information. 

## How to use it
This website is very easy to use and no downloads are required. The user simply has to go to this github url addres: https://emiwe3.github.io/CS50FinalProject/ and then follow the instructions to go to the login and register page as well as the map. The user must click the "I solemnly swear I am a First Year" button to take the Harvard Yard quiz. The menu of the website is very simple and the user can easily view their friends and profile by clicking on the respective buttons on the menu. By clicking on the icons located on various Harvard buildings teh user is able to set their location. The location will be set once the set locatin button is clicked and the icon turns green. This website will not work if the user is using safari. Chrome is the best browser to make full use of The Marauder's Map: Harvard Edition. 

## Features
1. Accepts user input (email and password) when logging in and registering
2. This user information is stored using firebase which allows the user to view their profile information and their friends
3. Allows to add friends and remove friends using the information stored in firebase
4. Icons are set onto various buildings on the map.png by using specific pixel coordinates.
5. We are able to ensure that user info stays secure through firebase authentication which only alows the user to access their data and change their data.
6. Firebase stores data in realtime so when user input changes their information automatically is updated
7. All of the data in firebase is stored using JSON formatting
8. Firebase also expands as traffic increases so the performance of our webiste is maintaine
9. Users are able to click on the map icons to set their location and display their location to friends
10. User is able to view the location set by their friends, their friends appear as an icon.
11. An engaging guessing quiz was also implemented that allows the user to memorize the locations of Harvard Yard buildings

## Issues and Potential Improvements
1. Using geolocation to track the real time location of friends instead of having friends set their location. This would make the location more accurate since the user's friend no longer has to manually set their location to a new building everytime they move across the yard.
2. Implementing this as an app instead of a website. Currently the Marauder's Map: Harvard Edition is a website that people can log into, but if this project were to be implemented as a map in the future it would be more useful because users would not have to go through the hassel of googling a url. 
3. Our website only displays friends as online if the friend has set a location on the map so one improve would be to display friends as online if they are logged in to the website instead. 
4. Another good improvement would be to include friend recommendations underneath the search bar to make it easier for first years to connect with other people. 

## Technologies Used
Various technological tools were utilized in the course of the project. Mention AI debugging. We used Firebase to store our data. We also utilized this website: https://imageonline.io/find-coordinates-of-image/#google_vignette to find the pixel locations of the buildings to implement the icons. Figma was used to create the website designs.
