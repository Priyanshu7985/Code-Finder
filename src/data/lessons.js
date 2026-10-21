/**
 * Training Lab curriculum. `example` names an interactive demo component
 * registered in components/training/examples.
 */
export const LESSONS = [
  {
    id: 'html-elements',
    code: 'T-01',
    title: 'HTML elements',
    summary: 'The building blocks every page is made of.',
    body: [
      'An HTML element is a tag, optional attributes, and its content. The browser reads the tags to understand structure: headings, paragraphs, buttons, sections.',
      'Attributes add information to an element. Some, like class and id, help styling and scripting. Others, like data-* attributes, store values the visitor never sees on screen.',
    ],
    takeaway: 'What a page shows and what its markup contains are not always the same thing.',
    example: 'anatomy',
  },
  {
    id: 'css-properties',
    code: 'T-02',
    title: 'CSS properties',
    summary: 'Rules that decide how, and whether, elements appear.',
    body: [
      'CSS matches elements with selectors and applies declarations such as color, display or opacity.',
      'Three properties matter most for hidden content: display: none removes the element from layout, visibility: hidden keeps its space but hides it, and opacity: 0 makes it transparent while it can still be interacted with.',
    ],
    takeaway: 'Hidden is a styling decision. The element is usually still in the document.',
    example: 'visibility',
  },
  {
    id: 'javascript',
    code: 'T-03',
    title: 'JavaScript',
    summary: 'Logic that runs in the visitor browser.',
    body: [
      'JavaScript reacts to events, changes the page, and sometimes performs checks. Anything it does in the browser can be read by the visitor.',
      'Step through the snippet to watch how a naive client-side password check works. Nothing here is executed; it is a deterministic walkthrough.',
    ],
    takeaway: 'Never trust secrets or security checks that live only in client-side code.',
    example: 'stepper',
  },
  {
    id: 'inspecting-dom',
    code: 'T-04',
    title: 'Inspecting the DOM',
    summary: 'The live tree the browser builds from HTML.',
    body: [
      'The browser turns HTML into the Document Object Model: a tree of nodes. Developer tools let you walk that tree, select elements, and read every attribute.',
      'Select nodes in the tree below. The same inspector component powers the mission workspace.',
    ],
    takeaway: 'Inspectors reveal comments, attributes and elements that never render.',
    example: 'dom',
  },
  {
    id: 'live-changes',
    code: 'T-05',
    title: 'How changes affect a page',
    summary: 'Edit the model, watch the page react.',
    body: [
      'When an element or a CSS rule changes, the browser recalculates styles and repaints. Changes in developer tools are local: they affect only your copy of the page.',
      'Toggle the controls to modify the simulated page model and see the result instantly.',
    ],
    takeaway: 'Local edits are powerful for investigation but never change the real server.',
    example: 'live',
  },
]

export const LESSON_IDS = LESSONS.map((l) => l.id)
