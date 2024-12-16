document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('stock-search');
    const suggestionsBox = document.getElementById('suggestions');
    const selectedStock = document.getElementById('selected-stock');
    const stockPrice = document.getElementById('stock-price');
    const stockChange = document.getElementById('stock-change');
    const stockChartContainer = document.getElementById('stock-chart');

    let chartInstance = null; // Store the chart instance
    let currentSymbol = ''; // Store the current symbol
    let currentRange = '1m'; // Default to '1m' range

    // Fetch stock suggestions based on user input
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();

        if (query.length === 0) {
            suggestionsBox.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/search/${query}`);
            const suggestions = await response.json();

            suggestionsBox.innerHTML = suggestions
                .map((item) => `<li data-symbol="${item.symbol}" role="button">${item.name} (${item.symbol})</li>`)
                .join('');
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    });

    // Fetch stock history for chart based on the symbol and time range
    async function fetchStockHistory(symbol, range) {
        try {
            const response = await fetch(`/stock/history/${symbol}?range=${range}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stock history:', error);
            return { labels: [], data: [] };
        }
    }

    // Format the date based on the selected time range
    function formatDate(date, range) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };

        if (range === '1d') {
            return new Date(date).toLocaleString('en-US', { ...options, hour: 'numeric', minute: 'numeric' }); // Show time for 1d
        } else if (range === '5d') {
            return new Date(date).toLocaleString('en-US', { ...options }); // Show date for 5d
        } else if (range === '1m') {
            return new Date(date).toLocaleString('en-US', { ...options }); // Show date for 1m
        } else if (range === 'max') {
            return new Date(date).getFullYear(); // Show year for max range
        }
        return date;
    }

    // Interpolate the data between the points (without skipping for 1d and 5d)
    function interpolateData(labels, data, range) {
        let interpolatedLabels = [];
        let interpolatedData = [];

        // For 1d and 5d, no gap. For others, a gap is applied.
        const gap = range === '1d' || range === '5d' ? 1 : 5;

        for (let i = 0; i < labels.length; i++) {
            const currentLabel = labels[i];
            const currentPrice = data[i];

            // Add a label for every data point based on range
            if (i % gap === 0 || i === labels.length - 1) {
                interpolatedLabels.push(formatDate(currentLabel, range));
            } else {
                interpolatedLabels.push('');
            }

            interpolatedData.push(currentPrice);
        }

        return { labels: interpolatedLabels, data: interpolatedData };
    }

    // Render the stock chart with the given symbol and time range
    async function renderStockChart(symbol, range) {
        const { labels, data } = await fetchStockHistory(symbol, range);
    
        if (labels.length === 0 || data.length === 0) {
            console.error('No data available to render the chart.');
            return;
        }
    
        // Interpolate the data between the points
        const { labels: interpolatedLabels, data: interpolatedData } = interpolateData(labels, data, range);
    
        // Determine the graph color based on the price change
        let graphColor = '#e94560'; // Default to red (loss)
        if (range === '1d' || range === '5d' || range === '1m') {
            const priceChange = data[data.length - 1] - data[0]; // Change in price
            graphColor = priceChange > 0 ? '#4caf50' : '#e94560'; // Green for profit, red for loss
        } else if (range === 'max') {
            const priceChange = data[data.length - 1] - data[0];
            graphColor = priceChange > 0 ? '#4caf50' : '#e94560'; // Green for profit, red for loss
        }
    
        const options = {
            chart: {
                type: 'line',
                height: 350,
                zoom: { enabled: true },
                toolbar: { show: false },
            },
            series: [{
                name: 'Price',
                data: interpolatedData,
                color: graphColor, // Set the color of the graph line
            }],
            xaxis: {
                categories: interpolatedLabels, // Display the X-axis labels based on the range
                labels: {
                    style: {
                        colors: '#f5f5f5',
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#f5f5f5',
                    },
                },
            },
            tooltip: {
                enabled: true,
                shared: true,
                intersect: false,
                x: {
                    show: true,
                    formatter: function (val) {
                        // Ensure the X value (date) is formatted correctly
                        const date = new Date(val);
                        return date.toLocaleDateString(); // Format date as MM/DD/YYYY
                    },
                    style: {
                        color: '#ffffff', // Tooltip date text color
                    },
                },
                y: {
                    formatter: function (val) {
                        return `$${val}`; // Format the Y-axis price value as currency
                    },
                    style: {
                        color: '#ffffff', // Tooltip price text color
                    },
                },
                theme: 'dark', // Set the theme to dark for tooltip background
                marker: {
                    show: true, // Show marker for the tooltip
                },
            },
            grid: {
                borderColor: '#444',
            },
            stroke: {
                curve: 'smooth', // Smooth curve for interpolation
                width: 2,
            },
            markers: {
                
                
            },
        };
    
        // Destroy any existing chart before creating a new one
        if (chartInstance) {
            chartInstance.destroy();
        }
    
        chartInstance = new ApexCharts(stockChartContainer, options);
        chartInstance.render();
    }
    
    // Handle suggestion click to show stock info and chart
    suggestionsBox.addEventListener('click', async (event) => {
        if (event.target.tagName === 'LI') {
            const symbol = event.target.dataset.symbol;
            searchInput.value = symbol;
            suggestionsBox.innerHTML = '';
            currentSymbol = symbol;

            try {
                const response = await fetch(`/stock/${symbol}`);
                const data = await response.json();

                if (data.error) {
                    selectedStock.textContent = '';
                    stockPrice.textContent = data.error;
                    stockChange.textContent = '';
                } else {
                    const { price, currency, convertedPriceInInr, changePercent } = data;

                    selectedStock.textContent = `Selected Stock: ${symbol}`;

                    if (currency === 'INR') {
                        stockPrice.textContent = `Price: ₹${price} (INR)`;
                    } else {
                        stockPrice.innerHTML = `Price: <span style="color: #e94560;">$${price} (USD)</span> (<span style="color: #4caf50;">₹${convertedPriceInInr}</span>)`;
                    }

                    stockChange.innerHTML = `Change: <span style="color: ${changePercent > 0 ? '#4caf50' : '#e94560'};">${changePercent > 0 ? '+' : ''}${changePercent}%</span>`;

                    // Render chart with default range (1 month)
                    await renderStockChart(symbol, currentRange);
                }
            } catch (error) {
                console.error('Error fetching stock price:', error);
            }
        }
    });

    // Time range buttons (click handler)
    const timeButtons = document.querySelectorAll('.time-range-btn');
    timeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            currentRange = button.dataset.range; // Update the selected range
            if (currentSymbol) {
                await renderStockChart(currentSymbol, currentRange); // Re-render chart with new range
            }
        });
    });
});
