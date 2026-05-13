import type { CreateSchemaInput, FieldRecord, SchemaRecord, UpdateSchemaInput } from "apiagex-database";

export type SchemaParams = {
  id: string;
};

export type SchemaCreateBody = CreateSchemaInput;

export type SchemaUpdateBody = UpdateSchemaInput;

export type SchemaErrorBody = {
  ok: false;
  error: string;
};

export type RelationTargetSummary = {
  id: string;
  name: string;
  slug: string;
};

export type SchemaFieldResponse = FieldRecord & {
  relationTarget?: RelationTargetSummary;
};

export type SchemaResponseRecord = Omit<SchemaRecord, "fields"> & {
  fields: SchemaFieldResponse[];
};
