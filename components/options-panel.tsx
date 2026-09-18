"use client";

import { useId, useState, type ReactNode } from "react";
import { Segmented } from "@/components/segmented";
import { TabList, tabPanelProps } from "@/components/tabs";
import { isDefault, isVisible, type Option, type Schema } from "@/lib/schema";

type Props = {
  schema: Schema;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onResetAll: () => void;
};

const groupOrder = ["Content", "Behaviour", "Add-ons", "Style"] as const;

// Readable names for select values; anything not listed is shown as written (e.g. DD/MM/YYYY).
const choiceNames: Record<string, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  center: "Centre",
  centered: "Centred",
  left: "Left",
  bottom: "Bottom sheet",
  none: "None",
  fade: "Fade",
  scale: "Scale",
  title: "Title",
  primary: "Primary button",
  single: "One date",
  range: "Date range",
  monday: "Monday",
  sunday: "Sunday",
  contains: "Contains",
  startsWith: "Starts with",
  blur: "When leaving a field",
  submit: "On submit",
  one: "One column",
  two: "Two columns",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  compact: "Compact",
  regular: "Regular",
  spacious: "Spacious",
};
const choiceName = (value: string) => choiceNames[value] ?? value;

/** Editor controls generated from a component's options schema: one tab per group, plus search across all. */
export function OptionsPanel({ schema, config, onChange, onResetAll }: Props) {
  const idBase = useId();
  const groups = groupOrder.filter((group) => schema.some((option) => option.group === group));
  const [group, setGroup] = useState<string>(groups[0]);
  const [query, setQuery] = useState("");

  const search = query.trim().toLowerCase();
  const isChanged = (option: Option) => !isDefault(option, config[option.key]);
  const changedCount = schema.filter(isChanged).length;
  const shown = schema.filter(
    (option) =>
      isVisible(option, config) &&
      (search
        ? `${option.label} ${option.description ?? ""} ${option.group}`.toLowerCase().includes(search)
        : option.group === group),
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-rule bg-paper lg:max-h-[calc(100svh-2rem)]">
      <div className="border-b border-rule p-4">
        <h2 className="font-display text-2xl leading-none font-semibold uppercase">Configure</h2>
        <label htmlFor={`${idBase}-search`} className="sr-only">
          Find an option
        </label>
        <div className="relative mt-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id={`${idBase}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an option, e.g. clear"
            autoComplete="off"
            className="w-full rounded-md border border-rule-strong bg-paper py-2 pr-3 pl-9 text-sm placeholder:text-ink-muted"
          />
        </div>
        <p aria-live="polite" className="sr-only">
          {search ? `${shown.length} ${shown.length === 1 ? "option" : "options"} found` : ""}
        </p>
      </div>

      {!search && (
        <TabList
          label="Option groups"
          idBase={idBase}
          value={group}
          onChange={setGroup}
          tabs={groups.map((name) => {
            const changed = schema.filter((option) => option.group === name && isChanged(option)).length;
            return {
              id: name,
              label: (
                <>
                  {name}
                  {changed > 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="grid size-4.5 place-items-center rounded-full bg-pad text-[0.6875rem] font-bold text-board"
                      >
                        {changed}
                      </span>
                      <span className="sr-only">({changed} changed)</span>
                    </>
                  )}
                </>
              ),
            };
          })}
        />
      )}

      <div
        {...(search ? { role: "region", "aria-label": "Matching options", tabIndex: 0 } : tabPanelProps(idBase, group))}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {shown.length === 0 ? (
          <p className="p-6 text-sm text-pretty text-ink-muted">
            No option matches “{query.trim()}”. Try a word like colour, text or button.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {shown.map((option) => (
              <li key={option.key} className="p-4">
                <Control
                  idBase={idBase}
                  option={option}
                  value={config[option.key]}
                  changed={isChanged(option)}
                  showGroup={!!search}
                  onChange={(value) => onChange(option.key, value)}
                  onReset={() => onChange(option.key, option.default)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper-sunk px-4 py-3 text-sm">
        <span className="text-ink-muted">
          {changedCount === 0 ? "Everything at default" : `${changedCount} ${changedCount === 1 ? "option" : "options"} changed`}
        </span>
        <button
          type="button"
          onClick={onResetAll}
          disabled={changedCount === 0}
          className="cursor-pointer font-semibold text-board underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}

type ControlProps = {
  idBase: string;
  option: Option;
  value: unknown;
  changed: boolean;
  showGroup: boolean;
  onChange: (value: unknown) => void;
  onReset: () => void;
};

const smallButton =
  "grid size-7 cursor-pointer place-items-center rounded text-ink-muted hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

function Control({ idBase, option, value, changed, showGroup, onChange, onReset }: ControlProps) {
  const id = `${idBase}-${option.key}`;
  const descriptionId = option.description ? `${id}-description` : undefined;
  const inputClass = "mt-2 block w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm";

  const description = option.description && (
    <p id={descriptionId} className="mt-0.5 text-sm text-pretty text-ink-muted">
      {option.description}
    </p>
  );

  const status: ReactNode = (showGroup || changed) && (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {showGroup && <span className="rounded bg-paper-sunk px-1.5 py-0.5 font-mono text-ink-muted">{option.group}</span>}
      {changed && (
        <>
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-pad ring-2 ring-pad/30" />
            Changed
          </span>
          <button type="button" onClick={onReset} className="cursor-pointer font-semibold text-board hover:underline">
            Reset<span className="sr-only"> {option.label}</span>
          </button>
        </>
      )}
    </div>
  );

  if (option.type === "list") {
    const items = value as Record<string, string>[];
    const name = option.itemLabel;
    const move = (from: number, to: number) => {
      const next = [...items];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange(next);
    };

    return (
      <fieldset aria-describedby={descriptionId}>
        <legend className="font-medium">{option.label}</legend>
        {description}
        <ol className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="rounded-md border border-rule bg-paper-sunk p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="pl-1 font-mono text-xs text-ink-muted">
                  {name} {index + 1}
                </span>
                <span className="flex">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Move ${name.toLowerCase()} ${index + 1} up`}
                    className={smallButton}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                      <path d="m6 15 6-6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Move ${name.toLowerCase()} ${index + 1} down`}
                    className={smallButton}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    aria-label={`Remove ${name.toLowerCase()} ${index + 1}`}
                    className={smallButton}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </span>
              </div>
              {option.fields.map((field) => (
                <label key={field.key} className="mt-1.5 block text-xs text-ink-muted">
                  {field.label}
                  <span className="sr-only">
                    {" "}
                    for {name.toLowerCase()} {index + 1}
                  </span>
                  <input
                    type={field.format === "url" ? "url" : "text"}
                    value={item[field.key] ?? ""}
                    maxLength={field.maxLength}
                    onChange={(event) =>
                      onChange(items.map((it, i) => (i === index ? { ...it, [field.key]: event.target.value } : it)))
                    }
                    className="mt-0.5 block w-full rounded border border-rule-strong bg-paper px-2 py-1.5 text-sm text-ink"
                  />
                </label>
              ))}
            </li>
          ))}
        </ol>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={items.length >= option.maxItems}
            onClick={() => onChange([...items, Object.fromEntries(option.fields.map((field) => [field.key, ""]))])}
            className="cursor-pointer rounded-md border border-rule-strong bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-paper-sunk disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add {name.toLowerCase()}
          </button>
          <span className="font-mono text-xs text-ink-muted">
            {items.length} of {option.maxItems}
          </span>
        </div>
        {status}
      </fieldset>
    );
  }

  if (option.type === "boolean") {
    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span id={`${id}-label`} className="font-medium">
              {option.label}
            </span>
            {description}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value as boolean}
            aria-labelledby={`${id}-label`}
            aria-describedby={descriptionId}
            onClick={() => onChange(!value)}
            className="group relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full border border-rule-strong bg-paper-sunk transition-colors duration-300 aria-checked:border-board aria-checked:bg-board"
          >
            <span className="absolute top-0.5 left-0.5 size-[1.125rem] rounded-full bg-rule-strong transition-[translate,background-color] duration-300 ease-out-expo group-aria-checked:translate-x-5 group-aria-checked:bg-pad" />
          </button>
        </div>
        {status}
      </div>
    );
  }

  if (option.type === "select") {
    const longest = Math.max(...option.options.map((choice) => choiceName(choice).length));
    return (
      <div>
        <Segmented
          name={id}
          legend={option.label}
          description={option.description}
          value={value as string}
          columns={longest > 7 || option.options.length > 3 ? 2 : option.options.length}
          choices={option.options.map((choice) => ({ value: choice, label: choiceName(choice) }))}
          onChange={onChange}
        />
        {status}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="font-medium">
        {option.label}
      </label>
      {description}

      {option.type === "text" &&
        (option.maxLength > 120 ? (
          <textarea
            id={id}
            rows={3}
            maxLength={option.maxLength}
            value={value as string}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(event.target.value)}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            id={id}
            type={option.format === "url" ? "url" : "text"}
            maxLength={option.maxLength}
            value={value as string}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        ))}

      {option.type === "color" && (
        <div className="mt-2 flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={value as string}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-rule-strong bg-paper p-1"
          />
          <input
            key={value as string}
            type="text"
            defaultValue={value as string}
            aria-label={`${option.label}, hex value`}
            spellCheck={false}
            onBlur={(event) => {
              if (/^#[0-9a-f]{6}$/i.test(event.target.value)) onChange(event.target.value.toLowerCase());
              else event.target.value = value as string;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="w-28 rounded-md border border-rule-strong bg-paper px-3 py-2 font-mono text-sm uppercase"
          />
        </div>
      )}

      {option.type === "number" && (
        <div className="mt-2 flex items-center gap-3">
          <input
            id={id}
            type="range"
            min={option.min}
            max={option.max}
            step={option.step ?? 1}
            value={value as number}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-2 flex-1 cursor-pointer accent-board"
          />
          <output htmlFor={id} className="w-14 text-right font-mono text-sm">
            {String(value)}
          </output>
        </div>
      )}

      {option.type === "date" && (
        <div className="mt-2 flex items-center gap-2">
          <input
            id={id}
            type="date"
            value={value as string}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm"
          />
          {value !== "" && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="cursor-pointer rounded-md px-2 py-2 text-sm font-semibold text-board hover:underline"
            >
              Clear<span className="sr-only"> {option.label}</span>
            </button>
          )}
        </div>
      )}

      {status}
    </div>
  );
}
