process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@careerio.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS || 'test-pass';
process.env.PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || 'test-client-id';
process.env.PAYOS_API_KEY = process.env.PAYOS_API_KEY || 'test-api-key';
process.env.PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || 'test-checksum-key';

// Cac controller chu dong console.error/console.warn khi bat loi da luong (dung thiet ke).
// An bot noise trong output test, khong anh huong ket qua pass/fail.
global.console.error = jest.fn();
global.console.warn = jest.fn();
