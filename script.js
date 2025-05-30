const form = document.getElementById("workout-form");
const list = document.getElementById("workout-list");
const ctx = document.getElementById("weeklyChart").getContext("2d");

// Load workouts from localStorage or use dummy data
let workouts = JSON.parse(localStorage.getItem("workouts")) || getDummyData();

function getDummyData() {
  const today = new Date();
  const daysAgo = (d) => {
    const date = new Date();
    date.setDate(today.getDate() - d);
    return date.toISOString().split("T")[0];
  };

  return [
    { type: "Deadlift", date: daysAgo(1), duration: 45, weight: 100, notes: "Felt strong" },
    { type: "Bench Press", date: daysAgo(2), duration: 30, weight: 60, notes: "" },
    { type: "Squat", date: daysAgo(3), duration: 40, weight: 80, notes: "" },
    { type: "Pull-ups", date: daysAgo(4), duration: 20, weight: 0, notes: "Bodyweight only" },
    { type: "Deadlift", date: daysAgo(6), duration: 50, weight: 110, notes: "PR!" },
    { type: "Squat", date: daysAgo(7), duration: 40, weight: 85, notes: "" },
    { type: "Pushups", date: daysAgo(9), duration: 20, weight: 0, notes: "" },
    { type: "Deadlift", date: daysAgo(10), duration: 40, weight: 105, notes: "" },
    { type: "Bench Press", date: daysAgo(13), duration: 30, weight: 65, notes: "" },
  ];
}

function saveWorkouts() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
}

function renderWorkouts() {
  list.innerHTML = "";
  workouts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((w, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${w.type}</strong> (${w.date})<br>
        Duration: ${w.duration} min, Weight: ${w.weight} kg<br>
        <em>${w.notes}</em><br>
        <button onclick="deleteWorkout(${index})">Delete</button>
      `;
      list.appendChild(li);
    });
}

function deleteWorkout(index) {
  workouts.splice(index, 1);
  saveWorkouts();
  renderWorkouts();
  renderChart();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;
  const duration = +document.getElementById("duration").value;
  const weight = +document.getElementById("weight").value;
  const notes = document.getElementById("notes").value;

  workouts.push({ type, date, duration, weight, notes });
  saveWorkouts();
  renderWorkouts();
  renderChart();
  form.reset();
});

function getWeeklySummary() {
  const summary = {};
  workouts.forEach((w) => {
    const weekStart = getWeekStart(new Date(w.date));
    if (!summary[weekStart]) {
      summary[weekStart] = { duration: 0, weight: 0 };
    }
    summary[weekStart].duration += w.duration;
    summary[weekStart].weight += w.weight;
  });
  return summary;
}

function getWeekStart(date) {
  const d = new Date(date);
  const diff = d.getDate() - d.getDay();
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split("T")[0];
}

let chart;
function renderChart() {
  const summary = getWeeklySummary();
  const labels = Object.keys(summary).sort();
  const durations = labels.map((d) => summary[d].duration);
  const weights = labels.map((d) => summary[d].weight);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total Duration (min)",
          data: durations,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "Total Weight (kg)",
          data: weights,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Weekly Workout Summary" },
      },
    },
  });
}

// INITIALIZE
renderWorkouts();
renderChart();
