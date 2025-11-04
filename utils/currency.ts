// A comprehensive map of country codes to currency codes.
const countryToCurrency: { [key: string]: string } = {
  AF: 'AFN', AL: 'ALL', DZ: 'DZD', AD: 'EUR', AO: 'AOA', AR: 'ARS', AM: 'AMD', AU: 'AUD', AT: 'EUR', AZ: 'AZN', BS: 'BSD', BH: 'BHD', BD: 'BDT', BB: 'BBD', BY: 'BYN', BE: 'EUR', BZ: 'BZD', BJ: 'XOF', BT: 'BTN', BO: 'BOB', BA: 'BAM', BW: 'BWP', BR: 'BRL', BG: 'BGN', BF: 'XOF', BI: 'BIF', KH: 'KHR', CM: 'XAF', CA: 'CAD', TD: 'XAF', CL: 'CLP', CN: 'CNY', CO: 'COP', HR: 'EUR', CU: 'CUP', CY: 'EUR', CZ: 'CZK', DK: 'DKK', EG: 'EGP', SV: 'USD', ET: 'ETB', FJ: 'FJD', FI: 'EUR', FR: 'EUR', DE: 'EUR', GE: 'GEL', GH: 'GHS', GR: 'EUR', GT: 'GTQ', HN: 'HNL', HK: 'HKD', HU: 'HUF', IS: 'ISK', IN: 'INR', ID: 'IDR', IR: 'IRR', IQ: 'IQD', IE: 'EUR', IL: 'ILS', IT: 'EUR', JM: 'JMD', JP: 'JPY', JO: 'JOD', KZ: 'KZT', KE: 'KES', KW: 'KWD', KG: 'KGS', LV: 'EUR', LB: 'LBP', LY: 'LYD', LI: 'CHF', LT: 'EUR', LU: 'EUR', MY: 'MYR', MV: 'MVR', ML: 'XOF', MT: 'EUR', MA: 'MAD', MM: 'MMK', NP: 'NPR', NL: 'EUR', NZ: 'NZD', NI: 'NIO', NG: 'NGN', KP: 'KPW', MK: 'MKD', NO: 'NOK', OM: 'OMR', PK: 'PKR', PA: 'PAB', PG: 'PGK', PY: 'PYG', PE: 'PEN', PH: 'PHP', PL: 'PLN', PT: 'EUR', QA: 'QAR', RO: 'RON', RU: 'RUB', RW: 'RWF', SA: 'SAR', SN: 'XOF', RS: 'RSD', SG: 'SGD', SK: 'EUR', SI: 'EUR', ZA: 'ZAR', KR: 'KRW', ES: 'EUR', LK: 'LKR', SE: 'SEK', CH: 'CHF', SY: 'SYP', TW: 'TWD', TZ: 'TZS', TH: 'THB', TR: 'TRY', UG: 'UGX', UA: 'UAH', AE: 'AED', GB: 'GBP', US: 'USD', UY: 'UYU', UZ: 'UZS', VE: 'VES', VN: 'VND', YE: 'YER', ZM: 'ZMW', ZW: 'ZWL',
  // Additions for countries in the list
  BN: 'BND', CF: 'XAF', KM: 'KMF', CG: 'XAF', CR: 'CRC', DJ: 'DJF', DM: 'XCD', DO: 'DOP', EC: 'USD', GQ: 'XAF', ER: 'ERN', EE: 'EUR', SZ: 'SZL', GA: 'XAF', GM: 'GMD', GD: 'XCD', GN: 'GNF', GY: 'GYD', HT: 'HTG', KI: 'AUD', LA: 'LAK', LS: 'LSL', LR: 'LRD', MG: 'MGA', MW: 'MWK', MR: 'MRU', MU: 'MUR', FM: 'USD', MD: 'MDL', MC: 'EUR', MN: 'MNT', ME: 'EUR', MZ: 'MZN', NA: 'NAD', NR: 'AUD', NE: 'XOF', PW: 'USD', PS: 'ILS', WS: 'WST', SM: 'EUR', SC: 'SCR', SL: 'SLL', SB: 'SBD', SO: 'SOS', SS: 'SSP', SD: 'SDG', SR: 'SRD', TJ: 'TJS', TL: 'USD', TG: 'XOF', TO: 'TOP', TT: 'TTD', TN: 'TND', TM: 'TMT', TV: 'AUD', VU: 'VUV', VA: 'EUR',
};

