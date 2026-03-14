document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ip-input');
    const maskInput = document.getElementById('mask-input');
    const ipError = document.getElementById('ip-error');
    const maskError = document.getElementById('mask-error');

    // Result elements
    const elements = {
        netAddress: document.getElementById('net-address'),
        broadcastAddress: document.getElementById('broadcast-address'),
        firstHost: document.getElementById('first-host'),
        lastHost: document.getElementById('last-host'),
        totalHosts: document.getElementById('total-hosts'),
        usableHosts: document.getElementById('usable-hosts'),
        subnetMask: document.getElementById('subnet-mask'),
        cidrNotation: document.getElementById('cidr-notation'),
        ipClass: document.getElementById('ip-class')
    };

    function ipToInt(ipStr) {
        return ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    function intToIp(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    }

    function isValidIp(ipStr) {
        const parts = ipStr.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
            if (!/^\d+$/.test(part)) return false;
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255 && part === num.toString();
        });
    }

    function determineClass(ipStr) {
        if (!ipStr) return '-';
        const firstOctet = parseInt(ipStr.split('.')[0], 10);
        if (isNaN(firstOctet)) return '-';
        if (firstOctet >= 1 && firstOctet <= 126) return 'A';
        if (firstOctet === 127) return 'Loopback';
        if (firstOctet >= 128 && firstOctet <= 191) return 'B';
        if (firstOctet >= 192 && firstOctet <= 223) return 'C';
        if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
        if (firstOctet >= 240 && firstOctet <= 255) return 'E (Experimental)';
        return '-';
    }

    function parseMask(maskStr) {
        if (!maskStr) return null;
        if (maskStr.startsWith('/')) {
            const cidrStr = maskStr.substring(1);
            if (!/^\d+$/.test(cidrStr)) return null;
            const cidr = parseInt(cidrStr, 10);
            if (cidr >= 0 && cidr <= 32) return cidr;
        } else if (isValidIp(maskStr)) {
            const maskInt = ipToInt(maskStr);
            if (maskInt === 0) return 0;
            const inverse = ~maskInt >>> 0;
            if ((inverse & (inverse + 1)) === 0) {
                return 32 - Math.log2(inverse + 1);
            }
        }
        return null;
    }

    function calculate() {
        const ipStr = ipInput.value.trim();
        const maskStr = maskInput.value.trim();

        let isValid = true;

        if (ipStr && !isValidIp(ipStr)) {
            ipError.textContent = 'Invalid IP Address';
            isValid = false;
        } else {
            ipError.textContent = '';
        }

        const cidr = parseMask(maskStr);
        if (maskStr && cidr === null) {
            maskError.textContent = 'Invalid Mask or CIDR';
            isValid = false;
        } else {
            maskError.textContent = '';
        }

        if (!ipStr || !maskStr || !isValid) {
            resetResults();
            return;
        }

        const ipInt = ipToInt(ipStr);
        
        const maskInt = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);

        const networkInt = (ipInt & maskInt) >>> 0;
        const broadcastInt = cidr === 32 ? networkInt : ((networkInt | ~maskInt) >>> 0);

        // Calculate host counts
        let totalHosts = 0;
        let usableHosts = 0;

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

        // Calculate host ranges
        let firstHostInt = cidr >= 31 ? networkInt : (networkInt + 1) >>> 0;
        let lastHostInt = cidr >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

        // Populate DOM
        elements.netAddress.textContent = intToIp(networkInt);
        elements.broadcastAddress.textContent = cidr === 32 ? '-' : intToIp(broadcastInt);
        elements.firstHost.textContent = intToIp(firstHostInt);
        elements.lastHost.textContent = intToIp(lastHostInt);
        
        elements.totalHosts.textContent = totalHosts.toLocaleString();
        elements.usableHosts.textContent = usableHosts.toLocaleString();
        
        elements.subnetMask.textContent = intToIp(maskInt);
        elements.cidrNotation.textContent = '/' + cidr;
        elements.ipClass.textContent = determineClass(ipStr);
    }

    function resetResults() {
        for (const key in elements) {
            elements[key].textContent = '-';
        }
    }

    // Attach listeners
    ipInput.addEventListener('input', calculate);
    maskInput.addEventListener('input', calculate);

    // Initial calculation if values are pre-filled or cached
    calculate();
});
