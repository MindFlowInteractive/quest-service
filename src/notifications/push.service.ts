  async sendToToken(token: string, payload: MessagingPayload) {
    if (!this.enabled) {
      this.logger.debug('Push disabled - token would be:', token);
      return { success: false, queued: true };
    }
    try {
      const message: any = {
        token,
        notification: payload.notification,
        data: payload.data,
      };

      const res = await admin.messaging().send(message);
      return { success: true, result: res };
    } catch (err) {
      this.logger.error('FCM send failed', err as any);
      return { success: false, error: err };
    }
  }
