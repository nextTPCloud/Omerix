'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import {
  EditorState,
  EditorAction,
  EditorLayout,
  EditorBlock,
  BlockPosition,
  BlockType,
  BLOCK_DEFAULTS,
} from './types'

// Estado inicial
const createInitialState = (): EditorState => ({
  layout: {
    sections: [
      { id: 'header', name: 'Cabecera', blocks: [], height: 'auto' },
      { id: 'body', name: 'Cuerpo', blocks: [], height: 'auto' },
      { id: 'footer', name: 'Pie', blocks: [], height: 'auto' },
    ],
    globalStyles: {
      fontFamily: 'Helvetica, Arial, sans-serif',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      textColor: '#1e293b',
      backgroundColor: '#ffffff',
    },
  },
  selectedBlockId: null,
  zoom: 100,
  showGrid: true,
  snapToGrid: true,
  gridSize: 5,
  history: [],
  historyIndex: -1,
  isDirty: false,
})

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LAYOUT': {
      return {
        ...state,
        layout: action.payload,
        history: [action.payload],
        historyIndex: 0,
        isDirty: false,
      }
    }

    case 'SELECT_BLOCK': {
      return {
        ...state,
        selectedBlockId: action.payload,
      }
    }

    case 'ADD_BLOCK': {
      const { sectionId, block } = action.payload
      const newLayout = {
        ...state.layout,
        sections: state.layout.sections.map(section =>
          section.id === sectionId
            ? { ...section, blocks: [...section.blocks, block] }
            : section
        ),
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      return {
        ...state,
        layout: newLayout,
        selectedBlockId: block.id,
        history: [...newHistory, newLayout],
        historyIndex: newHistory.length,
        isDirty: true,
      }
    }

    case 'UPDATE_BLOCK': {
      const { blockId, updates } = action.payload
      const newLayout = {
        ...state.layout,
        sections: state.layout.sections.map(section => ({
          ...section,
          blocks: section.blocks.map(block =>
            block.id === blockId
              ? {
                  ...block,
                  ...updates,
                  position: { ...block.position, ...updates.position },
                  style: { ...block.style, ...updates.style },
                  config: { ...block.config, ...updates.config },
                }
              : block
          ),
        })),
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      return {
        ...state,
        layout: newLayout,
        history: [...newHistory, newLayout],
        historyIndex: newHistory.length,
        isDirty: true,
      }
    }

    case 'REMOVE_BLOCK': {
      const blockId = action.payload
      const newLayout = {
        ...state.layout,
        sections: state.layout.sections.map(section => ({
          ...section,
          blocks: section.blocks.filter(block => block.id !== blockId),
        })),
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      return {
        ...state,
        layout: newLayout,
        selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
        history: [...newHistory, newLayout],
        historyIndex: newHistory.length,
        isDirty: true,
      }
    }

    case 'MOVE_BLOCK': {
      const { blockId, position } = action.payload
      const newLayout = {
        ...state.layout,
        sections: state.layout.sections.map(section => ({
          ...section,
          blocks: section.blocks.map(block =>
            block.id === blockId
              ? { ...block, position: { ...block.position, ...position } }
              : block
          ),
        })),
      }
      return {
        ...state,
        layout: newLayout,
        isDirty: true,
      }
    }

    case 'REORDER_BLOCKS': {
      const { sectionId, blockIds } = action.payload
      const newLayout = {
        ...state.layout,
        sections: state.layout.sections.map(section => {
          if (section.id !== sectionId) return section
          const orderedBlocks = blockIds
            .map(id => section.blocks.find(b => b.id === id))
            .filter((b): b is EditorBlock => b !== undefined)
          return { ...section, blocks: orderedBlocks }
        }),
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      return {
        ...state,
        layout: newLayout,
        history: [...newHistory, newLayout],
        historyIndex: newHistory.length,
        isDirty: true,
      }
    }

    case 'SET_ZOOM': {
      return {
        ...state,
        zoom: Math.min(200, Math.max(25, action.payload)),
      }
    }

    case 'TOGGLE_GRID': {
      return {
        ...state,
        showGrid: action.payload ?? !state.showGrid,
      }
    }

    case 'TOGGLE_SNAP': {
      return {
        ...state,
        snapToGrid: action.payload ?? !state.snapToGrid,
      }
    }

    case 'SET_GRID_SIZE': {
      return {
        ...state,
        gridSize: action.payload,
      }
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        ...state,
        layout: state.history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        ...state,
        layout: state.history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      }
    }

    case 'UPDATE_GLOBAL_STYLES': {
      const newLayout = {
        ...state.layout,
        globalStyles: { ...state.layout.globalStyles, ...action.payload },
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      return {
        ...state,
        layout: newLayout,
        history: [...newHistory, newLayout],
        historyIndex: newHistory.length,
        isDirty: true,
      }
    }

    case 'MARK_SAVED': {
      return {
        ...state,
        isDirty: false,
      }
    }

    default:
      return state
  }
}

// Contexto
interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  // Helpers
  addBlock: (sectionId: string, type: BlockType) => void
  updateBlock: (blockId: string, updates: Partial<EditorBlock>) => void
  removeBlock: (blockId: string) => void
  selectBlock: (blockId: string | null) => void
  moveBlock: (blockId: string, position: Partial<BlockPosition>) => void
  getSelectedBlock: () => EditorBlock | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

// Provider
interface EditorProviderProps {
  children: React.ReactNode
  initialLayout?: EditorLayout
}

export function EditorProvider({ children, initialLayout }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, createInitialState())

  // Inicializar con layout si se proporciona
  React.useEffect(() => {
    if (initialLayout) {
      dispatch({ type: 'SET_LAYOUT', payload: initialLayout })
    }
  }, [initialLayout])

  // Helpers
  const addBlock = useCallback((sectionId: string, type: BlockType) => {
    const defaults = BLOCK_DEFAULTS[type]
    const block: EditorBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: defaults.position || { x: 0, y: 0, width: 100, height: 'auto' },
      style: defaults.style || {},
      config: defaults.config || {},
      visible: true,
      locked: false,
    }
    dispatch({ type: 'ADD_BLOCK', payload: { sectionId, block } })
  }, [])

  const updateBlock = useCallback((blockId: string, updates: Partial<EditorBlock>) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { blockId, updates } })
  }, [])

  const removeBlock = useCallback((blockId: string) => {
    dispatch({ type: 'REMOVE_BLOCK', payload: blockId })
  }, [])

  const selectBlock = useCallback((blockId: string | null) => {
    dispatch({ type: 'SELECT_BLOCK', payload: blockId })
  }, [])

  const moveBlock = useCallback((blockId: string, position: Partial<BlockPosition>) => {
    dispatch({ type: 'MOVE_BLOCK', payload: { blockId, position } })
  }, [])

  const getSelectedBlock = useCallback(() => {
    if (!state.selectedBlockId) return null
    for (const section of state.layout.sections) {
      const block = section.blocks.find(b => b.id === state.selectedBlockId)
      if (block) return block
    }
    return null
  }, [state.selectedBlockId, state.layout.sections])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      addBlock,
      updateBlock,
      removeBlock,
      selectBlock,
      moveBlock,
      getSelectedBlock,
      canUndo,
      canRedo,
      undo,
      redo,
    }),
    [state, addBlock, updateBlock, removeBlock, selectBlock, moveBlock, getSelectedBlock, canUndo, canRedo, undo, redo]
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

// Hook
export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor debe usarse dentro de un EditorProvider')
  }
  return context
}
