# EthicsLab Activity Block Reference

> Complete guide to every block type, its required configuration, and the curriculum hierarchy.

---

## Curriculum Hierarchy

```
Curriculum Package → Course → Unit → Lesson → Lesson Version → Blocks
```

### Curriculum Package
| Field | Required | Description |
|-------|----------|-------------|
| `package_key` | ✅ | Unique identifier slug (e.g. `ai-ethics-k5`) |
| `title` | ✅ | Display name |

### Course
| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Course name |
| `grade_band` | ✅ | Target grade range (e.g. `K-2`, `3-5`, `6-8`, `9-12`) |
| `curriculum_package_id` | Optional | Links to parent package |

### Unit
| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Unit name |
| `sequence_no` | ✅ | Order within the course |
| `course_id` | ✅ | Parent course |

### Lesson
| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Lesson name |
| `unit_id` | Optional | Parent unit |
| `difficulty` | Optional | e.g. `beginner`, `intermediate`, `advanced` |
| `grade_band` | Optional | Override grade band |
| `estimated_minutes` | Optional | Expected duration |
| `learning_objectives` | Optional | JSON array of objective strings |
| `sensitive_topic_flags` | Optional | JSON array of flags |
| `required_materials` | Optional | JSON array of materials |

### Lesson Version
| Field | Required | Description |
|-------|----------|-------------|
| `version_label` | ✅ | e.g. `v1.0`, `v2-draft` |
| `publish_status` | ✅ | `draft` / `published` / `archived` |
| `lesson_id` | ✅ | Parent lesson |

---

## Common Block Fields

Every activity block shares these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `block_type` | ✅ | One of the 21 types listed below |
| `sequence_no` | ✅ | Order within the lesson version |
| `title` | Optional | Display title |
| `body` | Optional | Instructions / introductory text |
| `config` | ✅ | JSON object — fields vary by type (see below) |
| `hints` | Optional | JSON array of `{level, text}` objects for progressive hints |
| `is_gate` | Optional | If `true`, student must pass mastery rules to continue |
| `mastery_rules` | Optional | JSON object defining pass/fail criteria |
| `remediation_config` | Optional | JSON object for repair/remediation paths |

---

## Activity Block Types (21 Total)

### 1. Video (`video`)
Embeds a YouTube video.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `youtube_url` | ✅ | string | Full YouTube URL |

---

### 2. Poll (`poll`)
Quick class poll with preset options.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `options` | ✅ | string[] | List of poll choices |

> **Note:** The poll question goes in the `body` field.

---

### 3. Multiple Choice (`mcq`)
Single-answer multiple choice question.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `options` | ✅ | string[] | Answer choices |
| `correct_answer` | ✅ | string | Must exactly match one option |

---

### 4. Multi-Select (`multi_select`)
Multiple correct answers can be selected.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `options` | ✅ | string[] | Answer choices |
| `correct_answer` | ✅ | string | Correct answer text |

---

### 5. Short Answer (`short_answer`)
Free-text response with optional word minimum.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | The question/prompt |
| `min_words` | Optional | number | Minimum word count |

---

### 6. Scenario (`scenario`)
Ethical scenario with branching choices and outcomes.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `description` | ✅ | string | Scenario narrative |
| `choices` | ✅ | JSON array | `[{id, text, outcome}]` — each choice and its consequence |
| `debrief` | Optional | string | Reflection prompt shown after |

---

### 7. Dilemma Tree (`dilemma_tree`)
Branching decision tree for ethical reasoning.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `root_question` | ✅ | string | The opening dilemma |
| `tree` | ✅ | JSON array | `[{id, text, next}]` — linked decision nodes (`next: null` = terminal) |

---

### 8. Drag & Drop (`drag_drop`)
Categorization activity.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `instructions` | ✅ | string | Task instructions |
| `categories` | ✅ | string[] | Category names |
| `items` | ✅ | JSON array | `[{id, text, correct_category}]` |

---

### 9. Matching (`matching`)
Match pairs of items.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `instructions` | Optional | string | Task instructions |
| `pairs` | ✅ | JSON array | `[{left, right}]` — matched pairs |

