# 🌐 Vicodex Subnet Calculator Documentation

## 1. 📖 Overview
This document outlines the implementation details, thought process, and task breakdown for the Vicodex Subnet Calculator web application. 

## 2. 🧠 Thought Process & Design
Building a subnet calculator requires careful handling of IPv4 addresses and varying subnet masks (both dot-decimal and CIDR notation). The core logic revolves around bitwise operations, converting human-readable IP strings into 32-bit integers to perform calculations like bit masking, and then converting them back to formats users can read.

### 🔑 Key Considerations:
*   **🧮 Bitwise Arithmetic:** IP routing fundamentally works via bitwise AND operations between the IP and the mask. Simulating this in Javascript requires ensuring we use unsigned 32-bit integers (e.g., using `>>> 0`).
*   **⌨️ Input Flexibility:** Users might type `/24` or `255.255.255.0`. The script must seamlessly parse either.
*   **⚠️ Edge Cases:**
    *   `/32` (Single Host): Network, broadcast, first, and last host are all the exact same address.
    *   `/31` (Point-to-Point, RFC 3021): Only 2 addresses exist, and both are usable as hosts for point-to-point router links.
    *   **🚫 Invalid Inputs:** We need immediate, non-blocking feedback under the inputs when the user types an invalid IP.

## 3. 🗺️ Implementation Plan & Tasks

The project is broken down into three main components: HTML structure, CSS styling, and JavaScript logic.

### [x] 🏗️ Task 1: HTML Structure (`index.html`)
**Goal:** Create the semantic skeleton of the application.
*   Use standard `<header>`, `<main>`, and `<form>` tags.
*   Setup input fields for the `IP Address` and `Subnet Mask or CIDR`.
*   Create a clean grid/flexbox layout for the result cards (Network Address, Broadcast Address, Usable Hosts, etc.).

### [x] 🎨 Task 2: CSS Styling (`styles.css`)
**Goal:** Make the application visually appealing and responsive.
*   Implement a modern aesthetic (using sans-serif fonts, subtle shadows, clean borders).
*   Ensure inputs are clearly visible and error states are dynamically highlighted.
*   Use a responsive layout so the result cards stack cleanly on smaller screens.

### [x] ⚙️ Task 3: JavaScript Logic (`script.js`)
**Goal:** Implement the core calculation engine and DOM manipulation.
*   **🔄 IP Conversion Utilities:** `ipToInt()` and `intToIp()` to transition between strings and 32-bit numbers.
*   **✅ Validation:** Regex and numeric bounds checking (0-255) for valid IP octets.
*   **🔍 Mask Parsing:** `parseMask()` to handle both CIDR (e.g., `/24`) and dot-decimal masks and convert them to their CIDR integer equivalent.
*   **🚀 Core Calculator (`calculate()`):**
    *   Perform a bitwise `&` logic pass between IP and Mask to find the Network Address.
    *   Perform a bitwise `|` with the inverse mask to find the Broadcast Address.
    *   Compute usable hosts using $2^{(32 - CIDR)} - 2$.
    *   Handle edge cases for `/31` and `/32`.
*   **👂 Event Listeners:** Attach `input` event listeners on the form fields to trigger the `calculate()` process in real-time as the user types.

## 4. 🔬 Code Deep Dive: `script.js`

### 💻 Bitwise Conversions
JavaScript bitwise operations treat operands as 32-bit signed integers. When dealing with IP addresses, we must treat them as *unsigned* to prevent negative numbers breaking the string conversion or math. This is why `>>> 0` (zero-fill right shift by 0) is heavily used; it forces JS to treat the number as an unsigned 32-bit integer.

```javascript
function ipToInt(ipStr) {
    return ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
```
This reduces an array like `["192", "168", "1", "1"]` by shifting the accumulator left by 8 bits (1 byte) for each new octet, converting the entire IP into a single continuous 32-bit number.

### 🎭 Mask Parsing
The `parseMask` function intelligently decides if the user typed a CIDR or a standard mask. If it's a standard mask, it converts it to an integer, flips the bits to get the host portion (`~maskInt`), then checks how many bits are used.

### 🧮 The Calculation Engine
Once we have the IP as an integer and the network mask as an integer, finding the network is straightforward:
```javascript
const networkInt = (ipInt & maskInt) >>> 0;
```
To find the broadcast, we take the network bits and flip all the remaining host bits to `1` using an OR operation and the inverse mask:
```javascript
const broadcastInt = ((networkInt | ~maskInt) >>> 0);
```

### 📉 Edge Case Handling
Normally, usable hosts are calculated as $2^{hosts} - 2$, subtracting the network and broadcast addresses. However, RFC 3021 allows `/31` to be used for point-to-point links, where both addresses are usable (no dedicated network or broadcast addresses exist). `/32` represents a single specific host. We handle these to ensure accurate display.

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
