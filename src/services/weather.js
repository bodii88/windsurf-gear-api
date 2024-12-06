const axios = require('axios');

class WeatherService {
    static async getCurrentWeather(latitude, longitude) {
        // If no API key is configured, return a default response
        if (!process.env.OPENWEATHER_API_KEY) {
            console.log('OpenWeather API key not configured - weather service disabled');
            return {
                temperature: null,
                windSpeed: null,
                windDirection: null,
                conditions: 'Weather service not configured',
                description: 'Weather data unavailable',
                humidity: null,
                pressure: null,
                timestamp: new Date(),
                serviceEnabled: false
            };
        }

        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: 'metric'
                }
            });

            const { data } = response;
            
            return {
                temperature: data.main.temp,
                windSpeed: data.wind.speed,
                windDirection: this.getWindDirection(data.wind.deg),
                conditions: data.weather[0].main,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                timestamp: new Date(),
                serviceEnabled: true,
                raw: process.env.NODE_ENV === 'development' ? data : undefined
            };
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return {
                temperature: null,
                windSpeed: null,
                windDirection: null,
                conditions: 'Error',
                description: 'Weather data temporarily unavailable',
                humidity: null,
                pressure: null,
                timestamp: new Date(),
                serviceEnabled: false,
                error: error.message
            };
        }
    }

    static getWindDirection(degrees) {
        if (degrees === null || degrees === undefined) return null;
        
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
        return directions[index];
    }

    static async getForecast(latitude, longitude) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: 'metric'
                }
            });

            const { data } = response;
            
            return data.list.map(item => ({
                timestamp: new Date(item.dt * 1000),
                temperature: item.main.temp,
                windSpeed: item.wind.speed,
                windDirection: this.getWindDirection(item.wind.deg),
                conditions: item.weather[0].main,
                description: item.weather[0].description,
                humidity: item.main.humidity,
                pressure: item.main.pressure
            }));
        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            return null;
        }
    }
}

module.exports = WeatherService;
