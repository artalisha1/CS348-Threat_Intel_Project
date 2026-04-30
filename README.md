# CS348 Threat Intelligence Project

## Overview
This project is a web-based Threat Intelligence Management System. It allows users to view, add, edit, and delete Threat Actors and Indicators of Compromise (IOCs). The system uses a Node.js backend with an Express server, a MySQL database for storage, and a HTML/CSS/JS frontend.

## Live Deployment
The application is deployed on Google Cloud Platform (GCP) and can be accessed here:
**[https://cs348-threat-intel-project.uc.r.appspot.com/](https://cs348-threat-intel-project.uc.r.appspot.com/)**

---

## Code Files

### Backend & Server
*   **`server.js`**: This file implements a Node.js server using the Express framework. It connects to the MySQL database and sets up the API Routes (endpoints like `/api/actors` and `/api/iocs`) using GET, POST, PUT, and DELETE methods. When the frontend asks for data or wants to save something new, `server.js` receives that request, safely constructs and runs the respective parameterized SQL queries (preventing SQL injection), and sends the results back to the frontend.Additionally, it includes database transaction logic with a `READ COMMITTED` isolation level to ensure atomicity and prevent dirty reads when simultaneously creating a Threat Actor and linking an IOC.
*   **`package.json`**: This file keeps track of the project's metadata and its dependencies (the external libraries the project needs to run, such as `express` for the server, `mysql2` to talk to the database, and `cors` for security).
*   **`package-lock.json`**: Automatically generated file that locks down the exact versions of the dependencies so the project works identically everywhere.

### Database
*   **`init_db.sql`**: This file is the database setup script. It contains the SQL commands to create the `threat_intel` database, the `ThreatActors` and `IndicatorsOfCompromise` tables, establish the relationship between them, build indexes for faster searching, and insert initial "seed" data so the app isn't empty when it first starts.

### Frontend (`public` folder)
*   **`public/index.html`**: This file is the structure of the webpage. It defines where the tables, buttons, forms, and modals (pop-ups) are placed on the screen.
*   **`public/style.css`**: This file is the design file. It adds colors, spacing, and styling to the HTML elements to make the webpage look modern and user-friendly.
*   **`public/app.js`**: This file implements the logic for the frontend and controls the user-facing part of the application. It handles user clicks, manages the interactive modals for adding/editing records, and makes asynchronous requests (using `fetch`) to `server.js` to get or save data. It then takes the JSON data received from the server and dynamically builds the HTML table and updates filter dropdowns on the fly, providing a seamless experience without needing to refresh the page.

### Cloud Deployment
*   **`app.yaml`**: This file is a configuration file used by Google Cloud Platform. It tells GCP how to run the application (e.g., using Node.js) and sets up the environment when deploying the app to App Engine.

## How it all connects
1.  **User Action**: You open the webpage (`index.html`) and click a button or submit a form. The browser runs the logic in `app.js`.
2.  **API Request**: `app.js` sends an HTTP request over the internet to the backend server (`server.js`).
3.  **Database Query**: `server.js` interprets the request and securely communicates with the MySQL database (structured by `init_db.sql`) to fetch or modify data.
4.  **Response**: The database sends the result back to `server.js`, which then forwards it to the browser as JSON data.
5.  **UI Update**: `app.js` receives the data and updates the `index.html` page so you can see the new information.
