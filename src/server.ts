import express, { Express, Request, Response } from 'express';
import os from 'os';
import { retrieveDocuments } from '../lib/retrievalDocument';

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
	ollamaVersion: Record<string, unknown> | null;
}

interface OllamaResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
}

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ChatRequest {
	model?: string;
	messages: ChatMessage[];
}

interface ChatResponse {
	model: string;
	created_at: string;
	message: ChatMessage;
	done: boolean;
}

// App
const app: Express = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response): void => {
	res.send('Starting LLM Service...\n');
});

app.get('/app/version', async (_req: Request, res: Response<EnvironmentInfo>): Promise<void> => {
	let ollamaVersion: Record<string, unknown> | null = null;

	try {
		const response = await fetch('http://ollama:11434/api/version');
		if (response.ok) {
			ollamaVersion = await response.json() as Record<string, unknown>;
		}
	} catch {
		ollamaVersion = null;
	}

	res.json({
		platform: process.platform,
		nodeVersion: process.version,
		nodeEnv: process.env.NODE_ENV || 'development',
		arch: process.arch,
		osType: os.type(),
		osRelease: os.release(),
		hostname: os.hostname(),
		uptime: process.uptime(),
		ollamaVersion: ollamaVersion
	});
});

app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
	const { question, model = 'phi' } = req.body;
	const docs = await retrieveDocuments(question);

	const context = docs.map((d, i) => `Context ${i + 1}: ${d.text}`).join('\n\n');
	const prompt = `
Use the following documents to answer the question.
If the answer is not in the documents, say "I don't know."

${context}

Question: ${question}
Answer:
`;
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

app.post('/app/chat', async (req: Request, res: Response): Promise<void> => {
	const { messages, model = 'phi' } = req.body as ChatRequest;
	try {
		const response = await fetch('http://ollama:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: model,
				messages: messages,
				stream: false
			})
		});
		const data = await response.json() as ChatResponse;
		res.json({ response: data.message.content });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(PORT, HOST, (): void => {
	console.log(`Running on http://${HOST}:${PORT}`);
});
