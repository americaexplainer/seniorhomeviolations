import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import path from 'node:path';
import { slugify, stateSlug, citySlug, facilitySlug, STATE_NAMES } from '../utils/slugify';
import { severityWeight, calculateScore, scoreToGrade, type Grade } from '../utils/grading';

// ---------- Types ----------

export interface HealthCitation {
  surveyDate: string;
  category: string;
  tagNumber: string;
  description: string;
  severityCode: string;
  corrected: string;
  correctionDate: string;
  cycle: string;
  isStandard: boolean;
  isComplaint: boolean;
}

export interface FireCitation {
  surveyDate: string;
  category: string;
  tagNumber: string;
  description: string;
  severityCode: string;
  corrected: string;
  correctionDate: string;
  cycle: string;
}

export interface Penalty {
  date: string;
  type: string;
  fineAmount: number;
  paymentDenialStart: string;
  paymentDenialDays: number;
}

export interface StateAverage {
  state: string;
  overallRating: number;
  healthInspectionRating: number;
  staffingRating: number;
  qmRating: number;
  cycle1HealthDef: number;
  cycle1FireDef: number;
  avgResidents: number;
  reportedRNHours: number;
  reportedTotalNurseHours: number;
  numFines: number;
  fineAmount: number;
  nursingTurnover: number;
}

export interface Facility {
  ccn: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  county: string;
  ownershipType: string;
  beds: number;
  avgResidents: number;
  providerType: string;
  overallRating: number;
  healthRating: number;
  qmRating: number;
  staffingRating: number;
  rnHoursPerResident: number;
  totalNurseHours: number;
  nursingTurnover: string;
  rnTurnover: string;
  totalFines: number;
  numFines: number;
  numPenalties: number;
  specialFocusStatus: string;
  abuseIcon: string;
  sprinklers: string;
  latitude: string;
  longitude: string;
  // Computed
  healthCitations: HealthCitation[];
  fireCitations: FireCitation[];
  penalties: Penalty[];
  healthCitationCount: number;
  fireCitationCount: number;
  healthSeverityScore: number;
  safetyScore: number;
  safetyGrade: Grade;
  // Slugs
  stateSlug: string;
  citySlug: string;
  facilitySlug: string;
  url: string;
}

// ---------- Module-level cache ----------

let _facilities: Map<string, Facility> | null = null;
let _stateAverages: Map<string, StateAverage> | null = null;
let _facilitiesByState: Map<string, Facility[]> | null = null;
let _facilitiesByStateCity: Map<string, Facility[]> | null = null;
let _allFacilitiesList: Facility[] | null = null;

// ---------- CSV file paths ----------

const DATA_DIR = path.resolve(process.cwd());
const PROVIDERS_CSV = path.join(DATA_DIR, '4pq5-n9py_2026-10-01_NH_ProviderInfo_Oct2026.csv');
const PENALTIES_CSV = path.join(DATA_DIR, 'g6vv-u9sr_2026-10-01_NH_Penalties_Oct2026.csv');
const FIRE_CSV = path.join(DATA_DIR, 'ifjz-ge4w_2026-10-01_NH_FireSafetyCitations_Oct2026.csv');
const HEALTH_CSV = path.join(DATA_DIR, 'r5ix-sfxw_2026-10-01_NH_HealthCitations_Oct2026.csv');
const STATE_AVG_CSV = path.join(DATA_DIR, 'xcdc-v8bm_2026-10-01_NH_StateUSAverages_Oct2026.csv');

// ---------- Helpers ----------

