// (c) All Rights Reserved by Hans Boekweg.

import _ from "lodash";
import type {
  Transaction,
  AccountGroup,
  SamplingConfig,
  SelectedSample,
  SamplingResults,
  SamplingSummary,
} from "../types";

/**
 * Generates a unique ID for each transaction
 */
const generateId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Detects if the Excel data is in hierarchical GL format
 * (e.g., QuickBooks GL export with account names in column A and data in subsequent rows)
 * @param rawData - 2D array from sheet_to_json with header: 1
 * @returns true if hierarchical format detected
 */
export const detectHierarchicalGLFormat = (rawData: unknown[][]): boolean => {
  if (!rawData || rawData.length < 10) return false;

  // Look for header row with typical GL columns (Date, Amount, Balance, etc.)
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;

    const rowStr = row.map((c) => String(c || "").toLowerCase()).join(" ");
    // Check for typical GL header columns
    if (
      rowStr.includes("date") &&
      (rowStr.includes("amount") || rowStr.includes("balance"))
    ) {
      // Check if subsequent rows have account names in first column followed by data rows
      for (let j = i + 1; j < Math.min(i + 10, rawData.length); j++) {
        const dataRow = rawData[j];
        if (
          dataRow &&
          dataRow[0] &&
          typeof dataRow[0] === "string" &&
          !String(dataRow[0]).toLowerCase().includes("total")
        ) {
          // Found an account name row - check if next row has null in first column (transaction row)
          const nextRow = rawData[j + 1];
          if (
            nextRow &&
            (nextRow[0] === null ||
              nextRow[0] === undefined ||
              nextRow[0] === "")
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

/**
 * Parses hierarchical GL format (like QuickBooks GL export)
 * Account names appear in column A, with transaction data in subsequent rows
 * @param rawData - 2D array from sheet_to_json with header: 1
 * @returns Array of Transaction objects
 */
export const parseHierarchicalGL = (rawData: unknown[][]): Transaction[] => {
  const transactions: Transaction[] = [];

  // Find the header row (contains Date, Amount, etc.)
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;

    const rowStr = row.map((c) => String(c || "").toLowerCase()).join(" ");
    if (
      rowStr.includes("date") &&
      (rowStr.includes("amount") || rowStr.includes("balance"))
    ) {
      headerRowIndex = i;
      headers = row.map((c) =>
        String(c || "")
          .toLowerCase()
          .trim()
      );
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("Could not find header row in hierarchical GL");
    return [];
  }

  // Find column indices - add null checks for safety
  const dateColIdx = headers.findIndex((h) => h && h === "date");
  const amountColIdx = headers.findIndex((h) => h && h === "amount");
  const memoColIdx = headers.findIndex(
    (h) => h && (h.includes("memo") || h.includes("description"))
  );
  const numColIdx = headers.findIndex((h) => h && h === "num");
  const nameColIdx = headers.findIndex((h) => h && h === "name");
  const typeColIdx = headers.findIndex((h) => h && h.includes("type"));

  let currentAccountName = "";

  // Process data rows
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;

    const firstCol = row[0];

    // Check if this is an account name row
    if (firstCol && typeof firstCol === "string" && firstCol.trim() !== "") {
      const firstColStr = firstCol.trim();
      // Skip "Total for" rows and "Beginning Balance" type rows
      if (!firstColStr.toLowerCase().startsWith("total")) {
        currentAccountName = firstColStr;
      }
      continue;
    }

    // This is a transaction row - check if it has an amount
    const rawAmount = amountColIdx >= 0 ? row[amountColIdx] : null;
    if (rawAmount === null || rawAmount === undefined || rawAmount === "")
      continue;

    // Skip "Beginning Balance" rows
    const dateVal = dateColIdx >= 0 ? row[dateColIdx] : "";
    if (String(dateVal).toLowerCase().includes("beginning balance")) continue;

    // Parse amount
    let amount = 0;
    if (typeof rawAmount === "number") {
      amount = rawAmount;
    } else if (typeof rawAmount === "string") {
      const cleaned = rawAmount
        .replace(/[$,]/g, "")
        .replace(/\(([^)]+)\)/, "-$1")
        .trim();
      amount = parseFloat(cleaned) || 0;
    }

    // Skip zero amounts
    if (amount === 0) continue;

    // Parse date - handle Excel serial dates
    let dateStr = "";
    const rawDate = dateColIdx >= 0 ? row[dateColIdx] : "";
    if (typeof rawDate === "number") {
      // Excel serial date - convert to JS date
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(
        excelEpoch.getTime() + rawDate * 24 * 60 * 60 * 1000
      );
      dateStr = jsDate.toLocaleDateString("en-US");
    } else {
      dateStr = String(rawDate || "");
    }

    transactions.push({
      id: generateId(),
      date: dateStr,
      accountNumber: "", // Not typically available in this format
      accountName: currentAccountName,
      description: memoColIdx >= 0 ? String(row[memoColIdx] || "") : "",
      amount,
      reference: numColIdx >= 0 ? String(row[numColIdx] || "") : undefined,
      vendor: nameColIdx >= 0 ? String(row[nameColIdx] || "") : undefined,
      _rowIndex: i + 1,
    });
  }

  return transactions;
};

/**
 * Filters transactions by target keywords in account name
 * @param transactions - Raw transaction data
 * @param keywords - Target keywords to match (if empty, all transactions are returned)
 * @returns Filtered transactions containing any keyword, or all transactions if no keywords specified
 */
export const filterByKeywords = (
  transactions: Transaction[],
  keywords: string[]
): Transaction[] => {
  // If no keywords specified, return all transactions
  const validKeywords = keywords.filter((k) => k.trim() !== "");
  if (validKeywords.length === 0) {
    return transactions;
  }

  const upperKeywords = validKeywords.map((k) => k.toUpperCase().trim());

  return transactions.filter((txn) => {
    const accountName = (txn.accountName || "").toUpperCase();
    return upperKeywords.some((keyword) => accountName.includes(keyword));
  });
};

/**
 * Groups transactions by account name and calculates totals
 * @param transactions - Filtered transactions
 * @returns Array of account groups with summaries
 */
export const groupByAccount = (transactions: Transaction[]): AccountGroup[] => {
  const grouped = _.groupBy(transactions, "accountName");

  return Object.entries(grouped).map(([accountName, txns]) => {
    const totalBalance = _.sumBy(txns, (t) => Math.abs(t.amount));
    const accountNumber = txns[0]?.accountNumber || "";

    return {
      accountName,
      accountNumber,
      transactions: txns,
      totalBalance,
      transactionCount: txns.length,
    };
  });
};

/**
 * Identifies material accounts (those exceeding tolerable misstatement)
 * @param accountGroups - Grouped account data
 * @param tolerableMisstatement - TM threshold
 * @returns Material account groups
 */
export const identifyMaterialAccounts = (
  accountGroups: AccountGroup[],
  tolerableMisstatement: number
): AccountGroup[] => {
  return accountGroups.filter(
    (group) => group.totalBalance > tolerableMisstatement
  );
};

/**
 * Selects samples from a single account group based on priority rules
 * @param accountGroup - The account group to sample from
 * @param config - Sampling configuration
 * @returns Selected samples with metadata
 */
export const selectSamplesFromAccount = (
  accountGroup: AccountGroup,
  config: SamplingConfig
): SelectedSample[] => {
  const { testingScope, sampleSize } = config;

  // Sort transactions by absolute amount descending
  const sortedTransactions = _.orderBy(
    accountGroup.transactions,
    [(t) => Math.abs(t.amount)],
    ["desc"]
  );

  const selectedSamples: SelectedSample[] = [];

  // Priority 1: Select transactions over testing scope
  const overScopeTransactions = sortedTransactions.filter(
    (t) => Math.abs(t.amount) > testingScope
  );

  for (const txn of overScopeTransactions) {
    if (selectedSamples.length >= sampleSize) break;

    selectedSamples.push({
      ...txn,
      selectionReason: "OVER_SCOPE",
      accountGroup: accountGroup.accountName,
      groupTotalBalance: accountGroup.totalBalance,
    });
  }

  // Priority 2: Fill remaining slots with highest value transactions
  if (selectedSamples.length < sampleSize) {
    const selectedIds = new Set(selectedSamples.map((s) => s.id));
    const remainingTransactions = sortedTransactions.filter(
      (t) => !selectedIds.has(t.id)
    );

    for (const txn of remainingTransactions) {
      if (selectedSamples.length >= sampleSize) break;

      selectedSamples.push({
        ...txn,
        selectionReason: "HIGH_VALUE_KEY_ITEM",
        accountGroup: accountGroup.accountName,
        groupTotalBalance: accountGroup.totalBalance,
      });
    }
  }

  return selectedSamples;
};

/**
 * Calculates summary statistics for the sampling results
 * @param samples - Selected samples
 * @param materialAccounts - Material account groups
 * @returns Summary statistics
 */
export const calculateSummary = (
  samples: SelectedSample[],
  materialAccounts: AccountGroup[]
): SamplingSummary => {
  const totalMaterialAccounts = materialAccounts.length;
  const totalValueTested = _.sumBy(samples, (s) => Math.abs(s.amount));
  const totalMaterialBalance = _.sumBy(materialAccounts, "totalBalance");
  const coveragePercentage =
    totalMaterialBalance > 0
      ? (totalValueTested / totalMaterialBalance) * 100
      : 0;
  const totalTransactionsReviewed = _.sumBy(
    materialAccounts,
    "transactionCount"
  );
  const overScopeCount = samples.filter(
    (s) => s.selectionReason === "OVER_SCOPE"
  ).length;
  const highValueCount = samples.filter(
    (s) => s.selectionReason === "HIGH_VALUE_KEY_ITEM"
  ).length;

  return {
    totalMaterialAccounts,
    totalValueTested,
    totalMaterialBalance,
    coveragePercentage,
    totalTransactionsReviewed,
    overScopeCount,
    highValueCount,
  };
};

/**
 * Main sampling function - processes raw data and returns complete results
 * @param rawTransactions - Raw transaction data from file
 * @param config - Sampling configuration
 * @returns Complete sampling results with samples, summary, and account groups
 */
export const performSampling = (
  rawTransactions: Transaction[],
  config: SamplingConfig
): SamplingResults => {
  // Ensure all transactions have IDs
  const transactionsWithIds = rawTransactions.map((t) => ({
    ...t,
    id: t.id || generateId(),
  }));

  // Step 1: Filter by keywords
  const filteredTransactions = filterByKeywords(
    transactionsWithIds,
    config.targetKeywords
  );

  // Step 2: Group by account
  const accountGroups = groupByAccount(filteredTransactions);

  // Step 3: Identify material accounts
  const materialAccounts = identifyMaterialAccounts(
    accountGroups,
    config.tolerableMisstatement
  );

  // Step 4: Select samples from each material account
  const allSamples: SelectedSample[] = [];
  for (const accountGroup of materialAccounts) {
    const samples = selectSamplesFromAccount(accountGroup, config);
    allSamples.push(...samples);
  }

  // Step 5: Calculate summary
  const summary = calculateSummary(allSamples, materialAccounts);

  return {
    samples: allSamples,
    summary,
    accountGroups: materialAccounts,
    filteredTransactionCount: filteredTransactions.length,
  };
};

/**
 * Parses raw data from file into Transaction format
 * Attempts to auto-detect column mappings
 * @param data - Raw parsed data from CSV/XLSX
 * @returns Array of Transaction objects
 */
export const parseRawData = (
  data: Record<string, unknown>[]
): Transaction[] => {
  if (!data || data.length === 0) return [];

  // Common column name variations
  const columnPatterns = {
    date: ["date", "transaction date", "trans date", "posting date", "gl date"],
    accountNumber: [
      "account",
      "account number",
      "acct",
      "acct no",
      "account no",
      "gl account",
    ],
    accountName: [
      "account name",
      "account description",
      "acct name",
      "description",
      "account desc",
      "gl description",
    ],
    amount: [
      "amount",
      "debit",
      "credit",
      "value",
      "transaction amount",
      "trans amount",
    ],
    description: [
      "memo",
      "description",
      "transaction description",
      "line description",
      "detail",
      "narration",
    ],
    reference: [
      "reference",
      "ref",
      "doc no",
      "document",
      "invoice",
      "check no",
      "voucher",
    ],
    vendor: ["vendor", "payee", "supplier", "customer", "party"],
  };

  // Get available columns from first row
  const sampleRow = data[0];
  const availableColumns = Object.keys(sampleRow).map((c) =>
    c.toLowerCase().trim()
  );

  // Find best match for each field
  const findColumn = (patterns: string[]): string | undefined => {
    for (const pattern of patterns) {
      const match = availableColumns.find(
        (col) => col === pattern || col.includes(pattern)
      );
      if (match) {
        // Return original column name (case-sensitive)
        return Object.keys(sampleRow).find(
          (k) => k.toLowerCase().trim() === match
        );
      }
    }
    return undefined;
  };

  const mapping = {
    date: findColumn(columnPatterns.date),
    accountNumber: findColumn(columnPatterns.accountNumber),
    accountName: findColumn(columnPatterns.accountName),
    amount: findColumn(columnPatterns.amount),
    description: findColumn(columnPatterns.description),
    reference: findColumn(columnPatterns.reference),
    vendor: findColumn(columnPatterns.vendor),
  };

  return data.map((row, index) => {
    // Parse amount - handle various formats
    let amount = 0;
    if (mapping.amount) {
      const rawAmount = row[mapping.amount];
      if (typeof rawAmount === "number") {
        amount = rawAmount;
      } else if (typeof rawAmount === "string") {
        // Remove currency symbols, commas, and handle parentheses for negatives
        const cleaned = rawAmount
          .replace(/[$,]/g, "")
          .replace(/\(([^)]+)\)/, "-$1")
          .trim();
        amount = parseFloat(cleaned) || 0;
      }
    }

    return {
      id: generateId(),
      date: String(mapping.date ? row[mapping.date] || "" : ""),
      accountNumber: String(
        mapping.accountNumber ? row[mapping.accountNumber] || "" : ""
      ),
      accountName: String(
        mapping.accountName ? row[mapping.accountName] || "" : ""
      ),
      description: String(
        mapping.description ? row[mapping.description] || "" : ""
      ),
      amount,
      reference: mapping.reference
        ? String(row[mapping.reference] || "")
        : undefined,
      vendor: mapping.vendor ? String(row[mapping.vendor] || "") : undefined,
      _rowIndex: index + 1,
    };
  });
};

/**
 * Formats currency for display
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats percentage for display
 * @param value - Numeric percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};
