const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const currentLocationBtn = document.querySelector('.current-location-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.tem-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-data-txt');
const forecastItemsContainer = document.querySelector('.forecast-items-container');

const apiKey = '414f410134e10bd202c8fa80e708fe3c';

// Search weather by city
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value.trim());
        cityInput.value = '';
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value.trim());
        cityInput.value = '';
    }
});

// Get weather icon based on the condition
function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.svg';
    if (id >= 300 && id <= 321) return 'drizzle.svg';
    if (id >= 500 && id <= 531) return 'rain.svg';
    if (id >= 600 && id <= 622) return 'snow.svg';
    if (id >= 701 && id <= 781) return 'dust.svg'; // Atmosphere includes dust
    if (id === 800) return 'clear.svg';
    if (id >= 801 && id <= 804) return 'clouds.svg';
    return 'default.svg';
}

// Get current date formatted
function getCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return currentDate.toLocaleDateString('en-GB', options);
}

// Save weather data to localStorage
function saveWeatherData(data) {
    localStorage.setItem('weatherData', JSON.stringify(data));
}

// Load weather data from localStorage
function loadWeatherData() {
    const data = localStorage.getItem('weatherData');
    return data ? JSON.parse(data) : null;
}

// Update weather info based on city
async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city);
        saveWeatherData(weatherData); // Save data to localStorage

        const {
            name: cityName,
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed },
        } = weatherData;

        // Update UI
        countryTxt.textContent = cityName;
        tempTxt.textContent = `${Math.round(temp)} °C`;
        conditionTxt.textContent = main;
        humidityValueTxt.textContent = `${humidity}%`;
        windValueTxt.textContent = `${speed} m/s`;
        currentDateTxt.textContent = getCurrentDate();
        weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

        // Check for rain and dust
        const isRaining = main === 'Rain' || (id >= 500 && id <= 531);
        const isDusty = id >= 701 && id <= 781;

        // Construct alert message based on the weather condition
        let alertMessage = `Weather alert for ${cityName}:`;
        if (isRaining) {
            alertMessage += " It's raining today. Stay prepared!";
        }
        if (isDusty) {
            alertMessage += " It's dusty today. Take precautions!";
        }

        // Show the alert only if it's raining or dusty
        if (isRaining || isDusty) {
            alert(alertMessage);
        } else {
            console.log("No weather alerts for today.");
        }

        await updateForecastInfo(city);
        showDisplaySection(weatherInfoSection);

    } catch (error) {
        console.error(error);
        showDisplaySection(notFoundSection);
    }
}

// Fetch weather data from API
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

// Update forecast info
async function updateForecastInfo(city) {
    try {
        const forecastData = await getFetchData('forecast', city);
        const timeTarget = '12:00:00';
        const todayDate = new Date().toISOString().split('T')[0];

        forecastItemsContainer.innerHTML = '';

        forecastData.list.forEach((forecast) => {
            if (
                forecast.dt_txt.includes(timeTarget) &&
                !forecast.dt_txt.includes(todayDate)
            ) {
                const { dt_txt: date, weather: [{ id, main }], main: { temp } } = forecast;
                const dateFormatted = new Date(date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                });

                const forecastItem = `
                    <div class="forecast-item">
                        <h5 class="forecast-item-date regular-txt">${dateFormatted}</h5>
                        <img src="assets/weather/${getWeatherIcon(id)}" class="forecast-item-img">
                        <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
                    </div>
                `;
                forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
            }
        });
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// Show the correct section
function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(
        (sec) => (sec.style.display = 'none')
    );
    section.style.display = 'flex';
}

// Get weather by current location
async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

        try {
            const weatherData = await fetch(weatherApiUrl).then((res) => res.json());

            const {
                name: cityName,
                main: { temp, humidity },
                weather: [{ id, main }],
                wind: { speed },
            } = weatherData;

            // Save data to localStorage
            saveWeatherData(weatherData);

            // Update UI
            countryTxt.textContent = cityName;
            tempTxt.textContent = `${Math.round(temp)} °C`;
            conditionTxt.textContent = main;
            humidityValueTxt.textContent = `${humidity}%`;
            windValueTxt.textContent = `${speed} m/s`;
            currentDateTxt.textContent = getCurrentDate();
            weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

            // Check if it's raining or dusty
            const isRaining = main === 'Rain' || (id >= 500 && id <= 531);
            const isDusty = id >= 701 && id <= 781;

            // Construct alert message based on the weather condition
            let alertMessage = `Weather alert for ${cityName}:`;
            if (isRaining) {
                alertMessage += " It's raining today. Stay prepared!";
            }
            if (isDusty) {
                alertMessage += " It's dusty today. Take precautions!";
            }

            // Show the alert only if it's raining or dusty
            if (isRaining || isDusty) {
                alert(alertMessage);  // Display the alert
            }

            await updateForecastInfo(cityName);
            showDisplaySection(weatherInfoSection);

        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    }, (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check location settings.");
    });
}

// Event listener for current location button
currentLocationBtn.addEventListener('click', getWeatherByLocation);

// Load weather data on page load
document.addEventListener('DOMContentLoaded', () => {
    const weatherData = loadWeatherData();
    if (weatherData) {
        const {
            name: cityName,
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed },
        } = weatherData;

        // Update UI
        countryTxt.textContent = cityName;
        tempTxt.textContent = `${Math.round(temp)} °C`;
        conditionTxt.textContent = main;
        humidityValueTxt.textContent = `${humidity}%`;
        windValueTxt.textContent = `${speed} m/s`;
        currentDateTxt.textContent = getCurrentDate();
        weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

        showDisplaySection(weatherInfoSection);
    }
});
