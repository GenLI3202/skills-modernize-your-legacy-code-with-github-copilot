/**
 * Account Management System - Node.js Implementation
 * Converted from COBOL legacy application
 * 
 * This application maintains the same three-tier architecture:
 * - MainProgram: User interface and menu controller
 * - Operations: Business logic layer
 * - DataProgram: Data access layer
 */

const readline = require('readline');

// ============================================================================
// DataProgram - Data Access Layer
// ============================================================================
/**
 * Manages the persistent storage and retrieval of account balance
 * Equivalent to data.cob (DataProgram)
 */
class DataProgram {
    constructor() {
        // STORAGE-BALANCE: Initial balance of $1,000.00
        this.storageBalance = 1000.00;
    }

    /**
     * Handle READ and WRITE operations
     * @param {string} operation - 'READ' or 'WRITE'
     * @param {number} balance - Balance value (used for WRITE operations)
     * @returns {number} Current balance (for READ operations)
     */
    execute(operation, balance = null) {
        if (operation === 'READ') {
            // Copy STORAGE-BALANCE to BALANCE
            return this.storageBalance;
        } else if (operation === 'WRITE') {
            // Copy BALANCE to STORAGE-BALANCE
            this.storageBalance = balance;
            return this.storageBalance;
        }
        throw new Error(`Invalid operation: ${operation}`);
    }
}

// ============================================================================
// Operations - Business Logic Layer
// ============================================================================
/**
 * Implements business logic for all account operations
 * Equivalent to operations.cob (Operations)
 */
class Operations {
    constructor(dataProgram, rl) {
        this.dataProgram = dataProgram;
        this.rl = rl;
    }

    /**
     * Execute the specified operation
     * @param {string} operationType - 'TOTAL ', 'CREDIT', or 'DEBIT '
     * @param {function} callback - Callback to return to main program
     */
    async execute(operationType, callback) {
        if (operationType === 'TOTAL ') {
            await this.viewBalance(callback);
        } else if (operationType === 'CREDIT') {
            await this.creditAccount(callback);
        } else if (operationType === 'DEBIT ') {
            await this.debitAccount(callback);
        } else {
            callback();
        }
    }

    /**
     * View Balance Operation
     * Retrieves and displays current balance
     */
    async viewBalance(callback) {
        // CALL DataProgram with 'READ'
        const finalBalance = this.dataProgram.execute('READ');
        
        // DISPLAY current balance
        console.log(`Current balance: ${this.formatBalance(finalBalance)}`);
        
        // GOBACK
        callback();
    }

    /**
     * Credit Account Operation
     * Adds funds to the account
     */
    async creditAccount(callback) {
        // DISPLAY prompt and ACCEPT amount
        this.rl.question('Enter credit amount: ', (input) => {
            const amount = parseFloat(input);
            
            // Validate input
            if (isNaN(amount)) {
                console.log('Invalid amount. Please enter a valid number.');
                callback();
                return;
            }

            // CALL DataProgram with 'READ'
            let finalBalance = this.dataProgram.execute('READ');
            
            // ADD amount to balance
            finalBalance += amount;
            
            // CALL DataProgram with 'WRITE'
            this.dataProgram.execute('WRITE', finalBalance);
            
            // DISPLAY new balance
            console.log(`Amount credited. New balance: ${this.formatBalance(finalBalance)}`);
            
            // GOBACK
            callback();
        });
    }

    /**
     * Debit Account Operation
     * Withdraws funds from the account with insufficient funds protection
     */
    async debitAccount(callback) {
        // DISPLAY prompt and ACCEPT amount
        this.rl.question('Enter debit amount: ', (input) => {
            const amount = parseFloat(input);
            
            // Validate input
            if (isNaN(amount)) {
                console.log('Invalid amount. Please enter a valid number.');
                callback();
                return;
            }

            // CALL DataProgram with 'READ'
            let finalBalance = this.dataProgram.execute('READ');
            
            // Business Rule: Check if sufficient funds available
            if (finalBalance >= amount) {
                // SUBTRACT amount from balance
                finalBalance -= amount;
                
                // CALL DataProgram with 'WRITE'
                this.dataProgram.execute('WRITE', finalBalance);
                
                // DISPLAY new balance
                console.log(`Amount debited. New balance: ${this.formatBalance(finalBalance)}`);
            } else {
                // DISPLAY insufficient funds message
                console.log('Insufficient funds for this debit.');
            }
            
            // GOBACK
            callback();
        });
    }

    /**
     * Format balance to match COBOL display format: 6 digits + 2 decimal places
     * @param {number} balance - The balance to format
     * @returns {string} Formatted balance (e.g., "001000.00")
     */
    formatBalance(balance) {
        // Format to 2 decimal places
        const formatted = balance.toFixed(2);
        // Pad with leading zeros to match COBOL PIC 9(6)V99 format
        const [whole, decimal] = formatted.split('.');
        const paddedWhole = whole.padStart(6, '0');
        return `${paddedWhole}.${decimal}`;
    }
}

// ============================================================================
// MainProgram - User Interface and Application Controller
// ============================================================================
/**
 * Main entry point and user interface
 * Equivalent to main.cob (MainProgram)
 */
class MainProgram {
    constructor() {
        // Create readline interface for user input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Initialize data layer
        this.dataProgram = new DataProgram();
        
        // Initialize business logic layer
        this.operations = new Operations(this.dataProgram, this.rl);
        
        // CONTINUE-FLAG: Controls application loop
        this.continueFlag = 'YES';
    }

    /**
     * Display the main menu
     */
    displayMenu() {
        console.log('--------------------------------');
        console.log('Account Management System');
        console.log('1. View Balance');
        console.log('2. Credit Account');
        console.log('3. Debit Account');
        console.log('4. Exit');
        console.log('--------------------------------');
    }

    /**
     * Process user menu choice
     * @param {string} choice - User's menu selection
     */
    async processChoice(choice) {
        const userChoice = parseInt(choice);

        // EVALUATE user choice
        switch (userChoice) {
            case 1:
                // CALL Operations with 'TOTAL '
                await this.operations.execute('TOTAL ', () => this.mainLoop());
                break;
            case 2:
                // CALL Operations with 'CREDIT'
                await this.operations.execute('CREDIT', () => this.mainLoop());
                break;
            case 3:
                // CALL Operations with 'DEBIT '
                await this.operations.execute('DEBIT ', () => this.mainLoop());
                break;
            case 4:
                // Set CONTINUE-FLAG to 'NO'
                this.continueFlag = 'NO';
                this.exit();
                break;
            default:
                // Invalid choice
                console.log('Invalid choice, please select 1-4.');
                this.mainLoop();
                break;
        }
    }

    /**
     * Main application loop
     * PERFORM UNTIL CONTINUE-FLAG = 'NO'
     */
    mainLoop() {
        if (this.continueFlag === 'NO') {
            return;
        }

        this.displayMenu();
        this.rl.question('Enter your choice (1-4): ', (choice) => {
            this.processChoice(choice);
        });
    }

    /**
     * Exit the application
     * STOP RUN
     */
    exit() {
        console.log('Exiting the program. Goodbye!');
        this.rl.close();
        process.exit(0);
    }

    /**
     * Start the application
     */
    start() {
        this.mainLoop();
    }
}

// ============================================================================
// Application Entry Point
// ============================================================================

// Only start the application if this file is run directly (not imported for tests)
if (require.main === module) {
    const app = new MainProgram();
    app.start();
}

// Export for testing purposes
module.exports = { MainProgram, Operations, DataProgram };
