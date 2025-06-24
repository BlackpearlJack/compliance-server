const express = require("express");
const router = express.Router();
const { pool } = require("../config/database-config");

// User Authentication Routes
router.post("/signup", async (req, res) => {
//   console.log("Request body:", req.body); // Add this debug line
  const { username, password, role } = req.body;
//   console.log("Extracted values:", { username, password, role }); // Add this debug line
  try {
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const [result] = await pool.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, password, role] // Save the role in the database
    );

    res.json({ message: "User created successfully", userId: result.insertId });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
//   console.log("Login request body:", req.body);
  const { username, password } = req.body;
//   console.log("Login credentials:", { username, password });
  // ...rest of your login logic...
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [
      username,
      password,
    ]);
    if (users.length === 0) {
      console.log("Login failed: Invalid credentials");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    console.log(`Login successful: User role is ${user.role}`);
    console.log(`User logged in: ${JSON.stringify(user)}`);

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }

    // Clear the session cookie
    res.clearCookie("connect.sid");

    // Send success response
    res.json({ message: "Logged out successfully" });
  });
});

// Check session endpoint
router.get("/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Get user profile endpoint
router.get("/profile", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    username: req.session.user.username,
    role: req.session.user.role,
  });
});

module.exports = router;
