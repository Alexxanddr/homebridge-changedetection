import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

const MAX_BODY_BYTES = 64 * 1024;

export interface WebhookServerOptions {
  bindAddress: string;
  onTrigger: (id: string) => boolean;
  port: number;
  token: string;
}

export class WebhookServer {
  private server?: Server;

  constructor(private readonly options: WebhookServerOptions) {}

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    const server = createServer((request, response) => {
      void this.handle(request, response);
    });
    this.server = server;

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        this.server = undefined;
        reject(error);
      };
      server.once('error', onError);
      server.listen(this.options.port, this.options.bindAddress, () => {
        server.removeListener('error', onError);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    if (!server || !server.listening) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }

  address(): string | null {
    const address = this.server?.address();
    if (!address || typeof address === 'string') {
      return address ?? null;
    }
    return `${address.address}:${address.port}`;
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/health') {
      this.send(response, 200, { status: 'ok' });
      return;
    }

    if (request.method !== 'POST') {
      this.send(response, 404, { error: 'not_found' });
      return;
    }

    const match = /^\/webhook\/([^/]+)$/.exec(url.pathname);
    if (!match) {
      this.send(response, 404, { error: 'not_found' });
      return;
    }

    if (!this.authorized(request)) {
      this.send(response, 401, { error: 'unauthorized' });
      return;
    }

    try {
      await this.consumeBody(request);
    } catch {
      this.send(response, 413, { error: 'payload_too_large' });
      return;
    }

    const id = decodeURIComponent(match[1]);
    if (!this.options.onTrigger(id)) {
      this.send(response, 404, { error: 'unknown_sensor' });
      return;
    }

    this.send(response, 202, { accepted: true, id });
  }

  private authorized(request: IncomingMessage): boolean {
    const header = request.headers['x-changedetection-token'];
    const supplied = Array.isArray(header) ? header[0] : header;
    if (!supplied) {
      return false;
    }

    const expectedBuffer = Buffer.from(this.options.token);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length
      && timingSafeEqual(expectedBuffer, suppliedBuffer);
  }

  private async consumeBody(request: IncomingMessage): Promise<void> {
    let size = 0;
    for await (const chunk of request) {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        throw new Error('Payload too large');
      }
    }
  }

  private send(response: ServerResponse, status: number, body: object): void {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
  }
}
