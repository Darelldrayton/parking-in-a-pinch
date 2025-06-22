// Mobile Payment Services (Apple Pay & Google Pay)
export interface PaymentRequestConfig {
  total: {
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  };
  displayItems?: Array<{
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  }>;
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
  shippingOptions?: Array<{
    id: string;
    label: string;
    amount: {
      currency: string;
      value: string;
    };
    selected?: boolean;
  }>;
}

export interface PaymentResponse {
  methodName: string;
  details: any;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  shippingAddress?: any;
  shippingOption?: string;
}

export interface MobilePaymentResult {
  success: boolean;
  paymentMethod?: string;
  transactionId?: string;
  error?: string;
}

class MobilePaymentService {
  private paymentRequest: PaymentRequest | null = null;

  async isApplePayAvailable(): Promise<boolean> {
    if (!window.PaymentRequest) {
      return false;
    }

    const supportedMethods = [{
      supportedMethods: 'https://apple.com/apple-pay',
      data: {
        version: 3,
        merchantIdentifier: import.meta.env.VITE_APPLE_PAY_MERCHANT_ID || 'merchant.com.example.parking',
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        countryCode: 'US',
      },
    }];

    const details = {
      total: {
        label: 'Test Payment',
        amount: { currency: 'USD', value: '1.00' },
      },
    };

    try {
      const canMakePayment = await new PaymentRequest(supportedMethods, details).canMakePayment();
      return canMakePayment || false;
    } catch (error) {
      console.error('Error checking Apple Pay availability:', error);
      return false;
    }
  }

