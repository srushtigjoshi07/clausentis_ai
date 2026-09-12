/**
 * Government Verification Gateway
 *
 * Module entry point exporting types, connectors, entity resolution matcher,
 * risk scoring, and the main verification engine orchestrator.
 */

export * from './types';
export * from './engine';
export * from './matcher';
export * from './risk';
export * from './connectors/base';
export * from './connectors/udyam';
export * from './connectors/gst';
export * from './connectors/mca';
export * from './connectors/extended';

