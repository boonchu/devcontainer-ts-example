import express, { Express, Request, Response } from 'express';
import os from 'os';

// Types
interface Document {
	id: string;
	text: string;
}

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

// Constants
const PORT: number = 3000;
const HOST: string = '0.0.0.0';

// Retrieval helper
const documents: Document[] = [
	{ id: '1', text: 'The privacy policy states user data is retained for 30 days.' },
	{ id: '2', text: 'Payment information is encrypted and stored securely.' },
	{ id: '3', text: 'We do not share user email addresses with third parties.' }
];

function scoreDocument(query: string, doc: Document): number {
	const queryTerms = query.toLowerCase().split(/\s+/);
	const text = doc.text.toLowerCase();
	return queryTerms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

async function retrieveDocuments(query: string): Promise<Document[]> {
	return documents
		.map(doc => ({ doc, score: scoreDocument(query, doc) }))
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(item => item.doc);
}

// App
const app: Express = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response): void => {
	res.send('Starting LLM Service...\n');
});

app.get('/app/version', async (_req: Request, res: Response<EnvironmentInfo>): Promise<void> => {
	let vllmVersion: Record<string, unknown> | null = null;

	try {
		const response = await fetch('http://vllm:8000/api/version');
		if (response.ok) {
			vllmVersion = await response.json() as Record<string, unknown>;
		}
	} catch {
		vllmVersion = null;
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
		vllmVersion: vllmVersion
	});
});

app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
	const { prompt, model = 'phi' } = req.body;
	const docs = await retrieveDocuments(prompt);

	const context = docs.map((d, i) => `Context ${i + 1}: ${d.text}`).join('\n\n');
	const fullPrompt = `
Use the following documents to answer the question.
If the answer is not in the documents, say "I don't know."

${context}

Question: ${prompt}
Answer:
`;
	try {
		const response = await fetch('http://vllm:8000/v1/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'microsoft/phi-2',
				prompt: fullPrompt,
				max_tokens: 512
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
		const response = await fetch('http://vllm:8000/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'microsoft/phi-2',
				messages: messages,
				max_tokens: 512
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
