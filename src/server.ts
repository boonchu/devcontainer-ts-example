import express, { Express, Request, Response } from 'express';
import os from 'os';
import { retrieveDocuments } from './retrievalDocuments';

interface EnvironmentInfo {
	platform: string;
	nodeVersion: string;
	nodeEnv: string;
	arch: string;
	osType: string;
	osRelease: string;
	hostname: string;
	uptime: number;
	vllmVersion: Record<string, unknown> | null;
}

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAICompletionRequest {
	model?: string;
	prompt?: string | string[];
	max_tokens?: number;
	temperature?: number;
	top_p?: number;
	n?: number;
	stream?: boolean;
	logprobs?: number;
	echo?: boolean;
	stop?: string | string[];
	presence_penalty?: number;
	frequency_penalty?: number;
	best_of?: number;
	logit_bias?: Record<string, number>;
	user?: string;
}

interface OpenAICompletionChoice {
	text: string;
	index: number;
	logprobs: unknown | null;
	finish_reason: string | null;
}

interface OpenAICompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: OpenAICompletionChoice[];
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

interface OpenAIChatCompletionRequest {
	model?: string;
	messages: ChatMessage[];
	max_tokens?: number;
	temperature?: number;
	top_p?: number;
	n?: number;
	stream?: boolean;
	stop?: string | string[];
	presence_penalty?: number;
	frequency_penalty?: number;
	logit_bias?: Record<string, number>;
	user?: string;
}

interface OpenAIChatCompletionChoice {
	index: number;
	message: ChatMessage;
	finish_reason: string | null;
}

interface OpenAIChatCompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: OpenAIChatCompletionChoice[];
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

// Constants
const PORT: number = 3000;
const HOST: string = '0.0.0.0';
const app: Express = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response): void => {
	res.send('Starting LLM Service...\n');
});

app.get('/version', async (_req: Request, res: Response<EnvironmentInfo>): Promise<void> => {
	let vllmVersion: Record<string, unknown> | null = null;

	try {
		const response = await fetch('http://vllm:8000/version');
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

app.post('/v1/completions', async (req: Request, res: Response): Promise<void> => {
	const body = req.body as OpenAICompletionRequest;

	if (!body.prompt) {
		res.status(400).json({ error: 'Missing prompt in request body.' });
		return;
	}

	const promptText = Array.isArray(body.prompt) ? body.prompt.join('\n') : body.prompt;
	const docs = await retrieveDocuments(promptText);
	const context = docs.map((d, i) => `Context ${i + 1}: ${d.text}`).join('\n\n');
	const fullPrompt = `
Say "I don't know." when answer is not found in the documents. Always use information from the documents to answer.
${context}
Question: ${promptText}
Answer:
`;

	try {
		const payload = {
			model: body.model || 'microsoft/phi-2',
			prompt: fullPrompt,
			max_tokens: body.max_tokens,
			temperature: body.temperature,
			top_p: body.top_p,
			n: body.n,
			stream: body.stream,
			logprobs: body.logprobs,
			echo: body.echo,
			stop: body.stop,
			presence_penalty: body.presence_penalty,
			frequency_penalty: body.frequency_penalty,
			best_of: body.best_of,
			logit_bias: body.logit_bias,
			user: body.user,
		};

		const response = await fetch('http://vllm:8000/v1/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const data = await response.json() as OpenAICompletionResponse;
		res.status(response.status).json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/v1/chat/completions', async (req: Request, res: Response): Promise<void> => {
	const body = req.body as OpenAIChatCompletionRequest;

	if (!body.messages || !Array.isArray(body.messages)) {
		res.status(400).json({ error: 'Missing messages array in request body.' });
		return;
	}

	try {
		const payload = {
			model: body.model || 'microsoft/phi-2',
			messages: body.messages,
			max_tokens: body.max_tokens,
			temperature: body.temperature,
			top_p: body.top_p,
			n: body.n,
			stream: body.stream,
			stop: body.stop,
			presence_penalty: body.presence_penalty,
			frequency_penalty: body.frequency_penalty,
			logit_bias: body.logit_bias,
			user: body.user,
		};

		const response = await fetch('http://vllm:8000/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const data = await response.json() as OpenAIChatCompletionResponse;
		res.status(response.status).json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(PORT, HOST, (): void => {
	console.log(`Running on http://${HOST}:${PORT}`);
});
