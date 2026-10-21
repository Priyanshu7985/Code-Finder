import { AnatomyExample } from './AnatomyExample'
import { VisibilityExample } from './VisibilityExample'
import { StepperExample } from './StepperExample'
import { DomExample } from './DomExample'
import { LiveExample } from './LiveExample'

/** Maps lesson `example` keys (data/lessons.js) to interactive demos. */
export const LESSON_EXAMPLES = {
  anatomy: AnatomyExample,
  visibility: VisibilityExample,
  stepper: StepperExample,
  dom: DomExample,
  live: LiveExample,
}
