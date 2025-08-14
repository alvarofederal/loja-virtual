import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

class MercadoPagoService {
  constructor() {
    this.mp = mercadopago;
  }

  // Criar preferência de pagamento
  async createPreference(order) {
    try {
      const preference = {
        items: order.items.map(item => ({
          title: item.product_name,
          unit_price: parseFloat(item.unit_price),
          quantity: item.quantity,
          picture_url: item.product_image || null
        })),
        payer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: {
            number: order.customer_phone
          }
        },
        back_urls: {
          success: `${process.env.BASE_URL}/orders/success`,
          failure: `${process.env.BASE_URL}/orders/failure`,
          pending: `${process.env.BASE_URL}/orders/pending`
        },
        auto_return: 'approved',
        external_reference: order.order_number,
        notification_url: `${process.env.BASE_URL}/webhooks/mercadopago`,
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' } // Excluir boleto se necessário
          ],
          installments: 12 // Parcelamento em até 12x
        },
        shipments: {
          cost: parseFloat(order.shipping_amount || 0),
          mode: 'not_specified'
        }
      };

      const response = await this.mp.preferences.create(preference);
      return response.body;
    } catch (error) {
      console.error('Erro ao criar preferência do Mercado Pago:', error);
      throw new Error('Erro ao processar pagamento');
    }
  }

  // Processar notificação de pagamento
  async processNotification(query) {
    try {
      const { data } = await this.mp.payment.findById(query.data.id);
      
      return {
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        external_reference: data.external_reference,
        transaction_amount: data.transaction_amount,
        payment_method_id: data.payment_method_id,
        payment_type_id: data.payment_type_id,
        installments: data.installments,
        payer: data.payer
      };
    } catch (error) {
      console.error('Erro ao processar notificação:', error);
      throw new Error('Erro ao processar notificação de pagamento');
    }
  }

  // Buscar informações do pagamento
  async getPaymentInfo(paymentId) {
    try {
      const { data } = await this.mp.payment.findById(paymentId);
      return data;
    } catch (error) {
      console.error('Erro ao buscar informações do pagamento:', error);
      throw new Error('Erro ao buscar informações do pagamento');
    }
  }

  // Reembolsar pagamento
  async refundPayment(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount } : {};
      const response = await this.mp.refund.create({
        payment_id: paymentId,
        ...refundData
      });
      
      return response.body;
    } catch (error) {
      console.error('Erro ao reembolsar pagamento:', error);
      throw new Error('Erro ao processar reembolso');
    }
  }

  // Calcular parcelamento
  calculateInstallments(amount, maxInstallments = 12) {
    const installments = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const installmentAmount = amount / i;
      installments.push({
        installments: i,
        amount: installmentAmount,
        total: amount
      });
    }
    
    return installments;
  }

  // Validar webhook
  validateWebhook(query) {
    try {
      // Implementar validação do webhook se necessário
      return true;
    } catch (error) {
      console.error('Erro ao validar webhook:', error);
      return false;
    }
  }
}

export default new MercadoPagoService();
