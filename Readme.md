# VICODEX SUBNET CALCULATOR

## 1. SYSTEM OVERVIEW
This document outlines the implementation architecture, execution logic, and operational parameters for the Vicodex Subnet Calculator application.

## 2. ARCHITECTURE & DESIGN
Subnet calculation requires absolute precision in processing IPv4 addresses and varying subnet masks (dot-decimal and CIDR notation). The core operational logic executes via bitwise transformations, converting human-readable string interfaces into 32-bit unsigned integers for masking operations, then restructuring the output for user consumption.

### Key Operational Parameters:
*   **Bitwise Arithmetic:** IP routing operates strictly via bitwise AND operations. JavaScript simulation requires forced unsigned 32-bit integer conversion (utilizing `>>> 0`).
*   **Input Handling:** The system must process both CIDR (`/24`) and dot-decimal (`255.255.255.0`) notations without operational interruption.
*   **Edge Case Processing:**
    *   `/32` (Single Host): Network, broadcast, first, and last host resolve to the exact same address.
    *   `/31` (Point-to-Point, RFC 3021): Constrained to 2 addresses, both designated as usable hosts for point-to-point router links.
    *   **Invalid State Recovery:** The system mandates immediate, non-blocking validation feedback when processing malformed input strings.

## 3. IMPLEMENTATION TASKS

Project structure is separated into three distinct operational layers: structural, visual, and logical.

### Task 1: Structural Layer (index.html)
**Objective:** Define the semantic DOM architecture.
*   Implement standard `<header>`, `<main>`, and `<form>` layout.
*   Deploy input interfaces for IP Address and Subnet parameters.
*   Establish a rigid grid layout for output metric displays (Network Address, Broadcast Address, Host Count).

### Task 2: Visual Layer (styles.css)
**Objective:** Apply the design system.
*   Implement pure information density aesthetics.
*   Enforce clear visibility on input states and dynamic validation warnings.
*   Maintain layout integrity across variable viewport dimensions.

### Task 3: Logic Layer (script.js)
**Objective:** Deploy the core calculation engine.
*   **Data Conversion:** `ipToInt()` and `intToIp()` functions for string-to-integer translations.
*   **Input Validation:** Regex and numeric bounds checking (0-255) for octet verification.
*   **Mask Processing:** `parseMask()` execution to normalize mixed-format subnets into CIDR integer equivalents.
*   **Execution Engine (`calculate()`):**
    *   Execute bitwise `&` logic to isolate the Network Address.
    *   Execute bitwise `|` with inverse mask to isolate the Broadcast Address.
    *   Compute usable host capacity via $2^{(32 - CIDR)} - 2$.
    *   Apply overriding logic for `/31` and `/32` constraints.
*   **Event Handling:** Bind `input` listeners for real-time execution feedback.

## 4. ENGINE DOCUMENTATION: script.js

### Bitwise Conversions
JavaScript native bitwise operations process 32-bit signed integers. IP address processing mandates *unsigned* integers to prevent data corruption during string conversions. The zero-fill right shift (`>>> 0`) forces the engine to treat the output as an unsigned 32-bit integer.

```javascript
function ipToInt(ipStr) {
    return ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
```
This sequential reduction shifts the accumulator left by 8 bits (1 byte) per octet, compressing the sequence into a unified 32-bit value.

### Mask Parsing
The `parseMask` function identifies the input notation. Dot-decimal masks are converted to integers, inverted (`~maskInt`), and processed to determine bit utilization.

### Calculation Engine
With inputs normalized to integer states, network resolution executes immediately:
```javascript
const networkInt = (ipInt & maskInt) >>> 0;
```
Broadcast resolution executes by flipping host bits to `1` against the inverse mask:
```javascript
const broadcastInt = ((networkInt | ~maskInt) >>> 0);
```

### Edge Case Handling
Standard usable host capacity utilizes $2^{hosts} - 2$. However, RFC 3021 specifies `/31` usage for point-to-point links (two usable addresses, no dedicated network/broadcast). `/32` specifies a single absolute host. The engine overrides standard calculation states for these parameters.

```javascript
if (cidr === 32) {
    totalHosts = 1;
    usableHosts = 1;
} else if (cidr === 31) {
    totalHosts = 2;
    usableHosts = 2; // RFC 3021
} else {
    totalHosts = Math.pow(2, 32 - cidr);
    usableHosts = totalHosts - 2;
}
```

> [!WARNING]
> System restricted to educational purposes. Access at [Vicodex Calculator](https://vicode-x.github.io/vicodex_calculator/).
