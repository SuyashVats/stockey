// chart.js

/**
 * Create a reusable function to initialize a chart.
 * @param {HTMLCanvasElement} canvas - The canvas element to render the chart.
 * @param {string[]} labels - Array of labels for the x-axis.
 * @param {number[]} data - Array of data points for the chart.
 * @param {string} label - The label for the dataset.
 * @param {string} borderColor - Border color for the line.
 * @param {string} backgroundColor - Background color for the line.
 * @returns {Chart} - Returns the initialized Chart.js instance.
 */
export function createChart(canvas, labels, data, label, borderColor, backgroundColor) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Canvas element not found!');
        return null;
    }

    // Destroy previous chart if exists
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Create new chart
    canvas.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor,
                backgroundColor,
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

    return canvas.chartInstance;
}
