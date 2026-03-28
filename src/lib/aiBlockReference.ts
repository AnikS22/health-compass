/**
 * AI-ready reference document for generating EthicsLab lesson JSONs.
 * Download this and feed it to any AI model so it knows the exact schema.
 */

const AI_REFERENCE = `# EthicsLab Lesson JSON Reference — For AI Models

Use this document to generate valid lesson JSON files that can be imported into EthicsLab's curriculum builder.

---

## JSON Structure

The top-level JSON can be a **single lesson** or a **batch import with units**.

### Single Lesson Import

\`\`\`json
{
  "title": "Lesson Title",
  "grade_band": "9-12",
  "difficulty": "beginner | intermediate | advanced",
  "estimated_minutes": 45,
  "version_label": "v1",
  "audience_type": "school | independent | both",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "blocks": [ /* array of block objects */ ]
}
\`\`\`

### Batch Import (with Units)

\`\`\`json
{
  "units": [
    {
      "title": "Unit 1 Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "grade_band": "6-8",
          "difficulty": "beginner",
          "estimated_minutes": 30,
          "version_label": "v1",
          "audience_type": "both",
          "learning_objectives": [],
          "blocks": [ /* block objects */ ]
        }
      ]
    }
  ]
}
\`\`\`

When importing, you choose which Course the units/lessons go into.

---

## Common Block Fields

Every block in the \`blocks\` array must have:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| block_type | string | ✅ | One of the 22 types below |
| sequence_no | number | ✅ | Order within the lesson (1-based) |
| title | string | Optional | Display title shown to students |
| body | string | Optional | Instructions / intro text. Supports markdown images: \`![alt](url)\` |
| config | object | ✅ | Type-specific configuration (see below) |
| hints | array | Optional | \`[{"level": 1, "text": "Hint text"}]\` for progressive hints |
| is_gate | boolean | Optional | If true, student must pass mastery rules to continue |
| mastery_rules | object | Optional | Pass/fail criteria |

### Image Support (all block types)

Any block can include images via:
- \`config.image_url\`: single image URL string
- \`config.images\`: array of image URL strings
- Markdown in \`body\`: \`![description](https://example.com/image.png)\`

---

## Block Types & Config Schemas

### 1. video
\`\`\`json
{ "youtube_url": "https://www.youtube.com/watch?v=..." }
\`\`\`

### 2. poll
Question goes in \`body\` field.
\`\`\`json
{ "options": ["Option A", "Option B", "Option C"] }
\`\`\`

### 3. mcq (Multiple Choice — single answer)
\`\`\`json
{
  "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
  "correct_answer": "Choice B"
}
\`\`\`

### 4. multi_select (Multiple correct answers)
\`\`\`json
{
  "options": ["Option 1", "Option 2", "Option 3"],
  "correct_answer": "Option 2"
}
\`\`\`

### 5. short_answer
\`\`\`json
{
  "prompt": "Your question here",
  "min_words": 10
}
\`\`\`

### 6. scenario
\`\`\`json
{
  "description": "Ethical scenario narrative...",
  "choices": [
    { "id": "a", "text": "Choice text", "outcome": "What happens if chosen" },
    { "id": "b", "text": "Choice text", "outcome": "What happens if chosen" }
  ],
  "debrief": "Reflection prompt shown after choosing"
}
\`\`\`

### 7. dilemma_tree
\`\`\`json
{
  "root_question": "The opening dilemma question",
  "tree": [
    { "id": "root", "text": "First decision", "next": ["a", "b"] },
    { "id": "a", "text": "Branch A outcome", "next": null },
    { "id": "b", "text": "Branch B leads to...", "next": ["c", "d"] },
    { "id": "c", "text": "Sub-branch C", "next": null },
    { "id": "d", "text": "Sub-branch D", "next": null }
  ]
}
\`\`\`

### 8. drag_drop
\`\`\`json
{
  "instructions": "Sort these items into the correct categories",
  "categories": ["Category 1", "Category 2"],
  "items": [
    { "id": "1", "text": "Item text", "correct_category": "Category 1" },
    { "id": "2", "text": "Item text", "correct_category": "Category 2" }
  ]
}
\`\`\`

### 9. matching
\`\`\`json
{
  "instructions": "Match each term with its definition",
  "pairs": [
    { "left": "Term 1", "right": "Definition 1" },
    { "left": "Term 2", "right": "Definition 2" }
  ]
}
\`\`\`

### 10. debate
\`\`\`json
{
  "topic": "Should AI be used in hiring decisions?",
  "sides": ["For", "Against"],
  "time_limit_seconds": 120
}
\`\`\`

### 11. group_board (Live only — small groups)
\`\`\`json
{
  "prompt": "Discuss and post your group's ideas",
  "max_posts": 3,
  "allow_reactions": true,
  "anonymous": false
}
\`\`\`

### 12. collaborative_board (Whole class)
\`\`\`json
{
  "prompt": "Share your thoughts with the class",
  "max_posts": 5,
  "allow_reactions": true,
  "anonymous": true
}
\`\`\`

### 13. drawing
\`\`\`json
{
  "prompt": "Draw your interpretation of...",
  "background_url": "https://example.com/template.png",
  "allow_text": true
}
\`\`\`

### 14. red_team
\`\`\`json
{
  "system_prompt": "Description of the AI system to test",
  "success_criteria": "What counts as finding a flaw",
  "max_attempts": 5
}
\`\`\`

### 15. exit_ticket
\`\`\`json
{
  "question": "What was your biggest takeaway?",
  "response_type": "text | rating | emoji",
  "include_confidence": true
}
\`\`\`

### 16. concept_reveal
\`\`\`json
{
  "key_idea": "The main concept to reveal",
  "detail": "Supporting explanation text",
  "visual_url": "https://example.com/illustration.png"
}
\`\`\`

### 17. micro_challenge
\`\`\`json
{
  "question": "Quick challenge question",
  "options": [
    { "id": "a", "text": "Option A" },
    { "id": "b", "text": "Option B" },
    { "id": "c", "text": "Option C" }
  ],
  "correct_option_id": "b",
  "explanation": "Why B is correct..."
}
\`\`\`
Supports up to 3 progressive hints via the block's \`hints\` array.

### 18. reasoning_response
\`\`\`json
{
  "prompt": "Explain your reasoning about...",
  "min_words": 25,
  "exemplar": "Model answer shown after submission"
}
\`\`\`

### 19. peer_compare
\`\`\`json
{
  "prompt": "What do you think about...?",
  "options": [
    { "id": "a", "text": "Agree" },
    { "id": "b", "text": "Disagree" },
    { "id": "c", "text": "It depends" }
  ],
  "show_distribution": true
}
\`\`\`

### 20. peer_review
\`\`\`json
{
  "prompt": "Write about X, then review a classmate's work",
  "review_criteria": ["Clarity", "Evidence", "Reasoning"],
  "max_rating": 5,
  "anonymous": true
}
\`\`\`

### 21. group_challenge (Live only — teams)
\`\`\`json
{
  "prompt": "Work together to solve...",
  "group_size": 4,
  "time_limit_seconds": 300,
  "submission_type": "text",
  "rubric_criteria": ["Creativity", "Accuracy", "Collaboration"]
}
\`\`\`
For choice-based: set \`"submission_type": "choice"\` and add \`"choices": [{"id":"a","text":"..."}]\`.

### 22. video_checkpoint
\`\`\`json
{
  "video_url": "https://cdn.example.com/video.mp4",
  "checkpoints": [
    {
      "id": "cp1",
      "timestamp_seconds": 120,
      "activity": {
        "type": "mcq | short_answer | fill_blank | poll",
        "prompt": "Question at this timestamp",
        "options": [{ "id": "a", "text": "Option" }],
        "correct_option_id": "a",
        "explanation": "Why this is correct",
        "hints": ["Hint 1"],
        "time_limit_seconds": 60,
        "max_attempts": 2,
        "required_to_continue": true
      }
    }
  ]
}
\`\`\`

---

## Complete Example Lesson

\`\`\`json
{
  "title": "Introduction to AI Ethics",
  "grade_band": "9-12",
  "difficulty": "beginner",
  "estimated_minutes": 40,
  "version_label": "v1",
  "audience_type": "both",
  "learning_objectives": [
    "Define artificial intelligence and its key capabilities",
    "Identify ethical concerns surrounding AI systems",
    "Evaluate real-world AI scenarios using ethical frameworks"
  ],
  "blocks": [
    {
      "block_type": "video",
      "sequence_no": 1,
      "title": "What is AI?",
      "body": "Watch this introduction to artificial intelligence.",
      "config": { "youtube_url": "https://www.youtube.com/watch?v=example" },
      "hints": [],
      "is_gate": false,
      "mastery_rules": {}
    },
    {
      "block_type": "concept_reveal",
      "sequence_no": 2,
      "title": "Key Definition",
      "body": null,
      "config": {
        "key_idea": "AI is software that can learn from data and make decisions or predictions.",
        "detail": "Unlike traditional programs with fixed rules, AI systems improve through experience."
      },
      "hints": [],
      "is_gate": false,
      "mastery_rules": {}
    },
    {
      "block_type": "poll",
      "sequence_no": 3,
      "title": "Quick Check",
      "body": "How much do you trust AI to make important decisions?",
      "config": { "options": ["Completely trust", "Mostly trust", "Neutral", "Mostly distrust", "Completely distrust"] },
      "hints": [],
      "is_gate": false,
      "mastery_rules": {}
    },
    {
      "block_type": "scenario",
      "sequence_no": 4,
      "title": "AI Hiring Scenario",
      "body": "Consider this real-world situation:",
      "config": {
        "description": "A company uses an AI system to screen job applicants. The AI was trained on data from the past 10 years of hiring decisions. The company notices the AI consistently ranks male applicants higher than female applicants for technical roles.",
        "choices": [
          { "id": "a", "text": "Keep using the AI but add a gender-blind filter", "outcome": "This addresses the symptom but the underlying bias in training data remains." },
          { "id": "b", "text": "Retrain the AI with balanced data", "outcome": "Better approach, but defining 'balanced' data raises its own ethical questions." },
          { "id": "c", "text": "Stop using AI for hiring entirely", "outcome": "Avoids AI bias but human hiring has its own well-documented biases." }
        ],
        "debrief": "There is no perfect answer here. The key insight is that AI systems can amplify existing human biases present in their training data."
      },
      "hints": [],
      "is_gate": false,
      "mastery_rules": {}
    },
    {
      "block_type": "mcq",
      "sequence_no": 5,
      "title": "Comprehension Check",
      "body": "Based on the scenario above:",
      "config": {
        "options": [
          "AI systems are always unbiased",
          "AI bias comes from biased training data",
          "Only humans can be biased",
          "AI bias cannot be fixed"
        ],
        "correct_answer": "AI bias comes from biased training data"
      },
      "hints": [{ "level": 1, "text": "Think about where the AI learned its patterns." }],
      "is_gate": true,
      "mastery_rules": { "min_score": 1 }
    },
    {
      "block_type": "exit_ticket",
      "sequence_no": 6,
      "title": "Reflection",
      "body": null,
      "config": {
        "question": "Name one way AI could be used ethically in schools.",
        "response_type": "text",
        "include_confidence": true
      },
      "hints": [],
      "is_gate": false,
      "mastery_rules": {}
    }
  ]
}
\`\`\`

---

## AI Prompt Template

Use this prompt with any AI model to generate lessons:

> Generate an EthicsLab lesson JSON about [TOPIC] for grades [GRADE_BAND].
> Include [NUMBER] blocks using a mix of: video, concept_reveal, poll, mcq, scenario, short_answer, reasoning_response, and exit_ticket block types.
> Follow the EthicsLab JSON schema exactly. Each block needs block_type, sequence_no, title, body, config, hints, is_gate, and mastery_rules fields.
> Make the lesson [DIFFICULTY] difficulty, estimated at [MINUTES] minutes.
> Set audience_type to "[AUDIENCE]".

---

## Tips for AI-Generated Lessons

1. **Always number sequence_no starting from 1** and increment by 1.
2. **Use descriptive titles** for each block — students see these.
3. **Include a variety of block types** — don't repeat the same type 5 times.
4. **Start with content** (video/concept_reveal) before assessment (mcq/short_answer).
5. **End with reflection** (exit_ticket or reasoning_response).
6. **Use hints** on assessment blocks to help struggling students.
7. **Set is_gate: true** on key comprehension checks so students must pass to continue.
8. **Keep scenarios realistic** and age-appropriate for the grade band.
9. **Use images** via config.image_url or config.images when visuals would help.
10. **The body field supports markdown** — use \`![alt](url)\` for inline images.

## Valid Grade Bands
K-2, 3-5, 6-8, 9-10, 11-12

## Valid Difficulty Levels
beginner, intermediate, advanced

## Valid Audience Types
school, independent, both
`;

export function downloadAIReference() {
  const blob = new Blob([AI_REFERENCE], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "EthicsLab_AI_Block_Reference.md";
  a.click();
  URL.revokeObjectURL(url);
}
