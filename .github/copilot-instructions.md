# Audit Sampler Pro - Project Instructions

## Project Overview
A professional, browser-based React application for automating audit expense sampling. The app is secure, client-side only (for data privacy), and uses a premium FinTech aesthetic.

## Tech Stack
- **Framework**: React (Vite) + TypeScript
- **UI Library**: MUI (Material UI) with FinTech theme
- **Data Parsing**: Papaparse (CSV) + SheetJS (Excel)
- **Logic**: Lodash for data manipulation
- **Export**: XLSX (SheetJS) for Excel export
- **Icons**: Lucide-React

## Business Logic (Sampling Algorithm)

### Configuration Defaults
- **Tolerable Misstatement (TM)**: $15,000
- **Testing Scope**: $11,000
- **Target Keywords**: ["ADMIN", "CIVIC CENTER", "PARK", "POOL"]
- **Sample Size**: 3 items per material account

### Execution Flow
1. **Ingest Data**: User uploads GL file (CSV/XLSX)
2. **Filter**: Isolate transactions where Account Name includes target keywords
3. **Identify Material Accounts**: Group by Account Name, keep where Total Balance > TM
4. **Select Samples**: For each material account, select sample size transactions
   - Priority 1: Transactions > Testing Scope
   - Priority 2: Next highest value transactions
5. **Sort**: By Amount (Descending)

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

## Running the Application
```bash
npm install
npm run dev
```

## Copyright
© All Rights Reserved by Hans Boekweg
