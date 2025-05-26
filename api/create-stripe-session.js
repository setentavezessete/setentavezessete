// api/create-stripe-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { amount } = req.body;
      const currency = 'brl'; // Definir a moeda como BRL

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'O valor da contribuição deve ser positivo.' });
      }

      // Converter o valor para centavos (ou a menor unidade da moeda)
      const unitAmount = Math.round(parseFloat(amount) * 100);

      if (unitAmount < 50 && currency === 'usd') { // Stripe tem mínimos, ex: $0.50 USD
          console.warn("Stripe: Valor abaixo do mínimo para USD, ajustando para BRL pode ter outros mínimos.");
      }
      // Para BRL, o mínimo é geralmente R$0.50 (50 centavos)
      if (unitAmount < 50 && currency === 'brl') {
           return res.status(400).json({ error: 'O valor mínimo da contribuição é R$0.50.' });
      }


      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // Você pode adicionar 'google_pay', 'apple_pay' se configurado no Stripe
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: 'Contribuição Voluntária',
                // images: ['url_da_sua_imagem_aqui'], // Opcional
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/?stripe_payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/?stripe_payment=cancelled`,
      });

      res.status(200).json({ sessionId: session.id });
    } catch (err) {
      console.error("Erro ao criar sessão Stripe:", err.message);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}