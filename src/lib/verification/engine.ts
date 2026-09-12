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
    connector.verify(identity, environment)
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
