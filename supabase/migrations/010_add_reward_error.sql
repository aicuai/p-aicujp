-- Add reward_error column to store failure reasons
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS reward_error TEXT;

COMMENT ON COLUMN survey_responses.reward_error IS 'Error message when reward_status = failed';
