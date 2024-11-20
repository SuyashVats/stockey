document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('stock-search');
    const suggestionsBox = document.getElementById('suggestions');
    const selectedStock = document.getElementById('selected-stock');
    const stockPrice = document.getElementById('stock-price');
    const stockChange = document.createElement('p'); // Add element for change percent
    stockChange.id = 'stock-change';
    document.getElementById('stock-info').appendChild(stockChange);

    // Fetch suggestions based on user input
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
                .map((item) => `<li data-symbol="${item.symbol}">${item.name} (${item.symbol})</li>`)
                .join('');
            
            // Animate suggestions list with GSAP
            gsap.fromTo("#suggestions", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 });
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    });

    // Handle suggestion click
    suggestionsBox.addEventListener('click', async (event) => {
        if (event.target.tagName === 'LI') {
            const symbol = event.target.dataset.symbol;
            searchInput.value = symbol; // Set input value to the selected stock
            suggestionsBox.innerHTML = ''; // Clear suggestions

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
                        stockPrice.innerHTML = `Price: 
                            <span style="color: #e94560;">$${price} (USD)</span> 
                            (<span style="color: #4caf50;">₹${convertedPriceInInr}</span>)
                        `;
                    }
                
                    stockChange.innerHTML = `Change: 
                        <span style="color: ${changePercent > 0 ? '#4caf50' : '#e94560'};">
                            ${changePercent > 0 ? '+' : ''}${changePercent}%
                        </span>
                    `;
                    
                    // Animate stock information with GSAP
                    gsap.fromTo("#stock-info", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 });
                }
            } catch (error) {
                console.error('Error fetching stock price:', error);
            }
        }
    });
});

