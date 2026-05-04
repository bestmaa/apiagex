import type { CreateSchemaInput, UpdateSchemaInput } from "@apiagex/database";

export type SchemaParams = {
  id: string;
};

export type SchemaCreateBody = CreateSchemaInput;

export type SchemaUpdateBody = UpdateSchemaInput;

export type SchemaErrorBody = {
  ok: false;
  error: string;
};
