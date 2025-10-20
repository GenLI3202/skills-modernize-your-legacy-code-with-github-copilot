/**
 * Account Management System - Unit Tests
 * 
 * This test suite mirrors the test scenarios defined in docs/TESTPLAN.md
 * Tests cover all business logic from the COBOL legacy application
 */

const { DataProgram, Operations } = require('./index.js');

describe('DataProgram - Data Access Layer', () => {
    let dataProgram;

    beforeEach(() => {
        dataProgram = new DataProgram();
    });

    describe('TC-002: Initial Balance', () => {
        test('should initialize with balance of $1,000.00', () => {
            const balance = dataProgram.execute('READ');
            expect(balance).toBe(1000.00);
        });
    });

    describe('READ Operations', () => {
        test('should return current storage balance', () => {
            const balance = dataProgram.execute('READ');
            expect(balance).toBe(1000.00);
        });

        test('should return updated balance after WRITE', () => {
            dataProgram.execute('WRITE', 1500.00);
            const balance = dataProgram.execute('READ');
            expect(balance).toBe(1500.00);
        });
    });

    describe('WRITE Operations', () => {
        test('should update storage balance', () => {
            const result = dataProgram.execute('WRITE', 2000.00);
            expect(result).toBe(2000.00);
            expect(dataProgram.execute('READ')).toBe(2000.00);
        });

        test('should handle decimal amounts correctly', () => {
            dataProgram.execute('WRITE', 1234.56);
            const balance = dataProgram.execute('READ');
            expect(balance).toBeCloseTo(1234.56, 2);
        });
    });

    describe('Error Handling', () => {
        test('should throw error for invalid operation', () => {
            expect(() => {
                dataProgram.execute('INVALID');
            }).toThrow('Invalid operation: INVALID');
        });
    });
});

