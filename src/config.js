require('dotenv').config();

const required = [
  'DP_API_KEY', 'DP_API_SECRET', 'DP_PORTOKASSE_USER', 'DP_PORTOKASSE_PASS',
  'DP_DEFAULT_PRODUCT', 'DP_PAGE_FORMAT_ID',
  'DP_SENDER_NAME', 'DP_SENDER_STREET', 'DP_SENDER_ZIP', 'DP_SENDER_CITY', 'DP_SENDER_COUNTRY',
  'PRINTNODE_API_KEY', 'PRINTNODE_DEFAULT_PRINTER',
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required config: ${key}`);
}

module.exports = {
  DP_API_KEY: process.env.DP_API_KEY,
  DP_API_SECRET: process.env.DP_API_SECRET,
  DP_PORTOKASSE_USER: process.env.DP_PORTOKASSE_USER,
  DP_PORTOKASSE_PASS: process.env.DP_PORTOKASSE_PASS,
  DP_DEFAULT_PRODUCT: process.env.DP_DEFAULT_PRODUCT,
  DP_PAGE_FORMAT_ID: parseInt(process.env.DP_PAGE_FORMAT_ID, 10),
  DP_SENDER_NAME: process.env.DP_SENDER_NAME,
  DP_SENDER_COMPANY: process.env.DP_SENDER_COMPANY || '',
  DP_SENDER_STREET: process.env.DP_SENDER_STREET,
  DP_SENDER_ZIP: process.env.DP_SENDER_ZIP,
  DP_SENDER_CITY: process.env.DP_SENDER_CITY,
  DP_SENDER_COUNTRY: process.env.DP_SENDER_COUNTRY,
  PRINTNODE_API_KEY: process.env.PRINTNODE_API_KEY,
  PRINTNODE_DEFAULT_PRINTER: process.env.PRINTNODE_DEFAULT_PRINTER,
  PORT: process.env.PORT || 3000,
};
