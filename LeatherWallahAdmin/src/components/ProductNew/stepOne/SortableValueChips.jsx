import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiX } from "react-icons/fi";
import { RxDragHandleHorizontal } from "react-icons/rx";

// A3 — drag-to-reorder chip strip for picked attribute values.
//
// Order in this strip == customer-facing display order:
//   - PDP variation picker (swatch/button list)
//   - Filter sidebar checkbox order
//   - Variation matrix row order (cartesian iterates in this order)
//
// react-select isMulti gives us picked values, but its built-in chip strip is
// not reorderable. So we render this strip below the Select instead. Click ✕
// to remove. Drag the chip (or the handle) to reorder.
const SortableValueChips = ({ values, onReorder, onRemove }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = values.findIndex((v) => v?._id === active.id);
    const newIndex = values.findIndex((v) => v?._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(values, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-2">
      <div className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
        <RxDragHandleHorizontal size={14} />
        <span>
          Customer-facing order — drag to reorder, ✕ to remove
        </span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={values.map((v) => v?._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
              <SortableChip
                key={v?._id}
                value={v}
                onRemove={() => onRemove(v?._id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const SortableChip = ({ value, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value?._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`inline-flex items-center gap-1.5 bg-white border rounded-full pl-2 pr-1 py-0.5 text-xs select-none ${
        isDragging
          ? "border-primaryColor shadow-md"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        title="Drag to reorder"
      >
        <RxDragHandleHorizontal size={14} />
      </span>
      {value?.attribute_value_code && (
        <span
          className="inline-block w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: value.attribute_value_code }}
        />
      )}
      <span className="font-medium text-gray-700">
        {value?.attribute_value_name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50"
        title="Remove"
      >
        <FiX size={12} />
      </button>
    </div>
  );
};

export default SortableValueChips;
