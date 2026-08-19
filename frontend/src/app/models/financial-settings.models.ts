export type CategoryKind = 'INCOME' | 'EXPENSE' | 'GENERAL';
export type TransactionKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  kind: CategoryKind;
}

export interface TransactionType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  kind: TransactionKind;
  categoryId: string;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  kind?: CategoryKind;
}

export interface TransactionTypePayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  kind: TransactionKind;
  categoryId: string;
}

export interface TransactionRelation { id: string; name: string; icon: string | null; color: string | null; kind?: TransactionKind; }
export interface FinancialTransaction {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  notes: string | null;
  category: TransactionRelation | null;
  type: TransactionRelation | null;
}
export interface ExpensePayload { amount: string; date: string; description?: string | null; notes?: string | null; categoryId: string; typeId?: string | null; }
export interface IncomePayload { amount: string; date: string; description?: string | null; notes?: string | null; categoryId?: string | null; typeId?: string | null; }
export interface TransactionFilters { month?: number; year?: number; categoryId?: string; transactionTypeId?: string; page?: number; limit?: number; }
