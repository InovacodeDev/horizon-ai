/**
 * Script de teste para validar o tratamento de timezone
 *
 * Execute com: npx tsx scripts/test-timezone.ts
 */
import {
  dateToUserTimezone,
  getCurrentDateTimeInUTC,
  getTimezoneOffset,
  getUserTimezone,
  isoToUserTimezone,
} from '../lib/utils/timezone';

console.log('=== Teste de Timezone ===\n');

// 1. Obter timezone do usuário
const userTimezone = getUserTimezone();
console.log(`1. Timezone do usuário: ${userTimezone}`);

// 2. Obter offset do timezone
const offset = getTimezoneOffset(userTimezone);
console.log(`2. Offset do timezone: ${offset} minutos (${offset / 60} horas)`);

// 3. Converter data local para UTC
const localDate = '2025-11-01';
const utcDate = dateToUserTimezone(localDate, userTimezone);
console.log(`\n3. Conversão de data local para UTC:`);
console.log(`   Input (local): ${localDate} 00:00:00`);
console.log(`   Output (UTC): ${utcDate}`);

// 4. Converter UTC de volta para local
const backToLocal = isoToUserTimezone(utcDate, userTimezone);
console.log(`\n4. Conversão de UTC de volta para local:`);
console.log(`   Input (UTC): ${utcDate}`);
console.log(`   Output (local): ${backToLocal}`);

// 5. Obter data/hora atual em UTC
const currentUTC = getCurrentDateTimeInUTC(userTimezone);
console.log(`\n5. Data/hora atual em UTC: ${currentUTC}`);

// 6. Teste com diferentes timezones
console.log('\n6. Teste com diferentes timezones:');

const testDate = '2025-11-01';
const timezones = [
  'America/Sao_Paulo', // UTC-3
  'America/New_York', // UTC-5 (ou UTC-4 no horário de verão)
  'Europe/London', // UTC+0 (ou UTC+1 no horário de verão)
  'Asia/Tokyo', // UTC+9
];

timezones.forEach((tz) => {
  const offset = getTimezoneOffset(tz);
  const utc = dateToUserTimezone(testDate, tz);
  console.log(`   ${tz} (${offset / 60}h): ${testDate} -> ${utc}`);
});

console.log('\n=== Teste Concluído ===');
