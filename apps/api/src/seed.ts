import type { LeadStatus } from '@prisma/client';
import { disconnectDatabase, prismaClient } from './config/db.js';
import { buildLeadgenPayload } from './helper/metaLeadPayload.js';
import { extractLeadgenValues } from './schema/metaWebhook.schema.js';
import { updateLeadStatus } from './service/lead.service.js';
import { processWebhookEvent } from './service/webhookEvent.service.js';

const DAY_MS = 86_400_000;
const PAGE_ID = '104729384756102';

// Fixed ids keep the seed idempotent: a second run is an identical redelivery, which the
// ingestion path already answers with no writes.
const FIRST_LEADGEN_ID = 770000000000000;

const FORMS = {
  coworkingSeats: { formId: '873625194038271', adId: '239847561029384' },
  managedOffice: { formId: '904418273650192', adId: '411029384756102' },
  dayPass: { formId: '765102938475610', adId: '502938475610293' },
};

type Journey = { status: LeadStatus; note?: string }[];

type SeedLead = {
  form: keyof typeof FORMS;
  daysAgo: number;
  fields: Record<string, string>;
  journey: Journey;
};

const SEED_LEADS: SeedLead[] = [
  {
    form: 'coworkingSeats',
    daysAgo: 0,
    fields: {
      full_name: 'Priya Raghavan',
      email: 'priya.raghavan@example.com',
      phone_number: '+919812345678',
      city: 'Bengaluru',
      team_size: '6-15',
    },
    journey: [],
  },
  {
    form: 'managedOffice',
    daysAgo: 0,
    fields: {
      full_name: 'Devansh Kulkarni',
      email: 'devansh.kulkarni@example.com',
      phone_number: '+919820114477',
      city: 'Pune',
      team_size: '40+',
      move_in: 'Within a month',
    },
    journey: [],
  },
  {
    form: 'dayPass',
    daysAgo: 1,
    fields: {
      full_name: 'Ritika Bose',
      email: 'ritika.bose@example.com',
      phone_number: '+919903221188',
      city: 'Kolkata',
      team_size: '1-5',
    },
    journey: [],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 1,
    fields: {
      full_name: 'Aditya Rao',
      email: 'aditya.rao@example.com',
      phone_number: '+919845778821',
      city: 'Hyderabad',
      team_size: '16-40',
    },
    journey: [],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 2,
    fields: {
      full_name: 'Neha Sridhar',
      email: 'neha.sridhar@example.com',
      phone_number: '+919867542310',
      city: 'Chennai',
      team_size: '6-15',
    },
    journey: [],
  },
  {
    form: 'managedOffice',
    daysAgo: 2,
    fields: {
      full_name: 'Farhan Qureshi',
      email: 'farhan.qureshi@example.com',
      phone_number: '+919811203456',
      city: 'Delhi',
      team_size: '40+',
      requirement: 'Private floor with meeting rooms',
    },
    journey: [],
  },
  {
    form: 'dayPass',
    daysAgo: 3,
    fields: {
      full_name: 'Sanjana Pillai',
      email: 'sanjana.pillai@example.com',
      phone_number: '+919847001122',
      city: 'Kochi',
      team_size: '1-5',
    },
    journey: [],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 3,
    fields: {
      full_name: 'Karthik Iyer',
      email: 'karthik.iyer@example.com',
      phone_number: '+919886554433',
      city: 'Bengaluru',
      team_size: '6-15',
    },
    journey: [{ status: 'CONTACTED', note: 'Called, sending Koramangala options' }],
  },
  {
    form: 'managedOffice',
    daysAgo: 4,
    fields: {
      full_name: 'Ishita Bhattacharya',
      email: 'ishita.b@example.com',
      phone_number: '+919831778866',
      city: 'Kolkata',
      team_size: '16-40',
    },
    journey: [{ status: 'CONTACTED', note: 'Shared shortlist over WhatsApp' }],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 5,
    fields: {
      full_name: 'Rahul Deshpande',
      email: 'rahul.deshpande@example.com',
      phone_number: '+919822441133',
      city: 'Pune',
      team_size: '1-5',
    },
    journey: [{ status: 'CONTACTED' }],
  },
  {
    form: 'dayPass',
    daysAgo: 5,
    fields: {
      full_name: 'Tanvi Mehta',
      email: 'tanvi.mehta@example.com',
      phone_number: '+919819005566',
      city: 'Mumbai',
      team_size: '1-5',
    },
    journey: [{ status: 'CONTACTED', note: 'Wants a trial day this week' }],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 6,
    fields: {
      full_name: 'Aman Chauhan',
      email: 'aman.chauhan@example.com',
      phone_number: '+919871224455',
      city: 'Gurugram',
      team_size: '16-40',
    },
    journey: [{ status: 'CONTACTED', note: 'Budget confirmed, visit being scheduled' }],
  },
  {
    form: 'managedOffice',
    daysAgo: 7,
    fields: {
      full_name: 'Lakshmi Narayan',
      email: 'lakshmi.narayan@example.com',
      phone_number: '+919840332211',
      city: 'Chennai',
      team_size: '40+',
    },
    journey: [
      { status: 'CONTACTED', note: 'Requirement gathered for 60 seats' },
      { status: 'QUALIFIED', note: 'Site visit done, proposal sent' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 8,
    fields: {
      full_name: 'Siddharth Jain',
      email: 'siddharth.jain@example.com',
      phone_number: '+919825667788',
      city: 'Ahmedabad',
      team_size: '6-15',
    },
    journey: [
      { status: 'CONTACTED' },
      { status: 'QUALIFIED', note: 'Comparing two centres in Prahlad Nagar' },
    ],
  },
  {
    form: 'managedOffice',
    daysAgo: 9,
    fields: {
      full_name: 'Meghna Reddy',
      email: 'meghna.reddy@example.com',
      phone_number: '+919849112233',
      city: 'Hyderabad',
      team_size: '16-40',
      move_in: 'Next quarter',
    },
    journey: [
      { status: 'CONTACTED', note: 'Decision maker looped in' },
      { status: 'QUALIFIED' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 10,
    fields: {
      full_name: 'Nikhil Menon',
      email: 'nikhil.menon@example.com',
      phone_number: '+919846778899',
      city: 'Bengaluru',
      team_size: '6-15',
    },
    journey: [
      { status: 'CONTACTED' },
      { status: 'QUALIFIED', note: 'Agreement under review with their legal team' },
    ],
  },
  {
    form: 'managedOffice',
    daysAgo: 12,
    fields: {
      full_name: 'Shruti Kapoor',
      email: 'shruti.kapoor@example.com',
      phone_number: '+919818334455',
      city: 'Noida',
      team_size: '40+',
    },
    journey: [
      { status: 'CONTACTED', note: 'Walkthrough booked for Sector 62' },
      { status: 'QUALIFIED', note: 'Commercials agreed' },
      { status: 'CONVERTED', note: '45 seats booked for 12 months' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 14,
    fields: {
      full_name: 'Yash Agarwal',
      email: 'yash.agarwal@example.com',
      phone_number: '+919830445566',
      city: 'Kolkata',
      team_size: '16-40',
    },
    journey: [
      { status: 'CONTACTED' },
      { status: 'QUALIFIED', note: 'Trial week completed' },
      { status: 'CONVERTED', note: '20 seats, Salt Lake centre' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 16,
    fields: {
      full_name: 'Ananya Ghosh',
      email: 'ananya.ghosh@example.com',
      phone_number: '+919903556677',
      city: 'Bengaluru',
      team_size: '6-15',
    },
    journey: [
      { status: 'CONTACTED', note: 'Toured Indiranagar centre' },
      { status: 'QUALIFIED' },
      { status: 'CONVERTED', note: '8 seats on a flexible plan' },
    ],
  },
  {
    form: 'dayPass',
    daysAgo: 18,
    fields: {
      full_name: 'Rohit Salunke',
      email: 'rohit.salunke@example.com',
      phone_number: '+919820778899',
      city: 'Mumbai',
      team_size: '1-5',
    },
    journey: [
      { status: 'CONTACTED' },
      { status: 'QUALIFIED', note: 'Bought a 10-day pass to start' },
      { status: 'CONVERTED', note: 'Moved to a monthly desk' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 20,
    fields: {
      full_name: 'Pooja Nambiar',
      email: 'pooja.nambiar@example.com',
      phone_number: '+919847556677',
      city: 'Kochi',
      team_size: '1-5',
    },
    journey: [{ status: 'LOST', note: 'Duplicate enquiry, same person on another form' }],
  },
  {
    form: 'managedOffice',
    daysAgo: 22,
    fields: {
      full_name: 'Gaurav Sethi',
      email: 'gaurav.sethi@example.com',
      phone_number: '+919810667788',
      city: 'Delhi',
      team_size: '40+',
    },
    journey: [
      { status: 'CONTACTED', note: 'Two follow-ups, no response' },
      { status: 'LOST', note: 'Unreachable after three attempts' },
    ],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 25,
    fields: {
      full_name: 'Sneha Patil',
      email: 'sneha.patil@example.com',
      phone_number: '+919823889900',
      city: 'Pune',
      team_size: '16-40',
    },
    journey: [
      { status: 'CONTACTED' },
      { status: 'QUALIFIED', note: 'Proposal sent for 25 seats' },
      { status: 'LOST', note: 'Chose a centre closer to their office' },
    ],
  },
  {
    form: 'dayPass',
    daysAgo: 4,
    fields: {
      full_name: '<test lead: ignore>',
      email: 'test@meta.com',
      phone_number: '+910000000000',
      city: 'Bengaluru',
      team_size: '1-5',
    },
    journey: [],
  },
  {
    form: 'coworkingSeats',
    daysAgo: 11,
    fields: {
      full_name: 'Meta Test User',
      email: 'test@meta.com',
      phone_number: '+910000000001',
      city: 'Mumbai',
      team_size: '6-15',
    },
    journey: [{ status: 'CONTACTED' }],
  },
];

const ingest = async (leadgenId: string, seed: SeedLead): Promise<void> => {
  const { formId, adId } = FORMS[seed.form];

  const payload = buildLeadgenPayload({
    leadgenId,
    pageId: PAGE_ID,
    formId,
    adId,
    createdTime: Math.floor((Date.now() - seed.daysAgo * DAY_MS) / 1000),
    fields: seed.fields,
  });

  const [value] = extractLeadgenValues(payload);

  if (!value) {
    throw new Error(`Seed payload for ${leadgenId} carried no leadgen change`);
  }

  const event = await prismaClient.webhookEvent.create({
    data: { externalId: value.leadgen_id, payload: value },
    select: { id: true },
  });

  await processWebhookEvent(event.id);
};

// Transitions already applied on an earlier run are skipped, so the journey never replays
// into an invalid transition.
const applyJourney = async (leadId: string, status: LeadStatus, journey: Journey): Promise<void> => {
  const reached = journey.findIndex((step) => step.status === status);

  for (const step of journey.slice(reached + 1)) {
    await updateLeadStatus(leadId, step);
  }
};

const seed = async (): Promise<void> => {
  let ingested = 0;

  for (const [index, seedLead] of SEED_LEADS.entries()) {
    const metaLeadId = String(FIRST_LEADGEN_ID + index);

    if (!(await prismaClient.lead.findUnique({ where: { metaLeadId }, select: { id: true } }))) {
      await ingest(metaLeadId, seedLead);
      ingested += 1;
    }

    const lead = await prismaClient.lead.findUniqueOrThrow({
      where: { metaLeadId },
      select: { id: true, status: true },
    });

    await applyJourney(lead.id, lead.status, seedLead.journey);
  }

  const [leads, activities] = await prismaClient.$transaction([
    prismaClient.lead.count(),
    prismaClient.leadActivity.count(),
  ]);

  process.stdout.write(
    `Seed complete: ${ingested} of ${SEED_LEADS.length} seed leads ingested this run, ` +
      `${leads} leads and ${activities} activities in the database.\n`,
  );
};

try {
  await seed();
} finally {
  await disconnectDatabase();
}
