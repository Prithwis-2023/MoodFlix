import { useState } from 'react';



export function useEnvironment() {

    //base setting
    const [city, setCity] = useState('Seoul');
    const [weather, setWeather] = useState('Clear');
    const [weekday, setWeekday] = useState('Sunday');
    const [temperature, setTemperature] = useState('13.51');
    const [dayStatus, setDayStatus] = useState('Weekday');

    return {
        
        city,
        weather,
        dayStatus,
        weekday,
        temperature,

        setWeekday,
        setTemperature,
        setCity,
        setWeather,
        setDayStatus,
    };




}