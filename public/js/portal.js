const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

let invoice = null;
let stripe = null;
let config = null;

async function init() {
  if (!token) {
    showError('Invalid or missing token');
    return;
  }

  try {
    await loadConfig();
    await loadInvoice();
    initializeStripe();
    initializePayPal();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize payment portal');
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config/public');
    if (response.ok) {
      config = await response.json();
    }
  } catch (error) {
    console.error('Config load error:', error);
  }
}

async function loadInvoice() {
  try {
    const response = await fetch(`/api/invoices/${token}`);
    
    if (!response.ok) {
      throw new Error('Failed to load invoice');
    }

    const data = await response.json();
    invoice = data.invoice;
    
    displayInvoice(invoice, data.payments);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('invoice-container').style.display = 'block';
  } catch (error) {
    console.error('Load invoice error:', error);
    document.getElementById('loading').style.display = 'none';
    showError('Failed to load invoice. Please check your token.');
  }
}

function displayInvoice(invoice, payments) {
  document.getElementById('client-name').textContent = invoice.client_name;
  document.getElementById('client-email').textContent = invoice.client_email;
  document.getElementById('description').textContent = invoice.description || 'N/A';
  document.getElementById('amount').textContent = `${invoice.currency} ${parseFloat(invoice.amount).toFixed(2)}`;
  
  const statusBadge = document.getElementById('status-badge');
  statusBadge.textContent = invoice.status;
  statusBadge.className = `status-badge ${invoice.status}`;
  
  if (invoice.status === 'paid') {
    document.getElementById('payment-section').style.display = 'none';
  }
  
  if (payments && payments.length > 0) {
    displayPaymentHistory(payments);
  }
}

function displayPaymentHistory(payments) {
  const paymentList = document.getElementById('payment-list');
  paymentList.innerHTML = '';
  
  payments.forEach(payment => {
    const paymentItem = document.createElement('div');
    paymentItem.className = 'payment-item';
    paymentItem.innerHTML = `
      <div>
        <div class="payment-provider">${payment.provider}</div>
        <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">
          ${new Date(payment.created_at).toLocaleString()}
        </div>
      </div>
      <div>
        <div class="payment-status ${payment.status}">${payment.status}</div>
      </div>
    `;
    paymentList.appendChild(paymentItem);
  });
  
  document.getElementById('payment-history').style.display = 'block';
}

function initializeStripe() {
  const publicKey = config?.stripePublicKey || 'pk_test_your_stripe_publishable_key';
  stripe = Stripe(publicKey);
  
  const stripeButton = document.getElementById('stripe-button');
  stripeButton.addEventListener('click', handleStripePayment);
}

async function handleStripePayment() {
  const stripeButton = document.getElementById('stripe-button');
  stripeButton.disabled = true;
  stripeButton.textContent = 'Processing...';
  
  try {
    const response = await fetch('/api/payments/stripe/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment session');
    }
    
    const { sessionId } = await response.json();
    
    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Stripe payment error:', error);
    showError('Failed to process Stripe payment: ' + error.message);
    stripeButton.disabled = false;
    stripeButton.innerHTML = `
      <svg class="payment-icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
      </svg>
      Pay with Stripe
    `;
  }
}

function initializePayPal() {
  if (!invoice || !config) return;
  
  const paypalClientId = config.paypalClientId || 'your_paypal_client_id';
  
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${invoice.currency}`;
  script.onload = () => {
    renderPayPalButtons();
  };
  script.onerror = () => {
    console.error('Failed to load PayPal SDK');
    document.getElementById('paypal-button-container').innerHTML = '<p style="color: #ef4444;">Failed to load PayPal. Please try Stripe instead.</p>';
  };
  document.head.appendChild(script);
}

function renderPayPalButtons() {
  paypal.Buttons({
    createOrder: async () => {
      try {
        const response = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create PayPal order');
        }
        
        const { orderId } = await response.json();
        return orderId;
      } catch (error) {
        console.error('PayPal create order error:', error);
        showError('Failed to create PayPal order: ' + error.message);
      }
    },
    onApprove: async (data) => {
      try {
        const response = await fetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to capture PayPal payment');
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          window.location.href = `/portal/success?token=${token}`;
        } else {
          throw new Error('Payment capture failed');
        }
      } catch (error) {
        console.error('PayPal capture error:', error);
        showError('Failed to capture PayPal payment: ' + error.message);
      }
    },
    onCancel: () => {
      window.location.href = `/portal/cancel?token=${token}`;
    },
    onError: (err) => {
      console.error('PayPal error:', err);
      showError('PayPal payment failed. Please try again.');
    },
  }).render('#paypal-button-container');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

document.addEventListener('DOMContentLoaded', init);
