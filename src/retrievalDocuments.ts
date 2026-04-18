interface Document {
    id: string;
    text: string;
}

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

// take the user question, and return the most relevant documents.
export async function retrieveDocuments(query: string): Promise<Document[]> {
    return documents
        .map(doc => ({ doc, score: scoreDocument(query, doc) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.doc);
    // In a real implementation, this would query a vector store or search index.
    // - an external service (Pinecone, Weaviate, Milvus, Qdrant, etc.)
    // - a local vector index library (like faiss, annoy, or sqlite+vector)
    // For example:
    // const queryEmbedding = await embedText(query);
    // const results = await vectorStore.query({
    //     embedding: queryEmbedding,
    //     topK: 4
    // });
    // return results.map(r => ({ id: r.id, text: r.metadata.text }));
}
