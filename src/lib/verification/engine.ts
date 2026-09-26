/**
 * Government Verification Gateway — Orchestration Engine
 *
 * Runs all government verification connectors, entity resolution,
 * and risk scoring for a given bidder identity. Returns a unified
 * GovernmentVerificationReport.
 */

import type {
  BidderExtractedIdentity,
  GovVerificationEnvironment,
  GovernmentVerificationReport,
  GovVerificationResult,
  GovConnectorId,
} from './types';
import { UdyamConnector } from './connectors/udyam';
import { GstConnector } from './connectors/gst';
import { McaConnector } from './connectors/mca';
import { 
  DigiLockerConnector, 
  PanConnector, 
  BlacklistingConnector,
  EpfoEsicConnector,
  StartupIndiaConnector,
  NsicConnector,
  BisConnector
} from './connectors/extended';
import { resolveEntity } from './matcher';
import { calculateVerificationScore } from './risk';
import { getCurrentTimestamp } from './connectors/base';

/**
 * Connectors backed by an authorised live government API. None are wired yet: every
 * connector currently reads the bundled demo registry in src/data/government.
 * Add a connector id here only once its verify() calls the real API.
 */
const LIVE_ADAPTERS = new Set<GovConnectorId>();

function integrationNotConfigured(connectorId: GovConnectorId, source: string): GovVerificationResult {
  return {
    connectorId,
    source,
    sourceType: 'GOVERNMENT_API',
    status: 'UNAVAILABLE',
    identifier: 'NOT_CONFIGURED',
    checkedAt: getCurrentTimestamp(),
    fields: [],
    message: 'No authorised live API integration is configured for this source. The Procurement Officer must verify this manually on the official portal.',
  };
}

/**
 * Run government verification for a bidder across all connectors.
 *
 * 1. Instantiates statutory connectors (Udyam, GST, MCA, DigiLocker, PAN, Debarment, EPFO/ESIC, Startup India, NSIC, BIS)
 * 2. Runs verification on each
 * 3. Runs entity resolution across all results
 * 4. Calculates deterministic verification score
 * 5. Returns the full GovernmentVerificationReport
 */
export function runGovernmentVerification(
  bidderId: string,
  bidderName: string,
  identity: BidderExtractedIdentity,
  environment: GovVerificationEnvironment = 'DEMO'
): GovernmentVerificationReport {

  const connectors = [
    new UdyamConnector(),
    new GstConnector(),
    new McaConnector(),
    new PanConnector(),
    new DigiLockerConnector(),
    new BlacklistingConnector(),
    new EpfoEsicConnector(),
    new StartupIndiaConnector(),
    new NsicConnector(),
    new BisConnector(),
  ];

  const verifications: GovVerificationResult[] = connectors.map(connector =>
    environment === 'PRODUCTION' && !LIVE_ADAPTERS.has(connector.id)
      ? integrationNotConfigured(connector.id, connector.name)
      : connector.verify(identity, environment)
  );

  const entityResolution = resolveEntity(identity, verifications);
  const overallScore = calculateVerificationScore(verifications, entityResolution);

  return {
    bidderId,
    bidderName,
    environment,
    extractedIdentity: identity,
    verifications,
    entityResolution,
    overallScore,
    generatedAt: getCurrentTimestamp(),
  };
}
