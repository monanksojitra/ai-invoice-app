import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInvoiceStore, Invoice } from '../src/store/invoiceStore';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selected?: boolean;
    selectedColor?: string;
  };
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, isLoading, fetchInvoices } = useInvoiceStore();
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const markedDates: MarkedDates = useMemo(() => {
    const dates: MarkedDates = {};
    
    invoices.forEach((invoice: Invoice) => {
      if (invoice.due_date) {
        const dateKey = invoice.due_date.split('T')[0];
        const isPaid = invoice.status === 'paid';
        const isOverdue = invoice.status === 'overdue';
        
        dates[dateKey] = {
          marked: true,
          dotColor: isPaid ? Colors.success : isOverdue ? Colors.error : Colors.warning,
          selected: dateKey === selectedDate,
          selectedColor: Colors.primaryLight,
        };
      }
    });

    return dates;
  }, [invoices, selectedDate]);

  const invoicesOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return invoices.filter((inv: Invoice) => 
      inv.due_date && inv.due_date.startsWith(selectedDate)
    );
  }, [invoices, selectedDate]);

  const upcomingInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return invoices
      .filter((inv: Invoice) => {
        if (!inv.due_date || inv.status === 'paid') return false;
        const dueDate = new Date(inv.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      })
      .sort((a: Invoice, b: Invoice) => {
        const dateA = new Date(a.due_date!).getTime();
        const dateB = new Date(b.due_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [invoices]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleInvoicePress = useCallback((invoice: Invoice) => {
    router.push({
      pathname: '/invoice-detail',
      params: { id: invoice.id }
    });
  }, [router]);

  const statusIcon = (status: string) => {
    const icons: Record<string, string> = {
      paid: 'check-circle',
      pending: 'clock-outline',
      overdue: 'alert-circle',
      cancelled: 'close-circle',
    };
    return icons[status] || 'receipt-text';
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: Colors.success,
      pending: Colors.warning,
      overdue: Colors.error,
      cancelled: Colors.textMuted,
    };
    return colors[status] || Colors.textMuted;
  };

  if (isLoading && invoices.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-btn"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Calendar</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        testID="calendar-screen"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      >
        <Card style={styles.calendarCard}>
          <Calendar
            testID="calendar"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: Colors.surface,
              calendarBackground: Colors.surface,
              textSectionTitleColor: Colors.textMuted,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.surface,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.textMain,
              textDisabledColor: Colors.surfaceHighlight,
              dotColor: Colors.primary,
              monthTextColor: Colors.textMain,
              textMonthFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
          />
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Paid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>Overdue</Text>
            </View>
          </View>
        </Card>

        {invoicesOnSelectedDate.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Invoices on {formatDate(selectedDate)}
            </Text>
            {invoicesOnSelectedDate.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                testID={`invoice-${invoice.id}`}
                onPress={() => handleInvoicePress(invoice)}
              >
                <Card style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.vendorName}>
                        {invoice.vendor_name || 'Unknown Vendor'}
                      </Text>
                      <Text style={styles.invoiceNumber}>
                        #{invoice.invoice_number || invoice.id.slice(0, 8)}
                      </Text>
                    </View>
                    <View style={styles.invoiceRight}>
                      <Text style={styles.amount}>
                        {formatCurrency(invoice.grand_total)}
                      </Text>
                      <MaterialCommunityIcons
                        name={statusIcon(invoice.status) as any}
                        size={20}
                        color={statusColor(invoice.status)}
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          {upcomingInvoices.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>No upcoming payments</Text>
            </Card>
          ) : (
            upcomingInvoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                testID={`upcoming-${invoice.id}`}
                onPress={() => handleInvoicePress(invoice)}
              >
                <Card style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.vendorName}>
                        {invoice.vendor_name || 'Unknown Vendor'}
                      </Text>
                      <Text style={styles.invoiceNumber}>
                        Due: {formatDate(invoice.due_date!)}
                      </Text>
                    </View>
                    <View style={styles.invoiceRight}>
                      <Text style={styles.amount}>
                        {formatCurrency(invoice.grand_total)}
                      </Text>
                      <MaterialCommunityIcons
                        name={statusIcon(invoice.status) as any}
                        size={20}
                        color={statusColor(invoice.status)}
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMain,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
  },
  calendarCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 12,
  },
  invoiceCard: {
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMain,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMain,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
});
