import logger from 'jet-logger';
import app from './server';

// Start the server
const PORT = process.env.PORT || 3001;

const jetLogger = logger;

app.listen(PORT, () => {
  jetLogger.info('Express server started on port: ' + PORT);
});

export default app;
