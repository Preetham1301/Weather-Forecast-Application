// 🌦️ Weather App Script

// Your OpenWeatherMap API key
const apiKey = "a011a12d37dbab9edc0bd9025b1d4b12";

// Boolean to track temperature unit (false = Celsius, true = Fahrenheit)
let isFahrenheit = false;

// Grabbing all required HTML elements by their IDs
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const unitToggle = document.getElementById("unitToggle");
const dropdown = document.getElementById("dropdown");
const errorBox = document.getElementById("errorBox");

// Event listener for Search button
searchBtn.addEventListener("click", () => handleSearch(cityInput.value));

// Event listener for "Use Current Location" button
currentLocationBtn.addEventListener("click", getLocationWeather);

// Event listener when a city is selected from dropdown
dropdown.addEventListener("change", () => handleSearch(dropdown.value));

// Event listener for temperature unit toggle switch
unitToggle.addEventListener("change", () => {
    isFahrenheit = unitToggle.checked; // Update the unit
    const currentCity = document.getElementById("cityName").textContent;
    if (currentCity) handleSearch(currentCity); // Re-fetch weather with new unit
});

// Function to handle user input/search
function handleSearch(city) {
    if (!city) return showError("Please enter a city."); // Validation
    getWeather(city); // Fetch weather data
    updateRecentSearches(city);  // Store in recent searches
}

// Display error messages in UI
function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    setTimeout(() => errorBox.classList.add("hidden"), 3000);  // Auto-hide after 3 seconds
}

// Save city to local storage for recent search dropdown
function updateRecentSearches(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!searches.includes(city)) {
        searches.unshift(city); // Add to top
        if (searches.length > 5) searches.pop(); // Keep only 5
        localStorage.setItem("recentSearches", JSON.stringify(searches));
    }
    populateDropdown();// Refresh the dropdown list
}

// Fill the dropdown menu with saved cities
function populateDropdown() {
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    dropdown.innerHTML = '<option value="">-- Recently Searched Cities --</option>';
    searches.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        dropdown.appendChild(opt);// Add option to dropdown
    });
}

// Get user's current geolocation and fetch weather for that location
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const units = isFahrenheit ? "imperial" : "metric";
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
            const data = await res.json();
            handleSearch(data.name); // Use city name returned by API
        }, () => showError("Location access denied."));
    } else {
        showError("Geolocation not supported.");
    }
}

// Fetch current weather data for a given city
async function getWeather(city) {
    const units = isFahrenheit ? "imperial" : "metric";
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
        if (!res.ok) throw new Error("City not found"); // If bad response
        const data = await res.json();
        updateWeatherDisplay(data);// Show data in UI
        getForecast(city, units);// Also fetch 5-day forecast
    } catch (err) {
        showError(err.message);// Display any error messages
    }
}

// Update current weather UI display
function updateWeatherDisplay(data) {
    document.getElementById("weatherDisplay").classList.remove("hidden");
    document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temp").textContent = `${data.main.temp}°${isFahrenheit ? "F" : "C"}`;
    document.getElementById("description").textContent = data.weather[0].description;
    document.getElementById("wind").textContent = `${data.wind.speed} ${isFahrenheit ? "mph" : "m/s"}`;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

// Fetch and display 5-day forecast
async function getForecast(city, units) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`);
    const data = await res.json();

    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = ""; // Clear previous cards

    // We'll pick one entry per day (first available)
    const dailyMap = {};
    data.list.forEach(entry => {
        const date = entry.dt_txt.split(" ")[0]; // Get date part
        if (!dailyMap[date]) dailyMap[date] = entry; // Save first entry for the date
    });

    // Display next 5 days forecast (excluding today)
    Object.keys(dailyMap).slice(1, 6).forEach(date => {
        const day = dailyMap[date];

        // Create a forecast card
        const card = document.createElement("div");
        card.className = "bg-white/30 rounded-xl p-4 flex flex-col items-center shadow-md";
        card.innerHTML = `
      <p class="font-semibold mb-1">${new Date(date).toDateString().slice(0, 10)}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" class="w-12 h-12"/>
      <p class="text-lg font-bold">${day.main.temp}°${isFahrenheit ? "F" : "C"}</p>
    `;
        forecastEl.appendChild(card);
    });
}

// On load: Populate dropdown with saved searches
populateDropdown();
