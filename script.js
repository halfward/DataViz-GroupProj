// Start Screen
// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
    window.onload = function() {
        const startScreen = document.getElementById('start-screen');
        const dontShowAgainCheckbox = document.getElementById('dont-show-again');
        
        // Check if the user previously selected "Don't show again"
        if (localStorage.getItem('dontShowStartScreen') === 'true') {
            startScreen.classList.add('hidden');
        }

        // Check if the start-button exists and log it
        const startButton = document.getElementById('start-button');
        if (startButton) {
            console.log('Start button exists!');
        } else {
            console.log('Start button not found!');
        }

        // Add click event listener to the "Start Quiz" button
        startButton.addEventListener('click', function() {
            console.log('Start button clicked!');
            
            // If the checkbox is checked, save the preference to localStorage
            if (dontShowAgainCheckbox.checked) {
                localStorage.setItem('dontShowStartScreen', 'true');
            }
            
            // Hide the start screen when the button is clicked
            startScreen.classList.add('hidden');
        });
    };
});



// Tab Logic
// Get buttons and screen elements
const playButton = document.getElementById('play-button');
const modesButton = document.getElementById('modes-button');
const statsButton = document.getElementById('stats-button');
const screen1 = document.getElementById('screen-1');
const screen2 = document.getElementById('screen-2');
const screen3 = document.getElementById('screen-3');

// Add event listeners to the buttons
playButton.addEventListener('click', () => {
    screen1.style.display = 'block';
    screen2.style.display = 'none';
    screen3.style.display = 'none';
    
    // Add 'active' class to the clicked button and remove from others
    playButton.classList.add('active');
    modesButton.classList.remove('active');
    statsButton.classList.remove('active');
});

modesButton.addEventListener('click', () => {
    screen1.style.display = 'none';
    screen2.style.display = 'grid';
    screen3.style.display = 'none';
    
    // Add 'active' class to the clicked button and remove from others
    modesButton.classList.add('active');
    playButton.classList.remove('active');
    statsButton.classList.remove('active');
});

statsButton.addEventListener('click', () => {
    screen1.style.display = 'none';
    screen2.style.display = 'none';
    screen3.style.display = 'block';
    
    // Add 'active' class to the clicked button and remove from others
    statsButton.classList.add('active');
    playButton.classList.remove('active');
    modesButton.classList.remove('active');
});

// Default: Show the first screen and set the active button
screen1.style.display = 'block';
screen2.style.display = 'none';
screen3.style.display = 'none';
playButton.classList.add('active');  // Set the initial active button












// Quiz Logic Part 1------------------------------------------------------
const API_KEY = '3be2bc8a9d8fab379812442e317a4a99'; 
let currentStage = 1;
let currentMovie = null;
let genreList = [];
let correctGenreGuessed = false;
let correctYearGuessed = false;
let originalImageUrl = ''; 

// Fetch genre list from TMDB
async function fetchGenres() {
    const genreUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`;
    const response = await fetch(genreUrl);
    const data = await response.json();
    genreList = data.genres;
}

// Fetch the top 2000 movies sorted by rating and filtered by popularity
async function getTop2000RatedPopularMovies() {
    let topRatedPopularMovies = [];
    let page = 1;
    const maxPages = 100; // 2000 movies / 20 per page = 100 pages

    while (page <= maxPages) {
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=vote_average.desc&vote_count.gte=500&with_watch_monetization_types=flatrate&page=${page}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results) {
            topRatedPopularMovies = [...topRatedPopularMovies, ...data.results]; 
        }

        page++;
    }

    return topRatedPopularMovies;
}

// Function to get a random movie from the top 2000 rated and popular movies
async function getRandomTopRatedPopularMovie() {
    const topRatedPopularMovies = await getTop2000RatedPopularMovies();
    return topRatedPopularMovies[Math.floor(Math.random() * topRatedPopularMovies.length)];
}


// Function for the movie info and the blurred overlay
async function updateMovieInfo() {
    if (genreList.length === 0) {
        await fetchGenres();
    }

    const movie = await getRandomTopRatedPopularMovie();
    if (!movie) {
        alert("Failed to load movie data. Please try again.");
        return;
    }
    currentMovie = movie;

    const movieImagesUrl = `https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${API_KEY}`;
    const imagesResponse = await fetch(movieImagesUrl);
    const imagesData = await imagesResponse.json();

    // Try to find a suitable backdrop image
    let movieStill = imagesData.backdrops.find(
        image => image.aspect_ratio > 1.7 && image.vote_count > 5
    );

    if (movieStill) {
        // Store the original backdrop URL
        originalImageUrl = `https://image.tmdb.org/t/p/original${movieStill.file_path}`;

        // Show the image
        const backdropHTML = `<img src="https://image.tmdb.org/t/p/w780${movieStill.file_path}" alt="${movie.title} Still" id="movie-backdrop" />`;
        document.getElementById('movie-info').innerHTML = backdropHTML;

        // Set initial blur effect on the overlay
        const overlay = document.getElementById('overlay');
        overlay.style.filter = 'blur(15px)'; 
        updateChoicesForGenre();
    } else {
        updateMovieInfo();
    }
}






