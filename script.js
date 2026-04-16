let options = [];
let criteria = [];
let chartInstance = null;
const negativeCriteria = ["Time Required", "Cost", "Difficulty"];

//  Default weights 
const defaultWeights = {
  "Importance": 5,
  "Interest": 4,
  "Difficulty": 3,
  "Time Required": 3,
  "Cost": 2,
};

// ---------------- OPTIONS ----------------

function addOption() {
  let input = document.getElementById("optionInput");
  let value = input.value.trim();

  if (value === "") return;

  options.push(value);
  localStorage.setItem("options",JSON.stringify(options));
  input.value = "";
  displayOptions();
  generateScoring();
}

function displayOptions() {
  let list = document.getElementById("optionsList");
  list.innerHTML = "";

  options.forEach((opt, index) => {
    let li = document.createElement("li");
    li.innerHTML = `
            ${opt}
            <button onclick="deleteOption(${index})">❌</button>
        `;
    list.appendChild(li);
  });
}

function deleteOption(index) {
  options.splice(index, 1);
  displayOptions();
  generateScoring();
  localStorage.setItem("options",JSON.stringify(options));
}

// ---------------- CRITERIA ----------------

function addCriteria() {
  let name = document.getElementById("criteriaSelect").value;

  if (name === "") {
    alert("Select a criteria!");
    return;
  }

  // prevent duplicates

  if (criteria.some((c) => c.name === name)) {
    alert("Already added!");
    return;
  }

  let weight = defaultWeights[name];

  criteria.push({ name, weight });
  localStorage.setItem("criteria",JSON.stringify(criteria));

  displayCriteria();
}

function displayCriteria() {
  let list = document.getElementById("criteriaList");
  list.innerHTML = "";

  criteria.forEach((c, index) => {
    let li = document.createElement("li");
    li.innerHTML = `
            ${c.name}                     
             <button onclick="deleteCriteria(${index})">❌</button>
        `;
    list.appendChild(li);
  });

  generateScoring();
}

function deleteCriteria(index) {
  criteria.splice(index, 1);
  displayCriteria();
  localStorage.setItem("criteria",JSON.stringify(criteria));
}

// ---------------- SCORING ----------------

function generateScoring() {
  let container = document.getElementById("scoringSection");
  container.innerHTML = "";

  options.forEach((opt, i) => {
    let div = document.createElement("div");
    div.innerHTML = `<h3>${opt}</h3>`;

    criteria.forEach((c, j) => {
      let input = document.createElement("input");
      // input.type = "number";
      let select = document.createElement("select");
      select.id = `score-${i}-${j}`;

    select.innerHTML = `
    <option value="">Rate ${c.name}</option>
    <option value="5">High</option>
    <option value="3">Medium</option>
    <option value="1">Low</option>
    `;
    select.onchange = calculateResult;

      select.onchange = calculateResult;

      div.appendChild(select);
      input.placeholder = `${c.name} (1-5)`;
      input.id = `score-${i}-${j}`;
    //   div.appendChild(input)
    });

    container.appendChild(div);
  });
}

// ---------------- CALCULATION ----------------

function calculateResult() {
    if (options.length === 0 || criteria.length === 0) return;

    let scores = [];
    let resultText = "";

    options.forEach((opt, i) => {
        let total = 0;
        let missing = false;

        criteria.forEach((c, j) => {
            let value = document.getElementById(`score-${i}-${j}`).value;

            if (value === "") {
               missing = true;
               value = 0;
            }

            let scoreValue = Number(value);
            if (negativeCriteria.includes(c.name)) {
              if (scoreValue === 5) scoreValue = 1;
              else if (scoreValue === 1) scoreValue = 5;
            }
            
            total += scoreValue * c.weight;
        });

        scores.push({ option: opt, score: total });
    });

    // breakdown text

    scores.sort((a, b) => b.score - a.score);

// ranked result

    scores.forEach((s, index) => {
    resultText += `${index + 1}. ${s.option}: ${s.score}\n`;
});

    // Find max score

    let maxScore = scores[0].score;

    let winners = scores.filter(s => s.score === maxScore);

    // Handle tie
    
    if (winners.length > 1) {
        document.getElementById("result").innerText =
            `Tie between: ${winners.map(w => w.option).join(", ")} (Score: ${maxScore})\n\nAll Scores:\n${resultText}`;
    } else {
        document.getElementById("result").innerText =
            `Best Decision: ${winners[0].option} (Score: ${maxScore})\n\nAll Scores:\n${resultText}`;

            saveToHistory(scores,winners[0]);
    }

    //Prepare data for chart

let labels = scores.map(s => s.option);
let data = scores.map(s => s.score);

// Destroy old chart if exists

if (chartInstance) {
    chartInstance.destroy();
}

// Create new chart

let ctx = document.getElementById("resultChart").getContext("2d");

chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
        labels: labels,
        datasets: [{
            label: "Scores",
            data: data
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
}

// reset logic

function resetAll() {
    options = [];
    criteria = [];

    document.getElementById("optionsList").innerHTML = "";
    document.getElementById("criteriaList").innerHTML = "";
    document.getElementById("scoringSection").innerHTML = "";
    document.getElementById("result").innerText = "";

    localStorage.removeItem("options");
    localStorage.removeItem("criteria");
}

// save history

function saveToHistory(scores, winner) {
    let history = JSON.parse(localStorage.getItem("decisionHistory")) || [];

    let entry = {
        date: new Date().toLocaleString(),
        winner: winner.option,
        score: winner.score,
        allScores: scores
    };

    history.push(entry);

    if (history.length > 5) {
      history = history.slice(-5);
    }

    localStorage.setItem("decisionHistory", JSON.stringify(history));

    displayHistory();
}

function displayHistory() {
    let history = JSON.parse(localStorage.getItem("decisionHistory")) || [];

    let list = document.getElementById("historyList");
    list.innerHTML = "";

    [...history].reverse().forEach(item => {
        let li = document.createElement("li");

        li.innerHTML = `
            <strong>${item.winner}</strong> (${item.score}) <br>
            <small>${item.date}</small>
        `;

        list.appendChild(li);
    });
}

// load history on page load

window.onload = function (){

  // load options

  let savedOptions = JSON.parse(localStorage.getItem("options"));
  if (savedOptions) {
    options = savedOptions;
    displayOptions();
  }

  // load criteria

  let savedCriteria = JSON.parse(localStorage.getItem("criteria"));
  if(savedCriteria){
    criteria = savedCriteria;
    displayCriteria();
  }

  //load history
  
  displayHistory();
};

// clear history

function clearHistory(){

  localStorage.removeItem("decisionHistory");

  document.getElementById("historyList").innerHTML = "";
}