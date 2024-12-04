document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('stock-search');
    const suggestionsBox = document.getElementById('suggestions');
    const selectedStock = document.getElementById('selected-stock');
    const stockPrice = document.getElementById('stock-price');
    const stockChange = document.getElementById('stock-change');
    const stockChart = document.getElementById('stock-chart');

    let chartInstance = null; // Store the chart instance

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

    // Fetch stock history for chart
    async function fetchStockHistory(symbol) {
        try {
            const response = await fetch(`/stock/history/${symbol}`);
            const data = await response.json();
    
            return data;
        } catch (error) {
            console.error('Error fetching stock history:', error);
            return { labels: [], data: [] };
        }
    }
    
    
    // Render or update stock chart
    async function renderStockChart(symbol) {
        const { labels, data } = await fetchStockHistory(symbol);
    
        // Log labels and data to ensure it's correct
        console.log('Labels:', labels);
        console.log('Data:', data);
    
        if (labels.length === 0 || data.length === 0) {
            console.error('No data available to render the chart.');
            return; // Exit early if there's no data to display
        }
    
        const ctx = stockChart.getContext('2d');
        if (chartInstance) chartInstance.destroy(); // Destroy any existing chart before creating a new one
    
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels, // Use dynamic labels
                datasets: [{
                    label: `Price Trend (${symbol})`,
                    data: data, // Use dynamic data
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.4,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    x: { ticks: { color: '#f5f5f5' } },
                    y: { ticks: { color: '#f5f5f5' } },
                },
                plugins: {
                    legend: { display: true, labels: { color: '#f5f5f5' } },
                },
            },
        });
    }
    
    // Handle suggestion click to show stock info and chart
    suggestionsBox.addEventListener('click', async (event) => {
        if (event.target.tagName === 'LI') {
            const symbol = event.target.dataset.symbol;
            searchInput.value = symbol;
            suggestionsBox.innerHTML = '';

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

                    // Render chart
                    renderStockChart(symbol);
                }
            } catch (error) {
                console.error('Error fetching stock price:', error);
            }
        }
    });
});
