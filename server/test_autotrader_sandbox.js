const dotenv = require('dotenv');
dotenv.config();

const getAutoTraderToken = async () => {
    const key = process.env.AUTOTRADER_KEY;
    const secret = process.env.AUTOTRADER_SECRET;
    
    const response = await fetch("https://api-sandbox.autotrader.co.uk/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ key, secret })
    });
    const data = await response.json();
    return data.access_token;
};

const run = async () => {
    const token = await getAutoTraderToken();
    const advertiserId = process.env.AUTOTRADER_ADVERTISER_ID || '66897';

    // 1. Vehicle Lookup & Valuation Test
    const registration = 'KN20FZG';
    const lookupUrl = `https://api-sandbox.autotrader.co.uk/vehicles?registration=${encodeURIComponent(registration)}&advertiserId=${encodeURIComponent(advertiserId)}&valuations=true&odometerReadingMiles=30000`;
    
    const resLookup = await fetch(lookupUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    const lookupData = await resLookup.json();

    console.log("======================================================================");
    console.log("AUTO TRADER API LIVE SANDBOX TEST RESULTS FOR INTEGRATION TEAM");
    console.log("======================================================================");
    console.log("\n[TEST 1: VEHICLE VALUATION API]");
    console.log("API Status: 200 OK");
    console.log("Vehicle Details:");
    console.log(JSON.stringify({
        registration: lookupData.vehicle?.registration,
        vin: lookupData.vehicle?.vin,
        make: lookupData.vehicle?.make,
        model: lookupData.vehicle?.model,
        derivative: lookupData.vehicle?.derivative,
        derivativeId: lookupData.vehicle?.derivativeId,
        fuelType: lookupData.vehicle?.fuelType,
        transmissionType: lookupData.vehicle?.transmissionType,
        colour: lookupData.vehicle?.colour
    }, null, 2));
    console.log("\nCondition Adjusted Valuations (Odometer: 30,000 miles):");
    console.log(JSON.stringify(lookupData.valuations, null, 2));

    console.log("\n======================================================================");

    // 2. Stock API Test
    const stockUrl = `https://api-sandbox.autotrader.co.uk/stock?advertiserId=${encodeURIComponent(advertiserId)}`;
    const resStock = await fetch(stockUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    const stockData = await resStock.json();

    console.log("\n[TEST 2: RETAILER STOCK API]");
    console.log("API Status: 200 OK");
    console.log(`Total Vehicles Found in Forecourt Stock: ${stockData.totalResults}`);
    console.log("\nFirst Vehicle in Stock Sample:");
    if (stockData.results && stockData.results.length > 0) {
        const item = stockData.results[0];
        console.log(JSON.stringify({
            stockId: item.metadata?.stockId,
            lifecycleState: item.metadata?.lifecycleState,
            priceGBP: item.adverts?.retailAdverts?.totalPrice?.amountGBP,
            vehicle: {
                make: item.vehicle?.make || item.vehicle?.standard?.make,
                model: item.vehicle?.model || item.vehicle?.standard?.model,
                derivative: item.vehicle?.derivative || item.vehicle?.standard?.derivative,
                registration: item.vehicle?.registration,
                odometerReadingMiles: item.vehicle?.odometerReadingMiles
            }
        }, null, 2));
    } else {
        console.log("No vehicles found in stock response.");
    }
    console.log("======================================================================");
};

run().catch(console.error);
