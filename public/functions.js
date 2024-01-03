// StudentId to impersonate a specific student
const studentId = 1;

document.addEventListener("DOMContentLoaded", function () {
  const coursesList = document.getElementById("coursesList");
  const tasksList = document.getElementById("tasksList");
  const enrollInput = document.getElementById("enrollInput");
  const enrollButton = document.getElementById("enrollButton");
  const enrolledCoursesDropdown = document.getElementById("enrolledCourses");

  // Fetch and display courses
  fetch(`/api/${studentId}/courses`)
    .then((response) => response.json())
    .then((courses) => {
      coursesList.innerHTML = "<h2 class='mb-4'>Available Courses</h";
      enrolledCoursesDropdown.innerHTML =
        "<option value=''>Select a course</option>";
      courses.forEach((course) => {
        const courseItem = document.createElement("div");
        courseItem.classList.add("course-item");
        let courseHTML = `<p>${course.title} - ${course.instructor}`;
        if (course.enrolled) {
          courseHTML += " (Enrolled)";
          courseHTML += ` <button class='btn btn-danger btn-sm' onclick='window.unenrollFromCourse(${course.courseid})'> X </button>`;
          const option = document.createElement("option");
          option.value = course.courseid;
          option.text = `${course.title} - ${course.instructor}`;
          enrolledCoursesDropdown.appendChild(option);
        }
        courseHTML += "</p>";
        courseItem.innerHTML = courseHTML;
        coursesList.appendChild(courseItem);
      });
    })
    .catch((error) => console.error("Error fetching courses:", error));

  // Dopdown for enrolled courses
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
        if (!response.ok) {
          throw new Error("Response not OK");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.error) {
          alert(`Error: ${data.error}`);
        } else {
          alert(`Enrolled in course with code ${courseCode}`);
          location.reload();
        }
      })
      .catch((error) => {
        console.error("Error enrolling in course:", error);
        alert(`Error enrolling in course: ${error.message}`);
      });
  }

  // Fetch and display tasks
  function fetchTasks(courseId) {
    // Fetch tasks for the selected course
    fetch(`/api/${studentId}/${courseId}/tasks`)
      .then((response) => response.json())
      .then((tasks) => {
        tasksList.innerHTML = `<h3 class='mt-4'>Tasks for Course</h3>`;
        tasks.forEach((task) => {
          const taskItem = document.createElement("div");
          const deadline = new Date(task.deadline).toISOString().split("T")[0];
          taskItem.innerHTML = `</br><p>${
            task.description
          } - Deadline: ${deadline}${task.completionstatus ? " ✅" : ""}`;

          // If the task is not completed, offer a way to mark it as done
          if (!task.completionstatus) {
            const markDoneBtn = document.createElement("button");
            markDoneBtn.textContent = "Done";
            markDoneBtn.classList.add("btn", "btn-success", "btn-sm", "mr-2");
            markDoneBtn.addEventListener("click", () =>
              markTaskAsDone(task.taskid)
            );
            taskItem.appendChild(markDoneBtn);
          }
          // Delete button for specific task
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.classList.add("btn", "btn-danger", "btn-sm");
          deleteBtn.onclick = () => deleteTask(task.taskid);
          taskItem.appendChild(deleteBtn);

          tasksList.appendChild(taskItem);
        });
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }

  // Delete a task
  function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          alert("Task deleted successfully!");
          const selectedCourseId = enrolledCoursesDropdown.value;
          if (selectedCourseId) {
            fetchTasks(selectedCourseId);
          }
        } else {
          return response.json().then((data) => {
            throw new Error(data.error || "Failed to delete the task.");
          });
        }
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
        alert(`Error deleting task: ${error.message}`);
      });
  }

  // Call fetchTasks() initially to render the tasks for the selected course
  const selectedCourseId = enrolledCoursesDropdown.value;
  if (selectedCourseId) {
    fetchTasks(selectedCourseId);
  }

  // Mark the task as done
  function markTaskAsDone(taskId) {
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then((task) => {
        alert(`Task "${task.description}" marked as done.`);

        // Get the selected course ID from the dropdown to refresh the tasks
        const selectedCourseId = enrolledCoursesDropdown.value;
        if (selectedCourseId) {
          fetchTasks(selectedCourseId);
        }
      })
      .catch((error) => {
        console.error("Error marking task as done:", error);
        alert(`Error marking task as done: ${error.message}`);
      });
  }

  const addTaskForm = document.getElementById("addTaskForm");
  addTaskForm.addEventListener("submit", function (event) {
    event.preventDefault(); 

    const selectedCourseId = enrolledCoursesDropdown.value;
    if (!selectedCourseId) {
      alert("Please select a course before adding a task.");
      return;
    }

    // Get task details from the form
    const taskDescription = document.getElementById("taskDescription").value;
    const taskDeadline = document.getElementById("taskDeadline").value;
    addTask(selectedCourseId, taskDescription, taskDeadline);
  });

  function addTask(courseId, description, deadline) {
    fetch(`/api/${studentId}/${courseId}/tasks`, {
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
        fetchTasks(courseId);
      })
      .catch((error) => console.error("Error adding task:", error));
  }
});

window.unenrollFromCourse = function (courseId) {
  if (!confirm("Are you sure you want to unenroll from this course?")) {
    return;
  }

  fetch(`/api/unenroll`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studentId,
      courseId,
    }),
  })
    .then((response) => {
      if (response.ok) {
        alert("Unenrolled successfully!");
        location.reload(); 
      } else {
        return response.json().then((data) => {
          throw new Error(data.error || "Failed to unenroll from the course.");
        });
      }
    })
    .catch((error) => {
      console.error("Error unenrolling from course:", error);
      alert("Error unenrolling from course.");
    });
};
