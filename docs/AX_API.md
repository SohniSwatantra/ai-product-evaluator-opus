# Public AX API & CI Gating (Tier 3)

The public API lets you score a site's Agent Experience (AX) from CI and fail a
build when the **measured** AX score drops below a threshold — like Lighthouse-CI,
but for agent-readiness.

## 1. Create an API key

Sign in, then:

```bash
curl -X POST https://YOUR_APP/api/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"ci"}'
# => { "key": "axk_xxxxxxxx...", "record": { ... } }
```

The plaintext key is shown **once** — store it as a secret. Only its SHA-256 hash
is kept server-side.

## 2. Start an evaluation

```bash
curl -X POST https://YOUR_APP/api/public/evaluate \
  -H "Authorization: Bearer $AX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
# => { "jobId": "uuid", "status": "pending", "poll": "/api/public/evaluations/uuid" }
```

Each run costs 10 credits (same as the UI). `demographics` is optional.

## 3. Poll for the result (with CI gating)

```bash
curl "https://YOUR_APP/api/public/evaluations/$JOB_ID?minAx=70" \
  -H "Authorization: Bearer $AX_API_KEY"
```

- Returns **HTTP 200** with `"passed": true` when `axScore >= minAx`.
- Returns **HTTP 422** with `"passed": false` when below the threshold.
- While still running, returns `{ "status": "pending" }`.

You can also pass a numeric evaluation id instead of a job UUID.

## 4. GitHub Action example

```yaml
name: AX Gate
on: [pull_request]
jobs:
  ax:
    runs-on: ubuntu-latest
    steps:
      - name: Score Agent Experience and gate the build
        env:
          AX_API_KEY: ${{ secrets.AX_API_KEY }}
        run: |
          JOB=$(curl -s -X POST https://YOUR_APP/api/public/evaluate \
            -H "Authorization: Bearer $AX_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"url":"https://your-site.com"}' | jq -r .jobId)

          for i in $(seq 1 30); do
            RES=$(curl -s -o body.json -w "%{http_code}" \
              "https://YOUR_APP/api/public/evaluations/$JOB?minAx=70" \
              -H "Authorization: Bearer $AX_API_KEY")
            STATUS=$(jq -r .status body.json)
            if [ "$STATUS" = "completed" ]; then
              cat body.json
              [ "$RES" = "200" ] && echo "AX gate passed" && exit 0
              echo "AX below threshold" && exit 1
            fi
            sleep 20
          done
          echo "Timed out waiting for evaluation" && exit 1
```

## Related endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/evaluations/history?url=` | AX score over time + regression flag (Tier 2) |
| `GET /api/badge/{id}` | Embeddable SVG AX badge (Tier 2) |
| `GET /api/evaluations/compare?ids=1,2` | Side-by-side comparison (Tier 2) |
| `POST /api/scenario` | Run an agent task scenario, judged on 4 axis dimensions (Tier 4) |

### Badge embed

```markdown
![Agent Experience](https://YOUR_APP/api/badge/123)
![ANPS](https://YOUR_APP/api/badge/123?metric=anps)
```
