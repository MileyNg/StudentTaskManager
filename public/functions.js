document.addEventListener("DOMContentLoaded", function () {
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");

  taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
      addTaskToList(taskText);
      // Send task to server (you can use fetch or other methods here)
      fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: taskText,
          // You might add other properties like deadline and completionstatus here
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Task added:", data))
        .catch((error) => console.error("Error adding task:", error));
      taskInput.value = "";
    }
  });

  function addTaskToList(taskText) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = taskText;
    taskList.appendChild(li);
  }
});
