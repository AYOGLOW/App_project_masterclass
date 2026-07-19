# App_project_masterclass
w
# Event Center Booking Portal
A lightweight, responsive web application for managing event center bookings. This app provides a "single source of truth" for availability, allowing event planners to request time slots while preventing double-bookings. It also includes a hidden admin dashboard for the center owner to manage requests.
## Features
- **Planner View:** A clean, card-based calendar where event planners can view availability.
- **Block Booking System:** Supports fixed booking blocks ("Morning", "Afternoon", "Evening", and "Full Day").
- **Conflict Prevention:** Built-in logic prevents double-bookings. If a "Full Day" is booked, partial blocks are disabled. If a partial block is booked, the "Full Day" option is disabled.
- **Status Checker:** Planners can check the status of their requests (Pending, Approved, or Cancelled) using their name.
- **Admin Dashboard:** A hidden interface for the owner to review, approve, or cancel booking requests.
- **Responsive Design:** Mobile-first architecture using a premium Cyan and Navy UI theme.
## Tech Stack
- **Frontend:** Vanilla HTML, CSS, and JavaScript.
- **Backend:** Node.js with Express.js.
- **Database:** SQLite (local `database.sqlite` file).
## Installation & Setup
1. Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2. Clone or download this repository.
3. Open a terminal in the project directory.
4. Install the required dependencies:
   ```bash
   npm install
   ```
## Running the App
1. Start the server:
   ```bash
   node server.js
   ```
2. The server will run on port 3000 by default.
### Accessing the Views
- **Event Planner Portal:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/admin-dashboard-xyz789](http://localhost:3000/admin-dashboard-xyz789)
*(Note: The admin dashboard uses a secret URL path. Keep this link private!)*
## License
This project is created for the App Project_masterclass.
