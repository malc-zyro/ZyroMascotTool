/*
  # Schedule daily cleanup of old unstarred images

  1. Extensions
    - Enable `pg_cron` for scheduled jobs
    - Enable `pg_net` for HTTP calls from within Postgres

  2. Scheduled Job
    - Runs daily at 3:00 AM UTC
    - Calls the `cleanup-old-images` Edge Function via HTTP POST
    - Deletes unstarred images older than 7 days and their storage files
    - Removes orphaned generation records

  3. Important Notes
    - The cron job uses the service role key to authenticate
    - Starred images are never deleted
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'cleanup-old-images-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-old-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
