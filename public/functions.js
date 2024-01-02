document.addEventListener("DOMContentLoaded", function () {
  const coursesList = document.getElementById("coursesList");
  const tasksList = document.getElementById("tasksList");
  const enrollInput = document.getElementById("enrollInput");
  const enrollButton = document.getElementById("enrollButton");
  const enrolledCoursesDropdown = document.getElementById("enrolledCourses");

  // Change the studentId to impersonate a specific student
  const studentId = 1;

  // Fetch and display courses
  fetch(`/api/courses/${studentId}`)
    .then((response) => response.json())
    .then((courses) => {
      coursesList.innerHTML = "<h2 class='mb-4'>Available Courses</h2>";
      courses.forEach((course) => {
        const courseItem = document.createElement("div");
        courseItem.innerHTML = `<p>${course.title} - ${course.instructor} ${
          course.enrolled ? "(Enrolled)" : ""
        }</p>`;
        coursesList.appendChild(courseItem);
      });
      enrolledCoursesDropdown.innerHTML =
        "<option value=''>Select a course</option>";
      courses.forEach((course) => {
        if (course.enrolled) {
          const option = document.createElement("option");
          option.value = course.courseid;
          option.text = `${course.title} - ${course.instructor}`;
          enrolledCoursesDropdown.appendChild(option);
        }
      });
    })
    .catch((error) => console.error("Error fetching courses:", error));

  // dropdown for enrolled courses
  enrolledCoursesDropdown.addEventListener("change", () => {
    const selectedCourseId = enrolledCoursesDropdown.value;
    if (selectedCourseId) {
      fetchTasks(selectedCourseId);
    } else {
      tasksList.innerHTML = "";
    }
  });

  // Enroll in a course using a course code
  enrollButton.addEventListener("click", () => {
    const courseCode = enrollInput.value;
    enrollInCourseByCode(studentId, courseCode);
  });

  function enrollInCourseByCode(studentId, courseCode) {
    fetch("/api/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        courseCode,
      }),
    })
      .then((response) => {
        if (response.ok) {
          alert(`Enrolled in course with code ${courseCode}`);
          // Refresh the course list after enrolling
          location.reload();
        } else {
          return response.json();
        }
      })
      .then((data) => {
        if (data && data.error) {
          alert(`Error: ${data.error}`);
        }
      })
      .catch((error) => console.error("Error enrolling in course:", error));
  }

  function fetchTasks(courseId) {
    // Fetch tasks for the selected course
    fetch(`/api/tasks/${courseId}`)
      .then((response) => response.json())
      .then((tasks) => {
        tasksList.innerHTML = `<h3 class='mt-4'>Tasks for Course ${courseId}</h3>`;
        tasks.forEach((task) => {
          const taskItem = document.createElement("div");
          var deadline = new Date(task.deadline).toISOString().split('T')[0];
          if (!task.completionstatus) {
            taskItem.innerHTML = `<p>${task.description} - Deadline: ${deadline}</p>`;
            const markDoneBtn = document.createElement("button");
            markDoneBtn.textContent = "Mark Done";
            markDoneBtn.addEventListener("click", () =>
              markTaskAsDone(task.taskid)
            );
            taskItem.appendChild(markDoneBtn);
          } else {
            taskItem.innerHTML = `<p>${task.description} - Deadline: ${deadline} ✅</p>`;
          }
          tasksList.appendChild(taskItem);
        });
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }

  function markTaskAsDone(taskId) {
    // Mark the task as done
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then((task) => {
        alert(`Task "${task.description}" marked as done.`);
        fetchTasks(task.courseid);
      })
      .catch((error) => console.error("Error marking task as done:", error));
  }

  const addTaskForm = document.getElementById("addTaskForm");
  addTaskForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const selectedCourseId = enrolledCoursesDropdown.value;
    if (!selectedCourseId) {
      alert("Please select a course before adding a task.");
      return;
    }

    // Get task details from the form
    const taskDescription = document.getElementById("taskDescription").value;
    const taskDeadline = document.getElementById("taskDeadline").value;

    // Send a request to add the task
    addTask(selectedCourseId, taskDescription, taskDeadline);
  });

  function addTask(courseId, description, deadline) {
    fetch(`/api/tasks/${courseId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        deadline,
      }),
    })
      .then((response) => response.json())
      .then((task) => {
        alert(`Task added: ${task.description}`);
        // Refresh the tasks list
        fetchTasks(courseId);
      })
      .catch((error) => console.error("Error adding task:", error));
  }
});
