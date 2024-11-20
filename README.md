# Stock Price Checker

The **Stock Price Checker** is a JavaScript-based application that retrieves real-time stock prices from Yahoo Finance and converts them from USD to INR. The application is simple, efficient, and perfect for anyone who needs quick and accurate stock information.

## Features
- **Real-time Stock Prices**: Fetches live stock prices from Yahoo Finance.
- **Currency Conversion**: Converts stock prices from USD to INR using the latest exchange rates.
- **Simple and Fast**: Easy-to-run script for instant results.

## Requirements
Before running the Stock Price Checker, make sure you have:
- **Node.js** (Version 14.0 or later recommended)
- A working internet connection for API calls

Install the required npm packages:

```bash
npm install axios yahoo-finance forex-rates-api
```

## Setup
1. Clone the repository or download the source code.
2. Open a terminal and navigate to the project directory.
3. Install dependencies:

```bash
   npm install
```
4.Run the application with the following command:

```bash
node app.js
```

## How It Works

### Fetch Stock Price:
Uses the Yahoo Finance API (via `yahoo-finance` or a similar library) to get the current stock price.

### Fetch Exchange Rate:
Queries live USD to INR rates using a reliable exchange rate API (e.g., `forex-rates-api`).

### Display Results:
Outputs the stock price in both USD and INR on the console.

## Example Usage
After starting the application, input a stock ticker symbol when prompted (e.g., `TSLA` for Tesla or `GOOGL` for Alphabet).

The output will look like this:

```text
Stock: TSLA
Price in USD: $250.00
Price in INR: ₹20,750.00
Exchange Rate (USD to INR): 83.00
```
## Future Enhancements
- Develop a web-based UI using a frontend framework like React.
- Enable tracking of multiple stock prices simultaneously.
- Add historical data analysis and graphing functionality.

## License
You are free to use, modify, and distribute it as per the license terms.

## Author
Developed by Suyash Vats.

For questions or feedback, contact [suyashvats05@gmail.com](mailto:suyashvats05@gmail.com).

---

**Track Smart, Invest Smarter!**