// Quiz Logic Part 2------------------------------------------------------
// Declare correctGenre in a higher scope
let correctGenre;

function updateChoicesForGenre() {
    if (currentStage === 1) {
        if (currentMovie && currentMovie.genre_ids && Array.isArray(currentMovie.genre_ids)) {
            // Map the genre IDs from the movie to their corresponding names
            const genreNames = currentMovie.genre_ids.map(genreId => {
                const genre = genreList.find(g => g.id === genreId);
                return genre ? genre.name : 'Unknown Genre';
            });

            correctGenre = genreNames[0]; // Assign correct genre to the global variable
            console.log('Correct Genre:', correctGenre);

            // Now we need to shuffle and create the choices for genre
            const shuffledGenres = genreList
                .filter(genre => genreNames.indexOf(genre.name) === -1) // Exclude the correct genre
                .sort(() => 0.5 - Math.random())
                .slice(0, 3); // Get 3 other random genres

            // Include the correct genre and shuffle the final list
            const allGenres = [correctGenre, ...shuffledGenres.map(genre => genre.name)];
            const genreChoices = allGenres.sort(() => 0.5 - Math.random()).map(
                genre => `<button onclick="checkAnswer(this, '${genre}')">${genre}</button>`
            ).join('');

            document.getElementById('choices').innerHTML = genreChoices;
        } else {
            console.log('Genres are missing or incorrectly formatted');
        }
    }
}


let correctYear;  // Declare correctYear globally

function updateChoicesForDecade() {
    // Extract the correct year
    correctYear = currentMovie.release_date.split('-')[0];  // Update the global correctYear variable
    const correctDecade = `${Math.floor(correctYear / 10) * 10}s`;  // Calculate the correct decade

    // Predefined list of decades
    const allDecades = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

    // Filter to avoid duplicates and select 3 random other decades
    const randomDecades = allDecades.filter(decade => decade !== correctDecade).sort(() => 0.5 - Math.random()).slice(0, 3);

    // Combine and shuffle
    const decades = [correctDecade, ...randomDecades].sort(() => 0.5 - Math.random());

    // Map to buttons
    const decadeChoices = decades.map(
        decade => `<button onclick="checkAnswer(this, '${decade}')">${decade}</button>`
    ).join('');

    // Update DOM
    const choicesElement = document.getElementById('choices');
    if (choicesElement) {
        choicesElement.innerHTML = decadeChoices;
    } else {
        console.error('Element with ID #choices not found');
    }

    console.log('Correct Decade:', correctDecade);
}



