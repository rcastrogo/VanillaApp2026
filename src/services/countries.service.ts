/* eslint-disable @typescript-eslint/no-explicit-any */

import { createApiRequest } from "@/core/services/http-client.service";
import type { WrappedFetchResponse } from "@/core/services/http-client.utils";

export interface Country {
  id: number;
  cca2: string;
  name: string;
  capital: string;
  region: string;
  subregion?: string,
  population: number;
  flag: string;
  language?: string;
  data: any;
}

const BASE_ENDPOINT = 'https://api.restcountries.com/countries/v5';
const TOKEN = 'rc_live_433947321d12438884c3639458d5f94a';

export class CountriesService {

  async getAll(): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all countries')
      .useTransform(countries => countries.map((c, i) => this.mapCountry(c, i)))
      .getFrom('?limit=100')
      .useToken(TOKEN)
      .useProperty('data.objects')
      .invoke();
  }

  async searchByName(term: string): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Searching country: ${term}`)
      .useTransform(countries => countries.map((c, i) => this.mapCountry(c, i)))      
      .getFrom(`/name?q=${encodeURIComponent(term)}&limit=100`)
      .useToken(TOKEN)
      .useProperty('data.objects')
      .invoke();
  }

  private mapCountry(c: any, index: number): Country {
    return {
      id: index + 1,
      cca2: c.codes?.alpha_2 || '', 
      name: c.names?.common || '',
      capital: c.capitals?.[0]?.name || '',
      region: c.region,
      flag: c.flag?.url_png || '',
      population: c.population,
      subregion: c.subregion,
      language: c.languages?.length > 0 ? c.languages[0].name : 'unknown',
      data: c,
    };
  }

}