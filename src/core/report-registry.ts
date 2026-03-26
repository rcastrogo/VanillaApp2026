import type { ReportModuleLoader } from './report-engine/types';

let REPORT_REGISTRY:  Record<string, ReportModuleLoader> = {};

export function setupReports(reports: Record<string, ReportModuleLoader>) {
  REPORT_REGISTRY = reports;
}

export function getReport(name: string): ReportModuleLoader | undefined {
  return REPORT_REGISTRY[name];
}