# Audit Sampler Pro

A professional, browser-based React application for automating audit expense sampling. The app is secure, client-side only (for data privacy), and features a premium FinTech aesthetic.

© All Rights Reserved by Hans Boekweg

## Features

- **Secure Client-Side Processing**: All data processing happens locally in your browser - no data is sent to any server
- **Flexible File Support**: Upload CSV or Excel (XLSX/XLS) files
- **Configurable Sampling Parameters**:
  - Tolerable Misstatement (TM): Default $15,000
  - Testing Scope: Default $11,000
  - Target Keywords: Configurable filters for account names
  - Sample Size: Adjustable samples per material account
- **Professional Dashboard**: Summary cards showing material accounts, value tested, and coverage percentage
- **Export to Excel**: Download selected samples for audit documentation

## Tech Stack

- **Framework**: React (Vite) + TypeScript
- **UI Library**: Material UI (MUI) with custom FinTech theme
- **Data Parsing**: Papaparse (CSV) + SheetJS (Excel)
- **Logic**: Lodash for data manipulation
- **Export**: XLSX (SheetJS) for Excel export
- **Icons**: Lucide-React

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

## How It Works

### Sampling Algorithm

1. **Ingest Data**: Upload a General Ledger file (CSV/XLSX)
2. **Filter**: Isolate transactions where Account Name includes target keywords
3. **Identify Material Accounts**: Group by Account Name, keep accounts where Total Balance > Tolerable Misstatement
4. **Select Samples**: For each material account:
   - Priority 1: Select transactions > Testing Scope
   - Priority 2: Fill remaining slots with next highest value transactions
5. **Sort**: Transactions sorted by Amount (Descending)

### Expected File Format

Your GL file should include columns similar to:

- Date / Transaction Date
- Account Number / Account
- Account Name / Account Description
- Amount / Debit / Credit
- Description / Memo (optional)
- Reference / Document No (optional)
- Vendor / Payee (optional)

The app auto-detects common column name variations.

## Sample Data

A sample test file is included at `sample_data/test_gl_data.csv` for testing purposes.

## Project Structure

```
src/
├── types.ts                    # TypeScript interfaces
├── utils/
│   └── samplingLogic.ts        # Core sampling algorithm
├── components/
│   ├── FileUpload.tsx          # Drag-and-drop file upload
│   ├── ConfigPanel.tsx         # Settings configuration
│   ├── SummaryCards.tsx        # Dashboard statistics
│   └── DataGrid.tsx            # Results table with export
└── App.tsx                     # Main application
```

## License

All Rights Reserved by Hans Boekweg
# audit-test-sampler-main
