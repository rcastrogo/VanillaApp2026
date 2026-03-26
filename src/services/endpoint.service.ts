import { createApiRequest } from "../core/services/http-client.service";
import type { WrappedFetchResponse } from "../core/services/http-client.utils";

import type { Identifiable } from "@/core/types";



export interface SecureEndPoint {
  id: string | number,
  url: string,
  env: string,
  name: string,
  login: string,
  pass: string,
  favorite: boolean,
  info?: string,
}

const END_POINT =  'assets/apps.server.json';

export function getAllAsync(): Promise<WrappedFetchResponse<SecureEndPoint[]> | string> {
  return createApiRequest<SecureEndPoint[]>()
    .getFrom(END_POINT)
    .useLog('Fetching endpoints')
    .invoke();
}

export function getJamonesAsync(): Promise<WrappedFetchResponse<Identifiable[]> | string> {
  return createApiRequest<Identifiable[]>()
    .getFrom('assets/jamones.json')
    .useLog('Fetching jamones')
    .invoke();
}