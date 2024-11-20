const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const dotenv = require('dotenv');
const path = require('path'); // Correctly import the path module

dotenv.config();

const app = express();
const PORT = 4000;

// Mock USD to INR conversion rate (replace with real-time API for dynamic rates)
const usdToInrRate = 83.50;

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