// Adjusted for movie titles containing single-quotes
async function updateChoicesForTitle() {
    const topMovies = await getTop2000RatedPopularMovies();

    const otherMovies = topMovies.filter(movie => movie.id !== currentMovie.id);
    const randomOtherMovies = otherMovies.sort(() => 0.5 - Math.random()).slice(0, 3);

    const titleChoices = [currentMovie.title, ...randomOtherMovies.map(movie => movie.title)];
    const shuffledTitleChoices = titleChoices.sort(() => 0.5 - Math.random());

    const titleButtons = shuffledTitleChoices.map(
        title => {
            // Escape single quotes for safe use in the onclick attribute
            const escapedTitle = title.replace(/'/g, "\\'");
            return `<button onclick="checkAnswer(this, '${escapedTitle}')">${title}</button>`;
        }
    ).join('');

    document.getElementById('choices').innerHTML = titleButtons;
}


// Proceeding to the next stage
async function proceedToNextStage() {
    currentStage++;
    if (currentStage === 2) {
        document.getElementById('stage-instruction').innerText = 'Stage 2: Guess the year!';
        updateChoicesForDecade();
    } else if (currentStage === 3) {
        document.getElementById('stage-instruction').innerText = 'Final Stage: Guess the movie!';
        updateChoicesForTitle(); 
    } 
    console.log(`Current stage: ${currentStage}`);
}








// Resetting the Quiz
function resetQuiz() {
    // Add a 0.5-second delay before executing the reset logic
    setTimeout(() => {
        // Deactivate the 'start-reset-timer' button
        const startResetButton = document.getElementById('start-reset-timer');
        startResetButton.classList.remove('active'); // Deactivate the button

        // Only show the timer cover if the 'time-button' is active
        const timeButton = document.getElementById('time-button');
        const timerCover = document.getElementById('timer-cover');

        // Check if 'time-button' is active
        if (timeButton.classList.contains('active')) {
            timerCover.style.display = 'block'; // Show the timer cover
        } else {
            timerCover.style.display = 'none'; // Hide the timer cover if 'time-button' is not active
        }

        // Update movie info and choices for the first stage
        updateMovieInfo();
        updateChoicesForGenre();

        // Reset stage-related variables
        currentStage = 1;
        correctGenreGuessed = false;
        correctYearGuessed = false;

        // Reset instructions and feedback text
        document.getElementById('stage-instruction').innerText = 'Stage 1: Guess the genre!';
        document.getElementById('feedback-genre').innerText = 'Tip 1: Genre';
        document.getElementById('feedback-year').innerText = 'Tip 2: Year';

        // Reset the choices container
        document.getElementById('choices').innerHTML = '';

        // Reset any blur effects (optional)
        document.getElementById('overlay').style.filter = 'blur(10px)';

        // Reset feedback sections
        document.getElementById('feedback-genre').innerText = 'Tip 1: Genre';
        document.getElementById('feedback-year').innerText = 'Tip 2: Year';

        // Reset additional quiz state
        blurValue = 10;  // Optional: reset blur value to its starting state
        overlay.style.filter = 'blur(10px)';

        // Optionally, reset timer state or restart timer
        startTimer();  // Assuming you have a function to start the timer again

        console.log(`Reset to stage ${currentStage}`);
    }, 500); // 500 milliseconds (0.5 seconds) delay
}







// Global variables to track stage performance
let stage1Correct = 0;
let stage1Incorrect = 0;
let stage2Correct = 0;
let stage2Incorrect = 0;

function checkAnswer(button, selectedAnswer) {
    let isCorrect = false;
    let feedbackText = "";

    // Handle Stage 1: Genre
    if (currentStage === 1) {
        isCorrect = genreList.some(genre => genre.name === selectedAnswer && currentMovie.genre_ids.includes(genre.id));
        correctGenreGuessed = isCorrect;
        feedbackText = isCorrect ? `Tip 1: The genre is ${selectedAnswer}` : `Tip 1: The genre is NOT ${selectedAnswer}`;

        // Update the genre feedback
        const feedbackGenreDiv = document.getElementById('feedback-genre');
        feedbackGenreDiv.innerHTML = feedbackText;

        // Update stage1Correct or stage1Incorrect
        if (isCorrect) {
            stage1Correct++;
        } else {
            stage1Incorrect++;
        }
    } 
    // Handle Stage 2: Year
    else if (currentStage === 2) {
        const selectedDecade = selectedAnswer;
        const correctYear = currentMovie.release_date.split('-')[0];
        let correctDecade;
        
        // Determine the correct decade based on the release year
        if (correctYear >= 2020) {
            correctDecade = '2020s';
        } else if (correctYear >= 2010) {
            correctDecade = '2010s';
        } else {
            correctDecade = `${Math.floor(correctYear / 10) * 10}s`;
        }
    
        // Compare the selected decade to the correct decade
        isCorrect = selectedDecade === correctDecade;
        correctYearGuessed = isCorrect;
    
        // Provide feedback based on whether the selected decade is correct
        feedbackText = isCorrect 
            ? `Tip 2: It was released in the ${selectedDecade}` 
            : `Tip 2: It was NOT released in the ${selectedDecade}`;
    
        // Update the decade feedback
        const feedbackDecadeDiv = document.getElementById('feedback-year');
        if (feedbackDecadeDiv) {
            feedbackDecadeDiv.innerHTML = feedbackText;
        } else {
            console.error('Element with ID #feedback-year not found');
        }

        // Update stage2Correct or stage2Incorrect
        if (isCorrect) {
            stage2Correct++;
        } else {
            stage2Incorrect++;
        }
    }
    
    // Handle Stage 3: Movie Title (Final Stage)
    else if (currentStage === 3) {
        const quizFinishedMessages = [
            `Quiz Finished! The movie is "${currentMovie.title}"!<br>It's a ${correctGenre} movie released in ${correctYear}!`,
            `Congratulations! The movie was "${currentMovie.title}"!<br>It's a ${correctGenre} movie released in ${correctYear}!`,
            `Well done! The movie was "${currentMovie.title}"!<br>It's a ${correctGenre} movie released in ${correctYear}!`
        ];
    
        const incorrectMessages = [
            `Incorrect! The movie is "${currentMovie.title}".<br>It's a ${correctGenre} movie released in ${correctYear}.`,
            `Oops! The movie was "${currentMovie.title}".<br>It's a ${correctGenre} movie released in ${correctYear}.`,
            `Wrong guess! The movie is "${currentMovie.title}".<br>It's a ${correctGenre} movie released in ${correctYear}.`
        ];
    
        if (selectedAnswer === currentMovie.title) {
            isCorrect = true;
            feedbackText = quizFinishedMessages[Math.floor(Math.random() * quizFinishedMessages.length)];
        } else {
            isCorrect = false;
            feedbackText = incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
        }
    
        // Use innerHTML to ensure the <br> tags are rendered as line breaks
        document.getElementById('stage-instruction').innerHTML = feedbackText;
    
        // Show "Retry?" button
        document.getElementById('choices').innerHTML = `
            <button onclick="resetQuiz()">Retry?</button>
        `;
    
        // Optionally, pass isCorrect to finish the quiz
        finishQuiz(isCorrect);  // Assuming you have a function to handle stats or feedback
    }
    

    // Update button colors based on correctness
    button.style.backgroundColor = isCorrect ? '#ccfff2' : '#ffeaea';
    button.style.borderColor = isCorrect ? '#339999' : '#ea696c';
    button.style.color = isCorrect ? '#339999' : '#ea696c';

    // Update overlay blur effect based on stage and correctness
    const overlay = document.getElementById('overlay');
    if (currentStage === 3) {
        overlay.style.filter = 'blur(0px)'; // No blur in final stage
    } else if (currentStage === 1) {
        overlay.style.filter = isCorrect ? 'blur(10px)' : 'blur(15px)';
    } else if (currentStage === 2) {
        if (isCorrect) {
            overlay.style.filter = overlay.style.filter === 'blur(15px)' ? 'blur(10px)' : 'blur(7px)';
        } else {
            overlay.style.filter = overlay.style.filter || 'blur(15px)';
        }
    }

    // Proceed to next stage after a delay, or finish the quiz
    setTimeout(() => {
        button.style.backgroundColor = ''; // Reset button color
        proceedToNextStage(); // Only handle next stages
    }, 1000);
}







// Timed Mode Logic -------------------------------------------------------
// Select the necessary elements
const startResetButton = document.getElementById('start-reset-timer');
const redBackground = document.getElementById('red-background');

// Event listener to toggle the red background movement
startResetButton.addEventListener('click', function() {
    // Toggle the 'active' class to start and reset the animation
    redBackground.classList.toggle('active');

    // Check if the 'active' class is present and update the button text accordingly
    if (redBackground.classList.contains('active')) {
        startResetButton.textContent = 'RESET'; // Change text to "RESET"
    } else {
        startResetButton.textContent = 'START'; // Change text back to "START"
    }
});









// Timed Mode - Toggle Overlay and Button Styling  -------------------------------------------------------
function toggleTimedMode() {
    const gameModeToggle = document.getElementById('game-mode-toggle');
    const infiniteButton = document.getElementById('infinite-button');
    const timeButton = document.getElementById('time-button');
    const timer = document.getElementById('timer');
    const timerCover = document.getElementById('timer-cover');
    const startResetButton = document.getElementById('start-reset-timer');

    // Check if the toggle is on or off
    const isTimeMode = gameModeToggle.checked;
    console.log("Toggle State:", isTimeMode);

    // Check if the start-reset button is active
    const isStartResetActive = startResetButton.classList.contains('active');

    // Handle Time Mode
    if (isTimeMode) {
        console.log("Time Mode Activated");
        timeButton.classList.add('active');
        infiniteButton.classList.remove('active');
        timer.style.display = 'block'; // Show timer
        
        // Show or hide the timer cover based on the start/reset button state
        if (!isStartResetActive) {
            timerCover.style.display = 'block'; // Show timer cover if button is inactive
        } else {
            timerCover.style.display = 'none'; // Hide timer cover if button is active
        }
    } else {
        console.log("Infinite Mode Activated");
        infiniteButton.classList.add('active');
        timeButton.classList.remove('active');
        timer.style.display = 'none';
        timerCover.style.display = 'none';
    }
}


// Timed Mode - START/RESET Button logic
document.getElementById("start-reset-timer").addEventListener("click", function() {
    // Toggle the 'active' class on the button
    this.classList.toggle("active");

    // Get the timer and timerCover elements
    const timerCover = document.getElementById("timer-cover");

    // If the button is active, hide the timerCover
    if (this.classList.contains("active")) {
        timerCover.style.display = 'none'; // Hide the timer cover
    } else {
        timerCover.style.display = 'block'; // Show the timer cover
    }

    // Trigger the timed mode function to handle overlay and timer visibility
    toggleTimedMode();
});












// Easy Mode - Toggle Overlay and Button Styling ----------------------------------------------------------
function toggleOverlayAndButtonStyles() {
    const easyModeToggle = document.getElementById('easy-mode-toggle');
    const overlay = document.getElementById('overlay');
    const easyButton = document.getElementById('easy-button');
    const hardButton = document.getElementById('hard-button');
    
    // Check if the toggle is on or off
    const isEasyMode = easyModeToggle.checked; 
    
    if (isEasyMode) {
        // Easy mode is active
        overlay.style.display = 'none'; 
        easyButton.classList.add('active'); // Activate easy button style
        hardButton.classList.remove('active'); // Deactivate hard button style
    } else {
        // Hard mode is active
        overlay.style.display = 'block'; 
        hardButton.classList.add('active'); // Activate hard button style
        easyButton.classList.remove('active'); // Deactivate easy button style
    }
}

// Dark Mode - Toggle Button and Body Class ---------------------------------------------------------------
function toggleDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const lightButton = document.getElementById('light-button');
    const darkButton = document.getElementById('dark-button');
    const body = document.body;

    // Check if the toggle is on or off
    const isDarkMode = darkModeToggle.checked; 
    
    if (isDarkMode) {
        // Dark mode is active
        darkButton.classList.add('active'); // Activate dark button style
        lightButton.classList.remove('active'); // Deactivate light button style
        body.classList.add('dark-mode'); // Add dark mode class to the body
    } else {
        // Light mode is active
        lightButton.classList.add('active'); // Activate light button style
        darkButton.classList.remove('active'); // Deactivate dark button style
        body.classList.remove('dark-mode'); // Remove dark mode class from the body
    }
}

