import { Platform } from 'react-native';

function checkoutOptions({ keyId, order, bookingNumber, user }) {
    return {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'YOURMAHABALESHWAR',
        description: `Booking ${bookingNumber || ''}`.trim(),
        order_id: order.id,
        prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
        },
    };
}

function loadCheckoutScript() {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }
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
}

export function openWebCheckout(details) {
    if (Platform.OS !== 'web') {
        return Promise.reject(new Error('Web checkout is only used in the browser'));
    }
    return loadCheckoutScript().then((ok) => {
        if (!ok || !window.Razorpay) {
            throw new Error('Razorpay checkout failed to load');
        }
        const options = checkoutOptions(details);
        return new Promise((resolve, reject) => {
            const rzp = new window.Razorpay({
                ...options,
                handler: (response) => resolve(response),
                modal: { ondismiss: () => reject(new Error('CANCELLED')) },
            });
            rzp.open();
        });
    });
}

export function checkoutHtml(details) {
    const json = JSON.stringify(checkoutOptions(details)).replace(/</g, '\\u003c');
    return `<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      var options = ${json};
      options.handler = function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ ok: true, response: response }));
      };
      options.modal = {
        ondismiss: function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false }));
        }
      };
      new Razorpay(options).open();
    </script>
  </body>
</html>`;
}
