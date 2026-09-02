UPDATE submissions
SET submitter_email = NULL,
    reason = '';

UPDATE submissions
SET description = NULL
WHERE id IN (
  '087fb33d-d5b6-498a-83ad-d11cb8d64fc5',
  '1f33c276-e747-493a-893e-f08d35b94968'
);

PRAGMA optimize;
