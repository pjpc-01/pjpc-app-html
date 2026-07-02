
import { generateInvoicePDF } from './lib/pdf-generator';

const invoice = {
  id: 'test1',
  invoiceNumber: 'INV-2026-001',
  studentName: 'test 1',
  studentId: 'test1',
  totalAmount: 1702,
  items: [
    { name: 'Kids Boxing/MMA class', amount: 120 },
    { name: 'Extra Class', amount: 80 },
    { name: 'One Day Trip', amount: 120 },
    { name: 'Holiday program', amount: 150 },
    { name: 'Holiday full daycare charges', amount: 10 },
    { name: 'Daycare', amount: 350 },
    { name: 'Transit Care', amount: 100 },
    { name: 'Deposit Tuition (Primary)', amount: 330 },
    { name: 'Material & Progress Fee', amount: 180 },
    { name: 'Tea Time', amount: 4 },
    { name: 'Meal', amount: 8 },
    { name: 'Homework guidence', amount: 150 },
    { name: 'Transport Han Ming (s)', amount: 100 }
  ],
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
  const blob = await generateInvoicePDF(invoice as any, settings as any);
  const buf = Buffer.from(await blob.arrayBuffer());
  require('fs').writeFileSync('/tmp/test-invoice.pdf', buf);
  console.log('Written', buf.length, 'bytes');
})();
