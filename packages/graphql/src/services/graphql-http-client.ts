export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<TData = unknown> {
  data?: TData;
  errors?: Array<{
    message: string;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
}

export class GraphQLHttpClient {
  constructor(
    private readonly url: string,
    private readonly headers: Record<string, string> = {
      'content-type': 'application/json',
    },
  ) {}

  async request<TData = unknown>(
    request: GraphQLRequest,
  ): Promise<GraphQLResponse<TData>> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `GraphQL HTTP error ${response.status}: ${text}`,
      );
    }

    return response.json() as Promise<GraphQLResponse<TData>>;
  }
}