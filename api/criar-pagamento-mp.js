// /api/criar-pagamento-mp.js

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { transactionAmount, description, email } = req.body;
            if (!transactionAmount || !description || !email) {
                return res.status(400).json({ error: 'Dados insuficientes.' });
            }

            const payment = new Payment(client);

            // CORREÇÃO APLICADA AQUI:
            // Os dados do pagamento são passados diretamente, sem estarem dentro de um "body:".
            const paymentResult = await payment.create({
                transaction_amount: Number(transactionAmount),
                description: description,
                payment_method_id: 'pix',
                payer: {
                    email: email,
                },
            });

            res.status(201).json({
                paymentId: paymentResult.id,
                status: paymentResult.status,
                qr_code_base64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
                qr_code: paymentResult.point_of_interaction.transaction_data.qr_code,
            });

        } catch (error) {
            console.error('ERRO DETALHADO AO CRIAR PAGAMENTO PIX:', error);
            const errorMessage = error.cause?.message || error.message || 'Erro desconhecido no servidor.';
            res.status(500).json({
                error: 'Erro no servidor ao processar o pagamento.',
                details: errorMessage
            });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}