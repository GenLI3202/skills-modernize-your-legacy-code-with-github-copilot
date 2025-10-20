# Account Management System - Node.js

Modern Node.js implementation of the legacy COBOL Account Management System.

## Overview

This application has been converted from the original COBOL implementation while preserving:
- ✅ Original business logic
- ✅ Data integrity rules
- ✅ Menu-driven interface
- ✅ Three-tier architecture (UI → Business Logic → Data Access)

## Architecture

The application maintains the same modular structure as the COBOL version:

```
MainProgram (UI Layer)
    ↓
Operations (Business Logic Layer)
    ↓
DataProgram (Data Access Layer)
    ↓
Balance Storage
```

### Components

- **MainProgram**: User interface and application controller
- **Operations**: Business logic for account operations (view, credit, debit)
- **DataProgram**: Data access layer for balance management

## Business Rules

1. **Initial Balance**: $1,000.00
2. **Minimum Balance**: $0.00 (no negative balances allowed)
3. **Maximum Balance**: $999,999.99
4. **Overdraft Protection**: Debits exceeding balance are rejected
5. **Precision**: Two decimal places (cents)
6. **Display Format**: 6 digits + 2 decimals (e.g., "001000.00")

## Installation

```bash
cd src/accounting
npm install
```

## Running the Application

```bash
npm start
```

Or directly:

```bash
node index.js
```

## Usage

The application presents a menu-driven interface:

```
--------------------------------
Account Management System
1. View Balance
2. Credit Account
3. Debit Account
4. Exit
--------------------------------
Enter your choice (1-4):
```

### Operations

1. **View Balance** - Display current account balance
2. **Credit Account** - Add funds to the account
3. **Debit Account** - Withdraw funds (with overdraft protection)
4. **Exit** - Terminate the application

## Debugging in VS Code

Use the VS Code debugger with the provided launch configuration:

1. Open the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select "Run Node.js Accounting App"
3. Press F5 to start debugging

## Differences from COBOL Version

### Preserved Features
- Exact same menu options and flow
- Identical business logic and validation
- Same balance display format
- Insufficient funds protection

### Modern Enhancements
- Object-oriented design with classes
- Async/await ready for future database integration
- Modular, testable code structure
- Easy to extend for new features

## Future Enhancements

- [ ] Add database persistence (PostgreSQL, MongoDB)
- [ ] Implement transaction history
- [ ] Support multiple user accounts
- [ ] Add authentication and authorization
- [ ] Create REST API endpoints
- [ ] Add unit and integration tests
- [ ] Implement logging framework
- [ ] Add input validation and sanitization

## Testing

The application structure supports easy testing:

```javascript
const { DataProgram, Operations, MainProgram } = require('./index.js');

// Unit test example
const dataProgram = new DataProgram();
const initialBalance = dataProgram.execute('READ');
console.assert(initialBalance === 1000.00, 'Initial balance should be $1000.00');
```

See `docs/TESTPLAN.md` for comprehensive test cases.

## License

ISC