describe('Operations - Business Logic Layer', () => {
    let dataProgram;
    let operations;
    let mockReadline;

    beforeEach(() => {
        dataProgram = new DataProgram();
        mockReadline = {
            question: jest.fn()
        };
        operations = new Operations(dataProgram, mockReadline);
    });

    describe('Balance Formatting', () => {
        test('TC-002: should format initial balance as 001000.00', () => {
            const formatted = operations.formatBalance(1000.00);
            expect(formatted).toBe('001000.00');
        });

        test('TC-003: should format $1,250.00 as 001250.00', () => {
            const formatted = operations.formatBalance(1250.00);
            expect(formatted).toBe('001250.00');
        });

        test('TC-004: should format $900.00 as 000900.00', () => {
            const formatted = operations.formatBalance(900.00);
            expect(formatted).toBe('000900.00');
        });

        test('TC-014: should format zero balance as 000000.00', () => {
            const formatted = operations.formatBalance(0.00);
            expect(formatted).toBe('000000.00');
        });

        test('TC-009: should format maximum balance as 999999.99', () => {
            const formatted = operations.formatBalance(999999.99);
            expect(formatted).toBe('999999.99');
        });

        test('should format decimal amounts correctly', () => {
            const formatted = operations.formatBalance(123.45);
            expect(formatted).toBe('000123.45');
        });

        test('TC-007: should format cents-only amount 0.01 as 000000.01', () => {
            const formatted = operations.formatBalance(0.01);
            expect(formatted).toBe('000000.01');
        });
    });

    describe('TC-005 to TC-010: Credit Account Operations', () => {
        test('TC-005: should credit whole dollar amount successfully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                expect(prompt).toBe('Enter credit amount: ');
                callback('500');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(1500.00);
                expect(consoleSpy).toHaveBeenCalledWith('Amount credited. New balance: 001500.00');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-006: should credit decimal amount successfully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('123.45');
            });

            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(1123.45, 2);
                done();
            });
        });

        test('TC-007: should credit small amount (cents only)', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('0.01');
            });

            operations.execute('CREDIT', () => {
                const balance = dataProgram.execute('READ');
                expect(balance).toBeCloseTo(1000.01, 2);
                done();
            });
        });

        test('TC-008: should credit large amount', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('50000.00');
            });

            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(51000.00);
                done();
            });
        });

        test('TC-009: should credit approaching maximum balance', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('998999.99');
            });

            operations.execute('CREDIT', () => {
                const balance = dataProgram.execute('READ');
                expect(balance).toBe(999999.99);
                done();
            });
        });

        test('TC-010: should handle multiple consecutive credits', (done) => {
            let creditCount = 0;
            const amounts = ['100', '200', '50'];

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback(amounts[creditCount++]);
            });

            // First credit: $100
            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(1100.00);

                // Second credit: $200
                operations.execute('CREDIT', () => {
                    expect(dataProgram.execute('READ')).toBe(1300.00);

                    // Third credit: $50
                    operations.execute('CREDIT', () => {
                        expect(dataProgram.execute('READ')).toBe(1350.00);
                        done();
                    });
                });
            });
        });

        test('should handle invalid credit input gracefully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('invalid');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('CREDIT', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Invalid amount. Please enter a valid number.');
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                consoleSpy.mockRestore();
                done();
            });
        });
    });

    describe('TC-011 to TC-018: Debit Account Operations', () => {
        test('TC-011: should debit whole dollar amount successfully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                expect(prompt).toBe('Enter debit amount: ');
                callback('300');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(700.00);
                expect(consoleSpy).toHaveBeenCalledWith('Amount debited. New balance: 000700.00');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-012: should debit decimal amount successfully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('45.67');
            });

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(954.33, 2);
                done();
            });
        });

        test('TC-013: should debit small amount (cents only)', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('0.01');
            });

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(999.99, 2);
                done();
            });
        });

        test('TC-014: should debit exact balance (zero remaining)', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('1000.00');
            });

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(0.00, 2);
                done();
            });
        });

        test('TC-015: CRITICAL - should reject debit exceeding balance', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('1500.00');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                expect(consoleSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-016: should reject debit exceeding by 1 cent', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('1000.01');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                expect(consoleSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-017: should reject debit from zero balance', (done) => {
            // First, set balance to zero
            dataProgram.execute('WRITE', 0.00);

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('0.01');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(0.00); // Balance unchanged
                expect(consoleSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-018: should handle multiple consecutive debits', (done) => {
            let debitCount = 0;
            const amounts = ['100', '200', '50'];

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback(amounts[debitCount++]);
            });

            // First debit: $100
            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(900.00, 2);

                // Second debit: $200
                operations.execute('DEBIT ', () => {
                    expect(dataProgram.execute('READ')).toBeCloseTo(700.00, 2);

                    // Third debit: $50
                    operations.execute('DEBIT ', () => {
                        expect(dataProgram.execute('READ')).toBeCloseTo(650.00, 2);
                        done();
                    });
                });
            });
        });

        test('should handle invalid debit input gracefully', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('not-a-number');
            });

            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('DEBIT ', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Invalid amount. Please enter a valid number.');
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                consoleSpy.mockRestore();
                done();
            });
        });
    });

    describe('TC-019 to TC-021: Mixed Transaction Tests', () => {
        test('TC-019: should handle mixed credits and debits correctly', (done) => {
            let callCount = 0;
            const operations_data = [
                { type: 'CREDIT', amount: '500' },   // $1,500.00
                { type: 'DEBIT ', amount: '200' },   // $1,300.00
                { type: 'CREDIT', amount: '100' },   // $1,400.00
                { type: 'DEBIT ', amount: '300' }    // $1,100.00
            ];

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback(operations_data[callCount++].amount);
            });

            // Credit $500
            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(1500.00);

                // Debit $200
                operations.execute('DEBIT ', () => {
                    expect(dataProgram.execute('READ')).toBe(1300.00);

                    // Credit $100
                    operations.execute('CREDIT', () => {
                        expect(dataProgram.execute('READ')).toBe(1400.00);

                        // Debit $300
                        operations.execute('DEBIT ', () => {
                            expect(dataProgram.execute('READ')).toBe(1100.00);
                            done();
                        });
                    });
                });
            });
        });

        test('TC-020: should persist balance across multiple view operations', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                if (prompt === 'Enter credit amount: ') {
                    callback('250'); // Credit
                } else if (prompt === 'Enter debit amount: ') {
                    callback('100'); // Debit
                }
            });

            // Credit $250
            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(1250.00);

                // View balance (first time)
                const balance1 = dataProgram.execute('READ');
                expect(balance1).toBe(1250.00);

                // View balance (second time)
                const balance2 = dataProgram.execute('READ');
                expect(balance2).toBe(1250.00);

                // Debit $100
                operations.execute('DEBIT ', () => {
                    expect(dataProgram.execute('READ')).toBe(1150.00);

                    // View balance (third time)
                    const balance3 = dataProgram.execute('READ');
                    expect(balance3).toBe(1150.00);

                    // View balance (fourth time)
                    const balance4 = dataProgram.execute('READ');
                    expect(balance4).toBe(1150.00);

                    done();
                });
            });
        });

        test('TC-021: failed debit should not affect subsequent successful debit', (done) => {
            // Set balance to $500
            dataProgram.execute('WRITE', 500.00);

            let callCount = 0;
            const amounts = ['600', '100']; // First fails, second succeeds

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback(amounts[callCount++]);
            });

            const consoleSpy = jest.spyOn(console, 'log');

            // Attempt to debit $600 (should fail)
            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(500.00); // Balance unchanged
                expect(consoleSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');

                // Debit $100 (should succeed)
                operations.execute('DEBIT ', () => {
                    expect(dataProgram.execute('READ')).toBe(400.00);
                    expect(consoleSpy).toHaveBeenCalledWith('Amount debited. New balance: 000400.00');
                    consoleSpy.mockRestore();
                    done();
                });
            });
        });
    });

    describe('View Balance Operation', () => {
        test('TC-002: should display current balance', (done) => {
            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('TOTAL ', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Current balance: 001000.00');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-003: should display balance after credit', (done) => {
            dataProgram.execute('WRITE', 1250.00);
            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('TOTAL ', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Current balance: 001250.00');
                consoleSpy.mockRestore();
                done();
            });
        });

        test('TC-004: should display balance after debit', (done) => {
            dataProgram.execute('WRITE', 900.00);
            const consoleSpy = jest.spyOn(console, 'log');

            operations.execute('TOTAL ', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Current balance: 000900.00');
                consoleSpy.mockRestore();
                done();
            });
        });
    });

    describe('TC-027 to TC-028: Zero Amount Handling', () => {
        test('TC-027: should handle zero credit amount', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('0');
            });

            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                done();
            });
        });

        test('TC-028: should handle zero debit amount', (done) => {
            mockReadline.question.mockImplementation((prompt, callback) => {
                callback('0.00');
            });

            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(1000.00); // Balance unchanged
                done();
            });
        });
    });

    describe('TC-031: Decimal Precision Accuracy', () => {
        test('should handle decimal arithmetic without rounding errors', (done) => {
            let callCount = 0;
            const amounts = ['0.33', '0.33', '0.34', '1.00'];

            mockReadline.question.mockImplementation((prompt, callback) => {
                callback(amounts[callCount++]);
            });

            // Credit $0.33
            operations.execute('CREDIT', () => {
                expect(dataProgram.execute('READ')).toBeCloseTo(1000.33, 2);

                // Credit $0.33
                operations.execute('CREDIT', () => {
                    expect(dataProgram.execute('READ')).toBeCloseTo(1000.66, 2);

                    // Credit $0.34
                    operations.execute('CREDIT', () => {
                        expect(dataProgram.execute('READ')).toBeCloseTo(1001.00, 2);

                        // Debit $1.00
                        operations.execute('DEBIT ', () => {
                            expect(dataProgram.execute('READ')).toBeCloseTo(1000.00, 2);
                            done();
                        });
                    });
                });
            });
        });

        test('should maintain precision with multiple decimal operations', () => {
            dataProgram.execute('WRITE', 100.10);
            expect(dataProgram.execute('READ')).toBeCloseTo(100.10, 2);

            dataProgram.execute('WRITE', 200.25);
            expect(dataProgram.execute('READ')).toBeCloseTo(200.25, 2);

            dataProgram.execute('WRITE', 999.99);
            expect(dataProgram.execute('READ')).toBeCloseTo(999.99, 2);
        });
    });
});

