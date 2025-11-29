import { useState, useEffect } from 'react';



function getDayStatus(date = new Date()) {
    const day = date.getDay(); // 0: Sun ~ 6: Sat
    const weekdayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    const weekday = weekdayNames[day];
    const today_status = (day === 0 || day === 6) ? "Weekend" : "Weekday";

    // tomorrow
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    const tomorrowDay = tomorrow.getDay();
    const tomorrow_status = (tomorrowDay === 0 || tomorrowDay === 6)
        ? "Weekend"
        : "Weekday";

    return { weekday, today_status, tomorrow_status };
}

//Open-Meteo weathercode -> text 
function mapWeatherCodeToDesc(code) {
    if (code === 0) return "clear sky";
    if (code === 1) return "mainly clear";
    if (code === 2) return "partly cloudy";
    if (code === 3) return "overcast clouds";
    if (code === 45 || code === 48) return "fog";
    if (code >= 51 && code <= 57) return "drizzle";
    if (code >= 61 && code <= 67) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain showers";
    if (code === 95) return "thunderstorm";
    if (code === 96 || code === 99) return "thunderstorm with hail";
    return "unknown";
}


export function useEnvironment() {


    const { weekday, today_status, tomorrow_status } = getDayStatus();

    //const [weekday, setWeekday] = useState('Sunday');
    //const [today_status, setToDayStatus] = useState('Weekend');
    //const [tomorrow_status, setTomorrow_dStatus] = useState('Weekday');

    //base setting
    const [city, setCity] = useState('Seoul');
    const [lat, setlat] = useState('37.566');
    const [lon, setlon] = useState('126.9784');

    //openmeteo
    const [weather_desc, setWeather] = useState('laoading');
    const [temperature, setTemperature] = useState('13.51');
    
    

    const [weekdayState, setWeekday] = useState(weekday);
    const [todayStatusState, setToDayStatus] = useState(today_status);
    const [tomorrowStatusState, setTomorrow_dStatus] = useState(tomorrow_status);
    

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            console.warn("browser dose not support Geolocation");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                setlat(String(latitude));
                setlon(String(longitude));
            },
            (error) => {
                console.warn("failed update location information:", error);
                
            },
            {
                //option
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }, []);

    //reverse geocoding for city update
    useEffect(() => {
        async function fetchCity() {
            try {
                const res = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
                );

                const data = await res.json();

                if (data.city) {
                    setCity(data.city);   // 예: Seoul
                } else if (data.locality) {
                    setCity(data.locality);
                } else {
                    setCity("Unknown");
                }
            } catch (err) {
                console.error("Reverse geocoding error:", err);
            }
        }

        if (lat && lon) fetchCity();
    }, [lat, lon]);

    //open-meteo logic
    useEffect(() => {
        async function fetchWeather() {
            try {
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
                );
                const data = await res.json();

                if (data.current_weather) {
                    const { temperature, weathercode } = data.current_weather;
                    setTemperature(String(temperature));            // 숫자 → 문자열
                    setWeather(mapWeatherCodeToDesc(weathercode));  // code → 텍스트
                }
            } catch (err) {
                console.error('Open-Meteo fetch error:', err);
            }
        }

        fetchWeather();
    }, [lat, lon]);



    return {
        
        city,
        weather_desc,
        today_status:todayStatusState,
        weekday:weekdayState,
        temperature,
        tomorrow_status:tomorrowStatusState,
        lat,
        lon,


        setlat,
        setlon,
        setWeekday,
        setTemperature,
        setCity,
        setWeather,
        setToDayStatus,
        setTomorrow_dStatus,
    };




}

