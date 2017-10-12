/*Create an array of icons that will be used to display
  current weather conditions. These icons are groups of
  html code */
arWeatherIcons = {
    rain: "<div class=\"icon rainy\"><div class=\"cloud\"></div><div class=\"rain\"></div></div>",
    snow: "<div class=\"icon flurries\"><div class=\"cloud\"></div><div class=\"snow\"><div class=\"flake\"></div><div class=\"flake\"></div></div></div>",
    clouds: "<div class=\"icon cloudy\"><div class=\"cloud\"></div><div class=\"cloud\"></div></div>",
    clear: "<div class=\"icon sunny\"><div class=\"sun\"><div class=\"rays\"></div></div></div>",
    thunderstorm: " <div class=\"icon thunder-storm\"><div class=\"cloud\"></div><div class=\"lightning\"><div class=\"bolt\"></div><div class=\"bolt\"></div></div></div>",
    partlycloudy: "<div class=\"icon sun-shower\"><div class=\"cloud\"></div><div class=\"sun\"><div class=\"rays\"></div></div></div>"
}

// function to get a users location through built in navigator
// functionality of browsers
// This function will get the latitude and longitude of the user
// then send it the "getWeather" function which will pass it to
// the API to get the current weather for that location.
function getLocation() {
    // make sure the browser supports this
    if (navigator.geolocation) {
        // Pass the current lat & long to getWeather
        navigator.geolocation.getCurrentPosition(getWeather);
    } else {
        // alert the user if they cannot use this service.
        alert("Geolocation is not supported by this browser.");
    }
} // end function getLocation


// This function makes the call to the API to get the JSON weather based
// on lat and long passed in through the navigator.geolocation.getCurrentPosition
// information
function getWeather(position) {

    // set the user latitute & longitude
    var lat = position.coords.latitude;
    var long = position.coords.longitude;

    // build those values into the api url
    var urlApi = "https://fcc-weather-api.glitch.me/api/current?lat=" + lat + "&lon=" + long;

    // Request weather from API using this call - use jQuery to get the JSON weather object
    $.getJSON(urlApi)
        .done(parseWeather)
        .fail(handleErr);
} // end function getWeather



//This function recieves the JSON object, parses it out and determines what to do with it.
function parseWeather(weather) {

    var strResponse = JSON.stringify(weather);
    var objWeather = JSON.parse(strResponse);

    // I was going to use Moustache for this but there is too much I need
    // to do to the data before I sent it to the screen to go that route...
    // so instead I'll read the properly edited data I need into a js object
    // and display it from there.
    var location = objWeather.name + ', ' + objWeather.sys.country;
    var temp = Math.round(objWeather.main.temp);
    var hilo = Math.round(objWeather.main.temp_min) + ' / ' + Math.round(objWeather.main.temp_max);
    $("#hilo").html(hilo);

    // if we're in the US default to Farenheit, otherwise leave it as Celsius
    if (objWeather.sys.country.toLowerCase() === 'us') {
        window.name = 'C|' + temp;
        toggleTemp();
    } else {
        // this is the default state so we don't have to change anything
        window.name = 'C|' + temp;
        $("#temp").html(temp + '&deg;');
        $("#tempTypeLink").html('C');
        $("#hilo").html(hilo);
    }

    var desc = '';
    // there doesn't seem to be enough options for 'cloudy' so I'm
    // giving it more granularity
    if (objWeather.weather[0].description.toLowerCase() === 'broken clouds') {
        desc = 'partly cloudy'; //objWeather.weather[0].description;
    } else {
        desc = objWeather.weather[0].main;
    }

    var weatherIcon = determineWeatherIcon(desc);
    var hilo = objWeather.main.temp_min + ' / ' + objWeather.main.temp_max;

    // create the object to send to the function that will
    // load it to the screen
    var arData = {};
    arData['location'] = location;
    arData['desc'] = desc;
    arData['weatherIcon'] = weatherIcon;
    arData['hilo'] = hilo;
    arData['humidity'] = objWeather.main.humidity + '%';
    arData['windspeed'] = objWeather.wind.speed;
    arData['sunrise'] = getTimeFromTimestamp(objWeather.sys.sunrise);
    arData['sunset'] = getTimeFromTimestamp(objWeather.sys.sunset);
    arData['pressure'] = objWeather.main.pressure + 'mb';
    arData['cloudcover'] = objWeather.clouds.all + '%';

    // apparently wind degrees aren't always sent sooo 
    if (typeof objWeather.wind.deg != 'undefined') {
        console.log('t');
        arData['winddirection'] = convertDegreesToDirection(objWeather.wind.deg);
    } else {
        console.log('f');
        arData['winddirection'] = 'Not Available';
    }

    // pop that info out to the screen
    showDataAsHTML(arData);

} // end function parseWeather