describe('Integration Tests - Complete Workflows', () => {
    let dataProgram;
    let operations;
    let mockReadline;

    beforeEach(() => {
        dataProgram = new DataProgram();
        mockReadline = {
            question: jest.fn()
        };
        operations = new Operations(dataProgram, mockReadline);
    });

    test('should handle a typical user session workflow', (done) => {
        let callCount = 0;
        const amounts = ['500', '100', '50', '200'];

        mockReadline.question.mockImplementation((prompt, callback) => {
            callback(amounts[callCount++]);
        });

        const consoleSpy = jest.spyOn(console, 'log');

        // 1. View initial balance
        operations.execute('TOTAL ', () => {
            expect(consoleSpy).toHaveBeenCalledWith('Current balance: 001000.00');

            // 2. Credit $500
            operations.execute('CREDIT', () => {
                expect(consoleSpy).toHaveBeenCalledWith('Amount credited. New balance: 001500.00');

                // 3. Debit $100
                operations.execute('DEBIT ', () => {
                    expect(consoleSpy).toHaveBeenCalledWith('Amount debited. New balance: 001400.00');

                    // 4. Credit $50
                    operations.execute('CREDIT', () => {
                        expect(consoleSpy).toHaveBeenCalledWith('Amount credited. New balance: 001450.00');

                        // 5. Debit $200
                        operations.execute('DEBIT ', () => {
                            expect(consoleSpy).toHaveBeenCalledWith('Amount debited. New balance: 001250.00');

                            // 6. View final balance
                            operations.execute('TOTAL ', () => {
                                expect(consoleSpy).toHaveBeenCalledWith('Current balance: 001250.00');
                                consoleSpy.mockRestore();
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    test('should handle edge case: multiple operations near zero balance', (done) => {
        // Start with low balance
        dataProgram.execute('WRITE', 10.00);

        let callCount = 0;
        const amounts = ['5', '4', '1', '0.50', '20'];

        mockReadline.question.mockImplementation((prompt, callback) => {
            callback(amounts[callCount++]);
        });

        const consoleSpy = jest.spyOn(console, 'log');

        // Debit $5 (balance: $5)
        operations.execute('DEBIT ', () => {
            expect(dataProgram.execute('READ')).toBe(5.00);

            // Debit $4 (balance: $1)
            operations.execute('DEBIT ', () => {
                expect(dataProgram.execute('READ')).toBe(1.00);

                // Debit $1 (balance: $0)
                operations.execute('DEBIT ', () => {
                    expect(dataProgram.execute('READ')).toBe(0.00);

                    // Try to debit $0.50 (should fail)
                    operations.execute('DEBIT ', () => {
                        expect(consoleSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');
                        expect(dataProgram.execute('READ')).toBe(0.00);

                        // Credit $20 (balance: $20)
                        operations.execute('CREDIT', () => {
                            expect(dataProgram.execute('READ')).toBe(20.00);
                            consoleSpy.mockRestore();
                            done();
                        });
                    });
                });
            });
        });
    });
});

describe('Business Rules Validation', () => {
    let dataProgram;

    beforeEach(() => {
        dataProgram = new DataProgram();
    });

    test('Initial balance rule: should start with $1,000.00', () => {
        expect(dataProgram.execute('READ')).toBe(1000.00);
    });

    test('Minimum balance rule: should allow zero balance', () => {
        dataProgram.execute('WRITE', 0.00);
        expect(dataProgram.execute('READ')).toBe(0.00);
    });

    test('Maximum balance rule: should support up to $999,999.99', () => {
        dataProgram.execute('WRITE', 999999.99);
        expect(dataProgram.execute('READ')).toBe(999999.99);
    });

    test('Precision rule: should support two decimal places', () => {
        dataProgram.execute('WRITE', 1234.56);
        expect(dataProgram.execute('READ')).toBe(1234.56);
    });
});
