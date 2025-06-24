const express = require("express");
const router = express.Router();
const { pool } = require("../config/database-config");
const { isAdmin } = require("../middleware/auth");

// Get all submissions with their status
router.get("/submissions", isAdmin, async (req, res) => {
  try {
    const [submissions] = await pool.query(`
      SELECT 
        cf.*,
        u.username as submitted_by,
        GROUP_CONCAT(DISTINCT up.file_path) as files
      FROM compliance_forms cf
      LEFT JOIN users u ON cf.user_id = u.id
      LEFT JOIN uploads up ON cf.id = up.form_id
      GROUP BY cf.id
      ORDER BY cf.created_at DESC
    `);

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user statistics
router.get("/user-stats", isAdmin, async (req, res) => {
  try {
    const [[totalUsers]] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [[totalSubmissions]] = await pool.query("SELECT COUNT(*) as count FROM compliance_forms");
    const [[pendingSubmissions]] = await pool.query(
      'SELECT COUNT(*) as count FROM compliance_forms WHERE status = "pending"'
    );

    res.json({
      totalUsers: totalUsers.count,
      totalSubmissions: totalSubmissions.count,
      pendingSubmissions: pendingSubmissions.count,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get compliance form details by ID
router.get("/compliance-forms/:id",isAdmin, async (req, res) => {
  const submissionId = req.params.id;
  try {
    const [submission] = await pool.query("SELECT * FROM compliance_forms WHERE id = ?", [
      submissionId,
    ]);

    if (submission.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const [files] = await pool.query("SELECT * FROM uploads WHERE form_id = ?", [submissionId]);

    res.json({
      submission: submission[0],
      files,
    });
  } catch (error) {
    console.error("Error fetching compliance form details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update submission status
router.post("/update-submission", isAdmin, async (req, res) => {
  const { submissionId, status, checkedBy, verifiedBy, date, comment } = req.body;

  try {
    await pool.query(
      "UPDATE compliance_forms SET status = ?, checked_by = ?, verified_by = ?, review_date = ?, admin_comment = ? WHERE id = ?",
      [status, checkedBy, verifiedBy, date, comment, submissionId]
    );

    // Create notification for the user
    const [submission] = await pool.query("SELECT user_id FROM compliance_forms WHERE id = ?", [
      submissionId,
    ]);

    if (submission[0]?.user_id) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)",
        [
          submission[0].user_id,
          "submission_update",
          `Your compliance submission has been ${status}`,
          submissionId,
        ]
      );
    }

    res.json({ success: true, message: "Submission updated successfully" });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/approve-submission", isAdmin, async (req, res) => {
  const { submissionId, status, checkedBy, verifiedBy, date } = req.body;

  try {
    // Update the submission status in the database
    await pool.query(
      "UPDATE compliance_forms SET status = ?, checked_by = ?, verified_by = ?, review_date = ? WHERE id = ?",
      [status, checkedBy, verifiedBy, date, submissionId]
    );

    // Notify the user about the status update
    const [submission] = await pool.query("SELECT user_id FROM compliance_forms WHERE id = ?", [
      submissionId,
    ]);
    const userId = submission[0]?.user_id;

    if (userId) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)",
        [
          userId,
          "submission_update",
          `Your submission (ID: ${submissionId}) has been ${status}.`,
          submissionId,
        ]
      );
    }

    res.json({ message: "Submission status updated and user notified." });
  } catch (error) {
    console.error("Error updating submission status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
