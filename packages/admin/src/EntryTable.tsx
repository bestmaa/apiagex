import { useRef, type ChangeEvent, type MutableRefObject } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { StateMessage } from "./components/StateMessage";
import { entryPrimaryLabel, entrySummaryValue, formatEntryDate } from "./entry-display";
import type { EntryRecord } from "./entry.type";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

export function EntryTable(props: {
  confirmDeleteId: string;
  entries: EntryRecord[];
  limit: number;
  offset: number;
  onDelete: (entry: EntryRecord) => void;
  onEdit: (entry: EntryRecord) => void;
  onFieldToggle: (fields: string[]) => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (offset: number) => void;
  onSearchChange: (search: string) => void;
  relationEntries: Record<string, EntryRecord[]>;
  schema: SchemaRecord;
  search: string;
  setConfirmDeleteId: (entryId: string) => void;
  total: number;
  visibleFields: string[];
}) {
  const { entries, limit, offset, schema, total, visibleFields } = props;
  const deleteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const fields = schema.fields.filter((field) => visibleFields.includes(field.slug));
  const nextOffset = offset + limit;

  function cancelDelete(entryId: string) {
    props.setConfirmDeleteId("");
    requestAnimationFrame(() => deleteButtonRefs.current[entryId]?.focus());
  }

  return (
    <section className="entry-table-panel" aria-labelledby="entry-table-title">
      <EntryTableToolbar {...props} />
      <div className="entry-table-meta">
        <h3 id="entry-table-title">{schema.name} data</h3>
        <span>{total} total</span>
      </div>
      {entries.length === 0 ? (
        <StateMessage title="No entries found" variant="empty">Create an entry or change the current filters.</StateMessage>
      ) : (
        <div className="entry-table-scroll">
          <table className="entry-table">
            <thead>
              <tr>
                <th>Entry</th>
                {fields.map((field) => <th key={field.slug}>{field.name}</th>)}
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <EntryTableRow
                  deleteButtonRefs={deleteButtonRefs}
                  entry={entry}
                  fields={fields}
                  key={entry.id}
                  onCancelDelete={cancelDelete}
                  {...props}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="entry-pagination">
        <button disabled={offset === 0} type="button" onClick={() => props.onPageChange(Math.max(0, offset - limit))}>
          <ChevronLeft aria-hidden="true" size={16} />
          Previous
        </button>
        <span>Showing {total === 0 ? 0 : offset + 1}-{Math.min(nextOffset, total)} of {total}</span>
        <button disabled={nextOffset >= total} type="button" onClick={() => props.onPageChange(nextOffset)}>
          Next
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </section>
  );
}

function EntryTableToolbar(props: Parameters<typeof EntryTable>[0]) {
  function changeVisibleFields(event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    const slug = event.target.value;
    const nextFields = checked
      ? [...props.visibleFields, slug]
      : props.visibleFields.filter((field) => field !== slug);
    props.onFieldToggle(nextFields.length ? nextFields : [slug]);
  }

  return (
    <div className="entry-table-toolbar">
      <label className="entry-search-field">Find
        <span>
          <Search aria-hidden="true" size={16} />
          <input value={props.search} placeholder="Search entries" onChange={(event) => props.onSearchChange(event.target.value)} />
        </span>
      </label>
      <label>Rows
        <select value={props.limit} onChange={(event) => props.onLimitChange(Number(event.target.value))}>
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>Last {size}</option>)}
        </select>
      </label>
      <fieldset className="entry-field-filter">
        <legend>Visible fields</legend>
        {props.schema.fields.map((field) => (
          <label key={field.slug}>
            <input checked={props.visibleFields.includes(field.slug)} type="checkbox" value={field.slug} onChange={changeVisibleFields} />
            {field.name}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function EntryTableRow(props: Parameters<typeof EntryTable>[0] & {
  deleteButtonRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  entry: EntryRecord;
  fields: SchemaFieldDraft[];
  onCancelDelete: (entryId: string) => void;
}) {
  const { entry, fields, schema } = props;
  return (
    <tr>
      <th scope="row">
        <strong>{entryPrimaryLabel(entry, schema.fields)}</strong>
        <code>{entry.id.slice(0, 8)}</code>
      </th>
      {fields.map((field) => (
        <td key={field.slug}>{entrySummaryValue(field, entry.data[field.slug], props.relationEntries[field.slug] ?? [])}</td>
      ))}
      <td>{formatEntryDate(entry.updatedAt)}</td>
      <td>
        <div className="entry-table-actions">
          <button type="button" onClick={() => props.onEdit(entry)}>
            <Pencil aria-hidden="true" size={16} />
            Edit
          </button>
          <button ref={(element) => { props.deleteButtonRefs.current[entry.id] = element; }} type="button" onClick={() => props.setConfirmDeleteId(entry.id)}>
            <Trash2 aria-hidden="true" size={16} />
            Delete
          </button>
        </div>
        {props.confirmDeleteId === entry.id ? (
          <ConfirmDialog
            confirmIcon={<Trash2 aria-hidden="true" size={16} />}
            confirmLabel="Confirm delete"
            onCancel={() => props.onCancelDelete(entry.id)}
            onConfirm={() => { props.setConfirmDeleteId(""); void props.onDelete(entry); }}
            title="Delete this entry?"
          >
            This cannot be undone. Confirm only when this entry should be permanently removed.
          </ConfirmDialog>
        ) : null}
      </td>
    </tr>
  );
}
