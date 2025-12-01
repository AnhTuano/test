/**
 * Request Signature Generator for ICTU API
 * Tạo chữ ký CRC32 để xác thực request với ICTU LMS API
 */

export const APP_ID = "7040BD38-0D02-4CBE-8B0E-F4115C348003";
export const APP_VERSION = "2.0.1";

const makeCRCTable = () => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
};

const crcTable = makeCRCTable();

const crc32 = (str: string): number => {
  let crc = 0 ^ (-1);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

/**
 * Generate request signature for ICTU API
 * Format: CRC32(body + APP_ID + timestamp)
 * Timestamp format: YYYY-MM-DD HH:mm:00 (Asia/Bangkok timezone)
 */
export const getRequestSignature = (
  method: string,
  body: any = {}
): string => {
  const now = new Date();
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => 
    parts.find(p => p.type === type)?.value;

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  // Seconds must be strictly '00'
  const timestamp = `${year}-${month}-${day} ${hour}:${minute}:00`;
  
  // POST/PUT body must be stringified
  const methodUpper = method.toUpperCase();
  const bodyStr = ["POST", "PUT"].includes(methodUpper) ? JSON.stringify(body ?? {}) : "";
  
  const dataToHash = bodyStr + APP_ID + timestamp;
  
  // CRC32 and convert to UpperCase Hex
  const signature = crc32(dataToHash).toString(16).toUpperCase();
  
  return signature;
};
