import { useEffect, useState } from "react";
import { deleteEntry, listEntries, listSchemas } from "./api";
import { EntryCollectionRail } from "./EntryCollectionRail";
import { GeneratedEntryForm } from "./EntryForm";
import { EntryTable } from "./EntryTable";
import { isEntryPickerRelationField } from "./entry-display";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { EntryListQuery, EntryRecord } from "./entry.type";
import type { SchemaRecord } from "./schema.type";

const DEFAULT_LIMIT = 50;

export function EntryManager() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [schemaId, setSchemaId] = useState("");
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [relationEntries, setRelationEntries] = useState<Record<string, EntryRecord[]>>({});
  const [editingEntry, setEditingEntry] = useState<EntryRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("Entry manager loading");
  const schema = schemas.find((item) => item.id === schemaId);

  useEffect(() => {
    void loadSchemas();
  }, []);

  useEffect(() => {
    if (!schema) {
      setRelationEntries({});
      return;
    }
    void loadRelationEntries(schema);
  }, [schema]);

  async function loadSchemas() {
    const result = await listSchemas();
    const nextSchemas = result.schemas ?? [];
    setSchemas(nextSchemas);
    const firstSchema = nextSchemas[0];
    setSchemaId(firstSchema?.id ?? "");
    setStatus(firstSchema ? "Select a collection or create entries" : "Create a schema first");
    await loadEntryCounts(nextSchemas);
    if (firstSchema) {
      const fields = fieldSlugs(firstSchema);
      setVisibleFields(fields);
      await loadEntries(firstSchema.id, { fields, limit: DEFAULT_LIMIT, offset: 0 });
    }
  }

  async function loadEntryCounts(nextSchemas = schemas) {
    const counts: Record<string, number> = {};
    for (const item of nextSchemas) {
      const result = await listEntries(item.id, { fields: fieldSlugs(item), limit: 1, offset: 0 });
      counts[item.id] = result.total ?? result.entries?.length ?? 0;
    }
    setEntryCounts(counts);
  }

  async function loadRelationEntries(nextSchema: SchemaRecord) {
    const nextEntries: Record<string, EntryRecord[]> = {};
    for (const field of nextSchema.fields.filter(isEntryPickerRelationField)) {
      if (!field.relationSchemaId) continue;
      const result = await listEntries(field.relationSchemaId, { limit: 100, offset: 0 });
      nextEntries[field.slug] = result.entries ?? [];
    }
    setRelationEntries(nextEntries);
  }

  async function loadEntries(nextSchemaId = schemaId, query: EntryListQuery = {}) {
    if (!nextSchemaId) return;
    const result = await listEntries(nextSchemaId, {
      fields: query.fields ?? visibleFields,
      limit: query.limit ?? limit,
      offset: query.offset ?? offset,
      search: query.search ?? search,
    });
    setEntries(result.entries ?? []);
    setTotal(result.total ?? result.entries?.length ?? 0);
    setStatus(result.ok ? "Entries ready" : result.error ?? "Entries failed");
  }

  async function changeSchema(nextSchemaId: string) {
    const nextSchema = schemas.find((item) => item.id === nextSchemaId);
    const fields = nextSchema ? fieldSlugs(nextSchema) : [];
    setSchemaId(nextSchemaId);
    setEditingEntry(null);
    setSearch("");
    setOffset(0);
    setVisibleFields(fields);
    await loadEntries(nextSchemaId, { fields, limit, offset: 0, search: "" });
  }

  async function removeEntry(entry: EntryRecord) {
    const result = await deleteEntry(entry.schemaId, entry.id);
    if (!result.ok) {
      setStatus(result.error ?? "Entry delete failed");
      return;
    }
    setEditingEntry(null);
    setStatus(`Deleted entry: ${entry.id.slice(0, 8)}`);
    await loadEntries(entry.schemaId);
    await loadEntryCounts();
  }

  async function refreshAfterSave() {
    if (!schema) return;
    setOffset(0);
    await loadEntries(schema.id, { offset: 0 });
    await loadEntryCounts();
  }

  function changeSearch(nextSearch: string) {
    setSearch(nextSearch);
    setOffset(0);
    void loadEntries(schemaId, { search: nextSearch, offset: 0 });
  }

  function changeLimit(nextLimit: number) {
    setLimit(nextLimit);
    setOffset(0);
    void loadEntries(schemaId, { limit: nextLimit, offset: 0 });
  }

  function changeFields(nextFields: string[]) {
    setVisibleFields(nextFields);
    setOffset(0);
    void loadEntries(schemaId, { fields: nextFields, offset: 0 });
  }

  function changePage(nextOffset: number) {
    setOffset(nextOffset);
    void loadEntries(schemaId, { offset: nextOffset });
  }

  return (
    <section className="entry-manager" aria-labelledby="entry-manager-title">
      <div className="entry-page-heading">
        <h2 id="entry-manager-title">Entries</h2>
        <p>Collection select karo, data table me dekho, find/filter lagao, aur fields choose karo.</p>
      </div>
      <div className="entry-workspace">
        <div className="entry-main-column">
          {schema ? (
            <>
              <GeneratedEntryForm
                editingEntry={editingEntry}
                key={`${schema.id}-${editingEntry?.id ?? "new"}`}
                onCancelEdit={() => setEditingEntry(null)}
                onCreated={refreshAfterSave}
                relationEntries={relationEntries}
                schema={schema}
              />
              <EntryTable
                confirmDeleteId={confirmDeleteId}
                entries={entries}
                limit={limit}
                offset={offset}
                onDelete={removeEntry}
                onEdit={setEditingEntry}
                onFieldToggle={changeFields}
                onLimitChange={changeLimit}
                onPageChange={changePage}
                onSearchChange={changeSearch}
                relationEntries={relationEntries}
                schema={schema}
                search={search}
                setConfirmDeleteId={setConfirmDeleteId}
                total={total}
                visibleFields={visibleFields}
              />
            </>
          ) : (
            <StateMessage title="No schema available" variant="empty">Create a schema first.</StateMessage>
          )}
        </div>
        <EntryCollectionRail
          entryCounts={entryCounts}
          onSelect={(nextSchemaId) => void changeSchema(nextSchemaId)}
          schemaId={schemaId}
          schemas={schemas}
        />
      </div>
      <StatusToast title="Entry status">{status}</StatusToast>
    </section>
  );
}

function fieldSlugs(schema: SchemaRecord): string[] {
  return schema.fields.map((field) => field.slug);
}
