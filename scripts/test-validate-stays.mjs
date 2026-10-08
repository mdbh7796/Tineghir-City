// Negative fixtures for validateStays (ships honest data today, but the
// build gate must reject bad inputs on its own). Run: node scripts/test-validate-stays.mjs
import { validateStays } from './build-pages.mjs';

process.exit = ((code) => { throw new Error(`exit:${code}`); });

const good = {
  name: 'T', area: 'town', priceBand: 'mid', blurb: 'B',
  bookingUrl: 'https://www.booking.com/searchresults.html?ss=T%2C+Tinghir',
  mapsQuery: 'T, Tinghir, Morocco', verified: true,
};
let pass = 0;
const rejects = (label, entry) => {
  try {
    validateStays([{ ...good, ...entry }]);
    console.error(`FAIL (accepted): ${label}`);
    process.exitCode = 1;
  } catch (e) {
    if (String(e.message).startsWith('exit:')) pass++;
    else { console.error(`FAIL (wrong error): ${label}: ${e.message}`); process.exitCode = 1; }
  }
};

rejects('non-Moroccan phone', { phone: '+33612345678' });
rejects('local-format phone', { phone: '0612345678' });
rejects('non-Moroccan whatsapp', { whatsapp: '33612345678' });
rejects('short whatsapp', { whatsapp: '612345678' });
rejects('whatsapp with plus', { whatsapp: '+212612345678' });
rejects('verified as string', { verified: 'false' });

try {
  validateStays([{ ...good, phone: '+212612345678', whatsapp: '212612345678' }]);
  pass++;
} catch (e) {
  console.error(`FAIL (rejected good entry): ${e.message}`);
  process.exitCode = 1;
}

if (!process.exitCode) console.log(`validate-stays fixtures PASS (${pass}/7)`);
