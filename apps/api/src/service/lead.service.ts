import type { Prisma } from '@prisma/client';
import { prismaClient } from '../config/db.js';
import { allowedNextStatuses, canTransition } from '../helper/leadStatus.js';
import type { LeadListQuery, UpdateLeadStatusBody } from '../schema/lead.schema.js';
import ApiError from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const DASHBOARD_ACTOR = 'dashboard';

// The list never needs the stored Meta payload, and it is the largest column on the row.
const leadListSelect = {
  id: true,
  metaLeadId: true,
  pageId: true,
  formId: true,
  adId: true,
  campaignId: true,
  platform: true,
  fullName: true,
  email: true,
  phone: true,
  answers: true,
  isTest: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LeadSelect;

const buildWhere = (query: LeadListQuery): Prisma.LeadWhereInput => ({
  ...(query.status === undefined ? {} : { status: query.status }),
  ...(query.includeTest ? {} : { isTest: false }),
  ...(query.q === undefined
    ? {}
    : {
        OR: [
          { fullName: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
});

export const listLeads = async (query: LeadListQuery) => {
  const where = buildWhere(query);

  // Both reads share a transaction so the page and its total describe the same snapshot.
  const [total, leads] = await prismaClient.$transaction([
    prismaClient.lead.count({ where }),
    prismaClient.lead.findMany({
      where,
      select: leadListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    leads,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getLead = async (id: string) => {
  const found = await prismaClient.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  });

  if (!found) {
    throw new ApiError(404, 'Lead not found');
  }

  const { activities, ...lead } = found;

  return { lead, activities, allowedNextStatuses: allowedNextStatuses(lead.status) };
};

export const updateLeadStatus = async (id: string, { status, note }: UpdateLeadStatusBody) => {
  const current = await prismaClient.lead.findUnique({ where: { id } });

  if (!current) {
    throw new ApiError(404, 'Lead not found');
  }

  if (current.status === status) {
    return { lead: current, allowedNextStatuses: allowedNextStatuses(status) };
  }

  if (!canTransition(current.status, status)) {
    throw new ApiError(409, `Cannot change status from ${current.status} to ${status}`, [], {
      allowedNextStatuses: allowedNextStatuses(current.status),
    });
  }

  const lead = await prismaClient.$transaction(async (tx) => {
    // Conditional on the status we validated against, so a racing change loses rather than
    // silently overwriting a transition it never saw.
    const claim = await tx.lead.updateMany({
      where: { id, status: current.status },
      data: { status },
    });

    if (claim.count === 0) {
      throw new ApiError(409, 'Lead status was changed by another request');
    }

    await tx.leadActivity.create({
      data: {
        leadId: id,
        type: 'STATUS_CHANGED',
        actor: DASHBOARD_ACTOR,
        fromStatus: current.status,
        toStatus: status,
        ...(note === undefined ? {} : { changes: { note } }),
      },
    });

    return tx.lead.findUniqueOrThrow({ where: { id } });
  });

  logger.info({ leadId: id, fromStatus: current.status, toStatus: status }, 'Lead status changed');

  return { lead, allowedNextStatuses: allowedNextStatuses(status) };
};
