-- Add list_order column to todo_lists table
ALTER TABLE todo_lists ADD COLUMN list_order INTEGER DEFAULT 0;

-- Update existing records with incremental order based on created_at
WITH ordered_lists AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS new_order
  FROM todo_lists
)
UPDATE todo_lists
SET list_order = ordered_lists.new_order
FROM ordered_lists
WHERE todo_lists.id = ordered_lists.id;
