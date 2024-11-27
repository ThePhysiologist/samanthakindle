// Haiku data and functions
const haiku = [
    {
        text: "An old silent pond...\nA frog jumps into the pond,\nsplash! Silence again.",
        author: "Matsuo Bashō"
    },
    {
        text: "Autumn moonlight—\na worm digs silently\ninto the chestnut.",
        author: "Kobayashi Issa"
    },
    {
        text: "In the twilight rain\nthese brilliant-hued hibiscus -\nA lovely sunset.",
        author: "Matsuo Bashō"
    },
    {
    text: "a cloud\nwith somewhere to be\nautumn morning",
    author: "Julie Schwerin"
    },
  {text: "mirror lake\na sapling's\nfirst autumn",
    author: "Julie Schwerin"
    },
    {text: "loon call\nI let it sting\nawhile",
    author: "Julie Schwerin"
    },
    {text: "earthbound\ncrow shadow after crow shadow\nflies through me",
    author: "Julie Schwerin"
    },
    {text: "this side of the pane\nthe wind nothing\nbut swaying treetops",
    author: "Julie Schwerin"
    },
    {text: "at the end\nof the wrong road taken\n a flower",
    author: "Ed Bremson"
    },
      {text: "rising mist\nthe mountains hide\nthe morning sun",
    author: "Ed Bremson"
    },
      {text: "passionate kisses\nin the cold deep dark woods\nwe make love, tented",
    author: "Luke Hollomon"
    },
      {text: "sand blowing\nthrough a slot canyon\nsoon I will be gone",
    author: "Victor Ortiz"
    },
      {text: "dune pine\nthe low branch\n sweeping sand",
    author: "Dee Evetts"
    },
      {text: "she dreams\nher hand fluttering\nwithin mine",
    author: "Dee Evetts"
    },
];

function getDailyHaiku() {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return haiku[dayOfYear % haiku.length];
}

function displayHaiku() {
    const dailyHaiku = getDailyHaiku();
    document.getElementById('haiku-text').innerText = dailyHaiku.text;
    document.getElementById('author-display').innerText = `- ${dailyHaiku.author}`;
}

// Weather data function


