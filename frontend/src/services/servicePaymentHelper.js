const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export async function payWithRazorpay({ orderResult, user, description, onSuccess, mockConfirm }) {
  const { order, keyId } = orderResult;
  const ok = await loadRazorpayScript();

  if (!ok || order?.mock || keyId === 'mock_key') {
    return mockConfirm();
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'YOURMAHABALESHWAR',
      description,
      order_id: order.id,
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      handler: async (response) => {
        try {
          await onSuccess(response);
          resolve(response);
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
