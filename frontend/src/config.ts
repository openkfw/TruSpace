const apiUrlEnv = "NEXT_PUBLIC_API_URL";

const config = {
   apiUrl: process.env[apiUrlEnv] || "http://localhost:8000/api"
};

export default config;
