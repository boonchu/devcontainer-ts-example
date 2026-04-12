/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import express, { Express, Request, Response } from 'express';
import os from 'os';

// Constants
const PORT: number = 3000;
const HOST: string = '0.0.0.0';

// Types
interface EnvironmentInfo {
	platform: string;
	nodeVersion: string;
	nodeEnv: string;
	arch: string;
	osType: string;
	osRelease: string;
	hostname: string;
	uptime: number;
}

// App
const app: Express = express();

app.get('/', (req: Request, res: Response): void => {
	res.send('Hello remote world!\n');
});

app.get('/environment', (req: Request, res: Response<EnvironmentInfo>): void => {
	res.json({
		platform: process.platform,
		nodeVersion: process.version,
		nodeEnv: process.env.NODE_ENV || 'development',
		arch: process.arch,
		osType: os.type(),
		osRelease: os.release(),
		hostname: os.hostname(),
		uptime: process.uptime()
	});
});

app.listen(PORT, HOST, (): void => {
	console.log(`Running on http://${HOST}:${PORT}`);
});