
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const message = document.getElementById("message");

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Light freezing drizzle", "🌧️"],
  57: ["Dense freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Light freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snowfall", "🌨️"],
  73: ["Moderate snowfall", "🌨️"],
  75: ["Heavy snowfall", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Slight rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Heavy thunderstorm with hail", "⛈️"]
};

function getWeather(code) {
  return weatherCodes[code] || ["Weather unavailable", "🌡️"];
}

function showMessage(text) {
  message.textContent = text;
}

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service is unavailable. Try again.");
  }

  return await response.json();
}

async function loadWeather(city) {
  const searchCity = city.trim();

  if (!searchCity) {
    showMessage("Please enter a city name.");
    cityInput.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Loading...";
  showMessage("Fetching weather data...");

  try {
    // Step 1: Find the city's geographical coordinates.
    const geoURL = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    geoURL.search = new URLSearchParams({
      name: searchCity,
      count: "10",
      language: "en",
      format: "json"
    });

    const geoData = await getJSON(geoURL);

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    // Prefer an Indian result if multiple cities share a name.
    const places = geoData.results;
    const place =
      places.find(item => item.country_code === "IN") || places[0];

    // Step 2: Request current weather and a five-day forecast.
    const weatherURL = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    weatherURL.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max"
      ].join(","),
      timezone: "auto",
      forecast_days: "5"
    });

    const data = await getJSON(weatherURL);

    // Step 3: Update the current weather section.
    const current = data.current;
    const daily = data.daily;
    const [description, icon] = getWeather(current.weather_code);

    document.getElementById("cityName").textContent =
      `${place.name}, ${place.country}`;

    document.getElementById("todayDate").textContent =
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(new Date(`${current.time.slice(0, 10)}T12:00:00`));

    document.getElementById("temperature").textContent =
      Math.round(current.temperature_2m);

    document.getElementById("currentIcon").textContent = icon;
    document.getElementById("condition").textContent = description;

    document.getElementById("feelsLike").textContent =
      `Feels like ${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("highLow").textContent =
      `H: ${Math.round(daily.temperature_2m_max[0])}°  ` +
      `L: ${Math.round(daily.temperature_2m_min[0])}°`;

    document.getElementById("humidity").textContent =
      `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
      `${current.wind_speed_10m} km/h`;

    document.getElementById("rain").textContent =
      `${daily.precipitation_probability_max[0] ?? 0}%`;

    // Step 4: Dynamically create the five forecast cards.
    const forecast = document.getElementById("forecast");
    forecast.replaceChildren();

    daily.time.forEach((date, index) => {
      const [dayDescription, dayIcon] =
        getWeather(daily.weather_code[index]);

      const dateObject = new Date(`${date}T12:00:00`);

      const dayName = index === 0
        ? "Today"
        : new Intl.DateTimeFormat("en", {
            weekday: "short"
          }).format(dateObject);

      const card = document.createElement("article");
      card.className = "forecast-day";

      const day = document.createElement("div");
      day.className = "day";
      day.textContent = dayName;

      const iconElement = document.createElement("div");
      iconElement.className = "forecast-icon";
      iconElement.textContent = dayIcon;

      const descriptionElement = document.createElement("div");
      descriptionElement.className = "description";
      descriptionElement.textContent = dayDescription;

      const temps = document.createElement("div");
      temps.className = "temps";

      const high = document.createElement("span");
      high.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;

      const low = document.createElement("span");
      low.className = "low";
      low.textContent = ` / ${Math.round(daily.temperature_2m_min[index])}°`;

      temps.append(high, low);
      card.append(day, iconElement, descriptionElement, temps);
      forecast.appendChild(card);
    });

    showMessage(`Weather updated for ${place.name}.`);
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search ↗";
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadWeather(cityInput.value);
});

// Load a default city when the page opens.
loadWeather("Coimbatore");
