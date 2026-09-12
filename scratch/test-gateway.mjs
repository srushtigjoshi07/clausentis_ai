import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load JSON data
const udyamData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/data/government/udyam.json'), 'utf8'));
const gstData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/data/government/gst.json'), 'utf8'));
const mcaData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/data/government/mca.json'), 'utf8'));

console.log('--- DATA INTEGRITY CHECK ---');
console.log('Udyam Records:', udyamData.records.length, 'Label:', udyamData._meta.label);
console.log('GST Records:', gstData.records.length, 'Label:', gstData._meta.label);
console.log('MCA Records:', mcaData.records.length, 'Label:', mcaData._meta.label);

// Check Case 1: ABC Robotics (Genuine)
const udyamRec1 = udyamData.records.find(r => r.udyamNumber === 'UDYAM-DEMO-0001');
const gstRec1 = gstData.records.find(r => r.gstin === '29ABCDE1234F1Z5');
const mcaRec1 = mcaData.records.find(r => r.cin === 'U72900KA2022PTC000001');

console.log('\nCase 1 Data Check:');
console.log('Udyam Name:', udyamRec1?.enterpriseName, 'PAN:', udyamRec1?.pan);
console.log('GST Name:', gstRec1?.legalName, 'PAN:', gstRec1?.pan);
console.log('MCA Name:', mcaRec1?.companyName, 'PAN:', mcaRec1?.pan);

// Check Case 4: TechNova (Cancelled)
const udyamRec4 = udyamData.records.find(r => r.udyamNumber === 'UDYAM-DEMO-0002');
console.log('\nCase 4 Status Check:');
console.log('Udyam Status:', udyamRec4?.status);

// Check Case 6: Apex Heavy Engineering
const udyamApex = udyamData.records.find(r => r.udyamNumber === 'UDYAM-TN-02-0049182');
const gstApex = gstData.records.find(r => r.gstin === '33AABCA1234F1Z8');
const mcaApex = mcaData.records.find(r => r.cin === 'U28100TN2012PTC085123');

console.log('\nCase 6 Data Check:');
console.log('Apex Udyam:', udyamApex?.enterpriseName, 'PAN:', udyamApex?.pan);
console.log('Apex GST:', gstApex?.legalName, 'PAN:', gstApex?.pan);
console.log('Apex MCA:', mcaApex?.companyName, 'PAN:', mcaApex?.pan);

console.log('\nALL SYNTHETIC GOVERNMENT DATA VERIFIED VALID JSON.');
