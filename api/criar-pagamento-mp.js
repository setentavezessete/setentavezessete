// /api/criar-pagamento-mp.js (Versão Final)
import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { transactionAmount } = req.body;
        
        // Validação final e robusta dos dados recebidos
        if (typeof transactionAmount !== 'number' || isNaN(transactionAmount) || transactionAmount <= 0) {
             return res.status(400).json({ error: "Valor da transação é inválido ou nulo." });
        }
        
        // O cliente é inicializado aqui para usar a variável de ambiente mais recente
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
        });

        const payment = new Payment(client);

        const paymentResult = await payment.create({
            transaction_amount: transactionAmount,
            description: "Contribuição para Dual Player Pro",
            payment_method_id: 'pix',
            payer: {
                email: `pagador_${Date.now()}@example.com`,
            },
        });

        // Retorna sucesso
        return res.status(201).json({
            qr_code_base64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
            qr_code: paymentResult.point_of_interaction.transaction_data.qr_code,
        });

    } catch (error) {
        // Retorna um erro claro se algo falhar
        console.error('ERRO FINAL NA API MERCADO PAGO:', error);
        const errorMessage = error.cause?.message || error.message || 'Erro desconhecido.';
        return res.status(500).json({
            error: 'Erro interno do servidor ao criar pagamento.',
            details: errorMessage
        });
    }
}