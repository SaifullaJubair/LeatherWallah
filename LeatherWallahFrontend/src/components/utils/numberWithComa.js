export function numberWithCommas(x) {
  // Check if x is defined and not null
  if (x !== undefined && x !== null) {
    // Use the toString method if x is a valid value
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
  } else {
    // Handle the case where x is undefined or null
    return "0"; // or any default value or an empty string, depending on your requirements
  }
}
