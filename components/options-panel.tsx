"use client";

import { isVisible, type Option, type Schema } from "@/lib/schema";

type Props = {
  schema: Schema;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

/** Editor controls generated from a component's options schema. */
export function OptionsPanel({ schema, config, onChange }: Props) {
  const groups = [...new Set(schema.map((option) => option.group))];
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <fieldset key={group} className="space-y-3">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-neutral-600 uppercase">{group}</legend>
          {schema
            .filter((option) => option.group === group && isVisible(option, config))
            .map((option) => (
              <Control
                key={option.key}
                option={option}
                value={config[option.key]}
                onChange={(value) => onChange(option.key, value)}
              />
            ))}
        </fieldset>
      ))}
    </div>
  );
}

const inputClass = "mt-1 block w-full rounded-md border border-neutral-500 bg-white px-2 py-1.5 text-sm";

function Control({ option, value, onChange }: { option: Option; value: unknown; onChange: (value: unknown) => void }) {
  const id = `option-${option.key}`;

  if (option.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value as boolean} onChange={(e) => onChange(e.target.checked)} className="size-4" />
        {option.label}
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {option.label}
      </label>
      {option.type === "select" && (
        <select id={id} value={value as string} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {option.options.map((choice) => (
            <option key={choice}>{choice}</option>
          ))}
        </select>
      )}
      {option.type === "text" && (
        <input
          id={id}
          type="text"
          maxLength={option.maxLength}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {option.type === "color" && (
        <input
          id={id}
          type="color"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block h-9 w-16 cursor-pointer rounded-md border border-neutral-500"
        />
      )}
      {option.type === "date" && (
        <input
          id={id}
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {option.type === "number" && (
        <input
          id={id}
          type="number"
          min={option.min}
          max={option.max}
          step={option.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(Math.min(option.max, Math.max(option.min, Number(e.target.value))))}
          className={inputClass}
        />
      )}
    </div>
  );
}
