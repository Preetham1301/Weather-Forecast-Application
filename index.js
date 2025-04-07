// 🌦️ Weather App Script
const apiKey = "a011a12d37dbab9edc0bd9025b1d4b12";
let isFahrenheit = false;

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const unitToggle = document.getElementById("unitToggle");
const dropdown = document.getElementById("dropdown");
const errorBox = document.getElementById("errorBox");

searchBtn.addEventListener("click", () => handleSearch(cityInput.value));
currentLocationBtn.addEventListener("click", getLocationWeather);
dropdown.addEventListener("change", () => handleSearch(dropdown.value));
unitToggle.addEventListener("change", () => {
    isFahrenheit = unitToggle.checked;
    const currentCity = document.getElementById("cityName").textContent;
    if (currentCity) handleSearch(currentCity);
});

function handleSearch(city) {
    if (!city) return showError("Please enter a city.");
    getWeather(city);
    updateRecentSearches(city);
}

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    setTimeout(() => errorBox.classList.add("hidden"), 3000);
}

function updateRecentSearches(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!searches.includes(city)) {
        searches.unshift(city);
        if (searches.length > 5) searches.pop();
        localStorage.setItem("recentSearches", JSON.stringify(searches));
    }
    populateDropdown();
}

function populateDropdown() {
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    dropdown.innerHTML = '<option value="">-- Recently Searched Cities --</option>';
    searches.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        dropdown.appendChild(opt);
    });
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const units = isFahrenheit ? "imperial" : "metric";
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
            const data = await res.json();
            handleSearch(data.name);
        }, () => showError("Location access denied."));
    } else {
        showError("Geolocation not supported.");
    }
}

async function getWeather(city) {
    const units = isFahrenheit ? "imperial" : "metric";
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
        if (!res.ok) throw new Error("City not found");
        const data = await res.json();
        updateWeatherDisplay(data);
        getForecast(city, units);
    } catch (err) {
        showError(err.message);
    }
}

function updateWeatherDisplay(data) {
    document.getElementById("weatherDisplay").classList.remove("hidden");
    document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temp").textContent = `${data.main.temp}°${isFahrenheit ? "F" : "C"}`;
    document.getElementById("description").textContent = data.weather[0].description;
    document.getElementById("wind").textContent = `${data.wind.speed} ${isFahrenheit ? "mph" : "m/s"}`;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

async function getForecast(city, units) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`);
    const data = await res.json();

    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = "";

    const dailyMap = {};
    data.list.forEach(entry => {
        const date = entry.dt_txt.split(" ")[0];
        if (!dailyMap[date]) dailyMap[date] = entry;
    });

    Object.keys(dailyMap).slice(1, 6).forEach(date => {
        const day = dailyMap[date];
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

// Auto-load recent cities
populateDropdown();