---

### 10. Debate (`debate`)
Structured debate with sides.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `topic` | ✅ | string | Debate motion/topic |
| `sides` | ✅ | string[] | e.g. `["For", "Against"]` |
| `time_limit_seconds` | Optional | number | Per-round time limit |

---

### 11. Group Board (`group_board`)
Collaborative board for small groups.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | Board prompt/question |
| `max_posts` | Optional | number | Max posts per student |
| `allow_reactions` | Optional | boolean | Enable voting/reactions |
| `anonymous` | Optional | boolean | Hide post authors |

---

### 12. Collaborative Board (`collaborative_board`)
Whole-class shared board (same config as Group Board).

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | Board prompt/question |
| `max_posts` | Optional | number | Max posts per student |
| `allow_reactions` | Optional | boolean | Enable voting/reactions |
| `anonymous` | Optional | boolean | Hide post authors |

---

### 13. Drawing (`drawing`)
Free-draw / illustration activity.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | Drawing instructions |
| `background_url` | Optional | string | Background image URL |
| `allow_text` | Optional | boolean | Allow text annotations |

---

### 14. Red Team (`red_team`)
Students try to find flaws in an AI system.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `system_prompt` | ✅ | string | Description of the AI system to test |
| `success_criteria` | ✅ | string | What counts as a successful red-team |
| `max_attempts` | Optional | number | Attempt limit |

---

### 15. Exit Ticket (`exit_ticket`)
End-of-lesson reflection/check.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `question` | ✅ | string | The exit ticket question |
| `response_type` | Optional | string | `text` (default), `rating` (1-5), or `emoji` |
| `include_confidence` | Optional | boolean | Ask for confidence level |

---

### 16. Concept Reveal (`concept_reveal`)
Progressive reveal of a key idea.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `key_idea` | ✅ | string | The main concept text |
| `detail` | Optional | string | Supporting explanation |
| `visual_url` | Optional | string | Illustration image URL |

---

### 17. Micro Challenge (`micro_challenge`)
Quick quiz with hint ladder and explanation.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `question` | ✅ | string | The challenge question |
| `options` | ✅ | JSON array | `[{id, text}]` — answer options |
| `correct_option_id` | ✅ | string | ID of the correct option |
| `explanation` | ✅ | string | Shown after answering |

> Supports up to 3 progressive hints via the block's `hints` array.

---

### 18. Reasoning Response (`reasoning_response`)
Extended written response with word gate.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | The writing prompt |
| `min_words` | Optional | number | Minimum word count (default: 10) |
| `exemplar` | Optional | string | Model answer shown after submission |

---

### 19. Peer Compare (`peer_compare`)
Anonymous class opinion comparison.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | The comparison question |
| `options` | Optional | JSON array | `[{id, text}]` — predefined choices |
| `show_distribution` | ✅ | boolean | Show class-wide response distribution |

---

### 20. Peer Review (`peer_review`)
Students review each other's work.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | What students write about and review |
| `review_criteria` | Optional | string[] | Criteria list (e.g. `["Clarity", "Evidence"]`) |
| `max_rating` | Optional | number | Rating scale max (default: 5) |
| `anonymous` | Optional | boolean | Anonymous reviews |

---

### 21. Group Challenge (`group_challenge`)
Team-based collaborative challenge.

| Config Field | Required | Type | Description |
|-------------|----------|------|-------------|
| `prompt` | ✅ | string | Challenge description |
| `group_size` | Optional | number | Students per group |
| `time_limit_seconds` | Optional | number | Time limit |
| `submission_type` | Optional | string | `text` (default) or `choice` |
| `choices` | Conditional | JSON array | `[{id, text}]` — only when `submission_type = "choice"` |
| `rubric_criteria` | Optional | string[] | Success criteria list |

---

## Quick Reference: All Block Types

