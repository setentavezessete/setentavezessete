// /api/criar-pagamento-mp.js (Versão de Depuração Final)
console.log('[DEBUG 1/5] Módulo da API está a ser iniciado.');
import { MercadoPagoConfig, Payment } from 'mercadopago';
console.log('[DEBUG 2/5] Módulos importados. A verificar a variável de ambiente...');
console.log('[DEBUG INFO] MERCADO_PAGO_ACCESS_TOKEN existe:', process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'Sim' : 'NÃO!');
let client;
try {
    console.log('[DEBUG 3/5] Tentando criar o cliente MercadoPagoConfig...');
    client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    console.log('[DEBUG 4/5] Cliente MercadoPagoConfig criado com SUCESSO.');
} catch (e) {
    console.error('[ERRO CRÍTICO NA INICIALIZAÇÃO]', e);
}
export default async function handler(req, res) {
    console.log('[DEBUG 5/5] A função "handler" foi chamada.');
    if (req.method === 'POST') {
        try {
            console.log('DADOS RECEBIDOS NO CORPO DA REQUISIÇÃO:', req.body);
            const { transactionAmount, description, email } = req.body;
            if (typeof transactionAmount !== 'number' || isNaN(transactionAmount) || transactionAmount < 0.50) {
                 return res.status(400).json({ error: "Valor da transação inválido, nulo ou menor que R$0.50." });
            }
            const payment = new Payment(client);
            const paymentResult = await payment.create({
                transaction_amount: transactionAmount,
                description: description,
                payment_method_id: 'pix',
                payer: { email: email },
            });
            console.log("Pagamento criado com sucesso no Mercado Pago!");
            return res.status(201).json({
                paymentId: paymentResult.id,
                status: paymentResult.status,
                qr_code_base64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
                qr_code: paymentResult.point_of_interaction.transaction_data.qr_code,
            });
        } catch (error) {
            console.error('ERRO DETALHADO AO CRIAR PAGAMENTO PIX:', error);
            const errorMessage = error.cause?.message || error.message || 'Erro desconhecido no servidor.';
            return res.status(500).json({
                error: 'Erro no servidor ao processar o pagamento.',
                details: errorMessage
            });
        }
    } else {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }
}