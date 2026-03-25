export type Storage = {
  copyright: string[],
  characters: string[],
  artists: string[],
  general: string[],
  meta: string[],
  savedSearches: SavedSearch[]
}

type SavedSearch = {
  url: string,
  tags: string[]
}

export type QuerySectionProps = {
  searches: SavedSearch[]
}


export type TagProps = {
  name: string
  disabled: boolean
  onRemove?: () => void
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  onDragEnd?: () => void
}

export type TagSectionProps = {
  category: string
  tags: string[]
  onRemove: (tag: string) => void
  onReorder: (from: number, to: number) => void
}
