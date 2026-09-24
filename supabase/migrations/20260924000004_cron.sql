-- 0004_cron: daily show refresh and ai_usage pruning (docs/build-plan.md §7.5)

-- Store in Vault first: project_url, cron_secret (a random string also set as the function secret CRON_SECRET)
select cron.schedule('refresh-shows-daily', '30 20 * * *',   -- 02:00 Asia/Colombo
$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/refresh-shows',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb);
$$);

select cron.schedule('prune-ai-usage', '0 21 * * *',
  $$ delete from public.ai_usage where created_at < now() - interval '30 days' $$);
