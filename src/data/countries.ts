import { Country } from 'country-state-city'

export interface CountryItem {
  label: string
  name: string
  code: string
  dialCode: string
  flag: string
}

const list: CountryItem[] = []
const allCountries = Country.getAllCountries() || []

for (const c of allCountries) {
  if (c && typeof c.phonecode === 'string' && c.phonecode.trim().length > 0) {
    const phoneCode: string = c.phonecode
    const parts1 = phoneCode.split(' and ')
    const firstPart = parts1[0] || ''
    const parts2 = firstPart.split(' or ')
    const rawCode = (parts2[0] || '').trim()
    const cleanDialCode = rawCode.startsWith('+') ? rawCode : `+${rawCode}`

    list.push({
      label: `${c.flag || ''} ${c.name} (${cleanDialCode})`,
      name: c.name,
      code: c.isoCode,
      dialCode: cleanDialCode,
      flag: c.flag || '',
    })
  }
}

export const COUNTRIES: CountryItem[] = list
