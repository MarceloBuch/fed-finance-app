export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'PAID';
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID';
export type RecurrenceKind = 'FIXED' | 'INSTALLMENT';
export type RecurrenceFrequency = 'MONTHLY' | 'YEARLY';
export type RecurrenceEditMode = 'THIS' | 'ALL' | 'THIS_AND_FOLLOWING';

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  bankCode?: string | null;
  accountType: AccountType;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  color?: string | null;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  paymentAccountId?: string | null;
  usedLimit?: number | null;
  availableLimit?: number | null;
  active: boolean;
  createdAt?: string;
}

export interface CreateAccountRequest {
  userId: string;
  name: string;
  bankCode?: string | null;
  accountType: AccountType;
  initialBalance: number;
  currency: string;
  color?: string | null;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  paymentAccountId?: string | null;
  initialUsedAmount?: number | null;
}

export interface UpdateAccountRequest {
  name: string;
  bankCode?: string | null;
  accountType: AccountType;
  initialBalance: number;
  currency: string;
  color?: string | null;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  paymentAccountId?: string | null;
}

export interface Category {
  id: string;
  userId?: string | null;
  parentId?: string | null;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  active: boolean;
  createdAt?: string;
  subcategories?: Category[];
}

export interface CreateCategoryRequest {
  userId: string;
  parentId?: string | null;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateCategoryRequest {
  parentId?: string | null;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string | null;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  recurrenceId?: string | null;
  invoiceId?: string | null;
  invoiceReferenceMonth?: string | null;
  installmentNumber?: number | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string | null;
  dueDate: string;
  paidDate?: string | null;
  status: TransactionStatus;
  customized: boolean;
  overdue?: boolean | null;
  active: boolean;
  createdAt?: string;
  warning?: string | null;
}

export interface CreateTransactionRequest {
  userId: string;
  accountId?: string | null;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string | null;
  dueDate: string;
  paidDate?: string | null;
  status?: TransactionStatus | null;
}

export interface UpdateTransactionRequest {
  accountId?: string | null;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string | null;
  dueDate: string;
}

export interface PayTransactionRequest {
  accountId?: string | null;
  amount?: number | null;
  paidDate?: string | null;
}

export interface TransactionFilter {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

export interface Recurrence {
  id: string;
  userId: string;
  kind: RecurrenceKind;
  type: TransactionType;
  description: string;
  amount: number;
  accountId?: string | null;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  frequency: RecurrenceFrequency;
  intervalStep?: number | null;
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  totalInstallments?: number | null;
  generatedUntil?: string | null;
  active: boolean;
  createdAt?: string;
  transactions?: Transaction[];
}

export interface CreateRecurrenceRequest {
  userId: string;
  kind: RecurrenceKind;
  type: TransactionType;
  description: string;
  amount?: number | null;
  totalAmount?: number | null;
  accountId?: string | null;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  frequency: RecurrenceFrequency;
  intervalStep?: number | null;
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  totalInstallments?: number | null;
}

export interface Invoice {
  id: string;
  creditCardAccountId: string;
  referenceMonth: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  paymentTransactionId?: string | null;
  paymentAccountId?: string | null;
  transactions: Transaction[];
}

export interface PayInvoiceRequest {
  accountId?: string | null;
  paidDate?: string | null;
}

export interface DashboardInvoiceSummary {
  invoiceId: string;
  creditCardAccountId: string;
  cardName: string;
  referenceMonth: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
}

export interface MonthlyForecastItem {
  month: string;
  openingBalance: number;
  expectedIncome: number;
  expectedExpense: number;
  projectedBalance: number;
}

export interface CategoryExpenseSummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
}

export interface DashboardOverview {
  month: string;
  totalBalance: number;
  realizedIncome: number;
  expectedIncome: number;
  realizedExpense: number;
  expectedExpense: number;
  accounts: {
    id: string;
    name: string;
    accountType: AccountType;
    currentBalance: number;
    creditLimit?: number | null;
    usedLimit?: number | null;
    availableLimit?: number | null;
  }[];
  transactions: Transaction[];
  expensesByCategory: CategoryExpenseSummary[];
  invoicesDue?: DashboardInvoiceSummary[];
}
