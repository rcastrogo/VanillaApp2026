

import ReportEngine from '../report-engine/engine';
import type { Mediator, ReportDefinition } from '../report-engine/types';

/**
 * Service responsible for creating and managing ReportEngine instances.
 * 
 * This service abstracts the creation logic and provides
 * helper methods for loading and generating reports.
 */
export class ReportEngineService {

  /**
   * Creates a new ReportEngine instance.
   * 
   * @returns A new ReportEngine instance.
   */
  createEngine<T>(): ReportEngine<T> {
    return new ReportEngine<T>();
  }

  /**
   * Generates a report using the provided definition, dataset and mediator.
   * 
   * @param rd - Report definition
   * @param data - Dataset to process
   * @param mediator - Mediator used for rendering communication
   */
  generateReport<T>(
    rd: ReportDefinition<T>,
    data: T[],
    mediator: Mediator
  ): void {
    const engine = this.createEngine<T>();
    engine.generateReport(rd, data, mediator);
  }

  /**
   * Loads a report definition from external source (URL).
   * 
   * @param path - URL to fetch report definition from
   * @returns Promise resolving to ReportDefinition
   */
  async loadExternalReport<T>(path: string): Promise<ReportDefinition<T>> {
    const engine = this.createEngine<T>();
    return await engine.loadExternalReport(path);
  }

  /**
   * Loads a registered report definition.
   * 
   * @param name - Registered report name
   * @returns Promise resolving to ReportDefinition
   */
  async loadRegisteredReport<T>(name: string): Promise<ReportDefinition<T>> {
    const engine = this.createEngine<T>();
    return await engine.loadRegisteredReport(name);
  }
}