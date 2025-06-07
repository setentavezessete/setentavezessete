import { MercadoPagoConfig, Payment } from 'mercadopago';

// Esta função só é executada quando a API é chamada.
export default async function handler(req, res) {
    
    // Validação básica do método
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // Inicializa o cliente DENTRO da função handler
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
        });

        const { transactionAmount } = req.body;
        
        // Validação robusta dos dados recebidos
        if (typeof transactionAmount !== 'number' || isNaN(transactionAmount) || transactionAmount <= 0) {
             return res.status(400).json({ error: "Valor da transação é inválido ou nulo." });
        }

        const payment = new Payment(client);

        const paymentResult = await payment.create({
            transaction_amount: transactionAmount,
            description: "Contribuição para o projeto",
            payment_method_id: 'pix',
            payer: {
                email: `pagador-${Date.now()}@test.com`, // Email de teste genérico
            },
        });

        // Retorna o resultado com sucesso
        return res.status(201).json({
            paymentId: paymentResult.id,
            qr_code_base64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
            qr_code: paymentResult.point_of_interaction.transaction_data.qr_code,
        });

    } catch (error) {
        // Em caso de qualquer erro, regista e retorna uma mensagem clara
        console.error('ERRO NA API DO MERCADO PAGO:', error);
        const errorMessage = error.cause?.message || error.message || 'Erro desconhecido ao comunicar com o Mercado Pago.';
        return res.status(500).json({
            error: 'Erro no servidor ao processar o pagamento.',
            details: errorMessage
        });
    }
}