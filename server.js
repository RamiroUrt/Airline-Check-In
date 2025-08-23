import app from "./src/app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8080;

const HOST = '0.0.0.0';

console.log('🔄 Starting server on:', HOST, PORT);

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Public URL: https://Airline-Check-In.up.railway.app`);
});

if (!process.env.MYSQL_URL) {
  console.log('⚠️  MYSQL_URL not found, using local config');
}

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
});

//aca tuve un problema con Raleway y me lo sugirio la Ia
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

