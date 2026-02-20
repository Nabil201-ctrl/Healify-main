// Uses native fetch (Node 18+)

export async function fetchGoogleFitData(accessToken) {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const startTimeMillis = start.getTime();
    const endTimeMillis = end.getTime();

    const body = {
        aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.heart_rate.bpm' }
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
    };

    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Fit API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return parseGoogleFitData(data);
}

function parseGoogleFitData(data) {
    let steps = 0;
    let heartRates = [];

    if (!data.bucket || data.bucket.length === 0) return { steps, heartRate: 0 };

    data.bucket.forEach(bucket => {
        bucket.dataset.forEach(dataset => {
            dataset.point.forEach(point => {
                if (dataset.dataSourceId.includes('step_count')) {
                    point.value.forEach(val => {
                        steps += val.intVal || 0;
                    });
                }
                if (dataset.dataSourceId.includes('heart_rate')) {
                    point.value.forEach(val => {
                        if (val.fpVal) heartRates.push(val.fpVal);
                    });
                }
            });
        });
    });

    const avgHeartRate = heartRates.length > 0
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : 0;

    return { steps, heartRate: avgHeartRate };
}