// Approximate multipliers relative to USD for budget tiers. This ensures the tiers are meaningful in the local context.
const currencyMultipliers: { [key: string]: number } = {
  USD: 1, GBP: 0.8, EUR: 0.92, CNY: 7.25, JPY: 157, INR: 83.5, CAD: 1.37, AUD: 1.5, BRL: 5.25, RUB: 88, KRW: 1375, CHF: 0.9, MXN: 17.5, SGD: 1.35, HKD: 7.8, NZD: 1.6, ZAR: 18.5, SEK: 10.5, NOK: 10.5, DKK: 6.8, PLN: 3.9, THB: 36.5, 
  AED: 3.67, SAR: 3.75, TRY: 32.2,
  AFN: 71, ALL: 93, DZD: 134, AOA: 830, ARS: 890, AMD: 388, AZN: 1.7, BDT: 117, BYN: 3.2, BOB: 6.9, BAM: 1.8, BWP: 13.5, BGN: 1.8, KHR: 4100, CLP: 925, COP: 3900, CZK: 22.8, EGP: 47.5, ETB: 57, GEL: 2.8, GHS: 14.5, GTQ: 7.8, HNL: 24.7, HUF: 360, ISK: 138, IDR: 16200, IRR: 42000, IQD: 1310, ILS: 3.7, JMD: 155, JOD: 0.71, KZT: 445, KES: 130, KWD: 0.3, KGS: 88, LBP: 89700, LYD: 4.8, MYR: 4.7, MAD: 10, MMK: 2100, NPR: 133, NIO: 36.8, NGN: 1480, OMR: 0.38, PKR: 278, PYG: 7500, PEN: 3.7, PHP: 58.5, QAR: 3.64, RON: 4.6, RSD: 108, TWD: 32.3, TZS: 2600, UGX: 3750, UAH: 39.5, UYU: 39, UZS: 12650, VES: 36.5, VND: 25400, ZMW: 25, BND: 1.35, CRC: 512, GNF: 8600,
};

// New map for TimeZone -> Country Code. Prioritizes location over language settings.
const timeZoneToCountry: { [key: string]: string } = {
    // North America
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US', 'America/Honolulu': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Halifax': 'CA', 'America/Winnipeg': 'CA', 'America/Edmonton': 'CA', 'America/St_Johns': 'CA',
    'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX',
    // Europe
    'Europe/London': 'GB', 'Europe/Dublin': 'IE',
    'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Vienna': 'AT', 'Europe/Prague': 'CZ', 'Europe/Warsaw': 'PL', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO',
    'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR',
    // Asia
    'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN',
    'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
    'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA',
    'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY',
    // Australia & Oceania
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
    'Pacific/Auckland': 'NZ',
    // South America
    'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
    // Africa
    'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG',
};

const countryNameToCode: { [key: string]: string } = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bhutan": "BT", "Bolivia": "BO", "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA", "Central African Republic": "CF", "Chad": "TD", "Chile": "CL", "China": "CN", "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM", "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI", "France": "FR", "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT", "Guinea": "GN", "Guyana": "GY", "Haiti": "HT", "Honduras": "HN", "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Jamaica": "JM", "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Kuwait": "KW", "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU", "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV", "Mali": "ML", "Malta": "MT", "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX", "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ", "Myanmar": "MM", "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK", "Norway": "NO", "Oman": "OM", "Pakistan": "PK", "Palau": "PW", "Palestine State": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Rwanda": "RW", "Samoa": "WS", "San Marino": "SM", "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL", "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA", "South Korea": "KR", "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW", "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Timor-Leste": "TL", "Togo": "TG", "Tonga": "TO", "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM", "Tuvalu": "TV", "Uganda": "UG", "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB", "United States": "US", "Uruguay": "UY", "Uzbekistan": "UZ", "Vanuatu": "VU", "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN", "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW"
};

export const countryNames = Object.keys(countryNameToCode).sort();


const getCurrencyInfoForLocale = () => {
    try {
        const defaultLocale = 'en-US';
        const defaultCode = 'USD';
        
        if (typeof navigator === 'undefined' || typeof Intl === 'undefined') {
            return { locale: defaultLocale, code: defaultCode };
        }

        let countryCode: string | undefined;

        // 1. Try to get country from Timezone (most reliable for location)
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        countryCode = timeZoneToCountry[timeZone];

        // 2. Fallback to browser language locale if timezone didn't match
        if (!countryCode) {
            const locale = navigator.language; // e.g., "en-IN"
            const localeParts = locale.split('-');
            if (localeParts.length > 1) {
                const potentialCode = localeParts[1].toUpperCase();
                // Check if it's a valid code we have in our currency map
                if (countryToCurrency[potentialCode]) {
                    countryCode = potentialCode;
                }
            }
        }
        
        // 3. Default to US if all else fails
        const finalCountryCode = countryCode || 'US';
        const currencyCode = countryToCurrency[finalCountryCode] || defaultCode;

        return { locale: navigator.language, code: currencyCode };
    } catch (e) {
        // Final fallback in case of any error
        return { locale: 'en-US', code: 'USD' };
    }
}