// River data functions
async function fetchRiverData(siteCode, parameterCode, startDate, endDate) {
    // Format dates correctly for USGS API
    const formatDate = (date) => date.toISOString().split('T')[0];
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteCode}&startDT=${formattedStartDate}&endDT=${formattedEndDate}&parameterCd=${parameterCode}&siteStatus=all`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Check if we have the expected data structure
        if (data.value && data.value.timeSeries && data.value.timeSeries.length > 0) {
            return data.value.timeSeries[0].values[0].value;
        } else {
            console.error("Unexpected data structure:", data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching river data:", error);
        return null;
    }
}
async function createRiverChart() {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 3);
    const futureDate = new Date(endDate);
    futureDate.setDate(futureDate.getDate() + 3);

    const riverData = await fetchRiverData('02037500', '00065', startDate, futureDate);
    if (!riverData) {
        document.getElementById('river-chart').innerHTML = '<p class="error-message">Oops! The river data seems to have gone fishing. We\'re trying to reel it back in!</p>';
        return;
    }

    // Sample fewer points (every 4 hours instead of every reading)
    const sampledData = riverData.filter((_, index) => index % 8 === 0);

    const labels = sampledData.map(d => {
        const date = new Date(d.dateTime);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            hour12: true,
            weekday: 'short'
        });
    });
    const values = sampledData.map(d => parseFloat(d.value));

    // Calculate max value for y-axis
    const maxValue = Math.max(...values);
    const yAxisMax = maxValue > 12 ? maxValue + 1 : 12;

    const ctx = document.getElementById('river-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                // Main river level line
                {
                    label: 'River Level (ft)',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    pointRadius: 0,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                    borderWidth: 3,
                    z: 10 // Ensure this line appears on top
                },
                // Fill area above 9ft
                {
                    label: 'Above 9ft',
                    data: values.map(() => 9),
                    fill: '+1',
                    backgroundColor: 'rgba(200, 200, 200, 0.2)',
                    borderWidth: 0,
                    pointRadius: 0,
                    z: 1
                },
                // Fill area above 12ft
                {
                    label: 'Above 12ft',
                    data: values.map(() => 12),
                    fill: '+1',
                    backgroundColor: 'rgba(150, 150, 150, 0.3)',
                    borderWidth: 0,
                    pointRadius: 0,
                    z: 2
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return labels[context[0].dataIndex];
                        }
                    }
                },
                legend: {
                    display: false // Hide the legend since we don't need it
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: yAxisMax,
                    title: {
                        display: true,
                        text: 'River Level (ft)'
                    },
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 9 || context.tick.value === 12) {
                                return 'rgba(100, 100, 100, 0.5)';  // Darker line for important levels
                            }
                            return 'rgba(0, 0, 0, 0.1)';  // Default grid line color
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

async function displayRiverInfo() {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const levelData = await fetchRiverData('02037500', '00065', yesterday, currentDate);  // Westham gauge, water level
  console.log(levelData[0].value);
    const tempData = await fetchRiverData('02035000', '00010', yesterday, currentDate);   // Cartersville gauge, water temperature

    const riverInfoElement = document.getElementById('river-info');
    if (tempData && tempData.length > 0) {
        const latestTemp = tempData[tempData.length - 1];
        const tempTime = new Date(latestTemp.dateTime).toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit', hour12: true});
        const tempCelsius = parseFloat(latestTemp.value);
        const tempFahrenheit = (tempCelsius * 9/5) + 32;
        riverInfoElement.innerHTML += `<p>The James is<span id="river-temperature"> ${tempFahrenheit.toFixed(0)}°F</span> and at <span id="river-height">${levelData[0].value}ft</span></p><p id="current-data">Data current as of ${tempTime}</p>`;
    } else {
        riverInfoElement.innerHTML += '<p class="error-message">Looks like our temperature sensor decided to go for a swim.</p>';
    }
}

// Weather phrases organized by category
const weatherPhrases = {
    hot: [
        "It's fucking hot!",
        "Feels like the surface of the sun out there.",
        "You could fry an egg on the sidewalk.",
        "It's hotter than a jalapeño's armpit!",
        "Time to become one with your air conditioner."
    ],
    warm: [
        "It's pretty warm out there.",
        "Perfect weather for shorts and shades!",
        "Grab a cold drink and enjoy the warmth.",
        "Feels like summer's giving us a big hug.",
        "Warm enough to make you appreciate shade."
    ],
    pleasant: [
        "The weather's quite pleasant.",
        "It's a perfect day for a picnic!",
        "Goldilocks would approve - not too hot, not too cold.",
        "Weather so nice, you'll want to bottle it up."
    ],
    cool: [
        "It's a bit chilly", 
      "You might want to grab a light jacket.",
        "Perfect weather for a brisk walk",
        "Sweater weather is upon us!",
      "It's a chilly one out there"
    ],
    cold: [
        "Grab a jacket, it's cold!",
        "Brrr! Time to bundle up!",
        "It's nippy enough to make a polar bear shiver.",
        "You might see your breath out there!"
    ],
    rainy: [
        "It's raining cats and dogs!",
        "Perfect weather for ducks",
        "Time to sing in the rain!",
        "Mother Nature's giving the plants a drink.",
        "Grab your galoshes and embrace the puddles!"
    ],
    snowy: [
        "It's a winter wonderland!",
        "Snowmen are popping up everywhere!",
        "Time to break out the sleds!",
        "The world's getting a fresh coat of paint.",
    ],
    windy: [
        "Hold onto your hats, it's windy!",
        "The trees are doing the cha-cha out there.",
        "Kite flyers, rejoice!",
        "It's blowing harder than a wolf at a pig's house.",
        "Mother Nature's giving us all blow-dries today.",
      "That hair's gonna floof!"
    ]
};

function getRandomPhrase(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getWeatherPhrase(temp, humidity, weatherCondition) {
    if (weatherCondition.includes('rain')) {
        return getRandomPhrase(weatherPhrases.rainy);
    } else if (weatherCondition.includes('snow')) {
        return getRandomPhrase(weatherPhrases.snowy);
    } else if (weatherCondition.includes('wind') || weatherCondition.includes('gust')) {
        return getRandomPhrase(weatherPhrases.windy);
    }

    if (temp > 90 && humidity > 60) {
        return getRandomPhrase(weatherPhrases.hot) + " And it's humid too!";
    } else if (temp > 90) {
        return getRandomPhrase(weatherPhrases.hot);
    } else if (temp > 80) {
        return getRandomPhrase(weatherPhrases.warm);
    } else if (temp > 60) {
        return getRandomPhrase(weatherPhrases.pleasant);
    } else if (temp > 40) {
        return getRandomPhrase(weatherPhrases.cool);
    } else {
        return getRandomPhrase(weatherPhrases.cold);
    }
}

// Simple function to get and display weather
async function updateWeather() {
        const apiKey = 'e6237d931351eb01d11683806c7a8a81';
const city = 'Richmond,US';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=37.5407&lon=-77.4360&exclude=minutely,hourly&appid=${apiKey}&units=imperial`;

    try {
        // Fetch weather data
        const response = await fetch(url);
        const data = await response.json();
        console.log("Weather data:", data); // For debugging

        // Get elements
        const weatherDisplay = document.getElementById('current-weather');
        
        // Format the weather data
        const temp = Math.round(data.main.temp);
        const humidity = data.main.humidity;
        const condition = data.weather[0].description.toUpperCase();
        const weatherPhrase = getWeatherPhrase(temp, humidity, condition);
        const iconCode = data.weather[0].icon;
        const description = data.weather[0].description;
        const windSpeed = Math.round(data.wind.speed);
       const windDeg = data.wind.deg;
       const windDirection = getWindDirection(windDeg);
      const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', {
           hour: 'numeric',
           minute: '2-digit',
           hour12: true
       });
       const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', {
           hour: 'numeric',
           minute: '2-digit',
           hour12: true
       });

        // Update the display
        weatherDisplay.innerHTML = `
            <p><span id="temperature">${temp}°F</span>
            <span>${description}</span><span></span></p>
            <p>${weatherPhrase}</p>
            <p>Wind is ${windSpeed}mph from the ${windDirection}</p>
            <div class="sun-times">
               <div class="sunrise">
                   <span>Sunrise is at</span>
                   <span>${sunrise}</span>
               </div>
               <div class="sunset">
                   <span> Sunset is at</span>
                   <span>${sunset}</span>
               </div>
           </div>
        `;

    } catch (error) {
        console.error("Error fetching weather:", error);
        document.getElementById('current-weather').innerHTML = `
            <h2>Current Weather</h2>
            <p class="error-message">Oops! Our weather sensor is on vacation. Check back soon!</p>
        `;
    }
}
function getWindDirection(degrees) {
   const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
   const index = Math.round(((degrees % 360) / 22.5));
   return directions[index % 16];
}
// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateWeather();
    // Update weather every 5 minutes
    setInterval(updateWeather, 300000);
});
async function updateForecast() {
    const apiKey = 'e6237d931351eb01d11683806c7a8a81';  // Use the same API key
 const lat = 37.5407;
    const lon = -77.4360;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Forecast data:", data);

        const forecastDisplay = document.getElementById('forecast');
        
        // Get unique days and track min/max temps
        const dailyForecasts = {};
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            const temp = item.main.temp;
            
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    date: item.dt,
                    minTemp: temp,
                    maxTemp: temp,
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                };
            } else {
                dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, temp);
                dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, temp);
            }
        });

        // Convert to array and take first 7 days
        const forecasts = Object.values(dailyForecasts).slice(0, 4);

        // Create forecast HTML
        forecastDisplay.innerHTML = '';
        
        const forecastGrid = document.createElement('div');
        forecastGrid.className = 'forecast-grid';

        forecasts.forEach(day => {
            const date = new Date(day.date * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const highTemp = Math.round(day.maxTemp);
            const lowTemp = Math.round(day.minTemp);

            const dayElement = document.createElement('div');
            dayElement.className = 'forecast-day';
            dayElement.innerHTML = `
                <div class="day-name">${dayName}</div>
                <img src="http://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}">
                <div class="temp">${highTemp}° / ${lowTemp}°</div>
                <div class="description">${day.description}</div>
            `;
            forecastGrid.appendChild(dayElement);
        });

        forecastDisplay.appendChild(forecastGrid);

    } catch (error) {
        console.error("Error fetching forecast:", error);
        document.getElementById('forecast').innerHTML = `
            <p class="error-message">Our forecast crystal ball needs polishing. Check back soon!</p>
        `;
    }
}

async function fetchRiverData(siteCode, parameterCode, startDate, endDate) {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteCode}&startDT=${startDate.toISOString()}&endDT=${endDate.toISOString()}&parameterCd=${parameterCode}&siteStatus=all`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.value.timeSeries[0].values[0].value;
    } catch (error) {
        console.error("Error fetching river data:", error);
        return null;
    }
}
// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    displayHaiku();
    createRiverChart();
    displayRiverInfo();
    updateWeather();
    updateForecast();
  setInterval(() => {
        updateWeather();
        updateForecast();
    }, 600000);
});