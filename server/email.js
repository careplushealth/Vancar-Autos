const sendInquiryEmail = async (inquiry) => {
    const formspreeEndpoint = 'https://formspree.io/f/xlgyelej';
    
    // Format the payload so Formspree emails are readable
    const payload = {
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || 'Not provided',
        subject: inquiry.subject || 'General Enquiry',
        message: inquiry.message,
        enquiry_type: inquiry.type
    };

    // Flatten vehicle details if present so they show up clearly in the Formspree email
    if (inquiry.type === 'vehicle_inquiry' && inquiry.vehicle_details) {
        const vehicle = inquiry.vehicle_details;
        payload.vehicle_title = vehicle.title;
        payload.vehicle_price = `£${Number(vehicle.price || 0).toLocaleString('en-GB')}`;
        payload.vehicle_mileage = `${Number(vehicle.mileage || 0).toLocaleString('en-GB')} miles`;
        payload.vehicle_year = vehicle.year;
        payload.vehicle_id = vehicle.id;
    } else if (inquiry.type === 'sell_valuation' && inquiry.vehicle_details) {
        const vehicle = inquiry.vehicle_details;
        payload.valuation_registration = vehicle.registration || 'N/A';
        payload.valuation_make_model = `${vehicle.make} ${vehicle.model}`;
        payload.valuation_year = vehicle.year || 'N/A';
        payload.valuation_mileage = `${Number(vehicle.mileage || 0).toLocaleString('en-GB')} miles`;
        payload.valuation_condition = vehicle.condition;
        payload.valuation_service_history = vehicle.serviceHistory;
        payload.valuation_accidents = vehicle.accidents;
    }

    try {
        const response = await fetch(formspreeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log(`[Formspree] Successfully forwarded enquiry for: ${inquiry.name}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`[Formspree Error] Failed to submit to Formspree:`, errorText);
            return false;
        }
    } catch (err) {
        console.error(`[Formspree Connection Error] Failed to send request:`, err);
        return false;
    }
};

module.exports = {
    sendInquiryEmail
};
