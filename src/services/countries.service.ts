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

const BASE_ENDPOINT = 'https://restcountries.com/v3.1/';

export class CountriesService {

  async getAll(): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all countries')
      .useTransform(countries => countries.map((c, i) => this.mapCountry(c, i)))
      .getFrom('all?fields=name,capital,region,subregion,languages,population,flags,cca2')  
      .invoke();
  }

  async searchByName(term: string): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Searching country: ${term}`)
      .useTransform(countries => countries.map((c, i) => this.mapCountry(c, i)))      
      .getFrom(`name/${term}`)
      .invoke();
  }

  private mapCountry(c: any, index: number): Country {
    return {
      id: index + 1,
      cca2: c.cca2 || '',
      name: c.name?.common || '',
      capital: c.capital?.[0] || '',
      region: c.region,
      flag: c.flags?.png || '',
      population: c.population,
      subregion: c.subregion,
      language: c.languages ? String(Object.values(c.languages)[0]) : 'unknown',
      data: c,
    };
  }
}