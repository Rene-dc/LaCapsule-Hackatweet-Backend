const moment = require('moment');

function formatElapsedTime(elapsedTime) {
  // Convert the duration to total seconds for easier calculation
  const totalSeconds = Math.abs(elapsedTime.asSeconds());
  const secondsInAMinute = 60;
  const secondsInAnHour = 3600;
  const secondsInADay = 86400;
  const secondsInAMonth = 2629800; // Approximate average

  let seconds = totalSeconds;
  const months = Math.floor(seconds / secondsInAMonth);
  seconds -= months * secondsInAMonth;
  const days = Math.floor(seconds / secondsInADay);
  seconds -= days * secondsInADay;
  const hours = Math.floor(seconds / secondsInAnHour);
  seconds -= hours * secondsInAnHour;
  const minutes = Math.floor(seconds / secondsInAMinute);

  let formattedElapsedTime = "";

  if (months > 0) {
    formattedElapsedTime += months + " month" + (months > 1 ? "s, " : ", ");
}
if (days > 0) {
    formattedElapsedTime += days + " day" + (days > 1 ? "s, " : ", ");
}
if (hours > 0) {
    formattedElapsedTime += hours + " hour" + (hours > 1 ? "s, " : ", ");
}
if (minutes > 0) {
    formattedElapsedTime += minutes + " minute" + (minutes > 1 ? "s " : " ");
}

  // If no time has passed, or it's less than a minute
  if (formattedElapsedTime === "") {
    formattedElapsedTime = "less than a minute ";
  }

  formattedElapsedTime = formattedElapsedTime.replace(/, $/, "") + "ago";

  return formattedElapsedTime;
}

module.exports = { formatElapsedTime };
