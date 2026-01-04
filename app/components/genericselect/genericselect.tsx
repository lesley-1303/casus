import React from "react";

interface GenericSelectProps<T extends { id: string }> {
  title: string;
  items: T[];
  selectedItem: T;
  onChange: (item: T) => void;
  Label: (item: T) => string;
  emptyItem: T;
}

function GenericSelect<T extends { id: string }>({
  title,
  items,
  selectedItem,
  onChange,
  Label,
  emptyItem,
}: GenericSelectProps<T>) {
  return (
    <div>
      <h3>{title}</h3>
      <select
        value={selectedItem?.id || ""}
        onChange={(e) => {
          const item = items.find((i) => i.id === e.target.value) || emptyItem;
          onChange(item);
        }}
      >
        <option value="">-- Select --</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {Label(item)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default GenericSelect;