  async isGooglePayAvailable(): Promise<boolean> {
    if (!window.PaymentRequest) {
      return false;
    }

    const supportedMethods = [{
      supportedMethods: 'https://google.com/pay',
      data: {
        environment: import.meta.env.VITE_GOOGLE_PAY_ENVIRONMENT || 'TEST',
        merchantId: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || '01234567890123456789',
        paymentMethodData: {
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe',
              'stripe:version': '2018-10-31',
              'stripe:publishableKey': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
            },
          },
        },
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
          },
        }],
      },
    }];

    const details = {
      total: {
        label: 'Test Payment',
        amount: { currency: 'USD', value: '1.00' },
      },
    };

    try {
      const canMakePayment = await new PaymentRequest(supportedMethods, details).canMakePayment();
      return canMakePayment || false;
    } catch (error) {
      console.error('Error checking Google Pay availability:', error);
      return false;
    }
  }

  async initializeApplePay(config: PaymentRequestConfig): Promise<boolean> {
    try {
      const supportedMethods = [{
        supportedMethods: 'https://apple.com/apple-pay',
        data: {
          version: 3,
          merchantIdentifier: import.meta.env.VITE_APPLE_PAY_MERCHANT_ID || 'merchant.com.example.parking',
          merchantCapabilities: ['supports3DS'],
          supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
          countryCode: 'US',
        },
      }];

      const details = {
        total: config.total,
        displayItems: config.displayItems || [],
      };

      const options = {
        requestPayerName: config.requestPayerName || false,
        requestPayerEmail: config.requestPayerEmail || false,
        requestPayerPhone: config.requestPayerPhone || false,
        requestShipping: config.requestShipping || false,
        shippingOptions: config.shippingOptions || [],
      };

      this.paymentRequest = new PaymentRequest(supportedMethods, details, options);
      return true;
    } catch (error) {
      console.error('Error initializing Apple Pay:', error);
      return false;
    }
  }

  async initializeGooglePay(config: PaymentRequestConfig): Promise<boolean> {
    try {
      const supportedMethods = [{
        supportedMethods: 'https://google.com/pay',
        data: {
          environment: import.meta.env.VITE_GOOGLE_PAY_ENVIRONMENT || 'TEST',
          merchantId: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || '01234567890123456789',
          paymentMethodData: {
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'stripe',
                'stripe:version': '2018-10-31',
                'stripe:publishableKey': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
              },
            },
          },
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
            },
          }],
        },
      }];

      const details = {
        total: config.total,
        displayItems: config.displayItems || [],
      };

      const options = {
        requestPayerName: config.requestPayerName || false,
        requestPayerEmail: config.requestPayerEmail || false,
        requestPayerPhone: config.requestPayerPhone || false,
      };

      this.paymentRequest = new PaymentRequest(supportedMethods, details, options);
      return true;
    } catch (error) {
      console.error('Error initializing Google Pay:', error);
      return false;
    }
  }

  async processPayment(): Promise<MobilePaymentResult> {
    if (!this.paymentRequest) {
      return {
        success: false,
        error: 'Payment request not initialized',
      };
    }

    try {
      const paymentResponse = await this.paymentRequest.show();
      
      // Validate payment with backend
      const result = await this.validatePaymentWithBackend(paymentResponse);
      
      if (result.success) {
        await paymentResponse.complete('success');
        return {
          success: true,
          paymentMethod: paymentResponse.methodName,
          transactionId: result.transactionId,
        };
      } else {
        await paymentResponse.complete('fail');
        return {
          success: false,
          error: result.error || 'Payment validation failed',
        };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown payment error',
      };
    }
  }

  private async validatePaymentWithBackend(paymentResponse: PaymentResponse): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/v1/payments/mobile/validate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          method_name: paymentResponse.methodName,
          payment_details: paymentResponse.details,
          payer_name: paymentResponse.payerName,
          payer_email: paymentResponse.payerEmail,
          payer_phone: paymentResponse.payerPhone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Payment validation failed',
        };
      }

      const result = await response.json();
      return {
        success: true,
        transactionId: result.transaction_id,
      };
    } catch (error) {
      console.error('Error validating payment:', error);
      return {
        success: false,
        error: 'Network error during payment validation',
      };
    }
  }

  async createPaymentSession(bookingData: {
    booking_id: number;
    amount: number;
    currency: string;
    description: string;
  }): Promise<string> {
    try {
      const response = await fetch('/api/v1/payments/mobile/session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const result = await response.json();
      return result.session_id;
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  }

  abort(): void {
    if (this.paymentRequest) {
      this.paymentRequest.abort();
      this.paymentRequest = null;
    }
  }

  async getAvailablePaymentMethods(): Promise<{
    applePay: boolean;
    googlePay: boolean;
    webPayments: boolean;
  }> {
    const [applePay, googlePay] = await Promise.all([
      this.isApplePayAvailable(),
      this.isGooglePayAvailable(),
    ]);

    return {
      applePay,
      googlePay,
      webPayments: !!window.PaymentRequest,
    };
  }

  // Utility method to format payment config for booking
  createBookingPaymentConfig(
    amount: number,
    currency: string = 'USD',
    description: string = 'Parking Booking',
    platformFee: number = 0,
    taxes: number = 0
  ): PaymentRequestConfig {
    const displayItems = [];
    
    if (platformFee > 0) {
      displayItems.push({
        label: 'Platform Fee',
        amount: {
          currency,
          value: platformFee.toFixed(2),
        },
      });
    }

    if (taxes > 0) {
      displayItems.push({
        label: 'Taxes',
        amount: {
          currency,
          value: taxes.toFixed(2),
        },
      });
    }

    return {
      total: {
        label: description,
        amount: {
          currency,
          value: amount.toFixed(2),
        },
      },
      displayItems,
      requestPayerEmail: true,
      requestPayerName: true,
    };
  }

  // Check if device supports mobile payments
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Get recommended payment method based on device
  getRecommendedPaymentMethod(): 'apple' | 'google' | 'web' | null {
    if (!this.isMobileDevice()) return 'web';
    
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'apple';
    }
    
    if (/Android/.test(userAgent)) {
      return 'google';
    }
    
    return 'web';
  }
}

export default new MobilePaymentService();