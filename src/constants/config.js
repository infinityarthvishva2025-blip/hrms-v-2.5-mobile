// Set this to true to use the production/deployed backend
const IS_PRODUCTION = false; 

// const DEV_URL = 'https://hrms-v-2-5-backend.vercel.app/'; 
// const PROD_URL = 'https://hrms-v-2-5-backend.vercel.app/';

// https://hrms-v-2-5-backend.vercel.app/
const DEV_URL = 'http://192.168.1.53:5000'; 
const PROD_URL = 'http://192.168.1.53:5000';

// https://hrms-v-2-5-backend.vercel.app/





const BASE_URL = IS_PRODUCTION ? PROD_URL : DEV_URL;

export default {
  API_URL: `${BASE_URL}/api`,
  BASE_URL
};


