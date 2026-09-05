import api from './api';

export const fetchMySubscriptionInvoices = () =>
  api.get('/subscription-invoices').then((r) => r.data.data?.items || []);

export const downloadSubscriptionInvoice = async (invoiceId, invoiceNumber) => {
  const res = await api.get(`/subscription-invoices/${invoiceId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${invoiceNumber || invoiceId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
