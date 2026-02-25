
-- Seed: "What is Bias in AI?" lesson with 8 interactive steps
-- Uses existing unit
DO $$
DECLARE
  v_lesson_id uuid := gen_random_uuid();
  v_version_id uuid := gen_random_uuid();
  v_unit_id uuid := '284e7be1-74d1-40c8-be67-f05be9d32d17';
BEGIN
  -- Create lesson
  INSERT INTO lessons (id, unit_id, title, grade_band, difficulty, estimated_minutes, learning_objectives)
  VALUES (v_lesson_id, v_unit_id, 'What is Bias in AI?', '9-12', 'introductory', 15,
    '["Define algorithmic bias", "Identify real-world examples of AI bias", "Evaluate the ethical implications of biased systems"]'::jsonb);

  -- Create published version
  INSERT INTO lesson_versions (id, lesson_id, version_label, publish_status, published_at)
  VALUES (v_version_id, v_lesson_id, 'v1.0', 'published', NOW());

  -- Step 1: Concept Reveal
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, body, config, hints, is_gate)
  VALUES (v_version_id, 1, 'concept_reveal', 'The Hidden Decision-Makers',
    'Every day, algorithms make decisions that affect your life — from what videos you see to who gets approved for a loan.',
    '{"key_idea": "Algorithmic bias occurs when an AI system produces unfair outcomes that favor or disadvantage certain groups.", "detail": "This can happen because of biased training data, flawed assumptions in the model design, or feedback loops that amplify existing inequalities."}'::jsonb,
    '[]'::jsonb, false);

  -- Step 2: Micro Challenge
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, config, hints, is_gate)
  VALUES (v_version_id, 2, 'micro_challenge', 'Quick Check: Spot the Bias',
    '{"question": "A hiring algorithm trained on 10 years of company data consistently ranks male candidates higher. What is the most likely root cause?", "options": [{"id": "a", "text": "The algorithm is sexist by design"}, {"id": "b", "text": "Historical hiring data reflected existing gender imbalance"}, {"id": "c", "text": "Male candidates are genuinely more qualified"}, {"id": "d", "text": "The algorithm needs more processing power"}], "correct_option_id": "b", "explanation": "The algorithm learned patterns from historical data where men were hired more often — reflecting past bias, not present merit."}'::jsonb,
    '[{"level": 1, "text": "Think about where the algorithm gets its ''knowledge'' from."}, {"level": 2, "text": "If past decisions were biased, what would the training data look like?"}]'::jsonb, true);

  -- Step 3: Reasoning Response
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, config, hints, is_gate)
  VALUES (v_version_id, 3, 'reasoning_response', 'Your Turn: Real-World Impact',
    '{"prompt": "Describe one real-world scenario where algorithmic bias could cause harm. Explain who is affected and why it matters.", "min_words": 20, "exemplar": "A facial recognition system trained mostly on lighter-skinned faces could misidentify people with darker skin tones, leading to wrongful accusations by law enforcement. This disproportionately affects communities of color and erodes trust in both technology and justice systems."}'::jsonb,
    '[]'::jsonb, false);

  -- Step 4: Concept Reveal
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, body, config, hints, is_gate)
  VALUES (v_version_id, 4, 'concept_reveal', 'Three Sources of Bias', NULL,
    '{"key_idea": "Bias can enter AI systems through three main channels: data, design, and deployment.", "detail": "Data bias: training sets that don''t represent everyone equally. Design bias: choosing what to optimize for (e.g., profit over fairness). Deployment bias: using a model in contexts it wasn''t built for."}'::jsonb,
    '[]'::jsonb, false);

  -- Step 5: Micro Challenge
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, config, hints, is_gate)
  VALUES (v_version_id, 5, 'micro_challenge', 'Which Source of Bias?',
    '{"question": "A hospital uses an AI tool designed for urban patients to make decisions for rural patients with different health profiles. This is an example of:", "options": [{"id": "a", "text": "Data bias"}, {"id": "b", "text": "Design bias"}, {"id": "c", "text": "Deployment bias"}, {"id": "d", "text": "Confirmation bias"}], "correct_option_id": "c", "explanation": "This is deployment bias — the model is being used in a context (rural healthcare) that it wasn''t designed or validated for."}'::jsonb,
    '[{"level": 1, "text": "Consider whether the problem is with the data, the model''s goals, or where it''s being used."}]'::jsonb, true);

  -- Step 6: Peer Compare
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, config, hints, is_gate)
  VALUES (v_version_id, 6, 'peer_compare', 'Class Poll: Who Should Fix It?',
    '{"prompt": "Who bears the most responsibility for preventing AI bias?", "options": [{"id": "a", "text": "The engineers who build AI systems"}, {"id": "b", "text": "The companies that deploy them"}, {"id": "c", "text": "Government regulators"}, {"id": "d", "text": "All of the above equally"}], "show_distribution": true}'::jsonb,
    '[]'::jsonb, false);

  -- Step 7: Reasoning Response
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, config, hints, is_gate)
  VALUES (v_version_id, 7, 'reasoning_response', 'Defend Your Position',
    '{"prompt": "Based on the class poll, defend your choice or argue against the most popular answer. Use at least one specific example.", "min_words": 30, "exemplar": "While engineers build the systems, companies ultimately decide how they''re used. For example, Amazon scrapped an AI hiring tool when they discovered it was biased against women — showing that corporate accountability is crucial. However, without government regulation, companies may not always self-correct."}'::jsonb,
    '[]'::jsonb, false);

  -- Step 8: Concept Reveal (wrap-up)
  INSERT INTO lesson_blocks (lesson_version_id, sequence_no, block_type, title, body, config, hints, is_gate)
  VALUES (v_version_id, 8, 'concept_reveal', 'Key Takeaway',
    'Bias in AI isn''t just a technical problem — it''s a human one. The decisions we make about data, design, and deployment shape the fairness of the systems we build.',
    '{"key_idea": "Addressing AI bias requires diverse teams, representative data, ongoing auditing, and strong ethical frameworks.", "detail": "No single fix eliminates bias. It takes continuous effort from engineers, companies, policymakers, and communities working together."}'::jsonb,
    '[]'::jsonb, false);
END $$;
