import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { SalesInvoice, Shop, Party, Item } from '@/types';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { toWords } from '@/lib/numberToWords';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Courier',
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 12,
    marginBottom: 12,
  },
  shopTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  shopSub: {
    fontSize: 9,
    marginBottom: 2,
  },
  invoiceTagBox: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  invoiceBadge: {
    backgroundColor: '#FFE500',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  metaRow: {
    fontSize: 9,
    marginBottom: 2,
  },
  billToBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#F5F5F0',
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  customerName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  modeBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontFamily: 'Courier-Bold',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  table: {
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: 'Courier-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  tableRowZebra: {
    backgroundColor: '#F5F5F0',
  },
  colNum: { width: '7%' },
  colItem: { width: '41%' },
  colQty: { width: '12%', textAlign: 'right' },
  colUnit: { width: '12%', paddingLeft: 6 },
  colRate: { width: '14%', textAlign: 'right' },
  colAmount: { width: '14%', textAlign: 'right', fontFamily: 'Courier-Bold' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  leftNotesCol: {
    width: '54%',
    justifyContent: 'space-between',
  },
  wordsBox: {
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F0',
  },
  balanceSummaryBox: {
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 8,
    marginBottom: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  totalsBox: {
    width: '44%',
    borderWidth: 2,
    borderColor: '#000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Courier-Bold',
    fontSize: 11,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  termsText: {
    fontSize: 8,
    marginBottom: 28,
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sigBlock: {
    width: '38%',
    borderTopWidth: 1.5,
    borderTopColor: '#000000',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
});

export interface InvoicePdfProps {
  invoice: SalesInvoice;
  shop: Shop;
  customer: Party | undefined;
  items: Item[];
}

export function InvoicePdfDoc({ invoice, shop, customer, items }: InvoicePdfProps) {
  const prevBalance = customer ? customer.currentBalance - invoice.balance : 0;
  const newBalance = customer ? customer.currentBalance : invoice.balance;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Shop Header */}
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.shopTitle}>{shop.name}</Text>
            <Text style={styles.shopSub}>{shop.address}</Text>
            <Text style={styles.shopSub}>Phone: {shop.phone}</Text>
            {shop.ntn ? <Text style={styles.shopSub}>NTN: {shop.ntn}</Text> : null}
          </View>
          <View style={styles.invoiceTagBox}>
            <Text style={styles.invoiceBadge}>INVOICE</Text>
            <Text style={styles.metaRow}>Serial: {invoice.serial}</Text>
            <Text style={styles.metaRow}>Date: {formatDate(invoice.date)}</Text>
          </View>
        </View>

        {/* Bill-To Block */}
        <View style={styles.billToBox}>
          <View>
            <Text style={styles.sectionLabel}>BILL TO</Text>
            <Text style={styles.customerName}>{customer?.name ?? 'Walk-in Customer'}</Text>
            {customer?.phone ? <Text style={styles.shopSub}>Tel: {customer.phone}</Text> : null}
            {customer?.address ? <Text style={styles.shopSub}>{customer.address}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={styles.sectionLabel}>PAYMENT MODE</Text>
            <Text style={styles.modeBadge}>{invoice.paymentMode.toUpperCase()}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNum}>#</Text>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {invoice.lines.map((line, idx) => {
            const item = items.find(it => it.id === line.itemId);
            return (
              <View
                key={`${line.itemId}-${idx}`}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}
              >
                <Text style={styles.colNum}>{idx + 1}</Text>
                <Text style={styles.colItem}>{item?.name ?? line.itemId}</Text>
                <Text style={styles.colQty}>{line.qty}</Text>
                <Text style={styles.colUnit}>{line.unit}</Text>
                <Text style={styles.colRate}>{formatPKR(line.rate)}</Text>
                <Text style={styles.colAmount}>{formatPKR(line.amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals & Summary */}
        <View style={styles.totalsSection}>
          <View style={styles.leftNotesCol}>
            <View style={styles.wordsBox}>
              <Text style={styles.sectionLabel}>AMOUNT IN WORDS</Text>
              <Text>{toWords(invoice.grandTotal)}</Text>
            </View>
            {customer && (
              <View style={styles.balanceSummaryBox}>
                <Text style={styles.sectionLabel}>ACCOUNT SUMMARY</Text>
                <View style={styles.summaryLine}>
                  <Text>Previous Balance:</Text>
                  <Text>{formatPKR(prevBalance)}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text>This Invoice Balance:</Text>
                  <Text>{formatPKR(invoice.balance)}</Text>
                </View>
                <View style={[styles.summaryLine, { fontFamily: 'Courier-Bold', marginTop: 2 }]}>
                  <Text>New Balance:</Text>
                  <Text>{formatPKR(newBalance)}</Text>
                </View>
              </View>
            )}
            {invoice.notes ? (
              <View style={styles.balanceSummaryBox}>
                <Text style={styles.sectionLabel}>NOTES</Text>
                <Text>{invoice.notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatPKR(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>{formatPKR(invoice.discount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text>GRAND TOTAL</Text>
              <Text>{formatPKR(invoice.grandTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Paid</Text>
              <Text>{formatPKR(invoice.paid)}</Text>
            </View>
            <View style={[styles.totalRow, { borderBottomWidth: 0, fontFamily: 'Courier-Bold' }]}>
              <Text>Balance</Text>
              <Text>{formatPKR(invoice.balance)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.sectionLabel}>TERMS & CONDITIONS</Text>
          <Text style={styles.termsText}>{shop.terms}</Text>
          <View style={styles.sigRow}>
            <Text style={styles.sigBlock}>CUSTOMER SIGNATURE</Text>
            <Text style={styles.sigBlock}>AUTHORIZED SIGNATURE</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadInvoicePdf(
  invoice: SalesInvoice,
  shop: Shop,
  customer: Party | undefined,
  items: Item[]
): Promise<void> {
  const blob = await pdf(
    <InvoicePdfDoc invoice={invoice} shop={shop} customer={customer} items={items} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.serial}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
