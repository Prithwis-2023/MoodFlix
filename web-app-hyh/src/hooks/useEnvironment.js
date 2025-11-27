import { useState } from 'react';



export function useEnvironment() {

    //base setting
    const [city, setCity] = useState('Seoul');
    const [weather_desc, setWeather] = useState('broken clouds');
    const [weekday, setWeekday] = useState('Sunday');
    const [temperature, setTemperature] = useState('13.51');
    const [today_status, setToDayStatus] = useState('Weekend');
    const [tomorrow_status, setTomorrow_dStatus] = useState('Weekday');
    const [lat, setlat] = useState('37.566');
    const [lon, setlon] = useState('126.9784');

    return {
        
        city,
        weather_desc,
        today_status,
        weekday,
        temperature,
        tomorrow_status,
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

