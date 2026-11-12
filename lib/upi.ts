import QRCode from 'qrcode';

export interface UpiLinkInput { vpa: string; payee: string; amountPaise: number; orderNumber: string }
const enc = encodeURIComponent;
/** Standard UPI payment link (NPCI UPI linking spec). Opens the customer's UPI app chooser on Android and any installed UPI app on iPhone. */
export function upiParams({ vpa, payee, amountPaise, orderNumber }: UpiLinkInput) {
  return `pa=${enc(vpa)}&pn=${enc(payee.slice(0, 40))}&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tn=${enc('Order ' + orderNumber)}&tr=${enc(orderNumber.replace(/[^A-Za-z0-9]/g, ''))}`;
}
export const upiLink = (i: UpiLinkInput) => `upi://pay?${upiParams(i)}`;
/** Direct links for the most common apps (iPhone does not show a chooser for upi://). */
export const appLinks = (i: UpiLinkInput) => {
  const p = upiParams(i);
  return [{ name: 'Google Pay', href: `tez://upi/pay?${p}` }, { name: 'PhonePe', href: `phonepe://pay?${p}` }, { name: 'Paytm', href: `paytmmp://pay?${p}` }];
};
export const upiQrSvg = (i: UpiLinkInput) => QRCode.toString(upiLink(i), { type: 'svg', margin: 1, width: 260, errorCorrectionLevel: 'M', color: { dark: '#36422b', light: '#ffffff' } });
export const UTR = /^[0-9]{12}$/;
