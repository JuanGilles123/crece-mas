import currencyCodes from 'currency-codes/data';

export const currencyList = currencyCodes.map(c => ({
  code: c.code,
  name: `${c.code} - ${c.currency} (${c.countries.join(', ')})`
}));
