const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const getAutoTraderToken = async () => {
    const key = process.env.AUTOTRADER_KEY;
    const secret = process.env.AUTOTRADER_SECRET;
    if (!key || !secret) {
        throw new Error("AUTOTRADER_KEY and AUTOTRADER_SECRET must be set in .env file");
    }
    
    const response = await fetch("https://api-sandbox.autotrader.co.uk/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ key, secret })
    });

    if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.access_token;
};

const run = async () => {
    try {
        console.log("Authenticating with Auto Trader API...");
        const token = await getAutoTraderToken();
        console.log("Token obtained successfully.");

        console.log("Fetching makes list for vehicleType=Car...");
        const resMakes = await fetch("https://api-sandbox.autotrader.co.uk/taxonomy/makes?vehicleType=Car", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resMakes.ok) {
            throw new Error(`Failed to fetch makes: ${resMakes.status} ${await resMakes.text()}`);
        }

        const makesData = await resMakes.json();
        const makes = makesData.makes || [];
        console.log(`Found ${makes.length} makes. Fetching models for each...`);

        const taxonomy = {};
        let count = 0;
        
        // Fetch in batches to respect rate limits and keep it fast
        const batchSize = 10;
        for (let i = 0; i < makes.length; i += batchSize) {
            const batch = makes.slice(i, i + batchSize);
            await Promise.all(batch.map(async (make) => {
                try {
                    const resModels = await fetch(`https://api-sandbox.autotrader.co.uk/taxonomy/models?makeId=${make.makeId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (resModels.ok) {
                        const modelsData = await resModels.json();
                        const models = (modelsData.models || []).map(m => m.name).sort();
                        if (models.length > 0) {
                            taxonomy[make.name] = models;
                        }
                    } else {
                        console.error(`Failed to fetch models for make ${make.name}: ${resModels.status}`);
                    }
                } catch (err) {
                    console.error(`Error fetching models for make ${make.name}:`, err.message);
                }
            }));
            count += batch.length;
            console.log(`Progress: ${count}/${makes.length} makes processed...`);
            // Brief sleep between batches
            await new Promise(r => setTimeout(r, 100));
        }

        // Sort keys alphabetically
        const sortedTaxonomy = {};
        Object.keys(taxonomy).sort().forEach(k => {
            sortedTaxonomy[k] = taxonomy[k];
        });

        const outputPath = path.join(__dirname, '../src/data/autotrader_makes_models.json');
        fs.writeFileSync(outputPath, JSON.stringify(sortedTaxonomy, null, 4));
        console.log(`\nSuccess! Taxonomy dataset saved to ${outputPath}`);
        console.log(`Total makes with models: ${Object.keys(sortedTaxonomy).length}`);
    } catch (err) {
        console.error("Refresh failed:", err);
    }
};

run();
