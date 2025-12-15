// (c) All Rights Reserved by Hans Boekweg.

/**
 * Represents a single transaction from the General Ledger
 */
export interface Transaction {
  id: string;
  date: string;
  accountNumber: string;
  accountName: string;
  description: string;
  amount: number;
  reference?: string;
  vendor?: string;
  [key: string]: string | number | undefined; // Allow for additional GL fields
}

/**
 * Represents a grouped account with its transactions and summary
 */
export interface AccountGroup {
  accountName: string;
  accountNumber: string;
  transactions: Transaction[];
  totalBalance: number;
  transactionCount: number;
}

/**
 * Selected sample with metadata about selection criteria
 */
export interface SelectedSample extends Transaction {
  selectionReason: "OVER_SCOPE" | "HIGH_VALUE_KEY_ITEM";
  accountGroup: string;
  groupTotalBalance: number;
}

/**
 * Configuration settings for the sampling algorithm
 */
export interface SamplingConfig {
  tolerableMisstatement: number; // TM - accounts must exceed this to be material
  testingScope: number; // Transactions above this are prioritized
  targetKeywords: string[]; // Keywords to filter account names
  sampleSize: number; // Number of samples per material account
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: SamplingConfig = {
  tolerableMisstatement: 15000,
  testingScope: 11000,
  targetKeywords: [], // Empty = all accounts considered
  sampleSize: 3,
};

/**
 * Summary statistics for the sampling results
 */
export interface SamplingSummary {
  totalMaterialAccounts: number;
  totalValueTested: number;
  totalMaterialBalance: number;
  coveragePercentage: number;
  totalTransactionsReviewed: number;
  overScopeCount: number;
  highValueCount: number;
}

/**
 * Complete sampling results including samples and summary
 */
export interface SamplingResults {
  samples: SelectedSample[];
  summary: SamplingSummary;
  accountGroups: AccountGroup[];
  filteredTransactionCount: number;
}

/**
 * File upload state
 */
export interface FileUploadState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  rawData: Transaction[];
}

/**
 * Column mapping for flexible GL file parsing
 */
export interface ColumnMapping {
  date?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
  amount?: string;
  reference?: string;
  vendor?: string;
}