| # | Type Key | Category | Live | Independent |
|---|----------|----------|------|-------------|
| 1 | `video` | Content | ✅ | ✅ |
| 2 | `poll` | Engagement | ✅ | ✅ |
| 3 | `mcq` | Assessment | ✅ | ✅ |
| 4 | `multi_select` | Assessment | ✅ | ✅ |
| 5 | `short_answer` | Assessment | ✅ | ✅ |
| 6 | `scenario` | Interactive | ✅ | ✅ |
| 7 | `dilemma_tree` | Interactive | ✅ | ✅ |
| 8 | `drag_drop` | Interactive | ✅ | ✅ |
| 9 | `matching` | Interactive | ✅ | ✅ |
| 10 | `debate` | Collaborative | ✅ | ✅ |
| 11 | `group_board` | Collaborative | ✅ | ❌ |
| 12 | `collaborative_board` | Collaborative | ✅ | ✅ |
| 13 | `drawing` | Creative | ✅ | ✅ |
| 14 | `red_team` | Advanced | ✅ | ✅ |
| 15 | `exit_ticket` | Reflection | ✅ | ✅ |
| 16 | `concept_reveal` | Content | ✅ | ✅ |
| 17 | `micro_challenge` | Assessment | ✅ | ✅ |
| 18 | `reasoning_response` | Assessment | ✅ | ✅ |
| 19 | `peer_compare` | Collaborative | ✅ | ✅ |
| 20 | `peer_review` | Collaborative | ✅ | ✅ |
| 21 | `group_challenge` | Collaborative | ✅ | ❌ |
| 22 | `video_checkpoint` | Interactive Video | ✅ | ✅ |

---

## 22. Video Checkpoint (`video_checkpoint`)

Interactive video with time-coded activity checkpoints. The video auto-pauses at defined timestamps and presents an inline activity (MCQ, short answer, fill-in-blank, or poll). Students must respond before the video resumes.

### Config (`config` JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `video_url` | string | ✅ | Direct video URL (mp4, webm). YouTube not supported for checkpoints. |
| `checkpoints` | array | ✅ | Ordered list of checkpoint objects |

### Checkpoint Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique checkpoint identifier |
| `timestamp_seconds` | number | ✅ | Video timestamp to pause at (in seconds) |
| `activity` | object | ✅ | The activity to present (see below) |

### Activity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | ✅ | `mcq`, `short_answer`, `fill_blank`, or `poll` |
| `prompt` | string | ✅ | Question or instruction text |
| `options` | array | For mcq/poll | `[{ id, text }]` choices |
| `correct_option_id` | string | For mcq | Auto-grading: ID of the correct option |
| `explanation` | string | Optional | Shown after submission |
| `hints` | string[] | Optional | Progressive hints on wrong attempts |
| `time_limit_seconds` | number | Optional | Countdown timer; auto-submits when expired |
| `max_attempts` | number | Optional | Max wrong attempts before forcing continue |
| `required_to_continue` | boolean | Optional | If true, must complete to resume video |

### Example Config

```json
{
  "video_url": "https://cdn.example.com/lesson-video.mp4",
  "checkpoints": [
    {
      "id": "cp1",
      "timestamp_seconds": 120,
      "activity": {
        "type": "mcq",
        "prompt": "What ethical principle was just described?",
        "options": [
          { "id": "a", "text": "Autonomy" },
          { "id": "b", "text": "Beneficence" },
          { "id": "c", "text": "Justice" }
        ],
        "correct_option_id": "b",
        "explanation": "Beneficence means acting in the best interest of others.",
        "hints": ["Think about doing good for others."],
        "max_attempts": 2,
        "required_to_continue": true
      }
    },
    {
      "id": "cp2",
      "timestamp_seconds": 240,
      "activity": {
        "type": "short_answer",
        "prompt": "In your own words, explain the concept of informed consent.",
        "time_limit_seconds": 120,
        "required_to_continue": true
      }
    }
  ]
}
```

### Data Captured

| Field | Description |
|-------|-------------|
| Per-checkpoint answer | Selected option or text response |
| Correctness | For MCQ: whether the answer matched `correct_option_id` |
| Attempts | Number of tries before correct/moving on |
| Timed out | Whether the countdown expired |
| Rewatch points | Timestamps where student replayed segments |
