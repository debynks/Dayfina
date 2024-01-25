// app.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Set the view engine to EJS
app.set('view engine', 'ejs');
app.use("/views",express.static('views'));


const apiUrl = 'http://www.floatrates.com/daily/usd.json';
const jsonFilePath = path.join(__dirname, 'currency.json');
const dateFilePath = path.join(__dirname, 'lastUpdateDate.txt');

// Function to get the current date in the format YYYY-MM-DD
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to read the last update date from the file
function getLastUpdateDate() {
  try {
    const lastUpdateDate = fs.readFileSync(dateFilePath, 'utf-8').trim();
    return lastUpdateDate;
  } catch (error) {
    return null; // Return null if the file doesn't exist or there's an error reading it
  }
}

// Function to write the current date to the file
function writeLastUpdateDate() {
  const currentDate = getCurrentDate();
  fs.writeFileSync(dateFilePath, currentDate, 'utf-8');
}

// Function to fetch currency exchange rates and update the JSON file
async function updateCurrencyFile() {
  try {
    // Fetch currency exchange rates from the API
    const response = await axios.get(apiUrl);
    const exchangeRates = response.data;

    // Write the updated exchange rates to the JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(exchangeRates, null, 0), 'utf-8');

    // Record the current date as the last update date
    writeLastUpdateDate();

    console.log('Currency file updated successfully.');
  } catch (error) {
    console.error('Error updating currency file:', error.message);
  }
}

// Function to read contents from currency.json
function readCurrencyFile() {
  try {
    // Read contents from the JSON file
    const fileContents = fs.readFileSync(jsonFilePath, 'utf-8');
    const exchangeRates = JSON.parse(fileContents);

    return exchangeRates;
  } catch (error) {
    console.error('Error reading currency file:', error.message);
    return null;
  }
}

// Serve HTML page with a form
// app.get('/', (req, res) => {
//   const exchangeRates = readCurrencyFile();
//   if (exchangeRates) {
//     res.sendFile(__dirname + '/index.html', { exchangeRates });
//   } else {
//     res.status(500).send('Internal Server Error');
//   }
// });

app.get('/', function(req, res){
    const exchangeRates = readCurrencyFile();
    res.render('index.ejs', { result: null, toCurrency: null, exchangeRates });
});

// Handle form submission
// Modify the app.post('/convert', ...) route to handle AJAX request
app.post('/convert', (req, res) => {
  const { amount, fromCurrency } = req.body;

  try {
    // Read contents from the JSON file
    const exchangeRates = readCurrencyFile();

    if (!exchangeRates || !exchangeRates[fromCurrency]) {
      res.status(400).json({ error: 'Invalid fromCurrency provided.' });
      return;
    }

    // Convert the amount to Indian Rupees
    const toCurrency = 'inr';
    const conversionRate = 1 / exchangeRates[fromCurrency].rate;
    const realresult = amount * conversionRate 
    const result = realresult.toFixed(2);

    res.json({ result, toCurrency });
  } catch (error) {
    console.error('Error converting currency:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
