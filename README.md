# Compliance Server

A Node.js/Express server application for managing compliance forms and submissions.

## Project Structure

```
compliance-server/
├── config/
│   ├── app.js          # Application configuration
│   ├── database.js     # Database connection configuration
│   └── multer.js       # File upload configuration
├── database/
│   └── init.js         # Database initialization and table creation
├── middleware/
│   ├── auth.js         # Authentication middleware
│   └── errorHandler.js # Error handling middleware
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── admin.js        # Admin-specific routes
│   ├── compliance.js   # Compliance form routes
│   └── licensees.js    # Licensees management routes
├── uploads/            # File upload directory (created automatically)
├── server.js           # Main server file
├── package.json        # Project dependencies and scripts
└── README.md          # This file
```

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   yarn install
   ```

## Configuration

1. Ensure MySQL is running on your system
2. Update database configuration in `config/database.js` if needed
3. Create a `.env` file for environment variables (optional)

## Running the Application

### Development Mode
```bash
yarn dev
```

### Production Mode
```bash
yarn start
```

The server will run on `http://localhost:3001`

## Features

- User authentication and authorization
- Role-based access control (admin/user)
- Compliance form submission
- File upload handling
- Admin dashboard for managing submissions
- Session management
- Database transaction support

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-session` - Check session validity
- `GET /api/profile` - Get user profile

### Compliance
- `POST /api/submit-compliance` - Submit compliance form
- `GET /api/my-submissions` - Get user's submissions
- `GET /api/submission-status/:id` - Get submission status

### Admin (Requires admin role)
- `GET /api/admin/submissions` - Get all submissions
- `GET /api/admin/user-stats` - Get user statistics
- `POST /api/admin/update-submission` - Update submission status
- `POST /api/admin/approve-submission` - Approve/reject submission

### Licensees
- `POST /api/licensees` - Create/update licensee information

## Database

The application uses MySQL database with the following main tables:
- `users` - User accounts and roles
- `licensees` - Licensee information
- `compliance_forms` - Main compliance submissions
- `notifications` - User notifications
- Various related tables for form data (exports, imports, employment, etc.)

## File Structure Benefits

1. **Modularity**: Code is split into logical modules for easier maintenance
2. **Separation of Concerns**: Routes, middleware, and configuration are separated
3. **Reusability**: Middleware and utility functions can be easily reused
4. **Testing**: Individual modules can be tested independently
5. **Scalability**: Easy to add new features without cluttering the main server file

## Dependencies

- **express**: Web framework
- **mysql2**: MySQL database driver
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling
- **express-session**: Session management
- **dotenv**: Environment variable management

## Development Dependencies

- **nodemon**: Development server with auto-restart

## Environment Variables

Create a `.env` file in the root directory with:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=compliance
WEB_PORT=3001
SESSION_SECRET=compliance_secret
```
