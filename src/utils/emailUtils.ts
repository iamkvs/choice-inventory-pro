import emailjs from 'emailjs-com';
import type { Invoice, Customer, Company } from '@/db/database';

// EmailJS configuration - Users need to set up their own account
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_USER_ID = 'YOUR_USER_ID';

interface EmailData {
  [key: string]: string | undefined;
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_total?: string;
  company_name?: string;
}

// Send invoice email
export async function sendInvoiceEmail(
  invoice: Invoice,
  customer: Customer,
  _company: Company | null,
  _pdfBlob?: Blob
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if EmailJS is configured
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
      return {
        success: false,
        message: 'Email service not configured. Please set up EmailJS credentials in src/utils/emailUtils.ts',
      };
    }

    const templateParams: EmailData = {
      to_email: customer.email,
      to_name: customer.name,
      from_name: _company?.name || 'Choice Inventory System',
      subject: `Invoice ${invoice.invoiceNumber} from ${_company?.name || 'Your Company'}`,
      message: `Dear ${customer.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\nThank you for your business!`,
      invoice_number: invoice.invoiceNumber,
      invoice_date: new Date(invoice.date).toLocaleDateString(),
      invoice_total: `$${invoice.total.toFixed(2)}`,
      company_name: _company?.name || '',
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    return {
      success: true,
      message: 'Invoice email sent successfully!',
    };
  } catch (error) {
    console.error('Email send failed:', error);
    return {
      success: false,
      message: 'Failed to send email. Please check your EmailJS configuration.',
    };
  }
}

// Send generic email
export async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  message: string,
  company: Company | null
): Promise<{ success: boolean; message: string }> {
  try {
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
      return {
        success: false,
        message: 'Email service not configured. Please set up EmailJS credentials.',
      };
    }

    const templateParams: EmailData = {
      to_email: to,
      to_name: toName,
      from_name: company?.name || 'Choice Inventory System',
      subject,
      message,
      company_name: company?.name || '',
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    return {
      success: true,
      message: 'Email sent successfully!',
    };
  } catch (error) {
    console.error('Email send failed:', error);
    return {
      success: false,
      message: 'Failed to send email. Please check your EmailJS configuration.',
    };
  }
}

// Show email configuration instructions
export function getEmailConfigInstructions(): string {
  return `
To enable email functionality, please follow these steps:

1. Create a free account at https://www.emailjs.com/
2. Create a new Email Service (Gmail, Outlook, etc.)
3. Create an Email Template with the following variables:
   - {{to_email}}
   - {{to_name}}
   - {{from_name}}
   - {{subject}}
   - {{message}}
   - {{invoice_number}} (optional)
   - {{invoice_date}} (optional)
   - {{invoice_total}} (optional)
   - {{company_name}} (optional)
4. Update the EMAILJS constants in src/utils/emailUtils.ts:
   - EMAILJS_SERVICE_ID
   - EMAILJS_TEMPLATE_ID
   - EMAILJS_USER_ID
  `;
}
