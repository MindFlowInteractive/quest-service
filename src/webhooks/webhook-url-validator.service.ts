import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebhookUrlValidatorService {
  async validate(url: string): Promise<void> {
    const parsed = this.parseHttpsUrl(url);

    try {
      const response = await axios.head(parsed.toString(), {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      if (response.status < 400 || response.status === 403) {
        return;
      }

      if (response.status !== 405) {
        throw new BadRequestException(`Webhook URL is not reachable: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status !== 405) {
        throw new BadRequestException(`Webhook URL is not reachable: ${error.response.status}`);
      }

      if (!axios.isAxiosError(error) || !error.response) {
        throw new BadRequestException('Webhook URL is not reachable');
      }
    }

    try {
      const response = await axios.get(parsed.toString(), {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 400 && response.status !== 403) {
        throw new BadRequestException(`Webhook URL is not reachable: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        throw new BadRequestException(`Webhook URL is not reachable: ${error.response.status}`);
      }

      throw new BadRequestException('Webhook URL is not reachable');
    }
  }

  private parseHttpsUrl(url: string): URL {
    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Webhook URL must be a valid HTTPS URL');
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Webhook URL must use HTTPS');
    }

    return parsed;
  }
}