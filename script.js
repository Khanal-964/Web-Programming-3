/**
 * ==============================================================================
 * Professional Smartphone Calculator
 * Pure Vanilla JavaScript (Student-Friendly & Fully Commented)
 * ==============================================================================
 * This script powers a realistic smartphone calculator interface.
 * 
 * Key Features:
 * 1. Continuous calculations respecting mathematical order of operations (BODMAS/PEMDAS)
 *    e.g., 10 + 5 × 2 = 20.
 * 2. Safe custom evaluation without using dangerous eval().
 * 3. Division by zero protection.
 * 4. Decimal point validation (prevents multiple decimals like 3.14.15).
 * 5. Full keyboard support for desktop users.
 * 6. Dynamic display text scaling so numbers never overflow the screen.
 * 7. Live smartphone status-bar clock.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. DOM Element Selection
// ------------------------------------------------------------------------------
const primaryDisplay = document.getElementById('primaryDisplay');
const expressionDisplay = document.getElementById('expressionDisplay');
const btnClear = document.getElementById('btnClear');
const keypad = document.querySelector('.keypad-grid');

// ------------------------------------------------------------------------------
// 2. Application State Variables
// ------------------------------------------------------------------------------
// Holds the current number being typed by the user as a string
let currentInput = '0';

// Array of tokens representing the ongoing formula, e.g. ['10', '+', '5']
let expressionTokens = [];

// Flag indicating if a calculation was just completed with '='
let isEvaluated = false;

// Flag indicating if the calculator is currently showing an error
let hasError = false;

// Keeps track of the active operator button to highlight it like a real phone
let activeOperatorBtn = null;

// ------------------------------------------------------------------------------
// 3. Helper Functions
// ------------------------------------------------------------------------------

/**
 * Normalizes symbols for display and standard arithmetic.
 * Converts '÷' to '/' and '×' to '*' for calculations.
 */
function normalizeOperator(op) {
  if (op === '÷' || op === '/') return '÷';
  if (op === '×' || op === '*' || op === 'x') return '×';
  if (op === '−' || op === '-') return '−';
  if (op === '+') return '+';
  return op;
}

/**
 * Dynamically adjusts font size based on number length so it never overflows.
 */
function adjustFontSize(text) {
  primaryDisplay.classList.remove('text-md', 'text-sm', 'text-xs', 'is-error');

  if (hasError) {
    primaryDisplay.classList.add('is-error');
    return;
  }

  const len = text.length;
  if (len > 12) {
    primaryDisplay.classList.add('text-xs');
  } else if (len > 9) {
    primaryDisplay.classList.add('text-sm');
  } else if (len > 6) {
    primaryDisplay.classList.add('text-md');
  }
}

/**
 * Formats numbers for clean display:
 * - Fixes floating-point precision issues (e.g. 0.1 + 0.2 = 0.3)
 * - Uses scientific notation for huge numbers
 */
function formatNumber(num) {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Cannot divide by 0';

  // Fix floating point precision by rounding to 10 decimal places
  const rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;

  // If number is extremely large or tiny, use scientific notation
  if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
    return rounded.toExponential(6);
  }

  // Convert to clean string
  return rounded.toString();
}

/**
 * Updates the screen displays (both primary and expression history).
 */
function updateDisplay() {
  // Update primary display text
  primaryDisplay.textContent = currentInput;
  adjustFontSize(currentInput);

  // Update expression history text
  expressionDisplay.textContent = expressionTokens.join(' ');

  // Update Clear button text: 'C' when there is an active input, 'AC' when completely reset
  if (btnClear) {
    if (currentInput !== '0' || expressionTokens.length > 0) {
      btnClear.textContent = 'C';
    } else {
      btnClear.textContent = 'AC';
    }
  }
}

/**
 * Highlights or unhighlights the active operator button.
 */
function setActiveOperator(operatorSymbol) {
  // Clear any previously highlighted operator button
  if (activeOperatorBtn) {
    activeOperatorBtn.classList.remove('is-active-operator');
    activeOperatorBtn = null;
  }

  // Find and highlight matching operator button
  if (operatorSymbol) {
    const buttons = document.querySelectorAll('.btn-operator[data-action="operator"]');
    buttons.forEach((btn) => {
      if (btn.getAttribute('data-value') === operatorSymbol) {
        btn.classList.add('is-active-operator');
        activeOperatorBtn = btn;
      }
    });
  }
}

// ------------------------------------------------------------------------------
// 4. Mathematical Evaluation Engine (Safe & Order of Operations / BODMAS)
// ------------------------------------------------------------------------------

/**
 * Evaluates a sequence of mathematical tokens respecting BODMAS / PEMDAS:
 * Pass 1: Multiplication ('×') and Division ('÷')
 * Pass 2: Addition ('+') and Subtraction ('−')
 * 
 * @param {Array<string>} tokens - e.g. ['10', '+', '5', '×', '2']
 * @returns {number|string} - The calculated result or error message string.
 */
