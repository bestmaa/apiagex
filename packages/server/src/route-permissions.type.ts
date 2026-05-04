import type { FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';

import type { PermissionAction } from './permission-actions.type.js';

export interface RoutePermissionMetadata {
  action: PermissionAction;
  scope: string;
}

export type RoutePermissionOptions = RouteShorthandOptions & {
  config?: Record<string, unknown>;
};

export type RoutePermissionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void | never> | void;