function parseNum(val: string | undefined): number {
  if (!val || val === '') return 0;
  const n = parseFloat(val.replace(/[,$]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
}

// ---------- Load State Averages ----------

export function loadStateAverages(): Map<string, StateAverage> {
  if (_stateAverages) return _stateAverages;

  const rows = parseCsv(STATE_AVG_CSV);
  _stateAverages = new Map();

  for (const row of rows) {
    const key = row['State or Nation'] || '';
    _stateAverages.set(key, {
      state: key,
      overallRating: parseNum(row['Overall Rating']),
      healthInspectionRating: parseNum(row['Health Inspection Rating']),
      staffingRating: parseNum(row['Staffing Rating']),
      qmRating: parseNum(row['QM Rating']),
      cycle1HealthDef: parseNum(row['Cycle 1 Total Number of Health Deficiencies']),
      cycle1FireDef: parseNum(row['Cycle 1 Total Number of Fire Safety Deficiencies']),
      avgResidents: parseNum(row['Average Number of Residents per Day']),
      reportedRNHours: parseNum(row['Reported RN Staffing Hours per Resident per Day']),
      reportedTotalNurseHours: parseNum(row['Reported Total Nurse Staffing Hours per Resident per Day']),
      numFines: parseNum(row['Number of Fines']),
      fineAmount: parseNum(row['Fine Amount in Dollars']),
      nursingTurnover: parseNum(row['Total nursing staff turnover']),
    });
  }

  return _stateAverages;
}

// ---------- Load All Facilities ----------

export function loadAllFacilities(): Map<string, Facility> {
  if (_facilities) return _facilities;

  console.log('[Data Loader] Parsing provider info...');
  const providerRows = parseCsv(PROVIDERS_CSV);

  // Initialize facility map
  _facilities = new Map();
  for (const row of providerRows) {
    const ccn = row['CMS Certification Number (CCN)'] || '';
    if (!ccn) continue;

    const name = row['Provider Name'] || '';
    const city = row['City/Town'] || '';
    const state = row['State'] || '';
    const st = stateSlug(state);
    const ct = citySlug(city);
    const fs = facilitySlug(name);

    // Handle duplicate slugs by appending CCN suffix
    const url = `/facility/${st}/${ct}/${fs}`;

    _facilities.set(ccn, {
      ccn,
      name,
      address: row['Provider Address'] || '',
      city,
      state,
      zip: row['ZIP Code'] || '',
      phone: row['Telephone Number'] || '',
      county: row['County/Parish'] || '',
      ownershipType: row['Ownership Type'] || '',
      beds: parseNum(row['Number of Certified Beds']),
      avgResidents: parseNum(row['Average Number of Residents per Day']),
      providerType: row['Provider Type'] || '',
      overallRating: parseNum(row['Overall Rating']),
      healthRating: parseNum(row['Health Inspection Rating']),
      qmRating: parseNum(row['QM Rating']),
      staffingRating: parseNum(row['Staffing Rating']),
      rnHoursPerResident: parseNum(row['Reported RN Staffing Hours per Resident per Day']),
      totalNurseHours: parseNum(row['Reported Total Nurse Staffing Hours per Resident per Day']),
      nursingTurnover: row['Total nursing staff turnover'] || '',
      rnTurnover: row['Registered Nurse turnover'] || '',
      totalFines: parseNum(row['Total Amount of Fines in Dollars']),
      numFines: parseNum(row['Number of Fines']),
      numPenalties: parseNum(row['Total Number of Penalties']),
      specialFocusStatus: row['Special Focus Status'] || '',
      abuseIcon: row['Abuse Icon'] || '',
      sprinklers: row['Automatic Sprinkler Systems in All Required Areas'] || '',
      latitude: row['Latitude'] || '',
      longitude: row['Longitude'] || '',
      healthCitations: [],
      fireCitations: [],
      penalties: [],
      healthCitationCount: 0,
      fireCitationCount: 0,
      healthSeverityScore: 0,
      safetyScore: 0,
      safetyGrade: 'C',
      stateSlug: st,
      citySlug: ct,
      facilitySlug: fs,
      url,
    });
  }

  // Deduplicate URLs: if multiple facilities share the same URL, append CCN
  const urlCounts = new Map<string, string[]>();
  for (const [ccn, fac] of _facilities) {
    const existing = urlCounts.get(fac.url) || [];
    existing.push(ccn);
    urlCounts.set(fac.url, existing);
  }
  for (const [url, ccns] of urlCounts) {
    if (ccns.length > 1) {
      for (const ccn of ccns) {
        const fac = _facilities.get(ccn)!;
        fac.facilitySlug = `${fac.facilitySlug}-${ccn.toLowerCase()}`;
        fac.url = `/facility/${fac.stateSlug}/${fac.citySlug}/${fac.facilitySlug}`;
      }
    }
  }

  // Parse health citations
  console.log('[Data Loader] Parsing health citations...');
  const healthRows = parseCsv(HEALTH_CSV);
  for (const row of healthRows) {
    const ccn = row['CMS Certification Number (CCN)'] || '';
    const fac = _facilities.get(ccn);
    if (!fac) continue;

    const sevCode = row['Scope Severity Code'] || '';
    fac.healthCitations.push({
      surveyDate: row['Survey Date'] || '',
      category: row['Deficiency Category'] || '',
      tagNumber: row['Deficiency Tag Number'] || '',
      description: row['Deficiency Description'] || '',
      severityCode: sevCode,
      corrected: row['Deficiency Corrected'] || '',
      correctionDate: row['Correction Date'] || '',
      cycle: row['Inspection Cycle'] || '',
      isStandard: row['Standard Deficiency'] === 'Y',
      isComplaint: row['Complaint Deficiency'] === 'Y',
    });
    fac.healthSeverityScore += severityWeight(sevCode);
  }

  // Parse fire safety citations
  console.log('[Data Loader] Parsing fire safety citations...');
  const fireRows = parseCsv(FIRE_CSV);
  for (const row of fireRows) {
    const ccn = row['CMS Certification Number (CCN)'] || '';
    const fac = _facilities.get(ccn);
    if (!fac) continue;

    fac.fireCitations.push({
      surveyDate: row['Survey Date'] || '',
      category: row['Deficiency Category'] || '',
      tagNumber: row['Deficiency Tag Number'] || '',
      description: row['Deficiency Description'] || '',
      severityCode: row['Scope Severity Code'] || '',
      corrected: row['Deficiency Corrected'] || '',
      correctionDate: row['Correction Date'] || '',
      cycle: row['Inspection Cycle'] || '',
    });
  }

  // Parse penalties
  console.log('[Data Loader] Parsing penalties...');
  const penaltyRows = parseCsv(PENALTIES_CSV);
  for (const row of penaltyRows) {
    const ccn = row['CMS Certification Number (CCN)'] || '';
    const fac = _facilities.get(ccn);
    if (!fac) continue;

    fac.penalties.push({
      date: row['Penalty Date'] || '',
      type: row['Penalty Type'] || '',
      fineAmount: parseNum(row['Fine Amount']),
      paymentDenialStart: row['Payment Denial Start Date'] || '',
      paymentDenialDays: parseNum(row['Payment Denial Length in Days']),
    });
  }

  // Update counts and calculate grades
  console.log('[Data Loader] Calculating safety grades...');
  const stateAvgs = loadStateAverages();
  const national = stateAvgs.get('NATION');

  for (const [ccn, fac] of _facilities) {
    fac.healthCitationCount = fac.healthCitations.length;
    fac.fireCitationCount = fac.fireCitations.length;

    // Sort citations by date descending
    fac.healthCitations.sort((a, b) => b.surveyDate.localeCompare(a.surveyDate));
    fac.fireCitations.sort((a, b) => b.surveyDate.localeCompare(a.surveyDate));
    fac.penalties.sort((a, b) => b.date.localeCompare(a.date));

    // Get state averages for grading
    const stateAvg = stateAvgs.get(fac.state) || national;
    const avg = stateAvg || {
      cycle1HealthDef: 9,
      cycle1FireDef: 4,
      fineAmount: 30000,
    };

    // Total cycle health deficiencies (sum cycles from state avg as baseline)
    const stateAvgTotalHealth = (avg.cycle1HealthDef || 9) * 3; // approx 3 cycles
    const stateAvgTotalFire = (avg.cycle1FireDef || 4) * 3;

    const score = calculateScore({
      overallRating: fac.overallRating,
      healthRating: fac.healthRating,
      staffingRating: fac.staffingRating,
      healthCitationCount: fac.healthCitationCount,
      healthSeverityScore: fac.healthSeverityScore,
      fireCitationCount: fac.fireCitationCount,
      totalFines: fac.totalFines,
      stateAvgHealthDeficiencies: stateAvgTotalHealth,
      stateAvgFireDeficiencies: stateAvgTotalFire,
      stateAvgFineAmount: avg.fineAmount || 30000,
    });

    fac.safetyScore = score;
    fac.safetyGrade = scoreToGrade(score);
  }

  console.log(`[Data Loader] Loaded ${_facilities.size} facilities.`);
  return _facilities;
}

// ---------- Grouped accessors ----------

export function getFacilitiesByState(): Map<string, Facility[]> {
  if (_facilitiesByState) return _facilitiesByState;

  const all = loadAllFacilities();
  _facilitiesByState = new Map();

  for (const fac of all.values()) {
    const key = fac.state;
    if (!_facilitiesByState.has(key)) {
      _facilitiesByState.set(key, []);
    }
    _facilitiesByState.get(key)!.push(fac);
  }

  // Sort each state's facilities by grade (best first)
  for (const [, facs] of _facilitiesByState) {
    facs.sort((a, b) => b.safetyScore - a.safetyScore);
  }

  return _facilitiesByState;
}

export function getFacilitiesByStateCity(): Map<string, Facility[]> {
  if (_facilitiesByStateCity) return _facilitiesByStateCity;

  const all = loadAllFacilities();
  _facilitiesByStateCity = new Map();

  for (const fac of all.values()) {
    const key = `${fac.stateSlug}/${fac.citySlug}`;
    if (!_facilitiesByStateCity.has(key)) {
      _facilitiesByStateCity.set(key, []);
    }
    _facilitiesByStateCity.get(key)!.push(fac);
  }

  for (const [, facs] of _facilitiesByStateCity) {
    facs.sort((a, b) => b.safetyScore - a.safetyScore);
  }

  return _facilitiesByStateCity;
}

export function getAllFacilitiesList(): Facility[] {
  if (_allFacilitiesList) return _allFacilitiesList;
  const all = loadAllFacilities();
  _allFacilitiesList = Array.from(all.values());
  return _allFacilitiesList;
}

export function getTopPenaltyFacilities(count: number = 20): Facility[] {
  return getAllFacilitiesList()
    .filter(f => f.totalFines > 0)
    .sort((a, b) => b.totalFines - a.totalFines)
    .slice(0, count);
}

export function getStatesWithCounts(): { abbr: string; name: string; count: number; slug: string }[] {
  const byState = getFacilitiesByState();
  const results: { abbr: string; name: string; count: number; slug: string }[] = [];

  for (const [abbr, facs] of byState) {
    results.push({
      abbr,
      name: STATE_NAMES[abbr] || abbr,
      count: facs.length,
      slug: stateSlug(abbr),
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/** Lightweight search index for client-side search */
export function buildSearchIndex(): { name: string; city: string; state: string; grade: string; url: string }[] {
  return getAllFacilitiesList().map(f => ({
    name: f.name,
    city: f.city,
    state: f.state,
    grade: f.safetyGrade,
    url: f.url,
  }));
}
