// Access Firestore from window (defined in index.html)
const db = window.db;
const { collection, addDoc, getDocs, deleteDoc, doc } = window.firestoreFunctions;

const form = document.getElementById("workout-form");
const list = document.getElementById("workout-list");
const ctx = document.getElementById("weeklyChart").getContext("2d");

const workoutCollection = collection(db, "workouts");

// 🟢 Add workout to Firestore
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;
  const duration = +document.getElementById("duration").value;
  const weight = +document.getElementById("weight").value;
  const notes = document.getElementById("notes").value;

  try {
    await addDoc(workoutCollection, { type, date, duration, weight, notes });
    form.reset();
    loadWorkouts(); // reload after adding
  } catch (err) {
    alert("Error saving workout: " + err.message);
  }
});

// 🟡 Load and render workouts from Firestore
async function loadWorkouts() {
  const snapshot = await getDocs(workoutCollection);
  const workouts = [];
  snapshot.forEach((docSnap) => {
    workouts.push({ id: docSnap.id, ...docSnap.data() });
  });

  renderWorkouts(workouts);
  renderChart(workouts);
}

// 🔴 Delete workout from Firestore
async function deleteWorkout(id) {
  await deleteDoc(doc(db, "workouts", id));
  loadWorkouts();
}

// 🟢 Render workouts on the page
function renderWorkouts(workouts) {
  list.innerHTML = "";
  workouts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((w) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${w.type}</strong> (${w.date})<br>
        Duration: ${w.duration} min, Weight: ${w.weight} kg<br>
        <em>${w.notes || ""}</em><br>
        <button onclick="deleteWorkout('${w.id}')">Delete</button>
      `;
      list.appendChild(li);
    });
}

// 🧮 Generate weekly chart
function renderChart(workouts) {
  const summary = getWeeklySummary(workouts);
  const labels = Object.keys(summary).sort();
  const durations = labels.map((d) => summary[d].duration);
  const weights = labels.map((d) => summary[d].weight);

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
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
        title: { display: true, text: "Weekly Workout Summary" },
        legend: { position: "top" },
      },
    },
  });
}

function getWeekStart(date) {
  const d = new Date(date);
  const diff = d.getDate() - d.getDay(); // start of the week (Sunday)
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split("T")[0];
}

function getWeeklySummary(workouts) {
  const summary = {};
  workouts.forEach((w) => {
    const weekStart = getWeekStart(w.date);
    if (!summary[weekStart]) {
      summary[weekStart] = { duration: 0, weight: 0 };
    }
    summary[weekStart].duration += w.duration;