/**
 * Generates an array of budget options with localized currency symbols and adjusted values,
 * dynamically based on the selected geography.
 * @param {string} geography The selected geographic focus (e.g., "India", "Global", "National").
 * @returns {Array<{name: string, label: string}>} An array of budget options.
 */
export const getLocalizedBudgetOptions = (geography: string = 'national') => {
    let currencyCode = 'USD';
    let targetLocale = 'en-US';

    const countryCodeForGeography = countryNameToCode[geography];

    if (geography === 'global' || geography === 'international') {
        currencyCode = 'USD';
        targetLocale = 'en-US';
    } else if (countryCodeForGeography) {
        // A specific country was selected
        currencyCode = countryToCurrency[countryCodeForGeography] || 'USD';
        // Construct a plausible locale for formatting. e.g., 'en-IN' for India.
        targetLocale = `en-${countryCodeForGeography}`;
    } else {
        // Default to user's browser for 'national', 'local', or anything else
        const info = getCurrencyInfoForLocale();
        currencyCode = info.code;
        targetLocale = info.locale;
    }

    const multiplier = currencyMultipliers[currencyCode] || 1;

    // Base tiers in USD
    const tiers = {
      low: 1000,
      medium: 5000,
      high: 20000,
    };

    const formatCurrency = (num: number) => {
        const adjustedNum = num * multiplier;
        try {
            return new Intl.NumberFormat(targetLocale, { 
                style: 'currency', 
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(adjustedNum);
        } catch (e) {
            // Fallback for unsupported constructed locales like 'en-AF'
            return new Intl.NumberFormat('en-US', {
                style: 'currency', 
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(adjustedNum);
        }
    };
    
    const lowTier = formatCurrency(tiers.low);
    const medTier = formatCurrency(tiers.medium);
    const highTier = formatCurrency(tiers.high);
    
    return [
        { name: 'low', label: `Under ${lowTier}` },
        { name: 'medium', label: `${lowTier} - ${medTier}` },
        { name: 'high', label: `${medTier} - ${highTier}` },
        { name: 'enterprise', label: `${highTier}+` },
    ];
};

/**
 * Gets the currency symbol for a given geography.
 * @param {string} geography The selected geographic focus (e.g., "India", "Global", "National").
 * @returns {string} The currency symbol.
 */
export const getCurrencySymbolForGeography = (geography: string = 'national'): string => {
    let currencyCode = 'USD';
    let targetLocale = 'en-US';

    const countryCodeForGeography = countryNameToCode[geography];

    if (geography === 'global' || geography === 'international') {
        currencyCode = 'USD';
        targetLocale = 'en-US';
    } else if (countryCodeForGeography) {
        currencyCode = countryToCurrency[countryCodeForGeography] || 'USD';
        targetLocale = `en-${countryCodeForGeography}`;
    } else {
        const info = getCurrencyInfoForLocale();
        currencyCode = info.code;
        targetLocale = info.locale;
    }

    try {
        const parts = new Intl.NumberFormat(targetLocale, {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'symbol',
        }).formatToParts(0);
        const symbolPart = parts.find(part => part.type === 'currency');
        return symbolPart ? symbolPart.value : '$';
    } catch (e) {
        // Fallback for unsupported locales
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency', 
                currency: currencyCode,
                currencyDisplay: 'symbol',
            }).formatToParts(0).find(part => part.type === 'currency')?.value || '$';
        } catch {
             return '$';
        }
    }
};

/**
 * Gets the currency code for a given geography.
 * @param {string} geography The selected geographic focus (e.g., "India", "Global", "National").
 * @returns {string} The three-letter currency code (e.g., USD, INR).
 */
export const getCurrencyCodeForGeography = (geography: string = 'national'): string => {
    let currencyCode = 'USD';

    const countryCodeForGeography = countryNameToCode[geography];

    if (geography === 'global' || geography === 'international') {
        currencyCode = 'USD';
    } else if (countryCodeForGeography) {
        currencyCode = countryToCurrency[countryCodeForGeography] || 'USD';
    } else {
        const info = getCurrencyInfoForLocale();
        currencyCode = info.code;
    }
    return currencyCode;
};


/**
 * Gets the currency symbol for the user's current locale.
 * This is a simplified function in case just the symbol is needed elsewhere.
 * @returns {string} The currency symbol.
 */
export const getCurrencySymbolForLocale = (): string => {
  try {
    const { locale, code } = getCurrencyInfoForLocale();
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'symbol',
    }).formatToParts(0);
    const symbolPart = parts.find(part => part.type === 'currency');
    return symbolPart ? symbolPart.value : '$';
  } catch (e) {
    console.warn("Could not determine local currency symbol, defaulting to '$'.", e);
    return '$';
  }
};