// Ensure the toggle buttons are loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    const gameModeToggle = document.getElementById('game-mode-toggle');
    const easyModeToggle = document.getElementById('easy-mode-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (gameModeToggle) {
        gameModeToggle.addEventListener('change', toggleTimedMode);
        toggleTimedMode(); // Initialize the correct state
    } else {
        console.error("Game mode toggle not found");
    }

    if (easyModeToggle) {
        // Add event listener for easy mode toggle
        easyModeToggle.addEventListener('change', toggleOverlayAndButtonStyles);
        toggleOverlayAndButtonStyles(); // Call initially to set the default state
    }
    
    if (darkModeToggle) {
        // Add event listener for dark mode toggle
        darkModeToggle.addEventListener('change', toggleDarkMode);
        toggleDarkMode(); // Call initially to set the default state
    }
});











// Stats---------------------------------------------
// Declare global variables
let attempts = 0;
let wins = 0;

// Function to display the latest stats on page load
function displayStats() {
    const userStats = JSON.parse(localStorage.getItem('userStats')) || { attempts: 0, wins: 0, winRate: 0 };

    // Update global variables
    attempts = userStats.attempts;
    wins = userStats.wins;

    // Ensure stats are displayed correctly
    document.getElementById('attempts').innerText = attempts;
    document.getElementById('wins').innerText = wins;
    document.getElementById('win-rate').innerText = userStats.winRate.toFixed(2); // Round to 2 decimal places

    // Update the chart with the latest data
    updateChart();
}

