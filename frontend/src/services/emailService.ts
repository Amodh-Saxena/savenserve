import emailjs from '@emailjs/browser';

/**
 * Make sure to add these to your .env file:
 * VITE_EMAILJS_SERVICE_ID=your_service_id
 * VITE_EMAILJS_TEMPLATE_ID=your_template_id
 * VITE_EMAILJS_PUBLIC_KEY=your_public_key
 */
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_xrlon1l';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_dhaywbi';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'XOLcGuz16x_Q5_ywo';

export interface EmailParams {
  name: string;
  food_type: string;
  quantity: string | number;
  location: string;
  time: string;
  status: string;
  to_email?: string; // Optional: specify dynamic recipient if configured
  pickup_person?: string; // Information about the person picking up the donation
  contact_number?: string; // Contact number of the pickup person
}

/**
 * Sends a dynamic email notification using EmailJS
 * @param params - The dynamic data corresponding to template variables
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const sendDynamicEmail = async (params: EmailParams): Promise<boolean> => {
  try {
    // Map the params to exactly match the {{variable}} formats in your template
    const templateParams = {
      name: params.name,
      food_type: params.food_type, // Can be a comma-separated string for multiple items
      quantity: params.quantity.toString(),
      location: params.location,
      time: params.time,
      status: params.status,
      to_email: params.to_email || '', // If passing recipient dynamically
      pickup_person: params.pickup_person || 'N/A',
      contact_number: params.contact_number || 'N/A'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('[EmailJS] Notification successfully sent!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('[EmailJS] Failed to send email notification:', error);
    return false;
  }
};
