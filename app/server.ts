/**
 * Entry point for starting a server.
 */
import { app } from './app';

const port = process.env.PORT || 3000;

app.listen(port);
console.log('Server started! At http://localhost:' + port);
