require('dotenv').config();
const app = require('./app');

// Start cron jobs and simulator
const useDummyAuth = String(process.env.USE_DUMMY_AUTH || 'true').toLowerCase() === 'true';
if (useDummyAuth) {
  console.log('[MODE] USE_DUMMY_AUTH=true -> skipping DB cron jobs and bus simulator.');
} else {
  const { startCronJobs } = require('./utils/cronJobs');
  const { startBusSimulator } = require('./utils/busSimulator');
  startCronJobs();
  startBusSimulator();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SmartBusPass running on http://localhost:${PORT}`));
