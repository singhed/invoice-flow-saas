import axios, { AxiosError } from 'axios';
import { logger, AppError, NotFoundError } from '@invoice-saas/shared';
import { config } from '../config';
import { ShopifyOrder } from '../types';

export class ShopifyService {
  private get baseUrl(): string {
    const { storeDomain, apiVersion } = config.shopify;
    return `https://${storeDomain}/admin/api/${apiVersion}`;
  }

  private ensureConfiguration(): void {
    if (!config.shopify.storeDomain) {
      throw new AppError(500, 'Shopify store domain is not configured');
    }
    if (!config.shopify.accessToken) {
      throw new AppError(500, 'Shopify access token is not configured');
    }
  }

  async getOrder(orderId: string): Promise<ShopifyOrder> {
    this.ensureConfiguration();

    try {
      const response = await axios.get<{ order: ShopifyOrder }>(`${this.baseUrl}/orders/${orderId}.json`, {
        headers: {
          'X-Shopify-Access-Token': config.shopify.accessToken,
          'Content-Type': 'application/json',
          'User-Agent': 'invoice-service/1.0',
        },
      });

      if (!response.data?.order) {
        throw new AppError(502, 'Shopify response missing order payload');
      }

      return response.data.order;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ errors?: unknown }>;
        const status = axiosError.response?.status ?? 500;
        const data = axiosError.response?.data;

        if (status === 404) {
          throw new NotFoundError(`Shopify order ${orderId} not found`);
        }

        logger.error('Shopify API error while fetching order', {
          orderId,
          status,
          data,
          message: axiosError.message,
        });

        throw new AppError(status, 'Failed to fetch order details from Shopify');
      }

      throw error;
    }
  }
}

export const shopifyService = new ShopifyService();
