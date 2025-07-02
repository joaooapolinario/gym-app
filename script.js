document.addEventListener("DOMContentLoaded", () => {
    const CSV_URL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRULZD5E7cJ42W5eEbUivP9XR_qrfD58Cmr-sPJR01Y2-C5Yq-_9pGAHHxPSJc-zEyJrW3ZWegFCfWr/pub?gid=1800486219&single=true&output=csv";
    const workoutDetailsContainer = document.getElementById("workout-details");
    const dayTabs = document.querySelectorAll(".day-tab");
    let workoutData = {};
    let workoutProgress = {};

    function showMessage(message, isLoading = false) {
        let iconHtml = "";
        if (isLoading) {
            iconHtml = `
                        <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992a8.25 8.25 0 01-11.667 0c0 0 0 0 0 0z" />
                        </svg>`;
        }
        workoutDetailsContainer.innerHTML = `
                    <div class="message-container">
                        ${iconHtml}
                        <p>${message}</p>
                    </div>`;
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem("workoutProgress");
        workoutProgress = savedProgress ? JSON.parse(savedProgress) : {};
    }

    function saveProgress() {
        localStorage.setItem("workoutProgress", JSON.stringify(workoutProgress));
    }

    function parseCSV(csvText) {
        const data = {};
        const lines = csvText.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
                .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                .map((field) => field.replace(/"/g, "").trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            const day = row["Dia"];
            if (!day) continue;

            const workoutName = row["Grupo Muscular"];
            const exercise = {
                name: row["Exercício"],
                series: row["Séries"],
                reps: row["Reps"],
                obs: row["Observações"],
            };

            if (!data[day]) {
                data[day] = { name: workoutName, exercises: [] };
            }
            if (exercise.name) {
                data[day].exercises.push(exercise);
            }
        }
        return data;
    }

    function displayWorkout(day) {
        const data = workoutData[day];

        workoutDetailsContainer.innerHTML = "";
        workoutDetailsContainer.style.justifyContent = "flex-start";

        dayTabs.forEach((tab) => {
            tab.classList.toggle(
                "active",
                tab.dataset.day.toLowerCase() === day.toLocaleLowerCase()
            );
        });

        let contentHTML = `
                    <h2>${day}</h2>
                    <p class="workout-name">${data.name}</p>
                `;

        if (data.exercises.length > 0) {
            contentHTML += `
                        <div class="workout-table-wrapper">
                            <table class="workout-table">
                                <thead>
                                    <tr>
                                        <th>Exercício</th>
                                        <th class="text-center">Séries</th>
                                        <th class="text-center">Reps</th>
                                        <th>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            data.exercises.forEach((ex) => {
                const exerciseId = `${day.replace(/\s+/g, "-")}-${ex.name.replace(
                    /\s+/g,
                    "-"
                )}`;
                const progress = workoutProgress[exerciseId] || {
                    completed: false,
                    weights: [],
                };
                const seriesCount = parseInt(ex.series, 10) || 0;

                let weightsInputsHTML = "";
                if (seriesCount > 0) {
                    for (let i = 0; i < seriesCount; i++) {
                        weightsInputsHTML += `
                                    <div class="weight-input-group">
                                        <label for="weights-${exerciseId}-${i}">Série ${i + 1
                            }</label>
                                        <input type="text" id="weights-${exerciseId}-${i}" class="weights-input" data-exercise-id="${exerciseId}" data-series-index="${i}" value="${(Array.isArray(progress.weights) && progress.weights[i]) || ""
                            }" placeholder="kg">
                                    </div>
                                `;
                    }
                } else {
                    weightsInputsHTML = `
                                <div class="weight-input-group" style="flex-grow: 1;">
                                    <label for="weights-${exerciseId}-0">Anotação:</label>
                                    <input type="text" id="weights-${exerciseId}-0" class="weights-input" data-exercise-id="${exerciseId}" data-series-index="0" value="${(Array.isArray(progress.weights) && progress.weights[0]) || ""
                        }" placeholder="Ex: 30 min" style="width: 100%;">
                                </div>
                            `;
                }

                contentHTML += `
                            <tr class="exercise-row ${progress.completed ? "completed" : ""
                    }" data-exercise-id="${exerciseId}">
                                <td>
                                    <input type="checkbox" class="completion-checkbox" data-exercise-id="${exerciseId}" ${progress.completed ? "checked" : ""
                    }>
                                    <span class="exercise-name">${ex.name
                    }</span>
                                </td>
                                <td class="text-center">${ex.series || "---"
                    }</td>
                                <td class="text-center">${ex.reps || "---"}</td>
                                <td class="obs-cell">${ex.obs || "---"}</td>
                            </tr>
                            <tr class="weights-row" data-weights-for="${exerciseId}">
                                <td colspan="4" class="weights-cell">
                                    <div class="weights-container">
                                        ${weightsInputsHTML}
                                    </div>
                                </td>
                            </tr>`;
            });

            contentHTML += `
                                </tbody>
                            </table>
                        </div>`;
        } else {
            workoutDetailsContainer.style.justifyContent = "center";
            contentHTML += `
                        <div class="message-container">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color: #34d399;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Aproveite para recarregar as energias!</p>
                        </div>`;
        }

        workoutDetailsContainer.innerHTML = contentHTML;
    }

    /**
     * Inicializa o aplicativo, carregando os dados do treino e configurando eventos.
     */
    async function initializeApp() {
        loadProgress();
        showMessage("Carregando treino...", true);
        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const csvText = await response.text();
            workoutData = parseCSV(csvText);

            dayTabs.forEach((tab) => {
                tab.addEventListener("click", () => {
                    displayWorkout(tab.dataset.day);
                });
            });

            workoutDetailsContainer.addEventListener("click", (event) => {
                const exerciseRow = event.target.closest(".exercise-row");
                if (!exerciseRow) return;

                const exerciseId = exerciseRow.dataset.exerciseId;

                if (event.target.type === "checkbox") {
                    const isCompleted = event.target.checked;
                    exerciseRow.classList.toggle("completed", isCompleted);
                    if (!workoutProgress[exerciseId]) workoutProgress[exerciseId] = {};
                    workoutProgress[exerciseId].completed = isCompleted;
                    saveProgress();
                    return;
                }

                const weightsRow = workoutDetailsContainer.querySelector(
                    `tr[data-weights-for="${exerciseId}"]`
                );
                if (weightsRow) {
                    weightsRow.classList.toggle("visible");
                }
            });

            workoutDetailsContainer.addEventListener("input", (event) => {
                if (event.target.classList.contains("weights-input")) {
                    const target = event.target;
                    const exerciseId = target.dataset.exerciseId;
                    const seriesIndex = parseInt(target.dataset.seriesIndex, 10);

                    if (!workoutProgress[exerciseId]) {
                        workoutProgress[exerciseId] = { completed: false, weights: [] };
                    }

                    if (!Array.isArray(workoutProgress[exerciseId].weights)) {
                        workoutProgress[exerciseId].weights = [];
                    }

                    workoutProgress[exerciseId].weights[seriesIndex] = target.value;

                    saveProgress();
                }
            });

            const today = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
            const dayToDisplay =
                Object.keys(workoutData).find(
                    (d) => d.toLowerCase() === today.toLowerCase()
                ) || "Segunda";
            displayWorkout(dayToDisplay);
        } catch (error) {
            console.error("Falha ao carregar os dados do treino:", error);
            showMessage(
                "Não foi possível carregar o treino. Tente novamente mais tarde."
            );
        }
    }

    initializeApp();
});
