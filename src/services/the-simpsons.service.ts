import { createApiRequest } from "../core/services/http-client.service";
import { type WrappedFetchResponse } from "../core/services/http-client.utils";

const BASE_END_POINT = 'https://thesimpsonsapi.com/api/';

export interface Character {
  id: number;
  age: number;
  gender: string;
  name: string;
  occupation: string;
  status: string;
  portrait_path: string;
}

export async function getCharacters(page = 1): Promise<WrappedFetchResponse<Character[]> | string> {
  return createApiRequest<Character[]>()
    .useBase(BASE_END_POINT)
    .getFrom(`characters?page=${page}`)
    .useLog('Fetching characters')
    .useProperty('results')
    .invoke();
}