export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "media"
  | "relation";

export type RelationType =
  | "oneToOne"
  | "oneToMany"
  | "manyToOne"
  | "manyToMany";

export type SingleRelationValue = string | null;

export type MultiRelationValue = string[];

export type RelationValue = SingleRelationValue | MultiRelationValue;

export type RelationFieldContract = {
  relationSchemaId: string;
  relationType: RelationType;
  required: boolean;
  valueShape: "single" | "multi";
};

export type CreateFieldInput = {
  name: string;
  slug: string;
  type: FieldType;
  required?: boolean;
  relationSchemaId?: string;
  relationType?: RelationType;
};

export type CreateSchemaInput = {
  name: string;
  slug: string;
  description?: string;
  fields: CreateFieldInput[];
};

export type UpdateSchemaInput = CreateSchemaInput;

export type FieldRecord = {
  id: string;
  schemaId: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  relationSchemaId?: string | null;
  relationType?: RelationType | null;
  position: number;
};

export type SchemaRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  fields: FieldRecord[];
};