// will control the html display for the back and forth of celsius to farenheit
// as the user toggles
function toggleTemp() {

    // break out the current state of the temp and the temp itself
    var arInfo = window.name.split('|');
    var tempState = arInfo[0];
    var temp = arInfo[1];

    if (isNaN(temp)) {
        return;
    }

    // we also need to convert the high and low temps since I 
    // added them to the screen.
    var newTemp, newHi, newLo = 0;
    var hilo = $("#hilo").text();
    var arHilo = [];
    arHilo = hilo.split('/');
    var hi = arHilo[1].trim();
    var lo = arHilo[0].trim();

    // check if we're currently displaying the
    // farenheit or celsius temp to know what
    // to change it to
    if (tempState === 'F') {
        //console.log('change to celsius');
        // It's currently in farenheit
        // change to celsius
        newTemp = Math.round((temp - 32) / 1.8);
        //console.log('newtemp: ' + newTemp);

        // do the same for hi and lo
        newHi = Math.round((hi - 32) / 1.8);
        newLo = Math.round((lo - 32) / 1.8);

        // Show it in the hi/lo area
        $("#hilo").html(newLo + ' / ' + newHi);

        // Show it in the temp area
        $("#temp").html(newTemp + '&deg;');

        // show the link to show what it currently is (celsius)
        // but that they can change it if they want - hence the link
        $("#tempTypeLink").html('C');

        // change the button text to show changing to F
        $('#toggleTemp').html('F &deg;');

        // set window.name to show we're now in celsius
        window.name = 'C|' + newTemp;
    } // if
    else {
        // console.log('change to farenheit');
        // It's currently in celsius
        // change to farenheit
        newTemp = Math.round((temp * 1.8) + 32);
        // console.log('newtemp: ' + newTemp);

        // do the same for hi and lo
        newHi = Math.round((hi * 1.8) + 32);
        newLo = Math.round((lo * 1.8) + 32);

        // Show it in the hi/lo area
        $("#hilo").html(newLo + ' / ' + newHi);

        // Show it in the temp area
        $("#temp").html(newTemp + '&deg;');

        // change the button text to show changing to C
        $('#toggleTemp').html('C &deg;');

        // show the link to show what it currently is (farenheit)
        // but that they can change it if they want - hence the link
        $("#tempTypeLink").html('F');

        // set window.name to show we're now in celsius
        window.name = 'F|' + newTemp;

    } // else

} // end function toggleTemp


// Plugs the data into the HTML form that displays to the user
function showDataAsHTML(dataToDisplay) {

    $('#location').html(dataToDisplay.location);
    // $("#temp").html(dataToDisplay.temp + '&deg;');
    $("#desc").html(dataToDisplay.desc);
    $("#weatherIcon").html(dataToDisplay.weatherIcon);

    // now add in the "more info" items
    $("#humidity").html(dataToDisplay.humidity);
    $("#pressure").html(dataToDisplay.pressure);
    $("#windspeed").html(dataToDisplay.windspeed);
    $("#winddirection").html(dataToDisplay.winddirection);
    $("#sunrise").html(dataToDisplay.sunrise);
    $("#sunset").html(dataToDisplay.sunset);
    $("#cloudcover").html(dataToDisplay.cloudcover);
} // end function ShowDataAsHTML