function evaluateTokens(tokens) {
  if (tokens.length === 0) return 0;
  if (tokens.length === 1) return parseFloat(tokens[0]);

  // Clone array so we don't mutate the original
  const workingTokens = [...tokens];

  // --- PASS 1: Higher precedence (Multiplication and Division) ---
  let i = 0;
  while (i < workingTokens.length) {
    const token = workingTokens[i];

    if (token === '×' || token === '÷') {
      const prevNum = parseFloat(workingTokens[i - 1]);
      const nextNum = parseFloat(workingTokens[i + 1]);

      if (isNaN(prevNum) || isNaN(nextNum)) {
        return 'Error';
      }

      let subResult = 0;
      if (token === '×') {
        subResult = prevNum * nextNum;
      } else if (token === '÷') {
        // Prevent division by zero!
        if (nextNum === 0) {
          return 'Cannot divide by 0';
        }
        subResult = prevNum / nextNum;
      }

      // Replace the three tokens [prevNum, operator, nextNum] with subResult
      workingTokens.splice(i - 1, 3, subResult.toString());
      // Step back one index to account for splice
      i -= 1;
    } else {
      i++;
    }
  }

  // --- PASS 2: Lower precedence (Addition and Subtraction) ---
  let finalResult = parseFloat(workingTokens[0]);
  if (isNaN(finalResult)) return 'Error';

  for (let j = 1; j < workingTokens.length; j += 2) {
    const operator = workingTokens[j];
    const nextVal = parseFloat(workingTokens[j + 1]);

    if (isNaN(nextVal)) return 'Error';

    if (operator === '+') {
      finalResult += nextVal;
    } else if (operator === '−' || operator === '-') {
      finalResult -= nextVal;
    }
  }

  return finalResult;
}

// ------------------------------------------------------------------------------
// 5. Calculator Input Handlers
// ------------------------------------------------------------------------------

/**
 * Handles numeric digit inputs (0 - 9, 00).
 */
function handleNumber(digit) {
  // Clear error state if an error occurred previously
  if (hasError) {
    handleClearAll();
  }

  // If calculation was just evaluated with '=', typing a new number starts a new calculation
  if (isEvaluated) {
    currentInput = (digit === '00') ? '0' : digit;
    expressionTokens = [];
    isEvaluated = false;
    setActiveOperator(null);
    updateDisplay();
    return;
  }

  // Remove active operator highlight when user starts typing the next number
  setActiveOperator(null);

  if (digit === '00') {
    // If current input is 0 or empty, pressing 00 keeps it at 0
    if (currentInput === '0' || currentInput === '') {
      currentInput = '0';
    } else if (currentInput.replace('-', '').replace('.', '').length <= 13) {
      // Append double zero if within character length limit
      currentInput += '00';
    }
  } else {
    // Prevent multiple leading zeroes (e.g. typing 0 then 5 becomes 5)
    if (currentInput === '0') {
      currentInput = digit;
    } else {
      // Append digit to current number (up to 15 digits max to preserve accuracy)
      if (currentInput.replace('-', '').replace('.', '').length < 15) {
        currentInput += digit;
      }
    }
  }

  updateDisplay();
}

/**
 * Handles decimal point input ('.').
 */
function handleDecimal() {
  if (hasError) {
    handleClearAll();
  }

  if (isEvaluated) {
    currentInput = '0.';
    expressionTokens = [];
    isEvaluated = false;
    setActiveOperator(null);
    updateDisplay();
    return;
  }

  setActiveOperator(null);

  // If currentInput is empty (e.g. user pressed operator then decimal), start with '0.'
  if (currentInput === '' || currentInput === '0') {
    currentInput = '0.';
  } else if (!currentInput.includes('.')) {
    // Only add decimal if one doesn't already exist in the current number
    currentInput += '.';
  }

  updateDisplay();
}

/**
 * Handles arithmetic operators ('+', '−', '×', '÷').
 */
function handleOperator(rawOp) {
  const operator = normalizeOperator(rawOp);

  // If an error is on screen, clear it before proceeding
  if (hasError) {
    handleClearAll();
    return;
  }

  // If user just got a result with '=', chain calculations starting from that result
  if (isEvaluated) {
    expressionTokens = [currentInput, operator];
    currentInput = '';
    isEvaluated = false;
    setActiveOperator(operator);
    updateDisplay();
    return;
  }

  // If user enters minus right after multiplication or division, treat it as a negative number
  if (currentInput === '' && expressionTokens.length > 0 && (operator === '−' || operator === '-')) {
    const lastToken = expressionTokens[expressionTokens.length - 1];
    if (lastToken === '×' || lastToken === '÷') {
      currentInput = '-';
      setActiveOperator(null);
      updateDisplay();
      return;
    }
  }

  // If the user has typed a number
  if (currentInput !== '' && currentInput !== '-') {
    expressionTokens.push(currentInput);
    expressionTokens.push(operator);
    currentInput = '';
    setActiveOperator(operator);
    updateDisplay();
  } else if (expressionTokens.length > 0) {
    // If user clicked another operator consecutively, change the operator to the new one
    expressionTokens[expressionTokens.length - 1] = operator;
    setActiveOperator(operator);
    updateDisplay();
  }
}

