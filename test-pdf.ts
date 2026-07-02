import { generateInvoicePDF } from './lib/pdf-generator';

const invoice = {
  id: 'test1',
  invoiceNumber: 'INV-2026-001',
  studentName: 'test 1',
  studentId: 'test1',
  totalAmount: 1702,
  items: [{ name: 'Test Fee', amount: 1702 }],
  status: 'issued',
  issueDate: '2026-07-01',
  dueDate: '2026-07-16',
  receiptNumber: null,
  grade: '',
  notes: ''
};

const settings = {
  id: 'default', name: '默认设置', schoolName: '智慧教育学校', schoolNameEn: '',
  schoolLogo: '', schoolAddress: '', schoolPhone: '', schoolEmail: '', schoolWebsite: '',
  taxNumber: '', bankName: '', bankAccount: '', bankHolder: '',
  primaryColor: '#1e40af', secondaryColor: '#3b82f6', accentColor: '#f59e0b',
  footerText: '', paymentTerms: '', receiptNote: '',
  isDefault: true, createdAt: '', updatedAt: ''
};

(async () => {
  try {
    const blob = await generateInvoicePDF(invoice as any, settings as any);
    console.log('PDF generated successfully! Size:', blob.size, 'bytes');
  } catch (e: any) {
    console.error('ERROR:', e.message);
    console.error('STACK:', e.stack);
  }
})();
