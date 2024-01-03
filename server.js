const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = 3000;

// Serve static files from the root folder
app.use(express.static(path.join(__dirname, "public")));

// Express middleware to parse JSON requests
app.use(express.json());

// Configure the PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Student Task Manager",
  password: "EngData",
  port: 5432,
});

// Get all courses for a student (including those not enrolled)
app.get("/api/:studentId/courses", async (req, res) => {
  const studentId = req.params.studentId;

  try {
    // Get enrolled courses
    const enrolledQuery = `
      SELECT c.courseid, c.title, c.instructor
      FROM courses c
      JOIN enrollment e ON c.courseid = e.courseid
      WHERE e.studentid = $1;
    `;

    const enrolledCourses = await pool.query(enrolledQuery, [studentId]);

    // Get all courses
    const allCoursesQuery = `
      SELECT courseid, title, instructor
      FROM courses;
    `;

    const allCourses = await pool.query(allCoursesQuery);

    // Combine enrolled and all courses, marking enrolled courses
    const courses = allCourses.rows.map((course) => ({
      ...course,
      enrolled: enrolledCourses.rows.some(
        (enrolledCourse) => enrolledCourse.courseid === course.courseid
      ),
    }));

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Enroll in a course using a course code
app.post("/api/enroll", async (req, res) => {
  const { studentId, courseCode } = req.body;

  try {
    const courseQuery = "SELECT courseid FROM courses WHERE coursecode = $1";
    const courseResult = await pool.query(courseQuery, [courseCode]);

    if (courseResult.rowCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseId = courseResult.rows[0].courseid;

    // Check if the student is already enrolled
    const enrollmentCheckQuery =
      "SELECT * FROM enrollment WHERE studentid = $1 AND courseid = $2";
    const enrollmentCheckResult = await pool.query(enrollmentCheckQuery, [
      studentId,
      courseId,
    ]);

    if (enrollmentCheckResult.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "Student is already enrolled in the course" });
    }

    // Enroll the student in the course
    const enrollQuery =
      "INSERT INTO enrollment (studentid, courseid) VALUES ($1, $2)";
    await pool.query(enrollQuery, [studentId, courseId]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Unenroll from a course
app.delete("/api/unenroll", async (req, res) => {
  const { studentId, courseId } = req.body;

  try {
    const unenrollQuery =
      "DELETE FROM enrollment WHERE studentid = $1 AND courseid = $2";
    const result = await pool.query(unenrollQuery, [studentId, courseId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json({ success: true, message: "Unenrollment successful" });
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get tasks for a specific course for a specific student
app.get("/api/:studentId/:courseId/tasks", async (req, res) => {
  const studentId = req.params.studentId;
  const courseId = req.params.courseId;
  const query = `
    SELECT taskid, description, deadline, completionstatus
    FROM tasks
    WHERE courseid = $1 AND studentid = $2
    ORDER BY deadline;
  `;
  try {
    const { rows } = await pool.query(query, [courseId, studentId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a task for a specific course for a specific student
app.post("/api/:studentId/:courseId/tasks", async (req, res) => {
  const studentId = req.params.studentId;
  const courseId = req.params.courseId;
  const { description, deadline } = req.body;
  const query = `
    INSERT INTO tasks (description, deadline, completionstatus, courseid, studentid)
    VALUES ($1, $2, false, $3, $4)
    RETURNING *;
  `;
  try {
    const { rows } = await pool.query(query, [
      description,
      deadline,
      courseId,
      studentId,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mark a task as done
app.patch("/api/tasks/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  const query =
    "UPDATE tasks SET completionstatus = true WHERE taskid = $1 RETURNING *";
  try {
    const { rows } = await pool.query(query, [taskId]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Error marking task as done:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
