import { Country, type ICountry } from 'country-state-city'

export interface CountryItem {
  label: string
  name: string
  code: string
  dialCode: string
  flag: string
}

const rawCountries: ICountry[] = Country.getAllCountries() || []

export const COUNTRIES: CountryItem[] = rawCountries
  .filter((c): c is ICountry => Boolean(c && c.phonecode))
  .map((c) => {
    const phone = c.phonecode || ''
    const rawCode = phone.split(' and ')[0].split(' or ')[0].trim()
    const cleanDialCode = rawCode.startsWith('+') ? rawCode : `+${rawCode}`
    return {
      label: `${c.flag || ''} ${c.name} (${cleanDialCode})`,
      name: c.name,
      code: c.isoCode,
      dialCode: cleanDialCode,
      flag: c.flag || '',
    }
  })
