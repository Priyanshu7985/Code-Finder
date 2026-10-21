import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/languages/definitions/css/register'
import 'monaco-editor/languages/definitions/html/register'
import 'monaco-editor/languages/definitions/javascript/register'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

/**
 * Monaco code view, bundled locally (no CDN) and lazy-loaded by callers.
 * Only syntax highlighting is registered; language services are not
 * needed for read-only views. Phase 2 enables editing.
 */
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

loader.config({ monaco })

let themeDefined = false
function defineTheme(m) {
  if (themeDefined) return
  themeDefined = true
  m.editor.defineTheme('inspect-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4f6b5e', fontStyle: 'italic' },
      { token: 'tag', foreground: '62d6ee' },
      { token: 'attribute.name', foreground: 'a9b7b3' },
      { token: 'attribute.value', foreground: '5cf2a8' },
      { token: 'keyword', foreground: '62d6ee' },
      { token: 'string', foreground: '5cf2a8' },
      { token: 'number', foreground: 'f2c45c' },
      { token: 'attribute.value.number.css', foreground: 'f2c45c' },
      { token: 'attribute.value.unit.css', foreground: 'f2c45c' },
    ],
    colors: {
      'editor.background': '#0b0e0f',
      'editor.foreground': '#d7e0dd',
      'editorLineNumber.foreground': '#2f3a3b',
      'editorLineNumber.activeForeground': '#6d7c78',
      'editor.lineHighlightBackground': '#101415',
      'editor.selectionBackground': '#1d4a3655',
      'editorCursor.foreground': '#5cf2a8',
      'editorIndentGuide.background1': '#151a1b',
      'scrollbarSlider.background': '#26303266',
      'scrollbarSlider.hoverBackground': '#263032aa',
    },
  })
}

export default function CodeView({ value, language = 'css', readOnly = true, onChange, label }) {
  return (
    <div className="h-full min-h-0" aria-label={label}>
      <Editor
        value={value}
        language={language}
        theme="inspect-dark"
        beforeMount={defineTheme}
        onChange={onChange}
        loading={<p className="p-4 font-mono text-xs text-ink-mute">Loading editor...</p>}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 12.5,
          lineHeight: 20,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'line',
          padding: { top: 12, bottom: 12 },
          wordWrap: 'on',
          automaticLayout: true,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          tabSize: 2,
          contextmenu: false,
        }}
      />
    </div>
  )
}
