// /api/criar-pagamento-mp.js
import mercadopago from "mercadopago";

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { transactionAmount, description, email } = req.body;
            if (!transactionAmount || !description || !email) {
                return res.status(400).json({ error: 'Dados insuficientes.' });
            }

            const payment_data = {
                transaction_amount: Number(transactionAmount),
                description: description,
                payment_method_id: 'pix',
                payer: { email: email },
            };

            const { body } = await mercadopago.payment.create(payment_data);

            res.status(201).json({
                paymentId: body.id,
                status: body.status,
                qr_code_base64: body.point_of_interaction.transaction_data.qr_code_base64,
                qr_code: body.point_of_interaction.transaction_data.qr_code,
            });
        } catch (error) {
            console.error('Erro ao criar pagamento PIX:', error);
            res.status(500).json({ error: 'Erro no servidor ao processar o pagamento.' });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}