// Call displayStats when the page loads to show the latest stats
window.onload = displayStats;

// When the quiz is complete (final stage/guess)
function finishQuiz(isCorrect) {
    console.log("finishQuiz called");
    // Update stats based on whether the final guess is correct
    updateStats(isCorrect);
    // Re-display stats after update
    displayStats(); // Make sure to update the UI with new stats immediately
}

// Function to update stats in localStorage
function updateStats(isCorrect) {
    console.log("updateStats called with isCorrect:", isCorrect);
    attempts++;
    if (isCorrect) {
        wins++;
    }
    const winRate = attempts > 0 ? (wins / attempts) * 100 : 0;
    const userStats = { attempts, wins, winRate };
    localStorage.setItem("userStats", JSON.stringify(userStats));
}

// Get the context of the canvas
const ctx = document.getElementById('myChart').getContext('2d');

// Create the chart
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['GENRE', 'YEAR', 'TITLE'],
        datasets: [
            {
                label: 'CORRECT',
                data: [stage1Correct, stage2Correct, wins], // Initially set to 0, will be updated dynamically
                backgroundColor: ['#339999', '#339999', '#189a70'], // Default green, with more vibrant green for TITLE
                borderWidth: 1
            },
            {
                label: 'INCORRECT',
                data: [stage1Incorrect, stage2Incorrect, attempts - wins], // Initially set to 0
                backgroundColor: ['#ea696c', '#ea696c', '#ec3135'], // Default red, with more vibrant red for TITLE
                borderWidth: 1,
            }
        ]
    },
    options: {
        indexAxis: 'y',
        animation: {
            duration: 0 // Disable the animation
        },
        scales: {
            x: {
                beginAtZero: true,
                stacked: true,
                grid: {
                    display: false
                },
                ticks: {
                    display: true,
                    color: '#555555', 
                    font: {
                        family: 'Bebas Neue', 
                        size: 14,        
                        weight: 'bold'  
                    },
                    stepSize: 1, // Ensure only integers are displayed
                    callback: function(value) {
                        return Number.isInteger(value) ? value : '';
                    }
                },
                borderColor: 'transparent'
            },
            y: {
                stacked: true,
                grid: {
                    display: false // Hides grid lines
                },
                ticks: {
                    display: true,
                    color: '#555555', 
                    font: {
                        family: 'Bebas Neue', 
                        size: 27,          
                        weight: '500'      
                    }
                },
                borderColor: 'transparent'
            }
        }
    }
});

// Function to update the chart with the latest stats
function updateChart() {
    // Update the data in the chart
    myChart.data.datasets[0].data = [stage1Correct, stage2Correct, wins]; // Update 'Correct' data
    myChart.data.datasets[1].data = [stage1Incorrect, stage2Incorrect, attempts - wins]; // Update 'Incorrect' data

    // Refresh the chart to reflect updated data
    myChart.update();
}





// Start the quiz-------------------------------------------
updateMovieInfo();