// Alert the user in case there is an error getting a response from the API
function handleErr() {
    alert("Issues have been encountered. We apologize for the delay in obtaining your weather. Try again later");
} // end function handleErr


// Based on the string passed in this function will assign
// the icon to be displayed.
function determineWeatherIcon(weatherDesc) {
    var iconToReturn = '';
    switch (weatherDesc.toLowerCase()) {
        case 'rain':
            iconToReturn = arWeatherIcons.rain;
            break;
        case 'clouds':
        case 'mist':
        case 'fog':
        case 'haze':
            iconToReturn = arWeatherIcons.clouds;
            break;
        case 'clear':
            iconToReturn = arWeatherIcons.clear;
            break;
        case 'thunderstorm':
            iconToReturn = arWeatherIcons.thunderstorm;
            break;
        case 'snow':
        case 'blizzard':
        case 'flurries':
            iconToReturn = arWeatherIcons.snow;
            break;
        case 'partly cloudy':
            iconToReturn = arWeatherIcons.partlycloudy;
            break;
    } // switch

    return iconToReturn;
} // end function determineWeatherIcon

// This will load the current location weather as soon as the page loads.
$(document).ready(function() {
    getLocation();
}); // end document.ready

// this function will be used to convert the wind degrees
// into the wind direction
function convertDegreesToDirection(degrees) {
    console.log('d: ' + degrees);
    var val = Math.round((degrees / 22.5) + .5);
    console.log('v: ' + val);
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    console.log(arr[(val % 16)]);
    return arr[(val % 16)];
} // end function convertDegreesToDirection

// This function will allow the timestamp that is returned in JSON object to be
// displayed as a "normal" time to the user for both sunrise and sunset
function getTimeFromTimestamp(timestamp) {
    var date = new Date(timestamp * 1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    var formattedTime = '';
    // Will display time in 10:30:23 format
    console.log('hours: ' + hours)
    if (hours < 12) {
        formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + ' AM';
    } else {
        if (hours > 12) {
            hours = hours - 12;
        }

        formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + ' PM';
    }
    return formattedTime;
} // end function getTimeFromTimestamp



/* START FIXED LOCATION CODE */
/* ALL THIS CODE WAS GOING TO BE USED TO GET ADDRESS FROM FIXED LOCATION BUT THAT IS ON HOLD FOR NOW */
/*
function getLocationCoords() {

    // build those values into the api url
    var urlApi = "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyAWRoWbYBxWJy_ACrzrRPMyzjuRLSOov0E";

    // Request weather from API using this call - use jQuery to get the JSON weather object
    $.getJSON(urlApi) //, parseWeather); 
        .done(parseLocationWeather)
        .fail(handleLocErr);

     https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyAWRoWbYBxWJy_ACrzrRPMyzjuRLSOov0E

     var geocoder = new google.maps.Geocoder();
     var address = $("#locationToGet").text();
     geocoder.geocode({ 'address': address }, function(results, status) {
         if (status == google.maps.GeocoderStatus.OK) {
             // do something with the geocoded result
             //
             // results[0].geometry.location.latitude
             // results[0].geometry.location.longitude
         }
     })

}

// Will be called if location data could not be retrieved based on user entry into 
// the "locationToGet"
function handleLocErr() {
    $("#locationResults").html("Could not retrieve data for that location. Please try again.");
} // end function handleLocError

// 
function parseLocationWeather(data) {
    console.log(data);

    var strResponse = JSON.stringify(weather);
    console.log(strResponse);
    var objWeather = JSON.parse(strResponse);
}
*/
/* END FIXED LOCATION CODE */