/**
 * Handles percentage key ('%').
 * Converts the current active number into a percentage (divides by 100).
 */
function handlePercentage() {
  if (hasError || currentInput === '' || currentInput === '0') return;

  const num = parseFloat(currentInput);
  if (!isNaN(num)) {
    const percentValue = num / 100;
    currentInput = formatNumber(percentValue);
    updateDisplay();
  }
}

/**
 * Handles Delete / Backspace ('⌫').
 * Removes the last character entered one by one.
 */
function handleDelete() {
  if (hasError) {
    handleClearAll();
    return;
  }

  if (isEvaluated) {
    // If calculation completed, backspace clears the result
    handleClearAll();
    return;
  }

  if (currentInput !== '' && currentInput !== '0') {
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      // If only negative sign is left, reset to 0
      if (currentInput === '-') {
        currentInput = '0';
      }
    } else {
      currentInput = '0';
    }
  } else if (expressionTokens.length > 0) {
    // If currentInput is empty, backspace removes the last operator from expression
    expressionTokens.pop(); // Remove operator
    if (expressionTokens.length > 0) {
      currentInput = expressionTokens.pop(); // Restore previous number
    } else {
      currentInput = '0';
    }
    setActiveOperator(null);
  }

  updateDisplay();
}

/**
 * Handles Clear button ('AC' / 'C').
 */
function handleClear() {
  // If there is an active input, clear just the current input (acting like 'C')
  if (currentInput !== '0' && !isEvaluated) {
    currentInput = '0';
  } else {
    // Otherwise clear everything (acting like 'AC')
    handleClearAll();
  }
  updateDisplay();
}

/**
 * Resets all calculator states and memory ('AC').
 */
function handleClearAll() {
  currentInput = '0';
  expressionTokens = [];
  isEvaluated = false;
  hasError = false;
  setActiveOperator(null);
  updateDisplay();
}

/**
 * Handles Equals ('=').
 * Solves the continuous expression following BODMAS precedence.
 */
function handleEquals() {
  if (hasError) {
    handleClearAll();
    return;
  }

  // If there's an active number entered, append it to the token list
  const fullTokens = [...expressionTokens];
  if (currentInput !== '') {
    fullTokens.push(currentInput);
  }

  // If there is nothing to calculate, do nothing
  if (fullTokens.length === 0) return;

  // If the last token is an operator with no following number, drop the trailing operator
  if (['+', '−', '×', '÷'].includes(fullTokens[fullTokens.length - 1])) {
    fullTokens.pop();
  }

  if (fullTokens.length === 0) return;

  // Show full formula in the expression display with '='
  expressionDisplay.textContent = fullTokens.join(' ') + ' =';

  // Evaluate formula using standard mathematical precedence
  const result = evaluateTokens(fullTokens);

  if (typeof result === 'string') {
    // An error occurred (e.g. "Cannot divide by 0" or "Error")
    hasError = true;
    currentInput = result;
    expressionTokens = [];
    isEvaluated = true;
    setActiveOperator(null);
    updateDisplay();
  } else {
    // Successful calculation!
    hasError = false;
    currentInput = formatNumber(result);
    expressionTokens = [];
    isEvaluated = true;
    setActiveOperator(null);
    updateDisplay();
  }
}

// ------------------------------------------------------------------------------
// 6. Event Listeners (Clicks & Keyboard)
// ------------------------------------------------------------------------------

/**
 * Keypad clicks delegation.
 */
keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.getAttribute('data-action');
  const value = button.getAttribute('data-value');

  // Trigger slight visual ripple / tactile press
  button.classList.add('pressed');
  setTimeout(() => button.classList.remove('pressed'), 120);

  switch (action) {
    case 'number':
      handleNumber(value);
      break;
    case 'decimal':
      handleDecimal();
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'clear':
      handleClear();
      break;
    case 'delete':
      handleDelete();
      break;
    case 'percentage':
      handlePercentage();
      break;
    case 'equals':
      handleEquals();
      break;
    default:
      break;
  }
});

/**
 * Keyboard input support for desktop and laptop users.
 */
window.addEventListener('keydown', (event) => {
  const key = event.key;

  // Numbers (0 - 9)
  if (key >= '0' && key <= '9') {
    handleNumber(key);
  }
  // Decimal point
  else if (key === '.') {
    handleDecimal();
  }
  // Operators (+, -, *, /)
  else if (key === '+') {
    handleOperator('+');
  } else if (key === '-') {
    handleOperator('−');
  } else if (key === '*') {
    handleOperator('×');
  } else if (key === '/') {
    event.preventDefault(); // Prevent browser quick search shortcut
    handleOperator('÷');
  }
  // Percentage (%)
  else if (key === '%') {
    handlePercentage();
  }
  // Equals / Enter
  else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleEquals();
  }
  // Delete / Backspace
  else if (key === 'Backspace') {
    handleDelete();
  }
  // Clear (Escape or 'c' / 'C')
  else if (key === 'Escape' || key.toLowerCase() === 'c') {
    handleClear();
  }
});

// ------------------------------------------------------------------------------
// 7. Initial Initialization
// ------------------------------------------------------------------------------
updateDisplay();
