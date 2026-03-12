import type {
  WhatsAppConfig,
  WhatsAppSendResponse,
  WhatsAppTextMessage,
  WhatsAppImageMessage,
  WhatsAppDocumentMessage,
  WhatsAppTemplateMessage,
  TemplateComponent,
} from './types';

const GRAPH_API_BASE = 'https://graph.facebook.com';
const DEFAULT_API_VERSION = 'v21.0';

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: WhatsAppConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.baseUrl = `${GRAPH_API_BASE}/${this.apiVersion}/${this.phoneNumberId}`;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new WhatsAppAPIError(
        `WhatsApp API error: ${response.status}`,
        response.status,
        error,
      );
    }

    return response.json() as Promise<T>;
  }

  /** Send a plain text message */
  async sendText(to: string, body: string): Promise<WhatsAppSendResponse> {
    const message: WhatsAppTextMessage = {
      to,
      type: 'text',
      text: { body },
    };

    return this.request<WhatsAppSendResponse>('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...message,
    });
  }

  /** Send an image message */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResponse> {
    const message: WhatsAppImageMessage = {
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    };

    return this.request<WhatsAppSendResponse>('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...message,
    });
  }

  /** Send a document message */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string,
  ): Promise<WhatsAppSendResponse> {
    const message: WhatsAppDocumentMessage = {
      to,
      type: 'document',
      document: { link: documentUrl, caption, filename },
    };

    return this.request<WhatsAppSendResponse>('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...message,
    });
  }

  /** Send a template message */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: TemplateComponent[],
  ): Promise<WhatsAppSendResponse> {
    const message: WhatsAppTemplateMessage = {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    return this.request<WhatsAppSendResponse>('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...message,
    });
  }

  /** Mark a message as read */
  async markAsRead(messageId: string): Promise<void> {
    await this.request('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  /** Download media by ID */
  async getMediaUrl(mediaId: string): Promise<string> {
    const url = `${GRAPH_API_BASE}/${this.apiVersion}/${mediaId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new WhatsAppAPIError('Failed to get media URL', response.status);
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }
}

export class WhatsAppAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiError?: unknown,
  ) {
    super(message);
    this.name = 'WhatsAppAPIError';
  }
}
