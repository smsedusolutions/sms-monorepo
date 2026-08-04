import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Box } from "@mui/material";

export interface AppReorderableItem {
  id: string;
  [key: string]: any;
}

export interface AppReorderableListProps<T extends AppReorderableItem> {
  /** Array of items to display and reorder */
  items: T[];
  /** Callback fired when an item is dropped into a new position */
  onReorder: (newItems: T[]) => void;
  /** Render function for each item */
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  /** Optional max height for scrollable container */
  maxHeight?: number | string;
  /** Droppable container ID (defaults to 'reorderable-list') */
  droppableId?: string;
}

/**
 * Reusable Drag-and-Drop List component built with @hello-pangea/dnd.
 * Supports smooth dragging, custom rendering, handle grips, and container scrolling.
 */
export function AppReorderableList<T extends AppReorderableItem>({
  items,
  onReorder,
  renderItem,
  maxHeight = 250,
  droppableId = "reorderable-list",
}: AppReorderableListProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside the list or in the same position
    if (!destination || destination.index === source.index) {
      return;
    }

    const reordered = Array.from(items);
    const [movedItem] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedItem);

    onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              maxHeight,
              overflowY: "auto",
              px: 0.5,
              py: 0.5,
            }}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      mb: 0.75,
                      borderRadius: 1.5,
                      transition: "box-shadow 0.15s ease",
                      ...(snapshot.isDragging && {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                        zIndex: 9999,
                      }),
                    }}
                  >
                    {renderItem(item, index, snapshot.isDragging)}
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default AppReorderableList;
