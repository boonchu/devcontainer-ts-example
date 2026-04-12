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

interface OllamaResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
}

// App
const app: Express = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response): void => {
	res.send('Hello my service!\n');
});

app.get('/environment', (_req: Request, res: Response<EnvironmentInfo>): void => {
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

app.post('/ollama', async (req: Request, res: Response): Promise<void> => {
	const { prompt, model = 'phi' } = req.body;
	try {
		const response = await fetch('http://ollama:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: model,
				prompt: prompt,
				stream: false
			})
		});
		const data = await response.json() as OllamaResponse;
		res.json({ response: data.response });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(PORT, HOST, (): void => {
	console.log(`Running on http://${HOST}:${PORT}`);
});
