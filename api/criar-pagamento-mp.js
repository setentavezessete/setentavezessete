// /api/criar-pagamento-mp.js

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // LINHA DO "ESPIÃO" - VAI MOSTRAR OS DADOS EXATOS QUE O FRONTEND ENVIOU
            console.log('DADOS RECEBIDOS NO CORPO DA REQUISIÇÃO:', req.body);

            const { transactionAmount, description, email } = req.body;
            
            // Adicionando uma barreira de proteção extra no backend
            if (typeof transactionAmount !== 'number' || isNaN(transactionAmount) || transactionAmount < 0.50) {
                 return res.status(400).json({ error: "Valor da transação inválido, nulo ou menor que R$0.50." });
            }

            const payment = new Payment(client);

            const paymentResult = await payment.create({
                transaction_amount: transactionAmount, // Já é um número, não precisa de Number()
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