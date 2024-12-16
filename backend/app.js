const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = 4000;

// Mock USD to INR conversion rate (replace with real-time API for dynamic rates)
const usdToInrRate = 83.50;

// Enable CORS
app.use(cors());

// Serve static files from the "frontend" folder
app.use(express.static(path.resolve(__dirname, '../frontend')));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

// Endpoint for stock suggestions
app.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    try {
        const searchResults = await yahooFinance.search(query);

        if (!searchResults.quotes || searchResults.quotes.length === 0) {
            return res.json([]);
        }

        const suggestions = searchResults.quotes.map((item) => ({
            symbol: item.symbol,
            name: item.shortname || item.longname,
        }));

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ error: 'Error fetching search suggestions.' });
    }
});

// Endpoint for fetching the current stock price
app.get('/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    console.log('Requested Symbol:', symbol); // Debug the symbol

    try {
        const quote = await yahooFinance.quote(symbol);

        if (!quote) {
            console.error('No data received for the requested symbol:', symbol);
            return res.status(404).json({ error: 'Stock not found.' });
        }

        console.log('Quote Response:', quote); // Debug the API response

        const isNSEStock = symbol.endsWith('.NS'); // Detect NSE-listed stocks
        const price = quote.regularMarketPrice;
        const priceInInr = isNSEStock ? price : (price * usdToInrRate).toFixed(2);
        const changePercent = quote.regularMarketChangePercent?.toFixed(2);

        // Ensure the time is in milliseconds (multiply by 1000 if it's in seconds)
        const marketTime = quote.regularMarketTime ? quote.regularMarketTime * 1000 : Date.now();

        res.json({
            symbol: symbol,
            price: price, // Raw price
            currency: isNSEStock ? 'INR' : 'USD',
            convertedPriceInInr: isNSEStock ? null : priceInInr, // For non-NSE stocks
            changePercent: changePercent || '0.00', // Default to 0.00 if not provided
            time: marketTime, // Return time in milliseconds
        });
    } catch (error) {
        console.error('Error fetching stock price:', error);
        res.status(500).json({ error: 'Error fetching stock price.' });
    }
});

// Endpoint for fetching stock history
app.get('/stock/history/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const range = req.query.range; // Example values: '1d', '5d', '1m', '1y', 'max'

    console.log('Requested Symbol:', symbol);
    console.log('Requested Range:', range); // Debugging the range parameter

    let interval;
    let rangeParam;

    // Map the range to the correct interval and period for Yahoo Finance API
    switch (range) {
        case '1d':
            interval = '1h'; // Hourly data for the last 24 hours
            rangeParam = '1d';
            break;
        case '5d':
            interval = '1d'; // Daily data for the last 5 days
            rangeParam = '5d';
            break;
        case '1m':
            interval = '1d'; // Daily data for the last month
            rangeParam = '1mo';
            break;
        case '1y':
            interval = '1wk'; // Weekly data for the last year
            rangeParam = '1y';
            break;
        case 'max':
            interval = '1wk'; // Weekly data for the maximum available data
            rangeParam = 'max';
            break;
        default:
            return res.status(400).json({ error: 'Invalid range.' });
    }

    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${symbol}?range=${rangeParam}&interval=${interval}`);
        const data = response.data;

        console.log('Yahoo Finance Data:', data); // Log the data returned from Yahoo

        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            return res.status(404).json({ error: 'Stock history not found.' });
        }

        const { timestamp, indicators } = data.chart.result[0];
        const prices = indicators?.quote[0]?.close;

        if (!prices || prices.length === 0) {
            return res.status(404).json({ error: 'No stock prices available for the given symbol.' });
        }

        const result = {
            labels: timestamp.map((ts) => new Date(ts * 1000).toLocaleDateString()),
            data: prices,
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching stock history:', error);
        res.status(500).json({ error: 'Error fetching stock history' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});