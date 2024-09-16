[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/AHFn7Vbn)
# Superjoin Hiring Assignment

### Welcome to Superjoin's hiring assignment! 🚀

### Objective
Build a solution that enables real-time synchronization of data between a Google Sheet and a specified database (e.g., MySQL, PostgreSQL). The solution should detect changes in the Google Sheet and update the database accordingly, and vice versa.

### Problem Statement
Many businesses use Google Sheets for collaborative data management and databases for more robust and scalable data storage. However, keeping the data synchronised between Google Sheets and databases is often a manual and error-prone process. Your task is to develop a solution that automates this synchronisation, ensuring that changes in one are reflected in the other in real-time.

### Requirements:
1. Real-time Synchronisation
  - Implement a system that detects changes in Google Sheets and updates the database accordingly.
   - Similarly, detect changes in the database and update the Google Sheet.
  2.	CRUD Operations
   - Ensure the system supports Create, Read, Update, and Delete operations for both Google Sheets and the database.
   - Maintain data consistency across both platforms.
   
### Optional Challenges (This is not mandatory):
1. Conflict Handling
- Develop a strategy to handle conflicts that may arise when changes are made simultaneously in both Google Sheets and the database.
- Provide options for conflict resolution (e.g., last write wins, user-defined rules).
    
2. Scalability: 	
- Ensure the solution can handle large datasets and high-frequency updates without performance degradation.
- Optimize for scalability and efficiency.

## Submission ⏰
The timeline for this submission is: **Next 2 days**

Some things you might want to take care of:
- Make use of git and commit your steps!
- Use good coding practices.
- Write beautiful and readable code. Well-written code is nothing less than a work of art.
- Use semantic variable naming.
- Your code should be organized well in files and folders which is easy to figure out.
- If there is something happening in your code that is not very intuitive, add some comments.
- Add to this README at the bottom explaining your approach (brownie points 😋)
- Use ChatGPT4o/o1/Github Co-pilot, anything that accelerates how you work 💪🏽. 

Make sure you finish the assignment a little earlier than this so you have time to make any final changes.

Once you're done, make sure you **record a video** showing your project working. The video should **NOT** be longer than 120 seconds. While you record the video, tell us about your biggest blocker, and how you overcame it! Don't be shy, talk us through, we'd love that.

We have a checklist at the bottom of this README file, which you should update as your progress with your assignment. It will help us evaluate your project.

- [ ] My code's working just fine! 🥳
- [ ] I have recorded a video showing it working and embedded it in the README ▶️
- [ ] I have tested all the normal working cases 😎
- [ ] I have even solved some edge cases (brownie points) 💪
- [ ] I added my very planned-out approach to the problem at the end of this README 📜

## Got Questions❓
Feel free to check the discussions tab, you might get some help there. Check out that tab before reaching out to us. Also, did you know, the internet is a great place to explore? 😛

We're available at techhiring@superjoin.ai for all queries. 

All the best ✨.

## Developer's Section
*Add your video here, and your approach to the problem (optional). Leave some comments for us here if you want, we will be reading this :)*

## Current Approach:

Google Sheets API:

I'm using the Google Sheets API to facilitate communication between Google Sheets and the Express.js backend, to query, update, and manage data in Google Sheets programmatically.

APP Scripts for Automation:

I'm using App scripts within Google Sheets to automate tasks such as ID generation and timestamp creation.
Timestamp Generation is used to record when a cell or row was last modified for accurate synchronization.
This is done to identify and update only the modified data, reducing the need to process the entire sheet each time.

## Initial Focus:

CRUD Operations:

Establish CRUD (Create, Read, Update, Delete) operations between Google Sheets and the database.
I will then establish similar operations from the database to the sheets using triggers.

Future Enhancements:

Pub/Sub Model:
Explore converting the synchronization process into a pub/sub (publish/subscribe) model if time permits.
Benefits:
Scalability: Handle high loads and real-time updates more efficiently.
Decoupling: Separate the data update process from the data synchronization process to improve system responsiveness and reliability.
Additional Considerations:

Error Handling:

Implement comprehensive error handling and logging in both the Express.js backend and Google Sheets scripts.
Ensure that any issues in synchronization are detected and resolved promptly.
Testing and Validation:

Conduct thorough testing to validate the synchronization logic and ensure data consistency.
Use sample datasets and edge cases to verify that CRUD operations and timestamp-based updates work as expected.

## MY PROGRESS:
I was able to complete all primary goals which were part of my inital focus. Additionally, I was also able to establish efficient modifications since the sheet or db is only updated using "Id", which removes the necessity of going through the whole db or sheet.

The biggest challenge I faced was to sync the sheet on updating the db. I considered using triggers for this, but the issue is that these triggers activate every time there's a change in the sheet, which creates a loop since the database updates also trigger the sync process. To tackle this issue, I came up with a solution to efficiently enable and disable these triggers, which seemed like the easiest choice with the time left.

VIDEO LINK:
https://drive.google.com/file/d/1l21aS6cnY_QrCQ5ZpGrHTVJ0iDCuoFXh/view?usp=sharing